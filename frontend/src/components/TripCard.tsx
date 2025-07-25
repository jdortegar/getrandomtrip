import React from 'react';
import Image from 'next/image';

interface TripCardProps {
  trip: {
    id: string;
    title: string;
    description: string;
    image: string;
  };
}

const TripCard: React.FC<TripCardProps> = ({ trip }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105">
      <Image src={trip.image} alt={trip.title} width={300} height={200} className="w-full h-48 object-cover" />
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{trip.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{trip.description}</p>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-600 transition duration-300">
          View Details
        </button>
      </div>
    </div>
  );
};

export default TripCard;
