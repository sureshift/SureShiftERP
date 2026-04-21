import { useState, useEffect, useCallback } from "react";
import pb, { auth } from "../lib/pb.js";

export function useAuth() {
  const [user,    setUser]    = useState(() => pb.authStore.isValid ? pb.authStore.model : null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Keep user state in sync with PocketBase auth store
  useEffect(() => {
    const unsub = auth.onChange((token, model) => setUser(model));
    return () => unsub();
  }, []);

  // Refresh token on mount if already logged in
  useEffect(() => {
    if (pb.authStore.isValid) {
      auth.refresh()
        .then(() => setUser(pb.authStore.model))
        .catch(() => { auth.logout(); setUser(null); });
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true); setError(null);
    try {
      const res = await auth.login(email, password);
      setUser(res.record);
      return res.record;
    } catch (err) {
      const msg = err.status === 400
        ? "Invalid email or password."
        : (err.message || "Login failed. Please try again.");
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    auth.logout();
    setUser(null);
  }, []);

  return { user, loading, error, login, logout, isLoggedIn: !!user };
}
