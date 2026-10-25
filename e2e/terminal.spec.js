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
    ctx.fillStyle = '#ff6844';
    ctx.fillRect(85, 65, 70, 100);
    ctx.fillStyle = '#17191d';
    ctx.fillRect(40, 180, 160, 120);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  return { name: 'retrato.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') };
}
test('celular: ficha, navegação, foto base64 e permanência do login', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mkdir('.qa', { recursive: true });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Conecte sua unidade/ })).toBeVisible();
  await page.screenshot({ path: '.qa/mobile-login.png', fullPage: true });
  await page.getByRole('button', { name: /^UNIDADE 01/ }).click();
  await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible();
  await expect(page.getByText('VÍNCULO ATIVO', { exact: true })).toBeVisible();
  await assertNoOverflow(page);
  await page.screenshot({ path: '.qa/mobile-sheet.png', fullPage: true });
  await page.getByRole('button', { name: 'Diminuir Pontos de vida' }).click();
  await expect(page.locator('.hp .vital-reading strong')).toHaveText('19');
  await page.locator('.mobile-nav').getByRole('button', { name: 'Diário', exact: true }).click();
  await page.getByLabel('Anotações de campo').fill('Aguardar no ponto de extração.');
  await page.getByRole('button', { name: 'SALVAR REGISTROS', exact: true }).click();
  await expect(page.getByText('Registros de campo sincronizados.', { exact: true })).toBeVisible();
  await page.locator('.mobile-nav').getByRole('button', { name: 'Terminal', exact: true }).click();
  await page
    .getByLabel('Enviar foto de perfil', { exact: true })
    .setInputFiles(await photoFile(page));
  await expect(page.locator('.header-photo img')).toHaveAttribute(
    'src',
    /^data:image\/jpeg;base64,/,
  );
  await expect(
    page.getByText('Foto de identificação sincronizada.', { exact: true }),
  ).toBeVisible();
  const box = await page.locator('.header-photo').boundingBox();
  expect(box.width).toBe(36);
  expect(box.height).toBe(45);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible();
  await expect(page.locator('.header-photo img')).toBeVisible();
  await expect(page.locator('.hp .vital-reading strong')).toHaveText('19');
  await page.locator('.mobile-nav').getByRole('button', { name: 'Diário', exact: true }).click();
  await expect(page.getByLabel('Anotações de campo')).toHaveValue('Aguardar no ponto de extração.');
  await assertNoOverflow(page);
  await page.locator('.mobile-nav').getByRole('button', { name: 'Atributos', exact: true }).click();
  await page.getByLabel('Buscar atributo ou perícia').fill('Intuição');
  await expect(page.locator('.attribute-card')).toHaveCount(1);
  await expect(page.locator('.skill-value')).toHaveText('+2');
  await page.setViewportSize({ width: 320, height: 720 });
  await assertNoOverflow(page);
  expect(errors).toEqual([]);
});
test('comando: criação de conta e sincronização real entre administrador e jogador', async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.screenshot({ path: '.qa/desktop-login.png', fullPage: true });
  await page.getByRole('button', { name: /^COMANDO/ }).click();
  await expect(page.getByText('VÍNCULO ATIVO', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Painel de comando', exact: true }).click();
  await page.getByRole('button', { name: 'NOVA CONTA', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('USUÁRIO', { exact: true }).fill('operador_e2e');
  await dialog.getByLabel('SENHA INICIAL', { exact: true }).fill('senha_e2e');
  await dialog.getByLabel('NOME DA UNIDADE / OPCIONAL', { exact: true }).fill('Aster');
  await dialog.getByRole('button', { name: 'CRIAR CONTA', exact: true }).click();
  await expect(dialog).not.toBeVisible();
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
    await expect(player.locator('.armor .vital-reading strong')).toHaveText('13');
    await page
      .getByRole('spinbutton', { name: 'Constituição: Integridade', exact: true })
      .fill('5');
    await page
      .getByLabel('Enviar foto de perfil', { exact: true })
      .setInputFiles(await photoFile(page));
    await expect(page.locator('.profile-photo.preview img')).toHaveAttribute(
      'src',
      /^data:image\/jpeg;base64,/,
    );
    await page.getByRole('button', { name: 'SALVAR FICHA', exact: true }).click();
    await expect(
      player.locator('.skill-row').filter({ hasText: 'Integridade' }).locator('.skill-value'),
    ).toHaveText('+5');
    await expect(player.locator('.header-photo img')).toBeVisible();
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
    await player.screenshot({ path: '.qa/mobile-profile.png', fullPage: true });
    await player.setViewportSize({ width: 1440, height: 1000 });
    await player.screenshot({ path: '.qa/desktop-sheet.png', fullPage: true });
    await page.getByRole('tab', { name: 'CONTAS E FICHAS', exact: true }).click();
    await page.screenshot({ path: '.qa/desktop-admin.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoOverflow(page);
    await page.screenshot({ path: '.qa/mobile-admin.png', fullPage: true });
    await player.setViewportSize({ width: 390, height: 844 });
    await assertNoOverflow(player);
    expect(errors).toEqual([]);
  } finally {
    await playerContext.close();
  }
});
test('falha de conexão mantém a ficha local em modo de consulta e reconecta', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^UNIDADE 01/ }).click();
  await expect(page.getByText('VÍNCULO ATIVO', { exact: true })).toBeVisible();
  await page.route('**/api/**', (route) => route.abort());
  await page.reload();
  await expect(page.getByText('CONSULTA LOCAL', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Diminuir Pontos de vida' })).toBeDisabled();
  await page.unroute('**/api/**');
  await expect(page.getByText('VÍNCULO ATIVO', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Diminuir Pontos de vida' })).toBeEnabled();
});
