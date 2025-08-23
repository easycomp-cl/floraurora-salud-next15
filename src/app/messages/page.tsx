"use client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Mensajes</h1>
            <p className="text-gray-600">
              Aquí podrás ver y gestionar todos tus mensajes.
            </p>
            {/* Contenido de mensajes aquí */}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
