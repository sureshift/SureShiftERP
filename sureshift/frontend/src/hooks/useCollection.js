import { useState, useEffect, useCallback, useRef } from "react";
import pb from "../lib/pb.js";

export function useCollection(collectionName, options = {}) {
  const {
    filter   = "",
    sort     = "-created",
    expand   = "",
    page     = 1,
    perPage  = 50,
    realtime = false,
    enabled  = true,
  } = options;

  const [items,      setItems]      = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // A protected collection cannot be queried without an authenticated
    // PocketBase record. Keep the normal logged-out state quiet, but do not
    // hide real API failures when a user is supposed to be authenticated.
    if (!pb.authStore.isValid) {
      setLoading(false);
      setItems([]);
      setTotalItems(0);
      setTotalPages(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await pb.collection(collectionName)
        .getList(page, perPage, { filter, sort, expand });

      if (mountedRef.current) {
        setItems(res.items);
        setTotalItems(res.totalItems);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      if (!mountedRef.current) return;

      const status = err?.status || err?.response?.code || 0;
      const isAbort = err?.name === "AbortError";
      const isLoggedOut = !pb.authStore.isValid;

      // 401/abort during logout is expected. A 403 while authenticated is NOT
      // expected and must be visible; otherwise permission/rule problems look
      // exactly like an empty database.
      if (isLoggedOut || (status === 401 && !pb.authStore.isValid) || isAbort) {
        setItems([]);
        setTotalItems(0);
        setTotalPages(0);
        setError(null);
      } else {
        const message = err?.response?.message || err?.message || "Failed to load data";
        setError(`PocketBase ${status || "error"}: ${message}`);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [collectionName, filter, sort, expand, page, perPage, enabled]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const unsub = pb.authStore.onChange((token, model) => {
      if (!model && mountedRef.current) {
        setItems([]);
        setTotalItems(0);
        setTotalPages(0);
        setError(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!realtime || !enabled || !pb.authStore.isValid) return;
    let unsub;
    pb.collection(collectionName).subscribe("*", e => {
      if (!mountedRef.current || !pb.authStore.isValid) return;
      if (e.action === "create") setItems(d => [e.record, ...d]);
      if (e.action === "update") setItems(d => d.map(r => r.id === e.record.id ? e.record : r));
      if (e.action === "delete") setItems(d => d.filter(r => r.id !== e.record.id));
    }).then(u => { unsub = u; }).catch(err => {
      if (mountedRef.current && pb.authStore.isValid) {
        console.warn(`[PocketBase] realtime subscription failed for ${collectionName}`, err);
      }
    });
    return () => { if (unsub) try { unsub(); } catch (_) {} };
  }, [collectionName, realtime, enabled]);

  return { items, totalItems, totalPages, loading, error, refresh };
}

export function useMutation(collectionName) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const run = useCallback(async (action, ...args) => {
    setLoading(true); setError(null);
    try {
      if (!pb.authStore.isValid) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const col = pb.collection(collectionName);
      if (action === "create") return await col.create(args[0]);
      if (action === "update") return await col.update(args[0], args[1]);
      if (action === "delete") return await col.delete(args[0]);
      throw new Error(`Unsupported mutation: ${action}`);
    } catch (err) {
      const status = err?.status || err?.response?.code || 0;
      const serverMessage = err?.response?.message || err?.data?.message;
      const fieldErrors = err?.response?.data || err?.data?.data;
      let msg = serverMessage || err?.message || "Operation failed";

      if (fieldErrors && typeof fieldErrors === "object" && Object.keys(fieldErrors).length) {
        const details = Object.entries(fieldErrors)
          .map(([field, value]) => `${field}: ${value?.message || value}`)
          .join("; ");
        msg += ` — ${details}`;
      }

      setError(`PocketBase ${status || "error"}: ${msg}`);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  return {
    create: data       => run("create", data),
    update: (id, data) => run("update", id, data),
    remove: id         => run("delete", id),
    loading, error,
  };
}

export function useSettings() {
  const [settings, setSettings] = useState({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!pb.authStore.isValid) { setLoading(false); return; }
    pb.collection("app_settings").getFullList()
      .then(rows => setSettings(Object.fromEntries(rows.map(r => [r.key, r.value]))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (key, value, category = "general") => {
    try {
      const r = await pb.collection("app_settings").getFirstListItem(`key="${key}"`);
      await pb.collection("app_settings").update(r.id, { value });
    } catch {
      await pb.collection("app_settings").create({ key, value, category });
    }
    setSettings(s => ({ ...s, [key]: value }));
  };

  return { settings, loading, save };
}
