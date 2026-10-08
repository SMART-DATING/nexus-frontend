export type Property = { name: string; value: string; visible: boolean };
export type Profile = {
  userId: number;
  avatarUrl?: string;
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
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const token = sessionStorage.getItem("nexus-token");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch("/api/v1" + path, {
      method,
      signal: controller.signal,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res
        .json()
        .catch(() => ({ message: "Сервер недоступен" }));
      if (
        res.status === 401 &&
        token &&
        token === sessionStorage.getItem("nexus-token")
      ) {
        sessionStorage.removeItem("nexus-token");
        window.dispatchEvent(new Event("nexus-session-expired"));
      }
      throw new ApiError(
        data.message || "Не удалось выполнить запрос",
        res.status,
      );
    }
    if (res.status === 204) return undefined as T;
    try {
      return await res.json();
    } catch {
      throw new ApiError(
        "Сервер вернул некорректный ответ. Повторите попытку.",
        res.status,
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      controller.signal.aborted
        ? "Сервер долго не отвечает. Повторите попытку."
        : "Не удалось связаться с сервером. Проверьте, что приложение запущено.",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}
