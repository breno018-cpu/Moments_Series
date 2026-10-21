import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MaintenanceState {
  enabled: boolean;
  message: string;
  loading: boolean;
}

export const useMaintenance = (): MaintenanceState => {
  const [state, setState] = useState<MaintenanceState>({
    enabled: false,
    message: "",
    loading: true,
  });

  useEffect(() => {
    let alive = true;

    const fetchState = async () => {
      if (!alive || document.hidden) return;
      const { data } = await supabase.from("site_settings").select("*");
      if (!alive) return;
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => (map[r.key] = r.value));
      setState({
        enabled: map["maintenance_mode"] === "on",
        message:
          map["maintenance_message"] ||
          "Estamos passando por uma atualização. Voltamos em instantes!",
        loading: false,
      });
    };

    fetchState();
    const interval = setInterval(fetchState, 30_000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  return state;
};
