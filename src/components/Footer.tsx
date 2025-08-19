'use client';

import { useState } from 'react';

import {
  ChevronDown,
  Facebook,
  Instagram,
  Mail,
  Music,
  Phone,
  Twitter,
  Youtube,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { type FooterData } from '@/lib/types';

interface FooterProps {
  data: FooterData;
}

export function Footer({ data }: FooterProps) {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter signup:', email);
  };

  const getSocialIcon = (iconName: string) => {
    switch (iconName) {
      case 'Instagram':
        return Instagram;
      case 'Music':
        return Music;
      case 'Facebook':
        return Facebook;
      case 'Twitter':
        return Twitter;
      case 'Youtube':
        return Youtube;
      default:
        return Instagram;
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="hidden md:grid md:grid-cols-4 md:gap-8">
          <div>
            <h3 className="text-sm font-bold uppercase text-gray-300 mb-4">
              IDIOMA
            </h3>
            <button className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center justify-between">
              <span>{data.language}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase text-gray-300 mb-4">
              CONTACTO
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-white" />
                <a
                  href={`mailto:${data.contact.email}`}
                  className="text-gray-300 hover:text-white"
                >
                  {data.contact.email}
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-white" />
                <a
                  href={`tel:${data.contact.phone}`}
                  className="text-gray-300 hover:text-white"
                >
                  {data.contact.phone}
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase text-gray-300 mb-4">
              RANDOM TRIP
            </h3>
            <ul className="space-y-2">
              {data.waynaboxLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.url} className="text-gray-300 hover:text-white">
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase text-gray-300 mb-4">
              DESCUBRE MÁS
            </h3>
            <ul className="space-y-2">
              {data.discoverLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.url} className="text-gray-300 hover:text-white">
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="md:hidden space-y-8">
          <div>
            <h3 className="text-sm font-bold uppercase text-gray-300 mb-4">
              IDIOMA
            </h3>
            <button className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center justify-between">
              <span>{data.language}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase text-gray-300 mb-4">
              CONTACTO
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-white" />
                <a
                  href={`mailto:${data.contact.email}`}
                  className="text-gray-300 hover:text-white"
                >
                  {data.contact.email}
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-white" />
                <a
                  href={`tel:${data.contact.phone}`}
                  className="text-gray-300 hover:text-white"
                >
                  {data.contact.phone}
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase text-gray-300 mb-4">
              RANDOM TRIP
            </h3>
            <ul className="space-y-2">
              {data.waynaboxLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.url} className="text-gray-300 hover:text-white">
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase text-gray-300 mb-4">
              DESCUBRE MÁS
            </h3>
            <ul className="space-y-2">
              {data.discoverLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.url} className="text-gray-300 hover:text-white">
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="hidden md:flex md:justify-between md:items-center">
            <div className="flex items-center space-x-4">
              {data.socialLinks.map((social) => {
                const SocialIcon = getSocialIcon(social.icon);
                return (
                  <a
                    key={social.id}
                    href={social.url}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <SocialIcon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>

            <div className="flex items-center space-x-4">
              <Input
                type="email"
                placeholder="Tu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-64 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
              <Button
                onClick={handleNewsletterSubmit}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                Suscribirse
              </Button>
            </div>
          </div>

          <div className="md:hidden space-y-6">
            <div className="flex items-center justify-center space-x-4">
              {data.socialLinks.map((social) => {
                const SocialIcon = getSocialIcon(social.icon);
                return (
                  <a
                    key={social.id}
                    href={social.url}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <SocialIcon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>

            <div className="flex flex-col space-y-3">
              <Input
                type="email"
                placeholder="Tu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
              <Button
                onClick={handleNewsletterSubmit}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                Suscribirse
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="hidden md:flex md:justify-between md:items-center">
            <div className="text-sm text-gray-400">
              © 2024 Random Trip. Todos los derechos reservados.
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>IATA 91-3-1234-5</span>
            </div>
          </div>

          <div className="md:hidden text-center space-y-2">
            <div className="text-sm text-gray-400">
              © 2024 Random Trip. Todos los derechos reservados.
            </div>
            <div className="text-sm text-gray-400">IATA 91-3-1234-5</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
