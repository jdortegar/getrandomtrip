'use client';

import PrimaryButton from '../../components/PrimaryButton';

export default function ExplorationClient() {
  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Choose Your Adventure Style</h1>

      {/* Top Trippers Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-4">Top Trippers</h2>
        <div className="bg-gray-100 p-6 rounded-lg shadow-md">
          <input
            type="text"
            placeholder="Search influencers/advisors..."
            className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* Placeholder for grid/list of influencers */}
          <div className="mt-4 text-gray-600">Coming Soon: Discover and connect with expert trippers!</div>
        </div>
      </section>

      {/* By Traveller Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-4">By Traveller</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <PrimaryButton onClick={() => console.log('Family selected')}>Family</PrimaryButton>
          <PrimaryButton onClick={() => console.log('Couple selected')}>Couple</PrimaryButton>
          <PrimaryButton onClick={() => console.log('Group selected')}>Group</PrimaryButton>
          <PrimaryButton onClick={() => console.log('Honeymoon selected')}>Honeymoon</PrimaryButton>
          <PrimaryButton onClick={() => console.log('Solo selected')}>Solo</PrimaryButton>
        </div>
      </section>

      {/* Roadtrip Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-4">Roadtrip</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <PrimaryButton onClick={() => console.log('Car selected')}>Car</PrimaryButton>
          <PrimaryButton onClick={() => console.log('Motorcycle selected')}>Motorcycle</PrimaryButton>
          <PrimaryButton onClick={() => console.log('Bicycle selected')}>Bicycle</PrimaryButton>
        </div>
      </section>

      {/* Trippers Decode Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-4">Trippers Decode</h2>
        <div className="bg-gray-100 p-6 rounded-lg shadow-md">
          <input
            type="text"
            placeholder="Search destination + month..."
            className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* Placeholder for verified guides info */}
          <div className="mt-4 text-gray-600">Find verified local guides for your chosen destination and time.</div>
        </div>
      </section>
    </main>
  );
}
