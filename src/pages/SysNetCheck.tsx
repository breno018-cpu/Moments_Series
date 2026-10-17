import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchMaintenanceMode, saveMaintenanceMode } from "@/lib/api";

const LS_KEY = "hb_overlay_state";

const SysNetCheck = () => {
  const { action } = useParams();
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const [status, setStatus] = useState<string>("checking");

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }

    const query = new URLSearchParams(window.location.search);
    const queryAction = (query.get("do") || "").toLowerCase();
    const effective = (action || queryAction || "toggle").toLowerCase();

    (async () => {
      try {
        const current = await fetchMaintenanceMode();
        const next =
          effective === "on" ? true : effective === "off" ? false : !current.enabled;
        await saveMaintenanceMode({ enabled: next });
        localStorage.setItem(LS_KEY, next ? "on" : "off");
        setStatus(next ? "overlay-on" : "overlay-off");
      } catch {
        setStatus("error");
      }

      setTimeout(() => navigate("/", { replace: true }), 1200);
    })();
  }, [action, isAdmin, loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-[11px] font-mono text-muted-foreground/40 tracking-wider">
        net-check :: {status}
      </p>
    </div>
  );
};

export default SysNetCheck;
