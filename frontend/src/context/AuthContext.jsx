import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);
const makeGuestId = () => `guest_${crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("sambungkata_token"));
  const [guestName, setGuestName] = useState(localStorage.getItem("sambungkata_guest") || "");
  const [guestId, setGuestId] = useState(localStorage.getItem("sambungkata_guest_id") || "");
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    const loadMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
      } catch (_error) {
        localStorage.removeItem("sambungkata_token");
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, [token]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("sambungkata_token", data.token);
    setToken(data.token);
    setUser(data.user);
    setGuestName("");
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("sambungkata_token", data.token);
    setToken(data.token);
    setUser(data.user);
    setGuestName("");
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("sambungkata_token");
    setToken(null);
    setUser(null);
  };

  const enterGuest = (name) => {
    const nextName = name?.trim() || `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    const nextGuestId = guestId || makeGuestId();
    localStorage.setItem("sambungkata_guest", nextName);
    localStorage.setItem("sambungkata_guest_id", nextGuestId);
    setGuestName(nextName);
    setGuestId(nextGuestId);
    return { guestName: nextName, guestId: nextGuestId };
  };

  const value = useMemo(
    () => ({
      user,
      token,
      guestName,
      guestId,
      loading,
      login,
      register,
      logout,
      enterGuest,
      isAuthenticated: Boolean(user),
      displayName: user?.username || guestName || "Guest"
    }),
    [user, token, guestName, guestId, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
