"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, LogOut, User, Briefcase } from "lucide-react";
import { useAuthState } from "@/lib/hooks/useAuthState";
import {
  adminNavigationItems,
  getAuthenticatedNavItems,
  NavItem,
} from "@/lib/navigation";
import { useUserProfile } from "@/lib/hooks/useUserProfile";

export default function UserSection() {
  const { user, isAuthenticated, signOut } = useAuthState();
  const { userProfile } = useUserProfile();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Obtener elementos de navegación basados en el rol del usuario
  // Para admin, filtrar el item "Panel administrativo" ya que se mostrará en sección separada
  const allAuthenticatedNavItems = getAuthenticatedNavItems(userProfile?.role);
  const authenticatedNavItems =
    userProfile?.role === 1
      ? allAuthenticatedNavItems.filter(
          (item) => item.label !== "Panel administrativo"
        )
      : allAuthenticatedNavItems;
  const adminNavItems = userProfile?.role === 1 ? adminNavigationItems : [];

  const handleCloseDropdown = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsDropdownOpen(false);
      setIsClosing(false);
    }, 200); // Duración de la animación
  };

  const handleToggleDropdown = () => {
    if (isDropdownOpen) {
      handleCloseDropdown();
    } else {
      setIsDropdownOpen(true);
    }
  };

  const handleNavItemClick = () => {
    handleCloseDropdown();
  };

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsClosing(true);
        setTimeout(() => {
          setIsDropdownOpen(false);
          setIsClosing(false);
        }, 200);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleSignOut = async () => {
    try {
      handleCloseDropdown();

      // Cerrar sesión
      await signOut();
    } catch (error) {
      console.error("❌ UserSection: Error al cerrar sesión:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center space-x-1.5 sm:space-x-3">
        {/* Botón simple de Iniciar Sesión */}
        <Link
          href="/login"
          className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:border-gray-300 transition-all whitespace-nowrap"
        >
          Iniciar Sesión
        </Link>

        {/* Dropdown de Registrarse */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleToggleDropdown}
            className="flex items-center space-x-0.5 sm:space-x-1 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Registrarse</span>
            <ChevronDown
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-white transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div
              className={`absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50 ${
                isClosing
                  ? "animate-fade-out-up"
                  : "opacity-0 animate-fade-in-down"
              }`}
            >
              <Link
                href="/signup"
                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                onClick={handleNavItemClick}
              >
                <User className="w-4 h-4" />
                <span>Paciente</span>
              </Link>
              <Link
                href="/signup-pro"
                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                onClick={handleNavItemClick}
              >
                <Briefcase className="w-4 h-4" />
                <span>Profesional</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleDropdown}
        className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
          {userProfile?.avatar_url ? (
            <Image
              src={userProfile.avatar_url}
              alt={`${userProfile.name || "Usuario"} avatar`}
              width={32}
              height={32}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-white text-sm font-medium">
              {user?.user_metadata?.name?.[0] || user?.email?.[0] || "U"}
            </span>
          )}
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
        <div
          className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50 ${
            isClosing ? "animate-fade-out-up" : "opacity-0 animate-fade-in-down"
          }`}
        >
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

          {adminNavItems.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Panel administrativo
              </div>
              {adminNavItems.map((item) => (
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
            </>
          )}

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
