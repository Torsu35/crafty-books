import { useEffect, useState } from "react";
import { getDb, one } from "./db";

export function useDbReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    getDb().then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);
  return ready;
}

export interface BusinessProfile {
  id: number;
  business_name: string;
  owner_name: string;
  business_type: string | null;
  vat_registered: number;
  tax_id: string | null;
  currency: string;
  period_pref: "month" | "quarter" | "year";
  pin: string | null;
}

export async function getProfile(): Promise<BusinessProfile | null> {
  return one<BusinessProfile>("SELECT * FROM business_profile WHERE id = 1");
}

export function useProfile(): {
  profile: BusinessProfile | null;
  loading: boolean;
  refetch: () => void;
} {
  const ready = useDbReady();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    getProfile().then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, [ready, nonce]);
  return { profile, loading, refetch: () => setNonce((n) => n + 1) };
}