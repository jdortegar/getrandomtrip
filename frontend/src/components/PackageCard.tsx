import React from 'react';
import Image from 'next/image';

interface PackageCardProps {
  tier: string;
  description: string;
  price: string;
  features: string[];
  image: string;
  buttonText: string;
  onButtonClick: () => void;
}

const PackageCard: React.FC<PackageCardProps> = ({
  tier,
  description,
  price,
  features,
  image,
  buttonText,
  onButtonClick,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transform transition-all duration-300 hover:scale-105 hover:border-yellow-500 group">
      <div className="relative h-56 w-full">
        <Image src={image} alt={tier} layout="fill" objectFit="cover" />
      </div>
      <div className="p-8"> {/* Increased padding */}
        <h3 className="text-3xl font-serif text-gray-900 mb-3">{tier}</h3> {/* Larger tier title */}
        <p className="text-gray-700 text-base mb-5 leading-relaxed">{description}</p> {/* Improved description typography */}
        <div className="text-gray-900 text-4xl font-bold mb-5">{price}</div> {/* Larger price */}
        <ul className="text-gray-700 text-base mb-8 space-y-3"> {/* Improved feature list typography and spacing */}
          {features.map((feature, index) => (
            <li key={index} className="flex items-start"> {/* Align items to start for better icon alignment */}
              {/* Custom checkmark icon */}
              <svg
                className="w-5 h-5 mr-3 text-yellow-600 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                ></path>
              </svg>
              {feature}
            </li>
          ))}
        </ul>
        {/* PrimaryButton style (terracotta color, sharp corners) */}
        <button
          onClick={onButtonClick}
          className="w-full bg-[#E47B5F] text-white py-4 px-6 font-semibold uppercase tracking-wider transition duration-300 ease-in-out hover:bg-[#D16A4E] focus:outline-none focus:ring-2 focus:ring-[#E47B5F] focus:ring-opacity-75"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default PackageCard;
