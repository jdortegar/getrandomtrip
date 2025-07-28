// frontend/src/components/Navbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Experiencias', href: '/experiencias' },
    { label: 'Nosotros', href: '/nosotros' },
  ];

  const mobileNavItems = [
    { label: 'Experiencias', href: '/experiencias' },
    { label: 'Nosotros', href: '/nosotros' },
    { label: 'Mes', href: '#' },
    { label: 'Trippers’ Blog', href: '#' },
    { label: 'Tripper Finder', href: '#' },
    { label: 'Próximos Lanzamientos', href: '#' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white px-8 py-0 md:px-16 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex items-center">
        <Image
          src="/assets/logos/logo-fullcolor-horizontal.svg" // Changed to black logo for white background
          alt="Randomtrip Logo"
          width={550}
          height={220}
          className="h-36 w-auto"
          priority
        />
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-8">
        {/* Search Icon and Input */}
        <div className="relative flex items-center">
          <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="text-gray-900 hover:text-gray-700 transition-colors">
            🔍
          </button>
          {isSearchOpen && (
            <input
              type="text"
              placeholder="Search..."
              className="ml-4 bg-gray-100/70 text-gray-900 p-2 rounded-md focus:ring focus:ring-[#D4AF37] outline-none"
            />
          )}
        </div>

        {navItems.map((item) => (
          <Link key={item.label} href={item.href} className="text-gray-900 hover:text-gray-700 transition-colors">
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Action Icons (Desktop) */}
      <div className="hidden md:flex items-center space-x-6">
        <a href="https://wa.me/526241928208" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-900 hover:text-gray-700 transition-colors">
          <Image src="https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/whatsapp.svg" alt="WhatsApp" width={20} height={20} className="mr-2" /> {/* Removed filter-invert */}
          +52 624 192 8208
        </a>
        <button onClick={() => setIsLoginModalOpen(true)} className="text-gray-900 hover:text-gray-700 transition-colors">
          👤
        </button>
      </div>

      {/* Mobile Hamburger Menu */}
      <div className="md:hidden flex items-center">
        <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="text-gray-900 hover:text-gray-700 transition-colors mr-4">
          🔍
        </button>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-900 hover:text-gray-700 transition-colors">
          ☰
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white/90 z-40 flex flex-col items-center justify-center space-y-6 md:hidden">
          {mobileNavItems.map((item) => (
            <Link key={item.label} href={item.href} className="text-gray-900 text-2xl hover:text-gray-700 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
          <a href="https://wa.me/526241928208" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-900 text-2xl hover:text-gray-700 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
            <Image src="https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/whatsapp.svg" alt="WhatsApp" width={24} height={24} className="mr-2" /> {/* Removed filter-invert */}
            +52 624 192 8208
          </a>
          <button onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }} className="text-gray-900 text-2xl hover:text-gray-700 transition-colors">
            👤 Login
          </button>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-900 text-4xl mt-8">
            ✕
          </button>
        </div>
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center relative">
            <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl">
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Login / Register</h2>
            <p className="text-gray-700">Login modal content goes here...</p>
            {/* Add actual login form elements here */}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;