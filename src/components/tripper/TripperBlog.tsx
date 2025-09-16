'use client';
import Link from 'next/link';
import Img from '@/components/common/Img'; // Added import

export default function TripperBlog({
  sectionId = 'tripper-blog',
  posts,
  t,
}: {
  sectionId?: string;
  posts?: any[];
  t?: any;
}) {
  const items = posts ?? t?.posts ?? [];
  if (!items.length) return null;
  return (
    <section id={sectionId} className="py-20 px-8 bg-[#111827] text-white scroll-mt-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div className="md:col-span-1 text-left">
          <h2 className="text-5xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Inspiración del Tripper</h2>
          <p className="text-lg text-gray-300 mt-4">Notas, guías y momentos que inspiran.</p>
        </div>
        <div className="md:col-span-2">
          <div className="flex overflow-x-auto space-x-8 pb-8 hide-scrollbar">
            {items.map((p: { title: string; image: string; category: string }) => (
              <div key={p.title} className="w-80 flex-shrink-0 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="h-48 rounded-lg overflow-hidden">
                  <Img src={p.image} alt={p.title} className="w-full h-full object-cover" width={320} height={192} />
                </div>
                <p className="mt-3 text-sm text-gray-400 uppercase">{p.category}</p>
                <h3 className="text-xl font-bold">{p.title}</h3>
              </div>
            ))}
            <Link href="/blog">
              <div className="bg-gray-800 rounded-lg flex flex-col items-center justify-center text-center p-6 w-80 flex-shrink-0 cursor-pointer hover:bg-gray-700 transition-colors border border-gray-700">
                <div className="w-16 h-16 border-2 border-gray-500 rounded-full flex items-center justify-center mb-4">→</div>
                <h3 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>View All</h3>
                <p className="text-gray-400 mt-2">Ir al Blog</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}