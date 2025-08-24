export default function PawsTestimonials() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-10">Lo que dicen nuestros viajeros con huellas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="italic text-gray-700 mb-3">
              “¡Increíble experiencia! Mi perro y yo disfrutamos cada momento. La logística fue perfecta y los alojamientos superaron nuestras expectativas.”
            </p>
            <p className="font-semibold text-gray-900">— Ana & Max (Golden Retriever)</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="italic text-gray-700 mb-3">
              “Siempre fue un desafío encontrar lugares donde mi gato fuera bienvenido. PAWS© lo hizo posible. Un viaje sin estrés y con mimos para mi felino.”
            </p>
            <p className="font-semibold text-gray-900">— Carlos & Luna (Siamesa)</p>
          </div>
        </div>
      </div>
    </section>
  );
}