"use client";

import Link from "next/link";
import Sidebar from "@/components/tripper/Sidebar";
import Topbar from "@/components/tripper/Topbar";
import KpiCard from "@/components/tripper/KpiCard";
import ActivityFeed from "@/components/tripper/ActivityFeed";
import RevenueChart from "@/components/tripper/RevenueChart";
import { Plane, DollarSign, BookOpen, MessageSquare } from "lucide-react";

export default function TripperDashboardPage() {
  // Mock Data for KPIs
  const kpis = [
    {
      title: "Reservas Activas",
      value: 12,
      icon: Plane,
      color: "text-blue-500",
    },
    {
      title: "Ingresos (últimos 30 días)",
      value: "$1,250",
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "Rutas Publicadas",
      value: 8,
      icon: BookOpen,
      color: "text-purple-500",
    },
    {
      title: "Feedback de Viajeros",
      value: 4.8,
      icon: MessageSquare,
      color: "text-yellow-500",
    },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-900 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64"> {/* ml-64 to offset sidebar */}
        <Topbar />
        <main className="flex-1 p-8 pt-20"> {/* pt-20 to offset topbar */}
          {/* Hero de bienvenida */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-2xl shadow-lg mb-8">
            <h1 className="text-1xl md:text-2xl font-bold mb-2">
              Bienvenid@ a tu Tripper OS, tu Estudio Creativo y de operaciones para dar vida a las mejores experiencias.
            </h1>
            <p className="text-lg opacity-90">
              Aquí gestionas tus rutas, reservas y comunidad. ¡Inspira y conecta!
            </p>
            <Link
              href="/tripper/routes/new"
              className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-blue-600 bg-white hover:bg-blue-50 transition-colors"
            >
              Diseñar Nueva Ruta
            </Link>
          </div>

          {/* KPIs destacados */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi) => (
              <KpiCard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                icon={kpi.icon}
                color={kpi.color}
              />
            ))}
          </section>

          {/* Gráficos y Actividad */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart />
            </div>
            <div className="lg:col-span-1">
              <ActivityFeed />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}