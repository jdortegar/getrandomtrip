
// components/RoadtripFilterForm.tsx
import React from 'react';

const RoadtripFilterForm: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Planifica tu Roadtrip</h2>
      <form className="space-y-4">
        <div>
          <label htmlFor="origen" className="block text-sm font-medium text-gray-700">Origen</label>
          <input
            type="text"
            id="origen"
            name="origen"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Ciudad de origen"
          />
        </div>
        <div>
          <label htmlFor="destino" className="block text-sm font-medium text-gray-700">Destino</label>
          <input
            type="text"
            id="destino"
            name="destino"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Ciudad de destino"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="diasRuta" className="block text-sm font-medium text-gray-700">Días de ruta</label>
            <input
              type="number"
              id="diasRuta"
              name="diasRuta"
              min="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="diasDestino" className="block text-sm font-medium text-gray-700">Días en destino</label>
            <input
              type="number"
              id="diasDestino"
              name="diasDestino"
              min="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor="tipoViaje" className="block text-sm font-medium text-gray-700">Tipo de viaje</label>
          <select
            id="tipoViaje"
            name="tipoViaje"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Selecciona un tipo</option>
            <option value="aventura">Aventura</option>
            <option value="cultural">Cultural</option>
            <option value="relajacion">Relajación</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="personas" className="block text-sm font-medium text-gray-700"># Personas</label>
            <input
              type="number"
              id="personas"
              name="personas"
              min="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="presupuestoDiario" className="block text-sm font-medium text-gray-700">Presupuesto diario/persona</label>
            <input
              type="number"
              id="presupuestoDiario"
              name="presupuestoDiario"
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor="tipoAlojamiento" className="block text-sm font-medium text-gray-700">Tipo de alojamiento</label>
          <select
            id="tipoAlojamiento"
            name="tipoAlojamiento"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Selecciona un tipo</option>
            <option value="hotel">Hotel</option>
            <option value="hostal">Hostal</option>
            <option value="camping">Camping</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-300"
        >
          Continuar
        </button>
      </form>
    </div>
  );
};

export default RoadtripFilterForm;
