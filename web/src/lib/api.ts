import axios from "axios";

export const api = axios.create({ baseURL: "/" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export async function login(email: string, password: string) {
  const { data } = await api.post("/api/auth/login", { email, password });
  localStorage.setItem("token", data.token);
  return data.user as { id: string; email: string; name: string; role: string };
}

export async function registerUser(name: string, email: string, password: string) {
  const { data } = await api.post("/api/auth/register", { name, email, password });
  localStorage.setItem("token", data.token);
  return data.user as { id: string; email: string; name: string; role: string };
}
