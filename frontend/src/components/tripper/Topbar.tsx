"use client";

import Image from "next/image";
import { Search, Bell, UserCircle } from "lucide-react";

export default function Topbar() {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-neutral-800 shadow-sm flex items-center justify-between px-6 z-10">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
        <input
          type="text"
          placeholder="Buscar en Tripper OS..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-neutral-700 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-white placeholder-neutral-400"
        />
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        <button className="text-neutral-300 hover:text-white transition-colors">
          <Bell size={24} />
        </button>
        <button className="flex items-center space-x-2 text-neutral-300 hover:text-white transition-colors">
          <UserCircle size={32} />
          <span className="text-sm font-medium hidden md:inline">Tripper Name</span>
        </button>
      </div>
    </header>
  );
}
