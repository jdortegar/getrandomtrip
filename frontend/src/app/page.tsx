import HeroSectionClient from '../components/HeroSectionClient';
import TripCard from '../components/TripCard';
import ProgressBar from '../components/ProgressBar';

export const metadata = {
  title: 'Randomtrip - Your Next Unforgettable Journey',
  description: 'Discover curated trips tailored just for you.',
};

export default function Home() {
  const dummyTrips = [
    {
      id: 1,
      title: 'Beach Paradise',
      description: 'Relax on pristine beaches with crystal clear waters.',
      imageUrl: 'https://via.placeholder.com/300x200?text=Beach+Paradise',
    },
    {
      id: 2,
      title: 'Mountain Adventure',
      description: 'Hike through breathtaking landscapes and conquer peaks.',
      imageUrl: 'https://via.placeholder.com/300x200?text=Mountain+Adventure',
    },
    {
      id: 3,
      title: 'City Explorer',
      description: 'Immerse yourself in vibrant city life and culture.',
      imageUrl: 'https://via.placeholder.com/300x200?text=City+Explorer',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <HeroSectionClient
        title="Your Next Unforgettable Journey"
        subtitle="Discover curated trips tailored just for you."
      />

      {/* Informative Sections (Placeholder for now) */}
      <section className="py-16 bg-gray-100 text-center">
        <h2 className="text-4xl font-bold mb-8">How it works?</h2>
        <p className="text-lg max-w-3xl mx-auto">
          Randomtrip simplifies your travel planning. Just tell us your preferences, and we&apos;ll
          curate a unique trip experience for you.
        </p>
      </section>

      <section className="py-16 bg-white text-center">
        <h2 className="text-4xl font-bold mb-8">Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
          <div className="p-6 shadow-lg rounded-lg">
            <h3 className="text-2xl font-semibold mb-2">Surprise Destinations</h3>
            <p>Experience the thrill of discovering new places.</p>
          </div>
          <div className="p-6 shadow-lg rounded-lg">
            <h3 className="text-2xl font-semibold mb-2">Tailored Experiences</h3>
            <p>Trips designed to match your unique interests.</p>
          </div>
          <div className="p-6 shadow-lg rounded-lg">
            <h3 className="text-2xl font-semibold mb-2">Hassle-Free Planning</h3>
            <p>We handle the details, so you can focus on enjoying.</p>
          </div>
        </div>
      </section>

      {/* Trip Cards Section */}
      <section className="py-16 bg-gray-100">
        <h2 className="text-4xl font-bold text-center mb-12">Popular Trips</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
          {dummyTrips.map((trip) => (
            <TripCard key={trip.id} trip={{ id: String(trip.id), title: trip.title, description: trip.description, image: trip.imageUrl }} />
          ))}
        </div>
      </section>

      {/* Progress Bar */}
      <section className="py-8 bg-white">
        <div className="max-w-xl mx-auto px-4">
          <ProgressBar currentStep={1} totalSteps={4} />
        </div>
      </section>

      {/* Footer (Placeholder for now) */}
      <footer className="bg-gray-800 text-white py-8 text-center">
        <p>&copy; 2025 Randomtrip. All rights reserved.</p>
      </footer>
    </div>
  );
}