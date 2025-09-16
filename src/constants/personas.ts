// /constants/personas.ts
export type Persona = {
  id: string;
  name: string;
  avatar: string;
  bio: string; // Added this line
  ttsLang?: string; // 'es-MX' | 'es-AR' | 'en-US' | ...
  sttLang?: string; // 'es-MX' | 'es-AR' | 'en-US' | ...
  voiceURI?: string; // opcional: nombre exacto de voz si se quiere fijar
  country?: 'MX' | 'AR' | 'US';
};

export const personas: Persona[] = [
  { id: 'mx-local', name: 'Luna MX', avatar: '/images/avatars/luna-mx.jpg', bio: 'Tu guía local para México.', ttsLang: 'es-MX', sttLang: 'es-MX', country: 'MX' },
  { id: 'ar-local', name: 'Mora AR', avatar: '/images/avatars/mora-ar.jpg', bio: 'Tu compañera de aventuras en Argentina.', ttsLang: 'es-AR', sttLang: 'es-AR', country: 'AR' },
  { id: 'us-en',   name: 'Nova US', avatar: '/images/avatars/nova-us.jpg', bio: 'Your guide for exploring the USA.', ttsLang: 'en-US', sttLang: 'en-US', country: 'US' },
  { id: 'default', name: 'Aura',    avatar: '/images/avatars/aura.jpg', bio: 'Tu asistente de viaje global.', ttsLang: 'es-ES', sttLang: 'es-ES', country: 'MX' },
];