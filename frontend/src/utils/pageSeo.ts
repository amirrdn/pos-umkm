export interface PageSeoConfig {
  title: string;
  description: string;
  path?: string;
  keywords?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
}

export const SITE_NAME = 'UMKM POS';

export const PAGE_SEO = {
  home: {
    title: 'UMKM POS — Kasir Toko Online Gratis untuk UMKM',
    description:
      'Kasir toko online untuk warung, toko kelontong, dan UMKM. Gratis, gampang dipakai dari HP atau laptop — tanpa install, langsung jualan.',
    path: '/',
    keywords:
      'kasir online, pos umkm, aplikasi kasir, kasir toko, point of sale, saas pos, kasir warung, inventaris toko',
    ogType: 'website',
  },
  docs: {
    title: 'Dokumentasi UMKM POS — Panduan Kasir, Inventaris & Langganan',
    description:
      'Panduan lengkap UMKM POS: pendaftaran, terminal kasir, pembayaran QRIS, multi-outlet, inventaris stok, dan paket langganan SaaS.',
    path: '/docs',
    keywords:
      'dokumentasi umkm pos, panduan kasir online, cara pakai pos, qris umkm, multi outlet pos',
    ogType: 'article',
  },
} as const satisfies Record<string, PageSeoConfig>;

const DEFAULT_SEO: PageSeoConfig = PAGE_SEO.home;

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function upsertLink(rel: string, href: string) {
  let element = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}

export function applyPageSeo(config: PageSeoConfig) {
  const origin = window.location.origin;
  const path = config.path ?? window.location.pathname;
  const url = `${origin}${path}`;
  const imageUrl = `${origin}/pwa-512x512.png`;

  document.title = config.title;
  document.documentElement.lang = 'id';

  upsertMeta('name', 'description', config.description);
  upsertMeta('name', 'robots', config.noIndex ? 'noindex, nofollow' : 'index, follow');

  if (config.keywords) {
    upsertMeta('name', 'keywords', config.keywords);
  }

  upsertMeta('property', 'og:title', config.title);
  upsertMeta('property', 'og:description', config.description);
  upsertMeta('property', 'og:type', config.ogType ?? 'website');
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('property', 'og:locale', 'id_ID');
  upsertMeta('property', 'og:image', imageUrl);
  upsertMeta('property', 'og:image:alt', `${SITE_NAME} — Kasir Toko Online untuk UMKM`);

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', config.title);
  upsertMeta('name', 'twitter:description', config.description);
  upsertMeta('name', 'twitter:image', imageUrl);

  upsertLink('canonical', url);
}

export function resetPageSeo() {
  applyPageSeo(DEFAULT_SEO);
}
