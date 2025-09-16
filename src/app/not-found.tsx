import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <html lang="es">
      <head>
        <title>Página No Encontrada - RandomTrip</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans bg-neutral-50 text-neutral-900 antialiased min-h-screen flex items-center justify-center">
        <div className="w-full max-w-2xl mx-4">
          <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-neutral-900 mb-4">
              Página No Encontrada
            </h1>

            <p className="text-neutral-600 mb-8">
              Lo sentimos, la página que buscas no existe o ha sido movida. ¿Por
              qué no exploras nuestros increíbles destinos?
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir al Inicio
              </Link>
              <Link
                href="/packages"
                className="px-6 py-3 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Ver Paquetes
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
