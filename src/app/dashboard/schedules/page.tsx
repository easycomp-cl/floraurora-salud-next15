"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { UserService } from "@/lib/services/userService";
import { WeeklyScheduleForm } from "@/components/availability/WeeklyScheduleForm";
import { BlockedSlotsForm } from "@/components/availability/BlockedSlotsForm";
import { DateOverridesForm } from "@/components/availability/DateOverridesForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Calendar, Clock, AlertTriangle, Settings, Shield } from "lucide-react";

export default function SchedulesPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState<{
    id: string;
    email: string;
    name: string;
    last_name: string;
    role: number;
  } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadUserProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      const result = await UserService.getUserById(user!.id);
      if (result.success && result.data) {
        setUserProfile(
          result.data as {
            id: string;
            email: string;
            name: string;
            last_name: string;
            role: number;
          }
        );
      }
    } catch (error) {
      console.error("Error al cargar perfil de usuario:", error);
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserProfile();
    }
  }, [isAuthenticated, user, loadUserProfile]);

  const handleUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (isLoading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración de horarios...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
            <p className="text-gray-600">
              Debes iniciar sesión para acceder a esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600">
              No se pudo cargar la información del perfil.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar si el usuario es un profesional (role = 3)
  if (userProfile.role !== 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
            <p className="text-gray-600">
              Solo los profesionales pueden acceder a la configuración de
              horarios.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Configuración de Horarios
            </h1>
          </div>
          <p className="text-gray-600">
            Gestiona tu disponibilidad y horarios de atención como profesional
          </p>
        </div>

        {/* Información del profesional */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Información del Profesional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium">
                  {userProfile.name} {userProfile.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{userProfile.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas informativas */}
        <div className="mb-8 space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Horarios Semanales:</strong> Configura tus horarios
              regulares de disponibilidad para cada día de la semana. Solo se
              permiten horas completas (08:00-00:00).
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Bloques de Tiempo:</strong> Marca períodos específicos
              donde no estarás disponible (vacaciones, citas médicas, etc.).
            </AlertDescription>
          </Alert>

          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              <strong>Excepciones de Fecha:</strong> Define horarios especiales
              para fechas específicas (días festivos, horarios extendidos,
              etc.). Solo se permiten horas completas (08:00-00:00).
            </AlertDescription>
          </Alert>
        </div>

        {/* Componentes de configuración */}
        <div className="space-y-8">
          <WeeklyScheduleForm
            key={`weekly-${refreshKey}`}
            professionalId={parseInt(userProfile.id)}
            onUpdate={handleUpdate}
          />

          <BlockedSlotsForm
            key={`blocked-${refreshKey}`}
            professionalId={parseInt(userProfile.id)}
            onUpdate={handleUpdate}
          />

          <DateOverridesForm
            key={`overrides-${refreshKey}`}
            professionalId={parseInt(userProfile.id)}
            onUpdate={handleUpdate}
          />
        </div>
      </div>
    </div>
  );
}
