import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setToken } from "./api.js";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [meta, setMeta] = useState(null);
  const [expired, setExpired] = useState(false);
  function logout() {
    setToken(null);
    setUser(null);
    setMeta(null);
  }
  useEffect(() => {
    const listener = () => {
      logout();
      setExpired(true);
    };
    window.addEventListener("session-expired", listener);
    return () => window.removeEventListener("session-expired", listener);
  }, []);
  async function login(email, password) {
    const result = await api("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(result.token);
    try {
      const metadata = await api("/meta");
      setMeta(metadata);
      setUser(result.user);
      setExpired(false);
    } catch (error) {
      setToken(null);
      throw error;
    }
  }
  return (
    <AuthContext.Provider value={{ user, meta, expired, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
