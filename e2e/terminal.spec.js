import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

async function assertNoOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}
async function photoFile(page) {
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#303b3c';
    ctx.fillRect(0, 0, 240, 300);
    ctx.fillStyle = '#c8d8b1';
    ctx.fillRect(85, 65, 70, 100);
    ctx.fillStyle = '#17191d';
    ctx.fillRect(40, 180, 160, 120);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  return { name: 'retrato.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') };
}
async function flip(page, back) {
  await page
    .getByRole('button', {
      name: back ? 'Virar tablet para o verso' : 'Virar tablet para a frente',
      exact: true,
    })
    .click();
  await expect(page.locator('.psci-device')).toHaveAttribute('data-face', back ? 'back' : 'front');
  await expect(page.locator('.psci-device')).not.toHaveClass(/is-turning/);
  await expect(
    page.getByRole('button', {
      name: back ? 'Virar tablet para a frente' : 'Virar tablet para o verso',
      exact: true,
    }),
  ).toBeFocused();
}
async function playerLogin(page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^UNIDADE 01/ }).click();
  await expect(page.getByText('VÍNCULO ATIVO', { exact: true })).toBeVisible();
}
async function dismissToast(page) {
  const close = page.getByRole('button', { name: 'Fechar notificação', exact: true });
  if (await close.isVisible()) await close.click();
}

test('tablet mobile: virada, rascunhos, foto e permanência da sessão', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mkdir('.qa', { recursive: true });
  await playerLogin(page);
  await dismissToast(page);
  await expect(page.getByRole('heading', { name: 'UNIDADE 01', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Anotações de campo', exact: true })).toHaveCount(
    0,
  );
  await expect(page.locator('.device-back')).toHaveAttribute('inert', '');
  await expect(page.locator('.hp .tablet-meter > span')).toHaveCount(20);
  await expect(page.locator('.energy .tablet-meter > span')).toHaveCount(10);
  await expect(page.locator('.hp .tablet-meter > .filled')).toHaveCount(20);
  await expect(page.locator('.damage-cross, .caption-cross')).toHaveCount(0);
  await assertNoOverflow(page);
  await page.screenshot({ path: '.qa/tablet-mobile-front.png' });
  await page.getByRole('button', { name: 'Detalhes de Conhecimento', exact: true }).click();
  const detail = page.getByRole('dialog', { name: 'Detalhes de Conhecimento', exact: true });
  await expect(
    detail.locator('.skill-row').filter({ hasText: 'Intuição' }).locator('.skill-value'),
  ).toHaveText('+2');
  await page.getByRole('button', { name: 'Fechar detalhes do atributo', exact: true }).click();
  await page.getByRole('button', { name: 'Diminuir Pontos de vida', exact: true }).click();
  await expect(page.locator('.hp .tablet-resource-value strong')).toHaveText('19');
  await expect(page.locator('.hp .tablet-meter > .filled')).toHaveCount(19);
  await flip(page, true);
  await expect(page.locator('.device-front')).toHaveAttribute('inert', '');
  await page
    .getByLabel('Anotações de campo', { exact: true })
    .fill('Aguardar no ponto de extração.');
  await page.getByLabel('Equipamento de campo', { exact: true }).fill('Rifle e suprimentos.');
  await page.getByLabel('Habilidades da unidade', { exact: true }).fill('Pulso de reconhecimento.');
  await flip(page, false);
  await flip(page, true);
  await expect(page.getByLabel('Anotações de campo', { exact: true })).toHaveValue(
    'Aguardar no ponto de extração.',
  );
  await expect(page.getByLabel('Habilidades da unidade', { exact: true })).toHaveValue(
    'Pulso de reconhecimento.',
  );
  await page.getByRole('button', { name: 'Configurações da conta', exact: true }).click();
  await page
    .getByLabel('Enviar foto de perfil', { exact: true })
    .setInputFiles(await photoFile(page));
  await expect(
    page.getByText('Foto de identificação sincronizada.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voltar ao tablet', exact: true }).click();
  await expect(page.locator('.psci-device')).toHaveAttribute('data-face', 'back');
  await expect(page.getByLabel('Anotações de campo', { exact: true })).toHaveValue(
    'Aguardar no ponto de extração.',
  );
  await page.getByRole('button', { name: 'Salvar registros de campo', exact: true }).click();
  await expect(page.getByText('Registros de campo sincronizados.', { exact: true })).toBeVisible();
  await dismissToast(page);
  await page.screenshot({ path: '.qa/tablet-mobile-back.png' });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'UNIDADE 01', exact: true })).toBeVisible();
  await expect(page.locator('.portrait .tablet-portrait')).toHaveAttribute(
    'src',
    /^data:image\/jpeg;base64,/,
  );
  await expect(page.locator('.hp .tablet-resource-value strong')).toHaveText('19');
  await flip(page, true);
  await expect(page.getByLabel('Anotações de campo', { exact: true })).toHaveValue(
    'Aguardar no ponto de extração.',
  );
  await expect(page.getByLabel('Equipamento de campo', { exact: true })).toHaveValue(
    'Rifle e suprimentos.',
  );
  await expect(page.getByLabel('Habilidades da unidade', { exact: true })).toHaveValue(
    'Pulso de reconhecimento.',
  );
  await page.setViewportSize({ width: 320, height: 720 });
  await assertNoOverflow(page);
  expect(errors).toEqual([]);
});

test('comando: criação e atualização ao vivo de atributos, retrato e habilidades', async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 1440, height: 980 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: /^COMANDO/ }).click();
  await expect(page.getByText('VÍNCULO ATIVO', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Painel de comando', exact: true }).click();
  await page.getByRole('button', { name: 'NOVA CONTA', exact: true }).click();
  const dialog = page.getByRole('dialog').last();
  await dialog.getByLabel('USUÁRIO', { exact: true }).fill('operador_e2e');
  await dialog.getByLabel('SENHA INICIAL', { exact: true }).fill('senha_e2e');
  await dialog.getByLabel('NOME DA UNIDADE / OPCIONAL', { exact: true }).fill('Aster');
  await dialog.getByRole('button', { name: 'CRIAR CONTA', exact: true }).click();
  await expect(page.locator('.editor-account-title h2')).toHaveText('Aster');
  await page.getByLabel('MODELO', { exact: true }).fill('R-07');
  await page.getByRole('spinbutton', { name: 'Base de Agilidade', exact: true }).fill('3');
  await page.getByRole('button', { name: 'SALVAR FICHA', exact: true }).click();
  await expect(
    page.getByText('Ficha de operador_e2e sincronizada.', { exact: true }),
  ).toBeVisible();
  const playerContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'pt-BR',
  });
  const player = await playerContext.newPage();
  player.on('pageerror', (error) => errors.push(error.message));
  try {
    await player.goto('http://127.0.0.1:3101/');
    await player.getByLabel('IDENTIFICAÇÃO / USUÁRIO', { exact: true }).fill('operador_e2e');
    await player.getByLabel('CHAVE DE ACESSO', { exact: true }).fill('senha_e2e');
    await player.getByRole('button', { name: 'INICIAR CONEXÃO', exact: true }).click();
    await expect(player.getByRole('heading', { name: 'Aster', exact: true })).toBeVisible();
    await expect(player.locator('.tablet-armor > strong')).toHaveText('13');
    await page
      .getByRole('spinbutton', { name: 'Constituição: Integridade', exact: true })
      .fill('5');
    await page.getByLabel('HABILIDADES', { exact: true }).fill('Protocolo de cobertura.');
    await page
      .getByLabel('Enviar foto de perfil', { exact: true })
      .setInputFiles(await photoFile(page));
    await expect(page.locator('.profile-photo.preview img')).toHaveAttribute(
      'src',
      /^data:image\/jpeg;base64,/,
    );
    await page.getByRole('button', { name: 'SALVAR FICHA', exact: true }).click();
    await expect(
      player.locator('.tablet-skill').filter({ hasText: 'Integridade' }).locator('span').last(),
    ).toHaveText('+5');
    await expect(player.locator('.portrait .tablet-portrait')).toBeVisible();
    await page.getByRole('tab', { name: 'DIRETRIZES DA REDE', exact: true }).click();
    await page
      .getByLabel('COMUNICADO DO COMANDO', { exact: true })
      .fill('Retornar ao ponto de extração.');
    await page
      .getByLabel('Nome da perícia 2 de Constituição', { exact: true })
      .fill('Integridade estrutural');
    await page.getByRole('button', { name: 'TRANSMITIR ALTERAÇÕES', exact: true }).click();
    await expect(player.getByText('Retornar ao ponto de extração.', { exact: true })).toBeVisible();
    await expect(player.getByText('Integridade estrutural', { exact: true })).toBeVisible();
    await flip(player, true);
    await expect(player.getByLabel('Habilidades da unidade', { exact: true })).toHaveValue(
      'Protocolo de cobertura.',
    );
    await player
      .getByLabel('Habilidades da unidade', { exact: true })
      .fill('Rascunho que deve permanecer local.');
    await page.getByRole('tab', { name: 'CONTAS E FICHAS', exact: true }).click();
    await page.getByRole('spinbutton', { name: 'Base de Força', exact: true }).fill('2');
    await page.getByRole('button', { name: 'SALVAR FICHA', exact: true }).click();
    await expect(player.getByLabel('Habilidades da unidade', { exact: true })).toHaveValue(
      'Rascunho que deve permanecer local.',
    );
    await player.reload();
    await flip(player, true);
    await expect(player.getByLabel('Habilidades da unidade', { exact: true })).toHaveValue(
      'Rascunho que deve permanecer local.',
    );
    await flip(player, false);
    await dismissToast(player);
    await player.setViewportSize({ width: 1440, height: 980 });
    await player.screenshot({ path: '.qa/tablet-desktop-front.png' });
    await flip(player, true);
    await player.screenshot({ path: '.qa/tablet-desktop-back.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoOverflow(page);
    await page.screenshot({ path: '.qa/tablet-mobile-command.png' });
    expect(errors).toEqual([]);
  } finally {
    await playerContext.close();
  }
});

test('consulta local preserva a ficha e reconecta ao servidor', async ({ page }) => {
  await playerLogin(page);
  await page.route('**/api/**', (route) => route.abort());
  await page.reload();
  await expect(page.getByText('CONSULTA LOCAL', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'UNIDADE 01', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Diminuir Pontos de vida', exact: true }),
  ).toBeDisabled();
  await flip(page, true);
  await expect(page.getByLabel('Anotações de campo', { exact: true })).toBeDisabled();
  await page.unroute('**/api/**');
  await expect(page.getByText('VÍNCULO ATIVO', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Anotações de campo', { exact: true })).toBeEnabled();
});

test('dano afeta as duas imagens e a virada respeita movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await playerLogin(page);
  await dismissToast(page);
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem('psci-session')).token);
  for (const [hp, level] of [
    [10, 'unstable'],
    [2, 'critical'],
    [0, 'offline'],
  ]) {
    const update = await page.request.patch('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
      data: { vitals: { hp } },
    });
    expect(update.ok()).toBe(true);
    await expect(page.locator('.portrait.damage-display')).toHaveAttribute('data-damage', level);
    await expect(page.locator('.neural.damage-display')).toHaveAttribute('data-damage', level);
    await expect(page.locator('.hp .tablet-resource-value strong')).toHaveText(
      String(hp).padStart(2, '0'),
    );
    await expect(page.locator('.screen-fracture')).toHaveCount(hp <= 3 ? 2 : 0);
  }
  await expect(page.locator('.psci-device')).toHaveCSS('transition-duration', '0s');
  await page.screenshot({ path: '.qa/tablet-mobile-damage.png' });
  await flip(page, true);
  await page.screenshot({ path: '.qa/tablet-mobile-neural-damage.png' });
  await expect(page.locator('.neural .damage-signal')).toHaveText('SEM SINAL');
  for (const viewport of [
    { width: 320, height: 720 },
    { width: 768, height: 1024 },
    { width: 1440, height: 980 },
  ]) {
    await page.setViewportSize(viewport);
    await assertNoOverflow(page);
  }
});

test('jogador edita a própria ficha, usa Espaço e não vira enquanto digita', async ({
  page,
  browser,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await playerLogin(page);
  await dismissToast(page);
  await page.locator('body').click({ position: { x: 3, y: 65 } });
  await page.keyboard.press('Space');
  await expect(page.locator('.psci-device')).toHaveAttribute('data-face', 'back');
  await expect(page.locator('.psci-device')).not.toHaveClass(/is-turning/);
  await page.getByLabel('Anotações de campo', { exact: true }).fill('Texto');
  await page.keyboard.press('Space');
  await page.keyboard.type('com espaço');
  await expect(page.getByLabel('Anotações de campo', { exact: true })).toHaveValue(
    'Texto com espaço',
  );
  await expect(page.locator('.psci-device')).toHaveAttribute('data-face', 'back');
  await page.getByRole('button', { name: 'Virar tablet para a frente', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.psci-device')).toHaveAttribute('data-face', 'front');
  await expect(page.locator('.psci-device')).not.toHaveClass(/is-turning/);
  await page.getByRole('button', { name: 'Editar minha ficha', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Editar minha ficha', exact: true });
  await assertNoOverflow(page);
  await page.setViewportSize({ width: 320, height: 720 });
  await assertNoOverflow(page);
  await expect(
    editor.getByRole('button', { name: 'SALVAR MINHA FICHA', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '.qa/tablet-player-editor.png' });
  await editor.getByLabel('NOME', { exact: true }).fill('Exploradora');
  await editor.getByLabel('MODELO', { exact: true }).fill('R-12');
  await editor.getByRole('spinbutton', { name: 'Base de Agilidade', exact: true }).fill('4');
  await editor
    .getByRole('spinbutton', { name: 'Constituição: Resistência', exact: true })
    .fill('2');
  await editor.getByRole('spinbutton', { name: 'Força: Luta', exact: true }).fill('3');
  await page.screenshot({ path: '.qa/tablet-player-edit-attributes.png' });
  await editor.getByRole('button', { name: 'SALVAR MINHA FICHA', exact: true }).click();
  await expect(page.getByText('Ficha pessoal sincronizada.', { exact: true })).toBeVisible();
  await expect(
    editor.getByRole('button', { name: 'SALVAR MINHA FICHA', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Voltar ao tablet', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Exploradora', exact: true })).toBeVisible();
  await expect(page.locator('.tablet-armor > strong')).toHaveText('14');
  await expect(page.locator('.hp .tablet-resource-value > span')).toHaveText('/ 30');
  await page.getByRole('button', { name: 'Detalhes de Força', exact: true }).click();
  await page.getByRole('button', { name: 'EDITAR ATRIBUTO', exact: true }).click();
  const contextual = page.getByRole('dialog', { name: 'Editar minha ficha', exact: true });
  await contextual.getByRole('spinbutton', { name: 'Força: Luta', exact: true }).fill('4');
  await contextual.getByRole('button', { name: 'SALVAR MINHA FICHA', exact: true }).click();
  await expect(page.getByText('Ficha pessoal sincronizada.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar ao tablet', exact: true }).click();
  const commandContext = await browser.newContext();
  try {
    const command = await commandContext.newPage();
    await command.goto('http://127.0.0.1:3101/');
    await command.getByRole('button', { name: /^COMANDO/ }).click();
    await command.getByRole('button', { name: 'Painel de comando', exact: true }).click();
    await expect(command.locator('.editor-account-title h2')).toHaveText('Exploradora');
    await expect(command.getByRole('spinbutton', { name: 'Força: Luta', exact: true })).toHaveValue(
      '4',
    );
  } finally {
    await commandContext.close();
  }
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Exploradora', exact: true })).toBeVisible();
  await assertNoOverflow(page);
  const columns = await page
    .locator('.tablet-attributes')
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
  expect(columns).toBe(2);
  await dismissToast(page);
  await page.screenshot({ path: '.qa/tablet-larger-attributes.png' });
  expect(errors).toEqual([]);
});
