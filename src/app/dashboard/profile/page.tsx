"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { redirect } from "next/navigation";
import { profileService, Patient } from "@/lib/services/profileService";
import { Professional } from "@/lib/types/appointment";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/types/profile";

type FullUserProfile = User &
  UserProfile & {
    patientProfile?: Patient | null;
    professionalProfile?: Professional | null;
  };

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuthState();
  const [fullProfile, setFullProfile] = useState<FullUserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<
    Partial<{
      full_name: string;
      email: string;
      patientProfile: Partial<Patient>;
      professionalProfile: Partial<Professional>;
    }>
  >({});
  const [loadingProfileData, setLoadingProfileData] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (isAuthenticated && user && !isLoading) {
        setLoadingProfileData(true);
        let patientProfile: Patient | null = null;
        let professionalProfile: Professional | null = null;

        if (user.role === "patient") {
          patientProfile = await profileService.getPatientProfile(user.id);
        } else if (user.role === "professional") {
          professionalProfile = await profileService.getProfessionalProfile(
            user.id
          );
        }

        const combinedProfile: FullUserProfile = {
          ...user,
          patientProfile,
          professionalProfile,
        };
        setFullProfile(combinedProfile);
        setFormData({
          full_name: combinedProfile.full_name || "",
          email: combinedProfile.email || "",
          patientProfile: {
            date_of_birth: combinedProfile.patientProfile?.date_of_birth || "",
            gender: combinedProfile.patientProfile?.gender || undefined, // Cambiar a undefined si no hay valor
            phone_number: combinedProfile.patientProfile?.phone_number || "",
            address: combinedProfile.patientProfile?.address || "",
          },
          professionalProfile: {
            title: combinedProfile.professionalProfile?.title || "",
            specialty: combinedProfile.professionalProfile?.specialty || "",
            bio: combinedProfile.professionalProfile?.bio || "",
          },
        });
        setLoadingProfileData(false);
      }
    };
    fetchProfileData();
  }, [user, isAuthenticated, isLoading]);

  if (isLoading || loadingProfileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando perfil...</div>
      </div>
    );
  }

  if (!isAuthenticated || !fullProfile) {
    redirect("/login");
    return null; // Ensure nothing else renders after redirect
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const [parent, child] = name.split(".");

      if (child) {
        return {
          ...prev,
          [parent]: {
            ...(prev[parent as keyof typeof prev] as object),
            [child]: value,
          },
        };
      } else {
        return {
          ...prev,
          [name]: value,
        };
      }
    });
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      // Actualizar datos de la tabla 'users'
      if (formData.full_name && formData.full_name !== user.full_name) {
        await profileService.updateUserDetails(user.id, formData.full_name);
      }

      if (user.role === "patient" && formData.patientProfile) {
        const patientUpdateData: Partial<Patient> = {
          date_of_birth: formData.patientProfile.date_of_birth,
          gender: formData.patientProfile.gender as "male" | "female" | "other",
          phone_number: formData.patientProfile.phone_number,
          address: formData.patientProfile.address,
        };
        await profileService.updatePatientProfile(user.id, patientUpdateData);
      } else if (user.role === "professional" && formData.professionalProfile) {
        const professionalUpdateData: Partial<Professional> = {
          name: formData.full_name, // Asume que el nombre del profesional viene del full_name
          title: formData.professionalProfile.title,
          specialty: formData.professionalProfile.specialty,
          bio: formData.professionalProfile.bio,
        };
        await profileService.updateProfessionalProfile(
          user.id,
          professionalUpdateData
        );
      }
      setIsEditing(false);
      // Opcional: Recargar los datos del perfil para asegurar que estén actualizados
      // window.location.reload();
      // Mejorar esto con una actualización de estado local o re-fetch específico
    } catch (error) {
      console.error("Error al guardar el perfil:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {fullProfile.full_name?.[0] || fullProfile.email?.[0] || "U"}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {fullProfile.full_name || "Usuario"}
            </h2>
            <p className="text-gray-600">{fullProfile.email}</p>
            <p className="text-gray-600 capitalize">Rol: {fullProfile.role}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Información Personal
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="full_name">Nombre Completo</Label>
                {isEditing ? (
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name || ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="text-gray-900">
                    {fullProfile.full_name || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <p className="text-gray-900">{fullProfile.email}</p>
              </div>

              {fullProfile.role === "patient" && fullProfile.patientProfile && (
                <>
                  <div>
                    <Label htmlFor="patientProfile.date_of_birth">
                      Fecha de Nacimiento
                    </Label>
                    {isEditing ? (
                      <Input
                        id="patientProfile.date_of_birth"
                        name="patientProfile.date_of_birth"
                        type="date"
                        value={formData.patientProfile?.date_of_birth || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="text-gray-900">
                        {fullProfile.patientProfile.date_of_birth ||
                          "No especificado"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="patientProfile.gender">Género</Label>
                    {isEditing ? (
                      <select
                        id="patientProfile.gender"
                        name="patientProfile.gender"
                        value={formData.patientProfile?.gender || ""}
                        onChange={handleInputChange}
                        className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Selecciona</option>
                        <option value="male">Masculino</option>
                        <option value="female">Femenino</option>
                        <option value="other">Otro</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">
                        {fullProfile.patientProfile.gender || "No especificado"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="patientProfile.phone_number">
                      Número de Teléfono
                    </Label>
                    {isEditing ? (
                      <Input
                        id="patientProfile.phone_number"
                        name="patientProfile.phone_number"
                        type="text"
                        value={formData.patientProfile?.phone_number || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="text-gray-900">
                        {fullProfile.patientProfile.phone_number ||
                          "No especificado"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="patientProfile.address">Dirección</Label>
                    {isEditing ? (
                      <Input
                        id="patientProfile.address"
                        name="patientProfile.address"
                        type="text"
                        value={formData.patientProfile?.address || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="text-gray-900">
                        {fullProfile.patientProfile.address ||
                          "No especificado"}
                      </p>
                    )}
                  </div>
                </>
              )}

              {fullProfile.role === "professional" &&
                fullProfile.professionalProfile && (
                  <>
                    <div>
                      <Label htmlFor="professionalProfile.title">Título</Label>
                      {isEditing ? (
                        <Input
                          id="professionalProfile.title"
                          name="professionalProfile.title"
                          type="text"
                          value={formData.professionalProfile?.title || ""}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="text-gray-900">
                          {fullProfile.professionalProfile.title ||
                            "No especificado"}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="professionalProfile.specialty">
                        Especialidad
                      </Label>
                      {isEditing ? (
                        <Input
                          id="professionalProfile.specialty"
                          name="professionalProfile.specialty"
                          type="text"
                          value={formData.professionalProfile?.specialty || ""}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="text-gray-900">
                          {fullProfile.professionalProfile.specialty ||
                            "No especificado"}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="professionalProfile.bio">Biografía</Label>
                      {isEditing ? (
                        <textarea
                          id="professionalProfile.bio"
                          name="professionalProfile.bio"
                          value={formData.professionalProfile?.bio || ""}
                          onChange={handleInputChange}
                          rows={4}
                          className="flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {fullProfile.professionalProfile.bio ||
                            "No especificado"}
                        </p>
                      )}
                    </div>
                  </>
                )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Información de la Cuenta
            </h3>
            <div className="space-y-3">
              <div>
                <Label>ID de Usuario</Label>
                <p className="text-gray-900 text-sm font-mono">
                  {fullProfile.id}
                </p>
              </div>
              <div>
                <Label>Proveedor</Label>
                <p className="text-gray-900">
                  {fullProfile.app_metadata?.provider || "email"}
                </p>
              </div>

              {/* Elementos específicos por rol */}
              {fullProfile.role === "admin" && (
                <>
                  <div className="bg-blue-100 p-3 rounded-md">
                    <h4 className="font-semibold">Panel de Administración</h4>
                    <p className="text-sm text-blue-800">
                      Acceso completo a la gestión de usuarios y reportes.
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-md">
                    <h4 className="font-semibold">Configuración Global</h4>
                    <p className="text-sm text-blue-800">
                      Gestionar configuraciones generales de la plataforma.
                    </p>
                  </div>
                </>
              )}

              {fullProfile.role === "patient" && (
                <>
                  <div className="bg-green-100 p-3 rounded-md">
                    <h4 className="font-semibold">Mis Citas</h4>
                    <p className="text-sm text-green-800">
                      Ver y gestionar tus próximas citas.
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-md">
                    <h4 className="font-semibold">Historial de Sesiones</h4>
                    <p className="text-sm text-green-800">
                      Accede a tus sesiones anteriores y notas.
                    </p>
                  </div>
                </>
              )}

              {fullProfile.role === "professional" && (
                <>
                  <div className="bg-purple-100 p-3 rounded-md">
                    <h4 className="font-semibold">Mi Calendario</h4>
                    <p className="text-sm text-purple-800">
                      Gestiona tu disponibilidad y horarios de citas.
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-md">
                    <h4 className="font-semibold">Pacientes Asignados</h4>
                    <p className="text-sm text-purple-800">
                      Consulta la lista de tus pacientes.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          {isEditing ? (
            <Button onClick={handleSave}>Guardar Cambios</Button>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
          )}
        </div>
      </div>
    </div>
  );
}
