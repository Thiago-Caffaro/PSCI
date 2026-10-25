import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp } from '../server/app.js';
import { createCharacter, getVitals } from '../shared/schema.js';

let directory, dataFile, runtime, server, origin, admin, player, created;
async function start() {
  runtime = createApp({ dataFile, serveFrontend: false });
  server = runtime.app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = `http://127.0.0.1:${server.address().port}`;
}
async function stop() {
  runtime.closeStreams();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
async function call(path, { token, body, method = body ? 'POST' : 'GET' } = {}) {
  const response = await fetch(`${origin}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() };
}
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'psci-test-'));
  dataFile = join(directory, 'db.json');
  await start();
  admin = (await call('/login', { body: { username: 'admin', password: 'admin123' } })).data;
  player = (await call('/login', { body: { username: 'unidade01', password: 'psci123' } })).data;
});
after(async () => {
  await stop();
  await rm(directory, { recursive: true, force: true });
});

test('a ficha preserva os valores informados e os campos ainda não definidos', () => {
  const character = createCharacter();
  assert.deepEqual(character.attributes, {
    constitution: -1,
    strength: 1,
    agility: 1,
    knowledge: 0,
    intelligence: 0,
    charisma: -1,
  });
  assert.equal(character.skills.resistance, null);
  assert.equal(character.skills.intuition, 2);
  assert.equal(character.skills.performance, -1);
  assert.equal(character.skills.intimidation, 1);
  assert.equal(character.affiliation, 'Micilis');
  assert.deepEqual(getVitals(character), { maxHp: 20, maxEnergy: 5, ac: 11 });
  character.skills.resistance = 3;
  character.attributes.agility = 4;
  assert.deepEqual(getVitals(character), { maxHp: 35, maxEnergy: 5, ac: 14 });
});
test('login, sessão e permissões isolam contas de jogadores e credenciais', async () => {
  assert.equal(
    (await call('/login', { body: { username: 'admin', password: 'incorreta' } })).status,
    401,
  );
  assert.equal((await call('/session')).status, 401);
  const session = await call('/session', { token: player.token });
  assert.equal(session.status, 200);
  assert.equal(session.data.accounts, undefined);
  assert.equal(session.data.user.passwordHash, undefined);
  assert.equal(JSON.stringify(session.data).includes('passwordHash'), false);
  const denied = await call('/admin/accounts', {
    token: player.token,
    body: { username: 'teste', password: 'senha' },
  });
  assert.equal(denied.status, 403);
  assert.equal(
    (
      await call('/me', {
        token: player.token,
        method: 'PATCH',
        body: { attributes: { strength: 8 } },
      })
    ).status,
    403,
  );
});
test('o comando cria contas com ficha base e evita usuários duplicados', async () => {
  const result = await call('/admin/accounts', {
    token: admin.token,
    body: { username: 'teste02', password: 'senha02', name: 'Unidade teste' },
  });
  assert.equal(result.status, 201);
  created = result.data.accounts.find((account) => account.id === result.data.createdId);
  assert.equal(created.character.name, 'Unidade teste');
  assert.equal(created.character.skills.intuition, 2);
  assert.equal(created.character.skills.resistance, null);
  assert.equal(
    (await call('/login', { body: { username: 'teste02', password: 'senha02' } })).status,
    200,
  );
  assert.equal(
    (
      await call('/admin/accounts', {
        token: admin.token,
        body: { username: 'teste02', password: 'senha02' },
      })
    ).status,
    409,
  );
});
test('edições parciais do comando chegam ao jogador e preservam seu diário', async () => {
  await call('/me', {
    token: player.token,
    method: 'PATCH',
    body: { notes: 'Registro que deve ser preservado.' },
  });
  const result = await call(`/admin/accounts/${player.snapshot.user.id}`, {
    token: admin.token,
    method: 'PATCH',
    body: {
      character: {
        name: 'NOVA UNIDADE',
        model: 'R-07',
        skills: { resistance: 2 },
        attributes: { agility: 3 },
      },
    },
  });
  assert.equal(result.status, 200);
  const { data } = await call('/session', { token: player.token });
  assert.equal(data.user.character.name, 'NOVA UNIDADE');
  assert.equal(data.user.character.notes, 'Registro que deve ser preservado.');
  assert.deepEqual(getVitals(data.user.character), { maxHp: 30, maxEnergy: 5, ac: 13 });
  assert.equal(
    (await call('/me', { token: player.token, method: 'PATCH', body: { vitals: { hp: 31 } } }))
      .status,
    400,
  );
  assert.equal(
    (
      await call('/me', {
        token: player.token,
        method: 'PATCH',
        body: { vitals: { hp: 12, energy: 2 } },
      })
    ).status,
    200,
  );
});
test('a transmissão SSE entrega mudanças a uma sessão de jogador já conectada', async () => {
  const abort = new AbortController();
  const response = await fetch(`${origin}/api/events`, {
    headers: { Authorization: `Bearer ${player.token}` },
    signal: abort.signal,
  });
  assert.match(response.headers.get('content-type'), /text\/event-stream/);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  async function nextEvent() {
    while (!pending.includes('\n\n')) {
      const chunk = await reader.read();
      assert.equal(chunk.done, false);
      pending += decoder.decode(chunk.value, { stream: true });
    }
    const boundary = pending.indexOf('\n\n');
    const event = pending.slice(0, boundary);
    pending = pending.slice(boundary + 2);
    return JSON.parse(
      event
        .split('\n')
        .find((line) => line.startsWith('data: '))
        .slice(6),
    );
  }
  try {
    const initial = await nextEvent();
    assert.equal(initial.user.id, player.snapshot.user.id);
    await call(`/admin/accounts/${player.snapshot.user.id}`, {
      token: admin.token,
      method: 'PATCH',
      body: { character: { skills: { integrity: 4 } } },
    });
    const update = await nextEvent();
    assert.equal(update.user.character.skills.integrity, 4);
    assert.equal(update.accounts, undefined);
    assert.ok(update.revision > initial.revision);
  } finally {
    abort.abort();
    await reader.cancel().catch(() => {});
  }
});
test('estrutura global e comunicados atualizam todas as fichas sem trocar valores', async () => {
  const current = (await call('/session', { token: admin.token })).data;
  const schema = structuredClone(current.settings.schema);
  schema[0].label = 'Constituição sintética';
  schema[0].skills.push({ id: 'custom_protocol', label: 'Protocolo' });
  const result = await call('/admin/settings', {
    token: admin.token,
    method: 'PATCH',
    body: { operation: 'Operação teste', broadcast: 'Retornar ao ponto de extração.', schema },
  });
  assert.equal(result.status, 200);
  const session = (await call('/session', { token: player.token })).data;
  assert.equal(session.settings.operation, 'Operação teste');
  assert.equal(session.settings.schema[0].skills.at(-1).id, 'custom_protocol');
  assert.equal(session.user.character.skills.integrity, 4);
  assert.equal(session.user.character.skills.custom_protocol, undefined);
  assert.equal(
    (
      await call('/admin/settings', {
        token: player.token,
        method: 'PATCH',
        body: { broadcast: 'teste' },
      })
    ).status,
    403,
  );
});
test('fotos base64 são persistidas e retornadas para jogador e comando', async () => {
  const photo =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jP7sAAAAASUVORK5CYII=';
  const update = await call('/me', { token: player.token, method: 'PATCH', body: { photo } });
  assert.equal(update.status, 200);
  assert.equal(update.data.user.character.photo, photo);
  const command = (await call('/session', { token: admin.token })).data;
  assert.equal(
    command.accounts.find((account) => account.id === player.snapshot.user.id).character.photo,
    photo,
  );
  assert.equal(
    (
      await call('/me', {
        token: player.token,
        method: 'PATCH',
        body: { photo: 'data:image/svg+xml;base64,AAAA' },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call('/me', {
        token: player.token,
        method: 'PATCH',
        body: { photo: 'data:image/png;base64,AAAA' },
      })
    ).status,
    400,
  );
  const remove = await call(`/admin/accounts/${player.snapshot.user.id}`, {
    token: admin.token,
    method: 'PATCH',
    body: { character: { photo: '' } },
  });
  assert.equal(remove.status, 200);
  assert.equal((await call('/session', { token: player.token })).data.user.character.photo, '');
});
test('dados malformados não alteram os valores da ficha', async () => {
  const result = await call(`/admin/accounts/${player.snapshot.user.id}`, {
    token: admin.token,
    method: 'PATCH',
    body: { character: { attributes: { agility: 'muito' } } },
  });
  assert.equal(result.status, 400);
  const session = (await call('/session', { token: player.token })).data;
  assert.equal(session.user.character.attributes.agility, 3);
});
test('redefinição de senha invalida sessões antigas da conta', async () => {
  const old = (await call('/login', { body: { username: 'teste02', password: 'senha02' } })).data;
  assert.equal(
    (
      await call(`/admin/accounts/${created.id}`, {
        token: admin.token,
        method: 'PATCH',
        body: { password: 'novaSenha02' },
      })
    ).status,
    200,
  );
  assert.equal((await call('/session', { token: old.token })).status, 401);
  assert.equal(
    (await call('/login', { body: { username: 'teste02', password: 'senha02' } })).status,
    401,
  );
  assert.equal(
    (await call('/login', { body: { username: 'teste02', password: 'novaSenha02' } })).status,
    200,
  );
});
test('reiniciar o servidor preserva contas, atributos, diretrizes e sessões', async () => {
  await stop();
  await start();
  const session = await call('/session', { token: player.token });
  assert.equal(session.status, 200);
  assert.equal(session.data.user.character.skills.integrity, 4);
  assert.equal(session.data.user.character.vitals.hp, 12);
  assert.equal(session.data.settings.operation, 'Operação teste');
  const persisted = JSON.parse(await readFile(dataFile, 'utf8'));
  assert.equal(persisted.accounts.length, 3);
  assert.equal(
    persisted.accounts.some((account) => account.passwordHash.includes('admin123')),
    false,
  );
});
