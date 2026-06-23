import { useEffect } from 'react';
import { applyPageSeo, resetPageSeo, type PageSeoConfig } from '../utils/pageSeo';

export function usePageSeo(config: PageSeoConfig) {
  useEffect(() => {
    applyPageSeo(config);
    return () => resetPageSeo();
  }, [config.description, config.keywords, config.noIndex, config.ogType, config.path, config.title]);
}
