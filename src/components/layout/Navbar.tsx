"use client";
import Link from "next/link";
import Image from "next/image";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import UserSection from "./UserSection";
import logoImg from "../Fotos/logo.png";

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 mr-8">
            <Image
              src={logoImg}
              alt="Logo FlorAurora Salud"
              width={48}
              height={48}
              className="w-12 h-12"
            />
            <span className="text-xl font-bold text-gray-900">
              FlorAurora Salud
            </span>
          </Link>

          {/* Navegación Desktop */}
          <DesktopNav />

          {/* Sección de Usuario */}
          <div className="hidden lg:block ml-8">
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
