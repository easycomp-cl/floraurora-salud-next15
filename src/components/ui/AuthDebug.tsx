"use client";
import { useAuth } from "@/lib/hooks/useAuth";
import React from "react";

const AuthDebug = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="fixed right-4 top-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded">
        <strong>Estado:</strong> Cargando...
      </div>
    );
  }

  return (
    <div className="fixed right-4 top-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded max-w-md">
      <div className="text-sm">
        <strong>Estado de Autenticación:</strong>
        <br />
        <strong>Autenticado:</strong> {isAuthenticated ? "Sí" : "No"}
        <br />
        {user && (
          <>
            <strong>ID:</strong> {user.id}
            <br />
            <strong>Email:</strong> {user.email}
            <br />
            <strong>Proveedor:</strong> {user.app_metadata?.provider || "email"}
            <br />
            <strong>Metadata:</strong>
            <pre className="text-xs mt-1 bg-blue-50 p-2 rounded overflow-auto">
              {JSON.stringify(user.user_metadata, null, 2)}
            </pre>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthDebug;
