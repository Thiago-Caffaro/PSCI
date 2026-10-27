import express from 'express';
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import { createCharacter, DEFAULT_SETTINGS, getVitals } from '../shared/schema.js';

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = scryptSync(password, salt, 64);
  return timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}
function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
function textField(value, label, max = 150) {
  if (typeof value !== 'string' || value.length > max)
    fail(`${label}: texto inválido (máximo ${max} caracteres).`);
  return value.trim();
}
function numericMap(input, validIds) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Atributos inválidos.');
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => {
      if (!validIds.includes(key)) fail('Atributo não reconhecido.');
      if (
        value !== null &&
        (!Number.isFinite(value) || !Number.isInteger(value) || Math.abs(value) > 999)
      )
        fail('Use números inteiros entre -999 e 999, ou deixe em branco.');
      return [key, value];
    }),
  );
}

function profilePhoto(value) {
  if (value === '') return '';
  if (typeof value !== 'string' || value.length > 1000000)
    fail('Foto inválida ou muito grande. Envie outra imagem.');
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) fail('Use uma foto PNG, JPEG ou WebP em base64.');
  const bytes = Buffer.from(match[2], 'base64');
  const valid =
    match[1] === 'jpeg'
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : match[1] === 'png'
        ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!valid) fail('O conteúdo não corresponde a uma imagem válida.');
  return value;
}

export function createApp({
  dataFile = process.env.PSCI_DATA_FILE || resolve('data/psci.json'),
  serveFrontend = true,
} = {}) {
  mkdirSync(dirname(dataFile), { recursive: true });
  const db = new LowSync(new JSONFileSync(dataFile), null);
  db.read();
  if (!db.data) {
    const now = new Date().toISOString();
    const account = (username, password, role, serial) => ({
      id: randomUUID(),
      username,
      passwordHash: hashPassword(password),
      role,
      version: 1,
      character: createCharacter(serial),
      createdAt: now,
      updatedAt: now,
    });
    db.data = {
      secret: randomBytes(32).toString('hex'),
      revision: 1,
      settings: structuredClone(DEFAULT_SETTINGS),
      accounts: [
        account('admin', 'admin123', 'admin', 'PSCI-CMD'),
        account('unidade01', 'psci123', 'player', 'PSCI-0001'),
      ],
      log: [
        {
          id: randomUUID(),
          userId: null,
          time: now,
          actor: 'SISTEMA',
          message: 'Rede PSCI inicializada. Terminais disponíveis para identificação.',
        },
      ],
    };
    db.write();
  }
  const app = express();
  const clients = new Set();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  const publicAccount = ({ passwordHash: _hash, version: _version, ...account }) => account;
  const snapshot = (account) => ({
    revision: db.data.revision,
    user: publicAccount(account),
    settings: db.data.settings,
    accounts: account.role === 'admin' ? db.data.accounts.map(publicAccount) : undefined,
    log: db.data.log
      .filter(
        (entry) => account.role === 'admin' || entry.userId === null || entry.userId === account.id,
      )
      .slice(0, 60),
  });
  function sign(account) {
    const payload = Buffer.from(
      JSON.stringify({
        id: account.id,
        version: account.version,
        expires: Date.now() + 30 * 86400000,
      }),
    ).toString('base64url');
    return `${payload}.${createHmac('sha256', db.data.secret).update(payload).digest('base64url')}`;
  }
  function readToken(token) {
    if (typeof token !== 'string') fail('Identifique-se para acessar o terminal.', 401);
    const [payload, signature] = token.split('.');
    if (!payload || !signature) fail('Sessão inválida. Identifique-se novamente.', 401);
    const expected = createHmac('sha256', db.data.secret).update(payload).digest('base64url');
    if (
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      fail('Sessão inválida.', 401);
    let data;
    try {
      data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    } catch {
      fail('Sessão inválida.', 401);
    }
    const account = db.data.accounts.find(
      (item) => item.id === data.id && item.version === data.version,
    );
    if (!account || !Number.isFinite(data.expires) || data.expires < Date.now())
      fail('Sessão encerrada. Identifique-se novamente.', 401);
    return account;
  }
  function auth(req, _res, next) {
    try {
      req.account = readToken(req.headers.authorization?.replace(/^Bearer /, ''));
      next();
    } catch (error) {
      next(error);
    }
  }
  function admin(req, _res, next) {
    if (req.account.role !== 'admin')
      return next(Object.assign(new Error('Acesso exclusivo do comando.'), { status: 403 }));
    next();
  }
  function record(actor, userId, message) {
    db.data.log.unshift({
      id: randomUUID(),
      time: new Date().toISOString(),
      actor,
      userId,
      message,
    });
    db.data.log = db.data.log.slice(0, 200);
  }
  function commit() {
    db.data.revision += 1;
    db.write();
    for (const client of clients) {
      try {
        const account = readToken(client.token);
        client.res.write(`data: ${JSON.stringify(snapshot(account))}\n\n`);
      } catch {
        client.res.write('event: revoked\ndata: {}\n\n');
        client.res.end();
        clients.delete(client);
      }
    }
  }
  function patchCharacter(character, patch, fullAccess) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) fail('Ficha inválida.');
    const result = structuredClone(character);
    if ('photo' in patch) result.photo = profilePhoto(patch.photo);
    for (const field of ['notes', 'equipment', 'abilities']) {
      if (field in patch)
        result[field] = textField(
          patch[field],
          { notes: 'Diário', equipment: 'Equipamento', abilities: 'Habilidades' }[field],
          12000,
        );
    }
    if (fullAccess) {
      for (const field of [
        'name',
        'model',
        'affiliation',
        'squad',
        'designation',
        'intuitionNote',
      ]) {
        if (field in patch) result[field] = textField(patch[field], field);
      }
      if ('attributes' in patch)
        Object.assign(
          result.attributes,
          numericMap(
            patch.attributes,
            db.data.settings.schema.map((group) => group.id),
          ),
        );
      if ('skills' in patch)
        Object.assign(
          result.skills,
          numericMap(
            patch.skills,
            db.data.settings.schema.flatMap((group) => group.skills.map((skill) => skill.id)),
          ),
        );
    } else if (
      Object.keys(patch).some(
        (key) => !['vitals', 'notes', 'equipment', 'abilities', 'photo'].includes(key),
      )
    ) {
      fail('Atributos e identificação são editados pelo comando.', 403);
    }
    const { maxHp, maxEnergy } = getVitals(result);
    if ('vitals' in patch) {
      const vitals = patch.vitals;
      if (!vitals || typeof vitals !== 'object' || Array.isArray(vitals))
        fail('Recursos inválidos.');
      for (const [key, max] of [
        ['hp', Math.max(0, maxHp)],
        ['energy', maxEnergy],
      ]) {
        if (key in vitals) {
          if (!Number.isInteger(vitals[key]) || vitals[key] < 0 || vitals[key] > max)
            fail(`${key === 'hp' ? 'HP' : 'Energia'} deve estar entre 0 e ${max}.`);
          result.vitals[key] = vitals[key];
        }
      }
    }
    result.vitals.hp = Math.min(result.vitals.hp, Math.max(0, maxHp));
    return result;
  }

  app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'PSCI', version: '0.1.0' }));
  app.post('/api/login', (req, res) => {
    const username =
      typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    if (typeof req.body.password !== 'string' || req.body.password.length > 200)
      fail('Credenciais não reconhecidas.', 401);
    const account = db.data.accounts.find((item) => item.username === username);
    if (!account || !verifyPassword(req.body.password, account.passwordHash))
      fail('Credenciais não reconhecidas. Confira o usuário e a senha.', 401);
    res.json({ token: sign(account), snapshot: snapshot(account) });
  });
  app.get('/api/session', auth, (req, res) => res.json(snapshot(req.account)));
  app.get('/api/events', auth, (req, res) => {
    res.set({
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    const client = { res, token: req.headers.authorization.replace(/^Bearer /, '') };
    clients.add(client);
    res.write(`data: ${JSON.stringify(snapshot(req.account))}\n\n`);
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000);
    res.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(client);
    });
  });
  app.patch('/api/me', auth, (req, res) => {
    const allowed = [
      'vitals',
      'notes',
      'equipment',
      'abilities',
      'photo',
      'name',
      'model',
      'affiliation',
      'squad',
      'designation',
      'intuitionNote',
      'attributes',
      'skills',
    ];
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))
      fail('Ficha inválida.');
    if (Object.keys(req.body).some((key) => !allowed.includes(key)))
      fail('Este campo não pertence à edição da sua ficha.', 403);
    req.account.character = patchCharacter(req.account.character, req.body, true);
    req.account.updatedAt = new Date().toISOString();
    record(
      req.account.username,
      req.account.id,
      req.body.vitals
        ? 'Recursos de campo atualizados.'
        : 'photo' in req.body
          ? 'Foto de identificação atualizada.'
          : req.body.attributes || req.body.skills
            ? 'Parâmetros da unidade atualizados pelo operador.'
            : req.body.name !== undefined || req.body.model !== undefined
              ? 'Identificação atualizada pelo operador.'
              : 'Registros de campo atualizados.',
    );
    commit();
    res.json(snapshot(req.account));
  });
  app.post('/api/admin/accounts', auth, admin, (req, res) => {
    const username = textField(req.body.username, 'Usuário', 32).toLowerCase();
    if (!/^[a-z0-9_.-]{3,32}$/.test(username))
      fail('Usuário: use 3 a 32 letras sem acentos, números, ponto, hífen ou sublinhado.');
    if (db.data.accounts.some((account) => account.username === username))
      fail('Já existe uma conta com esse usuário.', 409);
    if (
      typeof req.body.password !== 'string' ||
      req.body.password.length < 4 ||
      req.body.password.length > 200
    )
      fail('A senha deve ter de 4 a 200 caracteres.');
    if (!['player', 'admin'].includes(req.body.role ?? 'player'))
      fail('Perfil de acesso inválido.');
    const now = new Date().toISOString();
    const account = {
      id: randomUUID(),
      username,
      passwordHash: hashPassword(req.body.password),
      role: req.body.role ?? 'player',
      version: 1,
      character: createCharacter(`PSCI-${String(db.data.accounts.length).padStart(4, '0')}`),
      createdAt: now,
      updatedAt: now,
    };
    if (req.body.name) account.character.name = textField(req.body.name, 'Nome');
    db.data.accounts.push(account);
    record(req.account.username, account.id, `Conta ${username} provisionada pelo comando.`);
    commit();
    res.status(201).json({ ...snapshot(req.account), createdId: account.id });
  });
  app.patch('/api/admin/accounts/:id', auth, admin, (req, res) => {
    const account = db.data.accounts.find((item) => item.id === req.params.id);
    if (!account) fail('Terminal não encontrado.', 404);
    const newCharacter = req.body.character
      ? patchCharacter(account.character, req.body.character, true)
      : account.character;
    if ('password' in req.body) {
      if (
        typeof req.body.password !== 'string' ||
        req.body.password.length < 4 ||
        req.body.password.length > 200
      )
        fail('A senha deve ter de 4 a 200 caracteres.');
      if (account.id === req.account.id)
        fail('Use outra conta de comando para redefinir a senha desta conta.');
      account.passwordHash = hashPassword(req.body.password);
      account.version += 1;
    }
    account.character = newCharacter;
    account.updatedAt = new Date().toISOString();
    record(
      req.account.username,
      account.id,
      req.body.password
        ? 'Credenciais redefinidas pelo comando.'
        : 'Ficha atualizada pelo comando.',
    );
    commit();
    res.json(snapshot(req.account));
  });
  app.patch('/api/admin/settings', auth, admin, (req, res) => {
    const settings = structuredClone(db.data.settings);
    for (const field of ['operation', 'sector', 'broadcast'])
      if (field in req.body)
        settings[field] = textField(req.body[field], field, field === 'broadcast' ? 500 : 150);
    if ('schema' in req.body) {
      const schema = req.body.schema;
      if (!Array.isArray(schema) || schema.length !== settings.schema.length)
        fail('Mantenha os seis atributos da primeira versão.');
      const ids = new Set();
      settings.schema = schema.map((group, index) => {
        if (
          group.id !== settings.schema[index].id ||
          !Array.isArray(group.skills) ||
          group.skills.length > 20
        )
          fail('Estrutura de atributos inválida.');
        const clean = {
          id: group.id,
          code: settings.schema[index].code,
          label: textField(group.label, 'Atributo', 40),
          skills: group.skills.map((skill) => {
            if (!/^[a-z][a-z0-9_]{0,63}$/.test(skill.id) || ids.has(skill.id))
              fail('Identificador de perícia inválido ou repetido.');
            ids.add(skill.id);
            return { id: skill.id, label: textField(skill.label, 'Perícia', 40) };
          }),
        };
        if (!clean.label || clean.skills.some((skill) => !skill.label))
          fail('Os nomes de atributos e perícias não podem ficar em branco.');
        if (
          settings.schema[index].skills.some(
            (skill) => !clean.skills.find((item) => item.id === skill.id),
          )
        )
          fail('As perícias existentes devem ser preservadas.');
        return clean;
      });
    }
    db.data.settings = settings;
    record(req.account.username, null, 'Diretrizes e estrutura da rede atualizadas pelo comando.');
    commit();
    res.json(snapshot(req.account));
  });
  app.use('/api', (_req, res) => res.status(404).json({ message: 'Canal não encontrado.' }));
  const dist = resolve('dist');
  if (serveFrontend && existsSync(dist)) {
    app.use(express.static(dist));
    app.get('/{*path}', (_req, res) => res.sendFile(resolve(dist, 'index.html')));
  }
  app.use((error, _req, res, _next) => {
    const status = error.status ?? 500;
    if (status >= 500) console.error(error);
    res
      .status(status)
      .json({ message: status >= 500 ? 'Falha no sistema. Tente novamente.' : error.message });
  });
  return {
    app,
    closeStreams: () => {
      for (const { res } of clients) res.end();
      clients.clear();
    },
  };
}
