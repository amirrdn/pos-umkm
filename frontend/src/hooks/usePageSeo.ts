import { useEffect } from 'react';
import { applyPageSeo, resetPageSeo, type PageSeoConfig } from '../utils/pageSeo';

export function usePageSeo(config: PageSeoConfig) {
  const { title, description, keywords, noIndex, ogType, path } = config;

  useEffect(() => {
    applyPageSeo({ title, description, keywords, noIndex, ogType, path });
    return () => resetPageSeo();
  }, [title, description, keywords, noIndex, ogType, path]);
}
