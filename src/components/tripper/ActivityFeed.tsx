"use client";

import { motion } from "framer-motion";
import { MessageSquare, Star, GitPullRequest } from "lucide-react";

type ActivityItem = {
  id: string;
  type: "message" | "review" | "route_change";
  message: string;
  timestamp: string;
};

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "message",
    message: "Nuevo mensaje de soporte de un viajero: '¿Puedo cambiar la fecha?'",
    timestamp: "Hace 5 minutos",
  },
  {
    id: "2",
    type: "review",
    message: "Nueva reseña de 'Aventura en la Patagonia': 5 estrellas.",
    timestamp: "Hace 1 hora",
  },
  {
    id: "3",
    type: "route_change",
    message: "Ruta 'Escapada al Viñedo' actualizada con nuevas fotos.",
    timestamp: "Hace 3 horas",
  },
  {
    id: "4",
    type: "message",
    message: "Consulta sobre disponibilidad de 'Ruta del Café'.",
    timestamp: "Ayer",
  },
];

const iconMap = {
  message: MessageSquare,
  review: Star,
  route_change: GitPullRequest,
};

export default function ActivityFeed() {
  return (
    <motion.div
      className="bg-neutral-800 p-6 rounded-2xl shadow-sm border border-neutral-700 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h3 className="text-xl font-bold text-white mb-4">Última Actividad</h3>
      <ul className="space-y-4">
        {mockActivities.map((activity) => {
          const Icon = iconMap[activity.type];
          return (
            <li key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 p-2 rounded-full bg-neutral-700 text-neutral-300">
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-300">{activity.message}</p>
                <p className="text-xs text-neutral-400 mt-1">{activity.timestamp}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}