"use client";
import { useAuth } from "@/lib/hooks/useAuth";
import MarketingNav from "./MarketingNav";
import AuthenticatedNav from "./AuthenticatedNav";

const DesktopNav = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="hidden lg:flex items-center space-x-6">
      {/* Navegación de marketing para todos los usuarios */}
      <MarketingNav />

      {/* Navegación para usuarios autenticados */}
      {isAuthenticated && (
        <>
          <div className="border-l border-gray-300 h-6 mx-2" />
          <AuthenticatedNav />
        </>
      )}
    </div>
  );
};

export default DesktopNav;
