"use client";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { navItems, authenticatedNavItems, NavItem } from "@/lib/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useMobileMenu } from "@/lib/hooks/useMobileMenu";

const MobileNav = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const {
    isOpen,
    openDropdown,
    menuRef,
    toggleMenu,
    closeMenu,
    toggleDropdown,
  } = useMobileMenu();

  const handleSignOut = async () => {
    try {
      await signOut();
      closeMenu();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleNavItemClick = () => {
    closeMenu();
  };

  const renderNavItem = (item: NavItem) => {
    if (item.subItems) {
      return (
        <div key={item.name} className="border-b border-gray-200">
          <button
            onClick={() => toggleDropdown(item.name)}
            className="flex items-center justify-between w-full py-3 px-4 text-left text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                openDropdown === item.name ? "rotate-180" : ""
              }`}
            />
          </button>

          {openDropdown === item.name && (
            <div className="bg-gray-50 border-t border-gray-100">
              {item.subItems.map((subItem) => (
                <Link
                  key={subItem.name}
                  href={subItem.url}
                  className="block py-2 px-8 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  onClick={handleNavItemClick}
                >
                  {subItem.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.url}
        className="flex items-center space-x-3 py-3 px-4 text-gray-700 hover:text-gray-900 hover:bg-gray-50 border-b border-gray-200"
        onClick={handleNavItemClick}
      >
        <item.icon className="w-5 h-5" />
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="lg:hidden" ref={menuRef}>
      {/* Botón del menú móvil - cambia según el estado de autenticación */}
      <button
        onClick={toggleMenu}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        aria-label={isAuthenticated ? "Abrir menú de usuario" : "Abrir menú"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : isAuthenticated ? (
          // Avatar del usuario cuando está autenticado
          <div className="flex items-center space-x-1">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {user?.user_metadata?.name?.[0] || user?.email?.[0] || "U"}
              </span>
            </div>
            {/* Nombre del usuario visible en tablets */}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 truncate max-w-24">
                {user?.user_metadata?.name || user?.email || "Usuario"}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        ) : (
          // Ícono de hamburguesa cuando no está autenticado
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Menú móvil */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
          <div className="py-2">
            {/* Navegación de marketing para todos los usuarios */}
            {navItems.map(renderNavItem)}

            {/* Separador para usuarios autenticados */}
            {isAuthenticated && (
              <div className="border-b border-gray-200">
                <div className="px-4 py-3 bg-gray-50">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Mi Cuenta
                  </span>
                </div>
                {authenticatedNavItems.map(renderNavItem)}
              </div>
            )}

            {/* Botones de autenticación */}
            <div className="px-4 py-3 border-t border-gray-200">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 px-2 py-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.user_metadata?.name?.[0] ||
                          user?.email?.[0] ||
                          "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.user_metadata?.name || user?.email || "Usuario"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/auth/login"
                    className="block w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:border-gray-300 text-center"
                    onClick={closeMenu}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 text-center"
                    onClick={closeMenu}
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileNav;
