import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouteChange } from './useRouteChange';

export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isDropdownClosing, setIsDropdownClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setOpenDropdown(null);
    setIsDropdownClosing(false);
  }, []);

  const handleCloseDropdown = useCallback(() => {
    setIsDropdownClosing(true);
    setTimeout(() => {
      setOpenDropdown(null);
      setIsDropdownClosing(false);
    }, 200); // Duración de la animación
  }, []);

  // Cerrar menú cuando cambia la ruta
  useRouteChange(closeMenu);

  // Cerrar menú cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    // Cerrar menú cuando se presiona Escape
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    // Escuchar evento personalizado para cerrar el menú móvil y dropdown
    const handleCloseEvent = () => {
      // Cerrar el dropdown si está abierto
      if (openDropdown) {
        handleCloseDropdown();
      }
      // Cerrar el menú completo
      closeMenu();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('closeNavbarDropdown', handleCloseEvent);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('closeNavbarDropdown', handleCloseEvent);
    };
  }, [isOpen, closeMenu, openDropdown, handleCloseDropdown]);

  const toggleMenu = () => {
    if (isOpen) {
      closeMenu();
    } else {
      setIsOpen(true);
    }
  };

  const toggleDropdown = (itemName: string) => {
    if (openDropdown === itemName) {
      handleCloseDropdown();
    } else {
      setOpenDropdown(itemName);
    }
  };

  return {
    isOpen,
    openDropdown,
    isDropdownClosing,
    menuRef,
    toggleMenu,
    closeMenu,
    toggleDropdown,
    handleCloseDropdown,
  };
}
