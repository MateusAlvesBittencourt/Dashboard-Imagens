export const isLocalMode = () => {
  try {
    // VITE_LOCAL_MODE pode ser 'true' ou '1'
    const v = (import.meta as any).env?.VITE_LOCAL_MODE;
    return v === 'true' || v === '1';
  } catch {
    return false;
  }
};
