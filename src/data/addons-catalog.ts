// frontend/src/data/addons-catalog.ts
import type { AddonUnit } from '@/store/slices/journeyStore'

export type Addon = {
  id: string
  category: 'Seguridad'|'Vuelo y Equipaje'|'Movilidad'|'Alojamiento'|'Experiencias'|'Conectividad'|'Otros'
  title: string
  short: string
  description: string
  unit: AddonUnit
  priceUsd: number            // base
  options?: { id: string; label: string; deltaUsd?: number }[]
  highlight?: boolean
}

export const ADDONS: Addon[] = [
  // Seguridad
  {
    id: 'cancel-ins',
    category: 'Seguridad',
    title: 'Seguro de Cancelación',
    short: 'Protegé tu inversión',
    description: 'Cubre cancelaciones por causas contempladas. Se calcula como el 15% del subtotal.',
    unit: 'percent_total', priceUsd: 15, highlight: true
  },
  {
    id: 'travel-ins-basic',
    category: 'Seguridad',
    title: 'Seguro de Viaje',
    short: 'Asistencia médica y más',
    description: 'Cobertura internacional. Opciones según nivel.',
    unit: 'per_pax', priceUsd: 35,
    options: [
      { id:'basic', label:'Básico' },
      { id:'plus', label:'Amplio', deltaUsd: 15 },
      { id:'premium', label:'Premium (deportes)', deltaUsd: 40 },
    ]
  },

  // Vuelo y Equipaje
  { id:'seat-select', category:'Vuelo y Equipaje', title:'Selección de asiento', short:'Elegí tu lugar', description:'Ventana, pasillo o preferente.', unit:'per_pax', priceUsd: 18,
    options: [{id:'std',label:'Standard'},{id:'xl',label:'Extra espacio',deltaUsd:20},{id:'front',label:'Preferente',deltaUsd:12}] },
  { id:'carry-on', category:'Vuelo y Equipaje', title:'Carry-on extra', short:'Equipaje de mano adicional', description:'Una pieza adicional.', unit:'per_pax', priceUsd: 25 },
  { id:'checked-bag', category:'Vuelo y Equipaje', title:'Equipaje en bodega', short:'1 maleta despachada', description:'Hasta 23kg.', unit:'per_pax', priceUsd: 35 },

  // Conectividad
  { id:'esim-5', category:'Conectividad', title:'e-SIM 5GB/15d', short:'Datos en destino', description:'Instalación inmediata, 5GB por 15 días.', unit:'per_pax', priceUsd: 18 },
  { id:'esim-10', category:'Conectividad', title:'e-SIM 10GB/30d', short:'Más datos', description:'10GB por 30 días.', unit:'per_pax', priceUsd: 28 },

  // Movilidad
  { id:'pickup-origin', category:'Movilidad', title:'Transfer en Origen', short:'Pick-up/Drop-off', description:'Traslado privado en origen.', unit:'per_trip', priceUsd: 30 },
  { id:'pickup-destination', category:'Movilidad', title:'Transfer en Destino', short:'Aeropuerto ↔ hotel', description:'Traslado privado en destino.', unit:'per_trip', priceUsd: 40 },
  { id:'car-rental', category:'Movilidad', title:'Alquiler de Auto (por día)', short:'Con seguro básico', description:'Precio por día. Ajustá cantidad de días.', unit:'per_trip', priceUsd: 35 },
  { id:'scooter', category:'Movilidad', title:'Alquiler de Moto/Scooter (día)', short:'Movilidad urbana', description:'Precio por día.', unit:'per_trip', priceUsd: 20 },
  { id:'bike', category:'Movilidad', title:'Alquiler de Bicicleta (día)', short:'Explorá a tu ritmo', description:'Precio por día.', unit:'per_trip', priceUsd: 12 },

  // Alojamiento
  { id:'hotel-upgrade', category:'Alojamiento', title:'Upgrade de Alojamiento', short:'Subí de categoría', description:'Mejor vista o categoría superior.', unit:'per_trip', priceUsd: 60,
    options: [{id:'view',label:'Mejor vista'},{id:'category',label:'Categoría superior',deltaUsd:40}] },
  { id:'early-late', category:'Alojamiento', title:'Early Check-in / Late Check-out', short:'Flexibilidad', description:'Garantizá horarios cómodos.', unit:'per_trip', priceUsd: 50 },

  // Experiencias
  { id:'food-exp', category:'Experiencias', title:'Experiencia Gastronómica', short:'Cena/Clase/Tour', description:'Opciones foodie en destino.', unit:'per_pax', priceUsd: 45,
    options: [{id:'dinner',label:'Cena Emblemática'},{id:'class',label:'Clase de cocina',deltaUsd:10},{id:'tasting',label:'Cata/Vinos',deltaUsd:15}] },
  { id:'tour-exp', category:'Experiencias', title:'Experiencia Turística', short:'Tour/Entrada', description:'Histórico, naturaleza o acuático.', unit:'per_pax', priceUsd: 40 },

  // Otros
  { id:'vip-lounge', category:'Otros', title:'Acceso Salas VIP', short:'Confort en aeropuerto', description:'Pase por persona.', unit:'per_pax', priceUsd: 40 },
  { id:'fast-track', category:'Otros', title:'Fast Track Seguridad', short:'Vía rápida', description:'Control prioritario.', unit:'per_pax', priceUsd: 25 },
  { id:'carbon', category:'Otros', title:'Compensación CO₂', short:'Viaje responsable', description:'Aporte a proyectos ambientales.', unit:'per_trip', priceUsd: 12 },
]
