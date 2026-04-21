import { useState, useEffect, useCallback } from "react";
import pb from "../lib/pb.js";

/**
 * useCollection — fetch a PocketBase collection with optional realtime updates
 */
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

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true); setError(null);
    try {
      const res = await pb.collection(collectionName)
        .getList(page, perPage, { filter, sort, expand });
      setItems(res.items);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, [collectionName, filter, sort, expand, page, perPage, enabled]);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime subscription
  useEffect(() => {
    if (!realtime || !enabled) return;
    let unsub;
    pb.collection(collectionName).subscribe("*", e => {
      if (e.action === "create") setItems(d => [e.record, ...d]);
      if (e.action === "update") setItems(d => d.map(r => r.id === e.record.id ? e.record : r));
      if (e.action === "delete") setItems(d => d.filter(r => r.id !== e.record.id));
    }).then(u => { unsub = u; });
    return () => { if (unsub) unsub(); };
  }, [collectionName, realtime, enabled]);

  return { items, totalItems, totalPages, loading, error, refresh };
}

/**
 * useMutation — create / update / delete with loading state
 */
export function useMutation(collectionName) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const run = useCallback(async (action, ...args) => {
    setLoading(true); setError(null);
    try {
      const col = pb.collection(collectionName);
      if (action === "create") return await col.create(args[0]);
      if (action === "update") return await col.update(args[0], args[1]);
      if (action === "delete") return await col.delete(args[0]);
    } catch (err) {
      const msg = err.data?.message || err.message || "Operation failed";
      setError(msg); throw new Error(msg);
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

/**
 * useSettings — loads all app_settings records into a key→value map
 */
export function useSettings() {
  const [settings, setSettings] = useState({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
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
