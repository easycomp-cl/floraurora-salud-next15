"use client";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { authenticatedNavItems, NavItem } from "@/lib/navigation";
import { useNavigation } from "@/lib/hooks/useNavigation";

const AuthenticatedNav = () => {
  const { openDropdown, setOpenDropdown, dropdownRef } = useNavigation();

  const renderNavItem = (item: NavItem) => {
    if (item.subItems) {
      return (
        <div key={item.label} className="relative" ref={dropdownRef}>
          <button
            onClick={() =>
              setOpenDropdown(openDropdown === item.label ? null : item.label)
            }
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                openDropdown === item.label ? "rotate-180" : ""
              }`}
            />
          </button>

          {openDropdown === item.label && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50">
              {item.subItems.map((subItem) => (
                <Link
                  key={subItem.label}
                  href={subItem.href}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  onClick={() => setOpenDropdown(null)}
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
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
      >
        <item.icon className="w-4 h-4" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="hidden lg:flex items-center space-x-6">
      {authenticatedNavItems.map(renderNavItem)}
    </div>
  );
};

export default AuthenticatedNav;
