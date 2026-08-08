import { test, expect } from '@playwright/test';

/**
 * Nota: Como o sistema exige autenticação, para um ambiente de teste real 
 * precisaríamos injetar o token de sessão ou realizar o login programático.
 * Este script valida o fluxo básico de redirecionamento para o login e 
 * a estrutura da rota raiz se acessível.
 */

test.describe('Navegação e Segurança de Rotas', () => {

  test('Deve redirecionar para login quando não autenticado em rotas protegidas', async ({ page }) => {
    // Tenta acessar uma rota protegida conhecida
    await page.goto('/operacional/abastecimento');
    
    // Verifica se foi redirecionado para o login
    await expect(page).toHaveURL(/.*login/);
  });

  test('Página Inicial (Hardening Dashboard) deve carregar elementos básicos', async ({ page }) => {
    // Assumindo que a home é pública ou o usuário será redirecionado
    await page.goto('/');
    
    // Se a home for protegida, ele redirecionará para login
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
        console.log('Home é protegida, redirecionado para login.');
        await expect(page.locator('h1')).toContainText('Use Sistemas');
    } else {
        // Se for acessível, verifica o título do Master Plan
        await expect(page.locator('h1')).toContainText('Master Plan');
        await expect(page.locator('text=Fase 3: Inteligência Logística IA')).toBeVisible();
    }
  });

  test('Verificar links de navegação da Central Unificada', async ({ page }) => {
    // Acessa a home
    await page.goto('/');
    
    // Se estiver na home (não redirecionado), testa os botões de ação
    if (!page.url().includes('auth')) {
        const supplyChainButton = page.locator('text=Acessar Central Unificada');
        if (await supplyChainButton.isVisible()) {
            await supplyChainButton.click();
            await expect(page).toHaveURL(/.*abastecimento/);
        }
    }
  });

});
