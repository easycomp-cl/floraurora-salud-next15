"use client";
import MarketingNav from "./MarketingNav";

export default function DesktopNav() {
  return (
    <div className="hidden lg:flex items-center space-x-3">
      {/* Navegación de marketing para todos los usuarios */}
      <MarketingNav />
    </div>
  );
}
