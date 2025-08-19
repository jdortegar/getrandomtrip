'use client';

import { useState } from 'react';

import { ChevronDown, ChevronUp, Gift, Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGiftDropdownOpen, setIsGiftDropdownOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleGiftDropdown = () => {
    setIsGiftDropdownOpen(!isGiftDropdownOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-pink-500">
                Random Trip
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a
                href="#como-funciona"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                CÓMO FUNCIONA
              </a>
              <a
                href="#hoteles"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                HOTELES
              </a>
              <a
                href="#experiencias"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                EXPERIENCIAS
              </a>
            </div>
          </div>

          <div className="hidden md:block relative">
            <Button
              variant="ghost"
              onClick={toggleGiftDropdown}
              className="flex items-center space-x-1 text-gray-700 hover:text-gray-900"
            >
              <Gift className="h-4 w-4" />
              <span className="text-sm font-medium">
                ¡REGALA UN RANDOM TRIP!
              </span>
              {isGiftDropdownOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {isGiftDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <a
                  href="#regala-viaje"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  REGALA UN VIAJE
                </a>
                <a
                  href="#canjea-regalo"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  CANJEA TU REGALO
                </a>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-gray-900"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a
                href="#como-funciona"
                className="text-gray-700 hover:text-gray-900 block px-3 py-2 text-base font-medium transition-colors"
              >
                CÓMO FUNCIONA
              </a>
              <a
                href="#hoteles"
                className="text-gray-700 hover:text-gray-900 block px-3 py-2 text-base font-medium transition-colors"
              >
                HOTELES
              </a>
              <a
                href="#experiencias"
                className="text-gray-700 hover:text-gray-900 block px-3 py-2 text-base font-medium transition-colors"
              >
                EXPERIENCIAS
              </a>
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-3">
                  <Gift className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-base font-medium text-gray-700">
                    ¡REGALA UN RANDOM TRIP!
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  <a
                    href="#regala-viaje"
                    className="block px-3 py-2 text-base text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    REGALA UN VIAJE
                  </a>
                  <a
                    href="#canjea-regalo"
                    className="block px-3 py-2 text-base text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    CANJEA TU REGALO
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
