'use client';
import PrimaryButton from '../components/PrimaryButton';
import TripCard from '../components/TripCard';
import ProgressBar from '../components/ProgressBar';

export default function Home() {
  const exampleTrips = [
    {
      id: '1',
      title: 'Adventure in the Amazon',
      description: 'Explore the lush rainforest and its incredible wildlife.',
      image: 'https://via.placeholder.com/300x200/FF5733/FFFFFF?text=Amazon',
    },
    {
      id: '2',
      title: 'Safari in Serengeti',
      description: 'Witness the great migration in Tanzania.',
      image: 'https://via.placeholder.com/300x200/33FF57/FFFFFF?text=Safari',
    },
    {
      id: '3',
      title: 'Cultural Tour of Kyoto',
      description: 'Discover ancient temples and vibrant traditions.',
      image: 'https://via.placeholder.com/300x200/3357FF/FFFFFF?text=Kyoto',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-center">
        <div className="z-10 p-4">
          <h1 className="text-5xl font-bold mb-4">Your Next Unforgettable Journey</h1>
          <p className="text-xl mb-8">Discover curated trips tailored just for you.</p>
          <PrimaryButton onClick={() => console.log('Explore Trips clicked')}>
            Explore Trips
          </PrimaryButton>
        </div>
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </section>

      {/* Trips Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Popular Destinations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exampleTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </div>
      </section>

      {/* Progress Bar */}
      <div className="p-4 bg-white shadow-md mt-auto">
        <ProgressBar currentStep={1} totalSteps={4} />
      </div>
    </div>
  );
}
