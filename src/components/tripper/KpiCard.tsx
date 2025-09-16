"use client";

import { motion } from "framer-motion";

type KpiCardProps = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string; // Tailwind color class, e.g., "text-blue-500"
};

export default function KpiCard({ title, value, icon: Icon, color }: KpiCardProps) {
  return (
    <motion.div
      className="bg-neutral-800 p-6 rounded-2xl shadow-sm border border-neutral-700 flex items-center space-x-4"
      whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className={`p-3 rounded-full ${color} bg-opacity-20`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-neutral-400 font-medium">{title}</p>
        <h2 className="text-2xl font-bold text-white mt-1">{value}</h2>
      </div>
    </motion.div>
  );
}
