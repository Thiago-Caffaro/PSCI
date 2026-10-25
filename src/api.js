const SESSION_KEY = 'psci-session';
export function readSession() {
  try {
    return JSON.parse(
      localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || 'null',
    );
  } catch {
    return null;
  }
}
export function saveSession(session, remember) {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
export function cacheSnapshot(snapshot) {
  try {
    // The local copy contains only this terminal, never the admin's account directory.
    localStorage.setItem(
      `psci-cache-${snapshot.user.id}`,
      JSON.stringify({ ...snapshot, accounts: undefined }),
    );
  } catch {
    /* Browser storage may be full or disabled. The live terminal still works. */
  }
}
export function readCache(id) {
  try {
    return JSON.parse(localStorage.getItem(`psci-cache-${id}`) || 'null');
  } catch {
    return null;
  }
}
export async function request(path, { token, signal, ...options } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Sem conexão com a Arca. Verifique se o servidor está ativo.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw Object.assign(new Error(data.message || 'Não foi possível completar a operação.'), {
      status: response.status,
    });
  return data;
}

export function subscribe(token, { onSnapshot, onStatus, onRevoked }) {
  const controller = new AbortController();
  let retryTimer;
  async function connect() {
    if (controller.signal.aborted) return;
    try {
      const response = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      if (response.status === 401) {
        onRevoked();
        return;
      }
      if (!response.ok || !response.body) throw new Error('Signal lost');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      onStatus('online');
      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) throw new Error('Signal lost');
        buffer += decoder.decode(value, { stream: true });
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const event = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          if (event.includes('event: revoked')) {
            onRevoked();
            return;
          }
          const line = event.split('\n').find((item) => item.startsWith('data: '));
          if (line) onSnapshot(JSON.parse(line.slice(6)));
        }
      }
    } catch {
      if (!controller.signal.aborted) {
        onStatus('offline');
        retryTimer = setTimeout(connect, 2500);
      }
    }
  }
  connect();
  return () => {
    controller.abort();
    clearTimeout(retryTimer);
  };
}
