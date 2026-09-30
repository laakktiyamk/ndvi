import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const LOCALES: Record<string, string> = { fi: 'fi-FI', sv: 'sv-FI', en: 'en-GB' };

export function useFormatters() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const locale = LOCALES[lang] ?? lang;

  return useMemo(() => {
    const cache = new Map<string, Intl.NumberFormat>();
    const nf = (opts: Intl.NumberFormatOptions) => {
      const key = JSON.stringify(opts);
      let f = cache.get(key);
      if (!f) {
        f = new Intl.NumberFormat(locale, opts);
        cache.set(key, f);
      }
      return f;
    };
    const dateFmt = new Intl.DateTimeFormat(locale, {
      day: 'numeric', month: 'numeric', year: 'numeric',
    });

    const fixed = (digits: number) => ({
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

    return {
      number: (v: number, digits = 0) => nf(fixed(digits)).format(v),
      /** Etumerkillinen luku: +0,025 / −0,025 / 0,000 */
      signed: (v: number, digits = 3) =>
        nf({ ...fixed(digits), signDisplay: 'exceptZero' }).format(v),
      /** Suhde 0–1 → "45,6 %" */
      percent: (ratio: number, digits = 1) =>
        nf({ style: 'percent', ...fixed(digits) }).format(ratio),
      hectares: (ha: number, digits = 2) =>
        t('unit.hectares', { value: nf(fixed(digits)).format(ha) }),
      date: (iso: string) => dateFmt.format(new Date(iso)),
    };
  }, [locale, t]);
}