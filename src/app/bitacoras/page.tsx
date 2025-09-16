"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Head from 'next/head';
import BitacoraCountryCard from '@/components/BitacoraCountryCard'; // Correct import

// --- Components ---

// A. DestinationCard Component


// B. MoreDestinationsModal Component
const MoreDestinationsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) => {
  if (!isOpen) return null;

  const regions = {
    "América del Norte": [
      { name: "Canadá", link: "/canada" },
      { name: "Estados Unidos", link: "/estados-unidos" },
    ],
    "América Central": [
        { name: "Belice", link: "/belice" },
        { name: "Guatemala", link: "/guatemala" },
        { name: "Honduras", link: "/honduras" },
        { name: "Nicaragua", link: "/nicaragua" },
        { name: "Panamá", link: "/panama" },
    ],
    "América del Sur": [
        { name: "Brasil", link: "/brasil" },
        { name: "Ecuador", link: "/ecuador" },
        { name: "Guyana", link: "/guyana" },
        { name: "Paraguay", link: "/paraguay" },
        { name: "Surinam", link: "/surinam" },
    ],
    "El Caribe": [
        { name: "Antigua y Barbuda", link: "/antigua-barbuda" },
        { name: "Bahamas", link: "/bahamas" },
        { name: "Barbados", link: "/barbados" },
        { name: "Cuba", link: "/cuba" },
        { name: "Dominica", link: "/dominica" },
        { name: "Granada", link: "/granada" },
        { name: "Haití", link: "/haiti" },
        { name: "Jamaica", link: "/jamaica" },
        { name: "República Dominicana", link: "/republica-dominicana" },
        { name: "San Cristóbal y Nieves", link: "/san-cristobal-nieves" },
        { name: "San Vicente y las Granadinas", link: "/san-vicente-granadinas" },
        { name: "Santa Lucía", link: "/santa-lucia" },
        { name: "Trinidad y Tobago", link: "/trinidad-tobago" },
    ],
    "Otros Territorios": [
        { name: "Puerto Rico", link: "/puerto-rico" },
        { name: "Groenlandia", link: "/groenlandia" },
        { name: "Islas Vírgenes de EE.UU.", link: "/islas-virgenes-eeuu" },
        { name: "Islas Caimán", link: "/islas-caiman" },
        { name: "Islas Turcas y Caicos", link: "/islas-turcas-caicos" },
        { name: "Aruba", link: "/aruba" },
        { name: "Guayana Francesa", link: "/guayana-francesa" },
        { name: "Martinica", link: "/martinica" },
    ]
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white text-black rounded-lg shadow-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Más destinos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(regions).map(([region, countries]) => (
            <div key={region}>
              <h3 className="font-bold text-lg mb-3">{region}</h3>
              <ul>
                {countries.map(country => (
                  <li key={country.name} className="mb-1">
                    <Link href={country.link} className="hover:underline">{country.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-6 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cerrar</button>
      </motion.div>
    </div>
  );
};


// --- Main Page Component ---

export default function BitacorasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const countries = [
    { href: "/argentina", title: "Argentina", img: "/images/bitacoras/argentina.jpg" },
    { href: "/bolivia",   title: "Bolivia",   img: "/images/bitacoras/bolivia.jpg"   },
    { href: "/chile",     title: "Chile",     img: "/images/bitacoras/chile.jpg"     },
    { href: "/colombia",  title: "Colombia",  img: "/images/bitacoras/colombia.jpg"  },
    { href: "/costa-rica",title: "Costa Rica",img: "/images/bitacoras/costa-rica.jpg"},
    { href: "/el-salvador",title:"El Salvador",img:"/images/bitacoras/el-salvador.jpg"},
    { href: "/peru",      title: "Perú",      img: "/images/bitacoras/peru.jpg"      },
    { href: "/mexico",    title: "México",    img: "/images/bitacoras/mexico.jpg"    },
    { href: "/venezuela", title: "Venezuela", img: "/images/bitacoras/venezuela.jpg" },
  ];

  return (
    <>
      <Head>
        <title>Off the Record: Bitácoras del Continente</title>
        <meta name="description" content="Rutas que no vas a encontrar en Google. Recomendaciones que solo los Trippers conocen." />
      </Head>
      <main className="bg-white text-black py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
              Off the Record: Bitácoras del Continente
            </h1>
            <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
              Rutas que no vas a encontrar en Google. Recomendaciones que solo los Trippers conocen.
            </p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {countries.map(c => (
              <BitacoraCountryCard key={c.href} href={c.href} title={c.title} imgSrc={c.img}/>
            ))}
            <motion.div
              className="relative rounded-lg overflow-hidden h-64 group cursor-pointer bg-gray-100 flex items-center justify-center text-center p-4"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsModalOpen(true)}
            >
              <div>
                <h3 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>+ Ver más países</h3>
                <p className="text-gray-600">Más destinos</p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <MoreDestinationsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}