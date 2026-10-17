import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { Skeleton } from "@/components/ui/skeleton";
import AdminTransitionOverlay from "@/components/admin/AdminTransitionOverlay";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading, isAdmin } = useAdmin();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <AdminTransitionOverlay
          label="Painel Administrativo"
          sublabel="Verificando credenciais e inicializando ambiente seguro..."
        />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
