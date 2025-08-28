"use client";
import Link from "next/link";
import { useAuthState } from "@/lib/hooks/useAuthState";
import MarketingNav from "./MarketingNav";
import AuthenticatedNav from "./AuthenticatedNav";

export default function DesktopNav() {
  const { isAuthenticated } = useAuthState();

  return (
    <div className="hidden lg:flex items-center space-x-6">
      {/* Navegación de marketing para todos los usuarios */}
      <MarketingNav />
    </div>
  );
}
