import { test, expect } from '@playwright/test';

/**
 * Nota: Como o sistema exige autenticação, para um ambiente de teste real 
 * precisaríamos injetar o token de sessão ou realizar o login programático.
 * Este script valida o fluxo básico de redirecionamento para o login e 
 * a estrutura da rota raiz se acessível.
 */

test.describe('Navegação e Segurança de Rotas', () => {

  test('Deve redirecionar para login quando não autenticado em rotas protegidas', async ({ page }) => {
    await page.goto('/operacional/abastecimento');
    await expect(page).toHaveURL(/.*login/);
  });

  test('Página inicial e dashboard principal carregam corretamente', async ({ page }) => {
    await page.goto('/');
    const currentUrl = page.url();

    if (currentUrl.includes('login')) {
      await expect(page.locator('h1')).toContainText(/Use Sistemas|Master Plan/i, { timeout: 10000 });
      return;
    }

    await expect(page.locator('body')).toContainText(/Dashboard Consolidado|Executivo & IA/i, { timeout: 15000 });
  });

  test('Rotas pai e críticas abrem as telas corretas e não caem no dashboard consolidado', async ({ page }) => {
    const checks = [
      { route: '/dashboard', expectText: /Dashboard Consolidado/i },
      { route: '/comercial', expectText: /Dashboard Comercial/i },
      { route: '/comercial/dashboard', expectText: /Dashboard Comercial/i },
      { route: '/financeiro', expectText: /Controladoria & Finanças|Financeiro/i },
      { route: '/financeiro/dashboard', expectText: /Controladoria & Finanças|Financeiro/i },
      { route: '/wms', expectText: /WMS Enterprise|WMS/i },
      { route: '/wms/dashboard', expectText: /WMS Enterprise|WMS/i },
      { route: '/tms', expectText: /TMS/i },
      { route: '/tms/dashboard', expectText: /TMS/i },
      { route: '/rfid', expectText: /RFID/i },
      { route: '/rfid/dashboard', expectText: /RFID/i },
      { route: '/executive/executive', expectText: /IA Executiva|Conselho Executivo/i },
      { route: '/executive/brain', expectText: /Cérebro Nativo|Brain/i },
      { route: '/success', expectText: /Success|Portal/i },
      { route: '/operacional', expectText: /Central de Abastecimento|Abastecimento/i },
      { route: '/operacional/abastecimento', expectText: /Central de Abastecimento|Abastecimento/i },
      { route: '/admin', expectText: /Manual do Sistema|Manual/i },
      { route: '/admin/manual', expectText: /Manual do Sistema|Manual/i },
    ];

    for (const testCase of checks) {
      await page.goto(testCase.route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(700);
      await expect(page.url()).not.toContain('/404');
      await expect(page.locator('body')).toContainText(testCase.expectText, { timeout: 20000 });
      if (!['/dashboard', '/comercial', '/comercial/dashboard', '/financeiro', '/financeiro/dashboard', '/wms', '/wms/dashboard', '/tms', '/tms/dashboard', '/rfid', '/rfid/dashboard'].includes(testCase.route)) {
        await expect(page.locator('body')).not.toContainText('Dashboard Consolidado', { timeout: 5000 });
      }
    }
  });

  test('Redireciona aliases legados para páginas atuais', async ({ page }) => {
    const aliasChecks = [
      { route: '/production/pcp', target: '/producao/pcp' },
      { route: '/production/aps', target: '/producao/aps' },
      { route: '/commerce/lojas', target: '/comercial/dashboard' },
      { route: '/logistica/recebimento', target: '/wms/recebimento' },
      { route: '/wms/reposicao', target: '/wms/ressuprimento' },
      { route: '/logistica/transferencias', target: '/operacional/rede/transferencias' },
      { route: '/billing/consumo', target: '/financeiro/dashboard' },
      { route: '/estoque/inventario', target: '/estoque/saldos' },
    ];

    for (const { route, target } of aliasChecks) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);
      await expect(page.url()).toContain(target);
      await expect(page.locator('body')).not.toContainText('Página não encontrada');
    }
  });

  test('Verificar links de navegação da Central Unificada', async ({ page }) => {
    await page.goto('/');

    if (!page.url().includes('login')) {
      const supplyChainButton = page.locator('text=Acessar Central Unificada');
      if (await supplyChainButton.isVisible()) {
        await supplyChainButton.click();
        await expect(page).toHaveURL(/.*abastecimento/);
      }
    }
  });

});
