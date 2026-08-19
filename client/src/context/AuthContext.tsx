import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getAccessToken, setAccessToken } from "../api/client.js";
import type { AuthUser } from "../types/index.js";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (moduleKey: string) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: AuthUser }>("/auth/me");
      setUser(res.data.data);
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // If we already have an access token cached, just confirm it.
      if (getAccessToken()) {
        await fetchMe();
        setLoading(false);
        return;
      }
      // Otherwise try to silently refresh from the httpOnly cookie.
      try {
        const res = await api.post<{ success: boolean; data: { accessToken: string } }>(
          "/auth/refresh"
        );
        setAccessToken(res.data.data.accessToken);
        await fetchMe();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();

    const onExpired = () => {
      setUser(null);
      setAccessToken(null);
    };
    window.addEventListener("ramada:session-expired", onExpired);
    return () => window.removeEventListener("ramada:session-expired", onExpired);
  }, [fetchMe]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post<{ success: boolean; data: { accessToken: string; user: AuthUser } }>(
      "/auth/login",
      { username, password }
    );
    setAccessToken(res.data.data.accessToken);
    setUser(res.data.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const isAdmin = user?.role === "Admin";
  const can = useCallback(
    (moduleKey: string) => isAdmin || !!user?.allowedModules?.includes(moduleKey),
    [isAdmin, user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
