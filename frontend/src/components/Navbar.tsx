"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [overlay, setOverlay] = useState(true); // true when over hero, false when scrolled
  const [isMenuOpen, setIsMenuOpen] = useState(false); // for mobile hamburger menu
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // for main menu dropdown

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll detection logic
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) { // Adjust threshold as needed
        setOverlay(false);
      } else {
        setOverlay(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
    // Prevent body scroll when mobile menu is open
    document.body.style.overflow = !isMenuOpen ? 'hidden' : 'auto';
  }, [isMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    setIsMenuOpen(false);
    document.body.style.overflow = 'auto';
  }, []);

  const handleSearchClick = () => {
    window.dispatchEvent(new CustomEvent("open-search"));
  };

  const logoSrc = overlay ? "/assets/logos/Logo.svg" : "/assets/logos/Logo.svg"; // Will handle color change via CSS

  return (
    <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      overlay ? "bg-black/20 text-white backdrop-blur-sm" : "bg-white text-neutral-900 shadow"
    }`}>
      <nav className="h-16 flex items-center justify-between px-4 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" aria-label="Randomtrip">
          <img src={logoSrc} alt="Randomtrip" className={`h-8 w-auto transition-all duration-300 ${
            overlay ? 'filter brightness-0 invert' : '' // Apply filter for white/dark logo effect
          }`} />
        </Link>

        {/* Left Block (Main Navigation - hidden on mobile) */}
        <div className="hidden md:flex items-center gap-7 uppercase tracking-wide text-sm font-medium">
          <button aria-label="Buscar" onClick={handleSearchClick} className="hover:opacity-80 underline-offset-4">
            {/* Search Icon */}
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path></svg>
          </button>
          <Link href="/?tab=Top+Trippers#start-your-journey-anchor" className="hover:underline hover:underline-offset-4 transition-all duration-150">Trippers’ Finder</Link>
          <Link href="/#trippers-inspiration" className="hover:underline hover:underline-offset-4 transition-all duration-150">Trippers’ Inspiration</Link>
          <Link href="/nosotros" className="hover:underline hover:underline-offset-4 transition-all duration-150">Nosotros</Link>

          {/* Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              aria-haspopup="menu"
              aria-expanded={isDropdownOpen}
              onClick={toggleDropdown}
              className="flex items-center gap-1 hover:underline hover:underline-offset-4 transition-all duration-150"
            >
              Menú
              <svg className={`h-3 w-3 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
            {isDropdownOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-80 rounded-xl bg-white/95 backdrop-blur-xl shadow-lg ring-1 ring-black/5 p-2 text-neutral-900"
                onClick={closeDropdown} // Close dropdown on item click
              >
                <Link href="/experiencias" role="menuitem" className="block px-4 py-2 rounded hover:bg-neutral-50 transition-colors duration-150">TripBuddy (replaces “Experiencias”)</Link>
                <Link href="/bitacoras" role="menuitem" className="block px-4 py-2 rounded hover:bg-neutral-50 transition-colors duration-150">Off the Record: Bitácoras del Continente</Link>
                <Link href="/proximos-lanzamientos" role="menuitem" className="block px-4 py-2 rounded hover:bg-neutral-50 transition-colors duration-150">Próximos Lanzamientos</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Block (Actions) */}
        <div className="flex items-center gap-4">
          {/* WhatsApp */}
          <a href="https://wa.me/526241928208" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="p-1 rounded-full hover:bg-white/10 transition-colors duration-150">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="h-7 w-7" />
          </a>
          {/* Login */}
          <Link href="/login" aria-label="Iniciar sesión" className="p-1 rounded-full hover:bg-white/10 transition-colors duration-150">
            {/* User Icon */}
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
          </Link>
          {/* Language Badge */}
          <span aria-label="Idioma: Español" className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-semibold transition-all duration-300 ${
            overlay ? "border border-white/30" : "border border-neutral-300"
          }`}>
            ES
          </span>

          {/* Hamburger (Mobile Only) */}
          <button className="md:hidden p-2 rounded hover:bg-white/10 transition-colors duration-150" aria-label="Abrir menú" onClick={toggleMobileMenu}>
            {/* Hamburger Icon */}
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
          </button>
        </div>
      </nav>

      {/* Mobile Panel (Slide-in) */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMobileMenu}>
          <div className="fixed right-0 top-0 h-full w-64 bg-white text-neutral-900 shadow-lg p-4 transform transition-transform duration-300 ease-in-out translate-x-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeMobileMenu} className="absolute top-4 right-4 p-2 rounded hover:bg-neutral-100">
              {/* Close Icon */}
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
            <nav className="mt-10 flex flex-col gap-4 uppercase tracking-wide text-sm font-medium">
              <Link href="/?tab=Top+Trippers#start-your-journey-anchor" onClick={closeMobileMenu} className="block py-2 hover:bg-neutral-50">Trippers’ Finder</Link>
              <Link href="/#trippers-inspiration" onClick={closeMobileMenu} className="block py-2 hover:bg-neutral-50">Trippers’ Inspiration</Link>
              <Link href="/nosotros" onClick={closeMobileMenu} className="block py-2 hover:bg-neutral-50">Nosotros</Link>

              {/* Mobile Dropdown (Accordion) */}
              <div className="border-t border-neutral-200 pt-4 mt-4">
                <button onClick={() => setIsDropdownOpen(prev => !prev)} className="flex items-center justify-between w-full py-2 hover:bg-neutral-50">
                  Menú
                  <svg className={`h-3 w-3 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                </button>
                {isDropdownOpen && (
                  <div className="pl-4">
                    <Link href="/experiencias" onClick={closeMobileMenu} className="block py-2 hover:bg-neutral-50">TripBuddy (replaces “Experiencias”)</Link>
                    <Link href="/bitacoras" onClick={closeMobileMenu} className="block py-2 hover:bg-neutral-50">Off the Record: Bitácoras del Continente</Link>
                    <Link href="/proximos-lanzamientos" onClick={closeMobileMenu} className="block py-2 hover:bg-neutral-50">Próximos Lanzamientos</Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}