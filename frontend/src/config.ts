export const USE_PIPELINE = import.meta.env.VITE_BACKEND === 'aws';
export const WS_URL = import.meta.env.VITE_WS_URL as string | undefined;