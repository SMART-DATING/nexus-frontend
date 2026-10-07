export type Property = { name: string; value: string; visible: boolean };
export type Profile = {
  userId: number;
  properties: Property[];
  interests: string[];
  commonInterests?: string[];
  compatibilityScore?: number;
};
export type User = {
  id: number;
  email: string;
  profile: Profile;
  preferences: { minAge: number; maxAge: number };
};
export type Match = { id: number; user: Profile; createdAt: string };
export type Message = {
  id: number;
  senderId: number;
  text: string;
  createdAt: string;
};
export type Notice = {
  id: number;
  matchId: number;
  text: string;
  seen: boolean;
  createdAt: string;
};
export const value = (p: Profile, name: string) =>
  p.properties.find((x) => x.name === name)?.value || "";
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const token = sessionStorage.getItem("nexus-token");
  const res = await fetch("/api/v1" + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res
      .json()
      .catch(() => ({ message: "Сервер недоступен" }));
    if (res.status === 401 && token) {
      sessionStorage.removeItem("nexus-token");
      window.dispatchEvent(new Event("nexus-session-expired"));
    }
    throw new Error(data.message || "Не удалось выполнить запрос");
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
