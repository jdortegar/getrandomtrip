"use client";

import { Tripper } from "@/content/trippers";
import Link from "next/link";
import { FaInstagram, FaLinkedinIn, FaTiktok, FaYoutube } from "react-icons/fa"; // Assuming react-icons is installed

type Props = {
  tripper: Tripper;
};

export default function TripperAbout({ tripper }: Props) {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4">About {tripper.name.split(" ")[0]}</h2>
        {tripper.longBio.map((paragraph, index) => (
          <p key={index} className="mb-4 text-neutral-700 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
      <div className="md:col-span-1 bg-neutral-50 p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Quick Facts</h3>
        <ul className="space-y-3 text-neutral-700">
          {tripper.location && (
            <li>
              <span className="font-semibold">Based in:</span> {tripper.location}
            </li>
          )}
          {tripper.languages && tripper.languages.length > 0 && (
            <li>
              <span className="font-semibold">Languages:</span> {tripper.languages.join(", ")}
            </li>
          )}
          {tripper.destinations && tripper.destinations.length > 0 && (
            <li>
              <span className="font-semibold">Expert in:</span> {tripper.destinations.join(", ")}
            </li>
          )}
          {tripper.certifications && tripper.certifications.length > 0 && (
            <li>
              <span className="font-semibold">Certifications:</span> {tripper.certifications.join(", ")}
            </li>
          )}
        </ul>
        {tripper.socials && (
          <div className="mt-6 pt-4 border-t border-neutral-200">
            <h4 className="font-semibold mb-3">Connect:</h4>
            <div className="flex space-x-4">
              {tripper.socials.instagram && (
                <Link href={tripper.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-pink-500">
                  <FaInstagram size={24} />
                </Link>
              )}
              {tripper.socials.linkedin && (
                <Link href={tripper.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-blue-700">
                  <FaLinkedinIn size={24} />
                </Link>
              )}
              {tripper.socials.tiktok && (
                <Link href={tripper.socials.tiktok} target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-black">
                  <FaTiktok size={24} />
                </Link>
              )}
              {tripper.socials.youtube && (
                <Link href={tripper.socials.youtube} target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-red-600">
                  <FaYoutube size={24} />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}