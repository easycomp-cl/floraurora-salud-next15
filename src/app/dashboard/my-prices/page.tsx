"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "@/lib/hooks/useAuthState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react";
import type { ProfessionalSpecialty } from "@/lib/types/profile";

interface SpecialtyWithPrice extends ProfessionalSpecialty {
  professional_amount: number | null;
  minimum_amount: number | null;
  maximum_amount: number | null;
}

export default function MyPricesPage() {
  const { user } = useAuthState();
  const [specialties, setSpecialties] = useState<SpecialtyWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [priceInputs, setPriceInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    if (user) {
      loadPrices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadPrices = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/professional/prices", {
        cache: "no-store",
        credentials: "include",
        headers: {
          "X-User-ID": user.id, // Enviar user_id en header como respaldo
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        
        // Si hay error 401 (no autenticado), redirigir al login
        if (response.status === 401 || data.needsReauth) {
          setError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
          return;
        }
        
        throw new Error(data.error || "Error al cargar los precios");
      }

      const data = await response.json();
      setSpecialties(data.data || []);
      
      // Inicializar los inputs con los valores actuales
      const initialInputs: Record<number, string> = {};
      (data.data || []).forEach((specialty: SpecialtyWithPrice) => {
        initialInputs[specialty.id] = specialty.professional_amount 
          ? specialty.professional_amount.toString() 
          : "";
      });
      setPriceInputs(initialInputs);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al cargar los precios.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (specialtyId: number, value: string) => {
    setPriceInputs((prev) => ({
      ...prev,
      [specialtyId]: value,
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSavePrice = async (specialty: SpecialtyWithPrice) => {
    const inputValue = priceInputs[specialty.id]?.trim();
    
    if (!inputValue) {
      setError("Por favor ingresa un precio");
      return;
    }

    const amount = Number(inputValue.replace(/[^\d]/g, ""));
    
    if (Number.isNaN(amount) || amount < 0) {
      setError("El precio debe ser un número válido mayor o igual a 0");
      return;
    }

    // Validar rango
    if (specialty.minimum_amount !== null && amount < specialty.minimum_amount) {
      setError(
        `El precio mínimo permitido es $${specialty.minimum_amount.toLocaleString("es-CL")}`
      );
      return;
    }

    if (specialty.maximum_amount !== null && amount > specialty.maximum_amount) {
      setError(
        `El precio máximo permitido es $${specialty.maximum_amount.toLocaleString("es-CL")}`
      );
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, [specialty.id]: true }));
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/professional/prices", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user?.id || "", // Enviar user_id en header como respaldo
        },
        body: JSON.stringify({
          specialtyId: specialty.id,
          professionalAmount: amount,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        
        // Si hay error 401 (no autenticado), redirigir al login
        if (response.status === 401 || data.needsReauth) {
          setError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
          return;
        }
        
        throw new Error(data.error || "Error al actualizar el precio");
      }

      // Actualizar el estado local
      setSpecialties((prev) =>
        prev.map((s) =>
          s.id === specialty.id
            ? { ...s, professional_amount: amount }
            : s
        )
      );

      setSuccess(`Precio de "${specialty.name}" actualizado exitosamente`);
      
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al actualizar el precio.";
      setError(message);
    } finally {
      setSaving((prev) => ({ ...prev, [specialty.id]: false }));
    }
  };

  const formatPrice = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "";
    return amount.toLocaleString("es-CL");
  };

  const formatPriceRange = (specialty: SpecialtyWithPrice) => {
    const min = specialty.minimum_amount;
    const max = specialty.maximum_amount;

    if (min !== null && max !== null) {
      return `$${formatPrice(min)} - $${formatPrice(max)}`;
    } else if (min !== null) {
      return `Mínimo: $${formatPrice(min)}`;
    } else if (max !== null) {
      return `Máximo: $${formatPrice(max)}`;
    }
    return "Sin restricciones";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Precios</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gestiona los precios que cobrarás por cada especialidad. Los precios deben estar dentro de los rangos establecidos.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 [&>svg]:text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {specialties.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No tienes especialidades asignadas aún.</p>
            <p className="text-sm mt-2">
              Ve a tu{" "}
              <a href="/dashboard/profile" className="text-teal-600 hover:underline">
                perfil
              </a>{" "}
              para asignar especialidades.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {specialties.map((specialty) => (
            <Card key={specialty.id}>
              <CardHeader>
                <CardTitle className="text-lg">{specialty.name}</CardTitle>
                <CardDescription>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Info className="h-3 w-3" />
                      <span>Rango permitido: {formatPriceRange(specialty)}</span>
                    </div>
                    {specialty.professional_amount !== null && (
                      <div className="text-sm font-medium text-teal-600">
                        Precio actual: ${formatPrice(specialty.professional_amount)}
                      </div>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`price-${specialty.id}`}>
                      Precio por sesión (CLP)
                    </Label>
                    <div className="mt-1 flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <Input
                          id={`price-${specialty.id}`}
                          type="text"
                          value={priceInputs[specialty.id] || ""}
                          onChange={(e) => {
                            // Permitir solo números
                            const value = e.target.value.replace(/[^\d]/g, "");
                            handlePriceChange(specialty.id, value);
                          }}
                          placeholder={
                            specialty.professional_amount
                              ? formatPrice(specialty.professional_amount)
                              : "35000"
                          }
                          className="pl-7"
                          disabled={saving[specialty.id]}
                        />
                      </div>
                      <Button
                        onClick={() => handleSavePrice(specialty)}
                        disabled={saving[specialty.id]}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        {saving[specialty.id] ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          "Guardar"
                        )}
                      </Button>
                    </div>
                    {specialty.minimum_amount !== null &&
                      Number(priceInputs[specialty.id]?.replace(/[^\d]/g, "") || 0) <
                        specialty.minimum_amount && (
                        <p className="mt-1 text-xs text-red-600">
                          El precio mínimo es ${formatPrice(specialty.minimum_amount)}
                        </p>
                      )}
                    {specialty.maximum_amount !== null &&
                      Number(priceInputs[specialty.id]?.replace(/[^\d]/g, "") || 0) >
                        specialty.maximum_amount && (
                        <p className="mt-1 text-xs text-red-600">
                          El precio máximo es ${formatPrice(specialty.maximum_amount)}
                        </p>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

