export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    credentials: "include",
  });

  const raw = await response.text();
  let payload: { success?: boolean; message?: string; data?: T } | null = null;
  if (raw) {
    try {
      payload = JSON.parse(raw) as { success?: boolean; message?: string; data?: T };
    } catch {
      payload = null;
    }
  }
  if (!response.ok || !payload?.success) {
    const textMessage =
      typeof raw === "string" && raw.trim() && !raw.trim().startsWith("{")
        ? raw.trim().slice(0, 180)
        : "";
    throw new Error(
      payload?.message || textMessage || `${response.status} ${response.statusText}` || "Request failed"
    );
  }
  return payload.data as T;
}
