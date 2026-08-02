/**
 * Configuração de ambiente da plataforma.
 *
 * Nada de domínio/URL hardcoded em telas: tudo passa por aqui, para que
 * whitelabel e ambientes (dev/homolog/prod) mudem em um único lugar.
 */

/** Domínio raiz usado nos subdomínios das lojas (storefronts). */
export const STOREFRONT_ROOT_DOMAIN =
  import.meta.env.VITE_STOREFRONT_ROOT_DOMAIN ?? 'usecommerce.com.br';

/** Monta o domínio público de uma loja a partir do slug. */
export function storefrontDomain(slug: string | null | undefined): string {
  return `${slug || 'minha-loja'}.${STOREFRONT_ROOT_DOMAIN}`;
}

/** URL pública completa de uma loja. */
export function storefrontUrl(slug: string | null | undefined): string {
  return `https://${storefrontDomain(slug)}`;
}
