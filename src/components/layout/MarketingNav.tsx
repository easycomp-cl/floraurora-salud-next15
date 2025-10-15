"use client";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { navItems, NavItem } from "@/lib/navigation";
import { useNavigation } from "@/lib/hooks/useNavigation";

const MarketingNav = () => {
  const {
    openDropdown,
    isClosing,
    dropdownRef,
    toggleDropdown,
    handleCloseDropdown,
  } = useNavigation();

  const renderNavItem = (item: NavItem) => {
    if (item.subItems) {
      return (
        <div key={item.label} className="relative" ref={dropdownRef}>
          <button
            onClick={() => toggleDropdown(item.label)}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-2 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                openDropdown === item.label ? "rotate-180" : ""
              }`}
            />
          </button>

          {openDropdown === item.label && (
            <div
              className={`absolute top-full left-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50 ${
                isClosing
                  ? "animate-fade-out-up"
                  : "opacity-0 animate-fade-in-down"
              }`}
            >
              {item.subItems.map((subItem) => (
                <Link
                  key={subItem.label}
                  href={subItem.href}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  onClick={handleCloseDropdown}
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-2 py-2 rounded-md text-sm font-medium transition-colors"
      >
        <item.icon className="w-4 h-4" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="hidden lg:flex items-center space-x-3">
      {navItems.map(renderNavItem)}
    </div>
  );
};

export default MarketingNav;
