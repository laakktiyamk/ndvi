import axios from 'axios';
import type { TFunction } from 'i18next';

/**
 * Turns an API error into a translated message.
 * Backend sends machine-readable codes: either an `errors` list
 * (validation, `msg` is the code) or a single `code`.
 */
export function getApiErrorMessage(err: unknown, t: TFunction): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;

    if (Array.isArray(data?.errors)) {
      const messages = data.errors
        .map((e: { msg?: string }) =>
          e.msg ? t(`err_${e.msg}`, { defaultValue: e.msg }) : null
        )
        .filter(Boolean);
      if (messages.length > 0) return messages.join(' | ');
    }

    if (typeof data?.code === 'string') {
      return t(`err_${data.code}`, { defaultValue: t('fetchFailed') });
    }

    if (typeof data?.message === 'string') return data.message;
    return t('fetchFailed');
  }

  if (err instanceof Error) return err.message;
  return t('fetchFailed');
}