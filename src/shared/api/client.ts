import { getToken, useSession } from "../model/session";
import { StorageFullError } from "./mock/db";
import { HttpError, handleRequest } from "./mock/server";

/**
 * HTTP-клиент. Сейчас транспорт — мок-сервер в памяти + localStorage
 * с имитацией сети (задержка, сериализация, коды ошибок). Для настоящего
 * бэкенда достаточно заменить тело `transport` на fetch/axios.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

type Method = "DELETE" | "GET" | "PATCH" | "POST";
type Options = { body?: unknown; query?: object };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function latency(method: Method) {
  // Чтение быстрее записи, как у живого API
  return method === "GET"
    ? 140 + Math.random() * 220
    : 220 + Math.random() * 280;
}

function toQueryString(query?: object) {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v == null || v === "") continue;
    params.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

async function transport<T>(
  method: Method,
  path: string,
  opts: Options,
): Promise<T> {
  const started = performance.now();
  await sleep(latency(method));
  const body =
    opts.body === undefined ? undefined : JSON.parse(JSON.stringify(opts.body));
  try {
    const result = handleRequest({
      method,
      path,
      query: opts.query as Record<string, unknown>,
      body,
      token: getToken(),
    });
    if (import.meta.env.DEV) {
      console.debug(
        `%c[api] ${method} ${path}${toQueryString(opts.query)} 200 · ${Math.round(performance.now() - started)}ms`,
        "color:#18baba",
      );
    }
    // Ответ «прошёл через сеть»: никаких общих ссылок с базой
    return result === undefined
      ? (undefined as T)
      : (JSON.parse(JSON.stringify(result)) as T);
  } catch (e) {
    if (e instanceof HttpError) {
      if (import.meta.env.DEV) {
        console.debug(
          `%c[api] ${method} ${path} ${e.status} ${e.message}`,
          "color:#fc302a",
        );
      }
      if (e.status === 401 && path !== "/auth/login")
        useSession.getState().clear();
      throw new ApiError(e.status, e.message);
    }
    if (e instanceof StorageFullError) throw new ApiError(507, "storage_full");
    throw new ApiError(500, "server_error");
  }
}

export const api = {
  get: <T>(path: string, query?: object) =>
    transport<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown) =>
    transport<T>("POST", path, { body }),
  patch: <T>(path: string, body?: unknown) =>
    transport<T>("PATCH", path, { body }),
  delete: <T>(path: string) => transport<T>("DELETE", path, {}),
};
