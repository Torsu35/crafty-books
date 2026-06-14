import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { getDb } from "./db";
import { getProfile } from "./accounting";

export function useDbReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      getDb();
      setReady(true);
    } catch (e) {
      console.warn("DB init failed", e);
    }
  }, []);
  return ready;
}

export function useProfile() {
  const ready = useDbReady();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    if (!ready) return;
    setLoading(true);
    try {
      setProfile(getProfile());
    } finally {
      setLoading(false);
    }
  }, [ready]);
  useEffect(reload, [reload]);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  return { profile, loading, refetch: reload };
}