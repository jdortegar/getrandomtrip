// frontend/src/components/layout/FooterLanding.tsx
export default function FooterLanding() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-transparent">
      <hr className="border-t border-white/10 dark:border-white/10" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 text-center">
        <p className="text-lg text-primary font-caveat">
          © {year} Randomtrip. Where the routine ends, the adventure begins.
        </p>
      </div>
    </footer>
  );
}
