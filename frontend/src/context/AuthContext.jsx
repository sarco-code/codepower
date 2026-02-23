import { createContext, useEffect, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sarcstar_token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then((response) => {
        setUser(response.data.user);
      })
      .catch(() => {
        localStorage.removeItem("sarcstar_token");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function login(credentials) {
    const response = await api.post("/auth/login", credentials);
    localStorage.setItem("sarcstar_token", response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }

  async function register(payload) {
    const response = await api.post("/auth/register", payload);
    localStorage.setItem("sarcstar_token", response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }

  function logout() {
    localStorage.removeItem("sarcstar_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
