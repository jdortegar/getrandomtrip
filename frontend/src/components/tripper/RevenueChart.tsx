"use client";

import { motion } from "framer-motion";
import { LineChart } from "lucide-react";

export default function RevenueChart() {
  return (
    <motion.div
      className="bg-neutral-800 p-6 rounded-2xl shadow-sm border border-neutral-700 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h3 className="text-xl font-bold text-white mb-4">Ingresos Recientes</h3>
      <div className="flex items-center justify-center h-48 bg-neutral-700 rounded-lg border border-dashed border-neutral-600 text-neutral-400">
        <LineChart size={48} />
        <p className="ml-4 text-lg">Gráfico de ingresos (placeholder)</p>
      </div>
      <p className="text-sm text-neutral-400 mt-4">Datos de ingresos de los últimos 12 meses.</p>
    </motion.div>
  );
}
