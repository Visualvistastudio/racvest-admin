// Background client-to-server synchronization helper
// Ensures frontend store mutations persist to the JSON-backed database layer via REST APIs.

export async function syncApi(url: string, method: 'POST' | 'PATCH' | 'DELETE' | 'GET', body?: unknown) {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      console.warn(`Sync warning [${method} ${url}]:`, errorJson.error || res.statusText);
      return { success: false, error: errorJson.error || res.statusText };
    }
    const data = await res.json().catch(() => ({}));
    return { success: true, data: data.data };
  } catch (err) {
    console.error(`Sync error [${method} ${url}]:`, err);
    return { success: false, error: 'Network or server error during sync' };
  }
}
