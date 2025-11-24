import { useState, useRef, useEffect } from 'react';

export function useNavigation() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCloseDropdown = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOpenDropdown(null);
      setIsClosing(false);
    }, 200); // Duración de la animación
  };

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    if (!openDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsClosing(true);
        setTimeout(() => {
          setOpenDropdown(null);
          setIsClosing(false);
        }, 200);
      }
    };

    // Escuchar evento personalizado para cerrar el dropdown
    const handleCloseEvent = () => {
      handleCloseDropdown();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("closeNavbarDropdown", handleCloseEvent);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("closeNavbarDropdown", handleCloseEvent);
    };
  }, [openDropdown]);

  const toggleDropdown = (itemName: string) => {
    if (openDropdown === itemName) {
      handleCloseDropdown();
    } else {
      setOpenDropdown(itemName);
    }
  };

  return {
    openDropdown,
    setOpenDropdown,
    isClosing,
    dropdownRef,
    toggleDropdown,
    handleCloseDropdown,
  };
}
