"use client";
import Link from "next/link";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import UserSection from "./UserSection";

const Navbar = () => {
  return (
    <nav className="bg-white mb-20 shadow-sm border-b border-gray-200 relative">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FA</span>
            </div>
            <span className="text-xl font-bold text-gray-900">FlorAurora</span>
          </Link>

          {/* Navegación Desktop */}
          <DesktopNav />

          {/* Sección de Usuario */}
          <div className="hidden lg:block">
            <UserSection />
          </div>

          {/* Navegación Móvil */}
          <MobileNav />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
