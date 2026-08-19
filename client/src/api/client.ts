import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send the httpOnly refresh cookie
});

let accessToken: string | null = null;
let refreshingPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) sessionStorage.setItem("ramada_access_token", token);
  else sessionStorage.removeItem("ramada_access_token");
}

export function getAccessToken() {
  if (!accessToken) accessToken = sessionStorage.getItem("ramada_access_token");
  return accessToken;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const newToken = res.data?.data?.accessToken as string | undefined;
    if (newToken) {
      setAccessToken(newToken);
      return newToken;
    }
    return null;
  } catch {
    setAccessToken(null);
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes("/auth/")) {
      original._retry = true;

      if (!refreshingPromise) {
        refreshingPromise = refreshAccessToken().finally(() => {
          refreshingPromise = null;
        });
      }
      const newToken = await refreshingPromise;

      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api(original);
      }

      // Refresh failed — force logout
      window.dispatchEvent(new CustomEvent("ramada:session-expired"));
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(err: unknown, fallback = "System khalad ayaa dhacay."): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}
