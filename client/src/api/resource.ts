import { api } from "./client.js";

export function resource<T>(basePath: string) {
  return {
    list: async (params?: Record<string, unknown>) => {
      const res = await api.get<{ success: boolean; data: T[] }>(basePath, { params });
      return res.data.data;
    },
    get: async (id: number | string) => {
      const res = await api.get<{ success: boolean; data: T }>(`${basePath}/${id}`);
      return res.data.data;
    },
    create: async (payload: Record<string, unknown>) => {
      const res = await api.post<{ success: boolean; data: T }>(basePath, payload);
      return res.data.data;
    },
    update: async (id: number | string, payload: Record<string, unknown>) => {
      const res = await api.put<{ success: boolean; data: T }>(`${basePath}/${id}`, payload);
      return res.data.data;
    },
    remove: async (id: number | string) => {
      const res = await api.delete<{ success: boolean; message: string }>(`${basePath}/${id}`);
      return res.data;
    },
  };
}
