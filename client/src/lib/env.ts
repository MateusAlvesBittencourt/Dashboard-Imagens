export const isLocalMode = () => {
  try {
    // Primeiro, respeita VITE_LOCAL_MODE se estiver definido
    const env: any = (import.meta as any).env ?? {};
    const v = env?.VITE_LOCAL_MODE;
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;

    // Fallback: em DEV (vite) e rodando em localhost, assume modo local
    if (env?.DEV) {
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      if (host === 'localhost' || host === '127.0.0.1') return true;
    }
  } catch {}
  return false;
};
