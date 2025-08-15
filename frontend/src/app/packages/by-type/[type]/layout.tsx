import type { Metadata } from "next";

// Function to convert slug to capitalized title (e.g., en-pareja -> En Pareja)
function capitalizeSlug(slug: string) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const typeTitles: { [key: string]: string } = {
  solo: "Aventura en Solitario",
  pareja: "Escapada en Pareja",
  familia: "Plan Familiar",
  grupo: "Viaje en Grupo",
  honeymoon: "Honeymoon",
};

export async function generateMetadata({ params }: { params: { type: string } }): Promise<Metadata> {
  const pageTitle = typeTitles[params.type] || capitalizeSlug(params.type);
  return {
    title: `${pageTitle} | Randomtrip`,
  };
}

export default function TypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
