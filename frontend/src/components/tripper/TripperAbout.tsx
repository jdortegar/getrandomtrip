'use client';
export default function TripperAbout({
  name, bio, videoUrl, interests=[], destinations=[]
}: {
  name: string;
  bio?: string;
  videoUrl?: string;
  interests?: string[];
  destinations?: string[];
}) {
  return (
    <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h2 className="text-xl font-medium">Sobre {name}</h2>
        <div className="mt-4">
          {videoUrl ? (
            <div className="aspect-video w-full rounded-xl overflow-hidden border">
              <iframe
                src={videoUrl}
                title={`Presentación de ${name}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <p className="text-slate-700 leading-relaxed">{bio || 'Pronto más sobre mi historia y cómo diseño cada viaje.'}</p>
          )}
        </div>
      </div>
      <aside className="lg:col-span-1">
        <div className="rounded-xl border bg-white p-5">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-slate-900 uppercase mb-2">Interests</h3>
              <ul className="text-sm text-slate-700 space-y-1">
                {interests.length ? interests.map(x => <li>• {x}</li>) : <li>—</li>}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-slate-900 uppercase mb-2">Destinations</h3>
              <ul className="text-sm text-slate-700 space-y-1">
                {destinations.length ? destinations.map(x => <li>• {x}</li>) : <li>—</li>}
              </ul>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}