"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { getAuthenticatedNavItems, NavItem } from "@/lib/navigation";
import { useUserProfile } from "@/lib/hooks/useUserProfile";

export default function UserSection() {
  const { user, isAuthenticated, signOut } = useAuthState();
  const { userProfile } = useUserProfile();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Obtener elementos de navegación basados en el rol del usuario
  const authenticatedNavItems = getAuthenticatedNavItems(userProfile?.role);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      console.log("🚪 UserSection: Iniciando cierre de sesión...");
      setIsDropdownOpen(false);

      // Cerrar sesión
      await signOut();

      console.log("✅ UserSection: Sesión cerrada exitosamente");
    } catch (error) {
      console.error("❌ UserSection: Error al cerrar sesión:", error);
    }
  };

  const handleNavItemClick = () => {
    setIsDropdownOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center space-x-3">
        <Link
          href="/login"
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Iniciar Sesión
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Registrarse
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user?.user_metadata?.name?.[0] || user?.email?.[0] || "U"}
          </span>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">
            {user?.user_metadata?.name || user?.email || "Usuario"}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm text-gray-500">Conectado como</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email}
            </p>
          </div>

          {/* Páginas de usuario autenticado */}
          {authenticatedNavItems.map((item: NavItem) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              onClick={handleNavItemClick}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          ))}

          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
