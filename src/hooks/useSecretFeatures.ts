import { useEffect, useState } from "react";
import { fetchSecretFeatures } from "@/lib/api";

const LS_KEY = "hb_secret_features";

export function useSecretFeatures() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(LS_KEY) === "on";
  });

  useEffect(() => {
    let alive = true;
    fetchSecretFeatures()
      .then((cfg) => {
        if (!alive) return;
        setEnabled(cfg.enabled);
        localStorage.setItem(LS_KEY, cfg.enabled ? "on" : "off");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return enabled;
}
