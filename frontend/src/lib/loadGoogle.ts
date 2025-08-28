let loadingPromise: Promise<void> | null = null;

export function loadGoogleMapsPlaces(apiKey: string, language = 'es'): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  // Si ya está disponible, salir
  if ((window as any).google?.maps?.places) return Promise.resolve();

  // Si ya estamos cargando, reutilizar
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise<void>((resolve, reject) => {
    // ¿Ya hay un script?
    const id = 'google-maps-script';
    if (!document.getElementById(id)) {
      const s = document.createElement('script');
      s.id = id;
      s.async = true;
      s.defer = true;
      s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=${language}`;
      s.onerror = () => reject(new Error('No se pudo cargar Google Maps JS'));
      document.head.appendChild(s);
    }

    // Polling corto hasta que exista google.maps.places
    const start = Date.now();
    const tick = () => {
      const g = (window as any).google;
      if (g?.maps?.places) return resolve();
      if (Date.now() - start > 10000) return reject(new Error('Timeout cargando Google Places'));
      requestAnimationFrame(tick);
    };
    tick();
  });

  return loadingPromise;
}