"use client";
import { useAuth } from "@/lib/hooks/useAuth";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    redirect("/login");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Bienvenido, {user?.user_metadata?.name || user?.email || "Usuario"}
          </h3>
          <p className="text-gray-600">
            Aquí puedes gestionar tus sesiones y configuraciones.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Próximas Sesiones
          </h3>
          <p className="text-gray-600">No tienes sesiones programadas.</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Historial
          </h3>
          <p className="text-gray-600">Revisa tus sesiones anteriores.</p>
        </div>
      </div>
    </div>
  );
}
