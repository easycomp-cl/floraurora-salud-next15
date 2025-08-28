"use client";
import { useAuth } from "@/lib/hooks/useAuth";
import { redirect } from "next/navigation";

export default function ProfilePage() {
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
  console.log("user", user);
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {user?.user_metadata?.name?.[0] || user?.email?.[0] || "U"}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {user?.user_metadata?.full_name || "Usuario"}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Información Personal
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <p className="text-gray-900">
                  {user?.user_metadata?.full_name || "No especificado"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Información de la Cuenta
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ID de Usuario
                </label>
                <p className="text-gray-900 text-sm font-mono">{user?.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Proveedor
                </label>
                <p className="text-gray-900">
                  {user?.app_metadata?.provider || "email"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
