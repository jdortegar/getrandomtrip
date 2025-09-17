'use client';

interface NavbarSearchProps {
  isOverlay: boolean;
}

export function NavbarSearch({ isOverlay }: NavbarSearchProps) {
  const handleSearchClick = () => {
    window.dispatchEvent(new CustomEvent('open-search'));
  };

  return (
    <button
      type="button"
      className="p-2 rounded-lg hover:bg-white/10"
      aria-label="Buscar"
      onClick={handleSearchClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <circle cx="11" cy="11" r="7" strokeWidth="2" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
      </svg>
    </button>
  );
}
