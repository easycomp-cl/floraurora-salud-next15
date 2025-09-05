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
import { UserProfile, PatientProfile } from "@/lib/types/profile";

import { getFullUserProfileData } from "@/lib/userdata/profile-data";
//Datos de perfil completo

// Importamos las interfaces necesarias de profile-data.ts y services/profileService.ts
import { DetailedUserData, UserProfileData } from "@/lib/userdata/profile-data";

type FormDataState = Partial<{
  name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  birth_date: string;
  patientProfile: Partial<PatientProfile>;
  professionalProfile: Partial<Professional>;
}>;

export default function UserProfilePage() {
  const [profileData, setProfileData] = useState<UserProfileData>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormDataState>({});

  // Mover fetchUserProfile fuera del useEffect para que sea accesible globalmente en el componente
  const fetchUserProfile = async () => {
    try {
      setProfileData((prev: UserProfileData) => ({
        ...prev,
        loading: true,
        error: null,
      }));
      const data = await getFullUserProfileData();
      if (data) {
        setProfileData((prev: UserProfileData) => ({
          ...prev,
          user: data.user,
          profile: data.profile,
          loading: false,
          error: null, // Clear any previous errors on successful fetch
        }));
        // Initialize formData with current profile data for editing
        setFormData((prev: FormDataState) => ({
          name: data.user?.name || "",
          last_name: data.user?.last_name || "",
          email: data.user?.email || "",
          phone_number: data.user?.phone_number || "",
          address: data.user?.address || "",
          birth_date: data.user?.birth_date || "",
          patientProfile:
            data.user?.role === "patient" && data.profile
              ? {
                  emergency_contact_name:
                    (data.profile as PatientProfile).emergency_contact_name ||
                    "",
                  emergency_contact_phone:
                    (data.profile as PatientProfile).emergency_contact_phone ||
                    "",
                  health_insurances_id:
                    (data.profile as PatientProfile).health_insurances_id || 0,
                }
              : undefined,
          professionalProfile:
            data.user?.role === "professional" && data.profile
              ? {
                  title: (data.profile as Professional).title || "",
                  specialty: (data.profile as Professional).specialty || "",
                  bio: (data.profile as Professional).bio || "",
                }
              : undefined,
        }));
      } else {
        setProfileData((prev: UserProfileData) => ({
          ...prev,
          user: null,
          profile: null,
          loading: false,
          error: "No se pudo cargar la información del perfil.",
        }));
      }
    } catch (err) {
      console.error("Error al cargar el perfil del usuario:", err);
      setProfileData((prev: UserProfileData) => ({
        ...prev,
        loading: false,
        error: "Ocurrió un error al cargar tu perfil.",
      }));
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar el componente

  if (profileData.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando perfil...</div>
      </div>
    );
  }

  if (profileData.error) {
    return <div className="text-red-500">Error: {profileData.error}</div>;
  }

  if (!profileData.user) {
    redirect("/login");
  }

  // if (!isAuthenticated || !fullProfile) {
  //   redirect("/login");
  //   return null; // Ensure nothing else renders after redirect
  // }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const [parent, child] = name.split(".");

      if (parent === "patientProfile" || parent === "professionalProfile") {
        return {
          ...prev,
          [parent]: {
            ...(prev[parent] as object),
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
    if (!profileData.user) return;
    try {
      // Actualizar datos de la tabla 'users'
      const userUpdateData: Partial<UserProfile> = {};

      if (formData.name && formData.name !== profileData.user.name) {
        userUpdateData.name = formData.name;
      }
      if (
        formData.last_name &&
        formData.last_name !== profileData.user.last_name
      ) {
        userUpdateData.last_name = formData.last_name;
      }
      if (
        formData.phone_number &&
        formData.phone_number !== profileData.user.phone_number
      ) {
        userUpdateData.phone_number = formData.phone_number;
      }
      if (formData.address && formData.address !== profileData.user.address) {
        userUpdateData.address = formData.address;
      }
      if (
        formData.birth_date &&
        formData.birth_date !== profileData.user.birth_date
      ) {
        userUpdateData.birth_date = formData.birth_date;
      }
      console.log("profileData.user", profileData.user);
      console.log("profileData.user.user_id", profileData.user.user_id);

      if (Object.keys(userUpdateData).length > 0) {
        await profileService.updateUserProfile(
          profileData.user.user_id, // Usar user_id (UUID) para la autenticación
          userUpdateData
        );
      }

      if (profileData.user.role === "patient" && formData.patientProfile) {
        const patientUpdateData: Partial<PatientProfile> = {
          emergency_contact_name:
            formData.patientProfile.emergency_contact_name,
          emergency_contact_phone:
            formData.patientProfile.emergency_contact_phone,
          health_insurances_id: formData.patientProfile.health_insurances_id,
        };
        await profileService.updatePatientProfile(
          profileData.user.user_id, // Usar user_id (UUID) para la autenticación
          patientUpdateData
        );
      } else if (
        profileData.user.role === "professional" &&
        formData.professionalProfile
      ) {
        // TODO: Implementar cuando se cree la tabla de profesionales
        console.log("Professional profile update not yet implemented");
      }
      setIsEditing(false);
      // Recargar los datos del perfil para asegurar que estén actualizados
      await fetchUserProfile(); // Volvemos a cargar los datos después de guardar
    } catch (error) {
      console.error("Error al guardar el perfil:", error);
      setProfileData((prev) => ({
        ...prev,
        error: "Error al guardar los cambios.",
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {profileData.user.name?.[0] || profileData.user.email?.[0] || "U"}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {profileData.user.name && profileData.user.last_name
                ? `${profileData.user.name} ${profileData.user.last_name}`
                : profileData.user.email || "Usuario"}
            </h2>
            <p className="text-gray-600">{profileData.user.email}</p>
            <p className="text-gray-600 capitalize">
              Rol: {profileData.user.role}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Información Personal
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Nombre</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name || ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="text-gray-900">
                    {profileData.user.name || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name">Apellido</Label>
                {isEditing ? (
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={formData.last_name || ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="text-gray-900">
                    {profileData.user.last_name || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <p className="text-gray-900">{profileData.user.email}</p>
              </div>
              <div>
                <Label htmlFor="phone_number">Teléfono</Label>
                {isEditing ? (
                  <Input
                    id="phone_number"
                    name="phone_number"
                    type="text"
                    value={formData.phone_number || ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="text-gray-900">
                    {profileData.user.phone_number || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="address">Dirección</Label>
                {isEditing ? (
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="text-gray-900">
                    {profileData.user.address || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                {isEditing ? (
                  <Input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    value={formData.birth_date || ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="text-gray-900">
                    {profileData.user.birth_date || "No especificado"}
                  </p>
                )}
              </div>

              {profileData.user.role === "patient" && profileData.profile && (
                <>
                  <div>
                    <Label htmlFor="patientProfile.emergency_contact_name">
                      Nombre de Contacto de Emergencia
                    </Label>
                    {isEditing ? (
                      <Input
                        id="patientProfile.emergency_contact_name"
                        name="patientProfile.emergency_contact_name"
                        type="text"
                        value={
                          formData.patientProfile?.emergency_contact_name || ""
                        }
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="text-gray-900">
                        {(profileData.profile as PatientProfile)
                          .emergency_contact_name || "No especificado"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="patientProfile.emergency_contact_phone">
                      Teléfono de Contacto de Emergencia
                    </Label>
                    {isEditing ? (
                      <Input
                        id="patientProfile.emergency_contact_phone"
                        name="patientProfile.emergency_contact_phone"
                        type="text"
                        value={
                          formData.patientProfile?.emergency_contact_phone || ""
                        }
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="text-gray-900">
                        {(profileData.profile as PatientProfile)
                          .emergency_contact_phone || "No especificado"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="patientProfile.health_insurances_id">
                      ID de Seguro de Salud
                    </Label>
                    {isEditing ? (
                      <Input
                        id="patientProfile.health_insurances_id"
                        name="patientProfile.health_insurances_id"
                        type="number"
                        value={
                          formData.patientProfile?.health_insurances_id || ""
                        }
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="text-gray-900">
                        {(profileData.profile as PatientProfile)
                          .health_insurances_id || "No especificado"}
                      </p>
                    )}
                  </div>
                </>
              )}

              {profileData.user.role === "professional" &&
                profileData.profile && (
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
                          {(profileData.profile as Professional).title ||
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
                          {(profileData.profile as Professional).specialty ||
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
                          {(profileData.profile as Professional).bio ||
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
                  {profileData.user.id}
                </p>
              </div>
              <div>
                <Label>UUID de Autenticación</Label>
                <p className="text-gray-900 text-sm font-mono">
                  {profileData.user.user_id}
                </p>
              </div>
              <div>
                <Label>Proveedor</Label>
                <p className="text-gray-900">{"email"} </p>
              </div>

              {/* Elementos específicos por rol */}
              {profileData.user.role === "admin" && (
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

              {profileData.user.role === "patient" && (
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

              {profileData.user.role === "professional" && (
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
            <>
              <Button onClick={handleSave} className="mr-2">
                Guardar Cambios
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  // Restablecer formData a los datos actuales si el usuario cancela la edición
                  if (profileData.user) {
                    setFormData((prev: FormDataState) => ({
                      name: profileData.user?.name || "",
                      last_name: profileData.user?.last_name || "",
                      email: profileData.user?.email || "",
                      phone_number: profileData.user?.phone_number || "",
                      address: profileData.user?.address || "",
                      birth_date: profileData.user?.birth_date || "",
                      patientProfile:
                        profileData.user?.role === "patient" &&
                        profileData.profile
                          ? {
                              emergency_contact_name:
                                (profileData.profile as PatientProfile)
                                  .emergency_contact_name || "",
                              emergency_contact_phone:
                                (profileData.profile as PatientProfile)
                                  .emergency_contact_phone || "",
                              health_insurances_id:
                                (profileData.profile as PatientProfile)
                                  .health_insurances_id || 0,
                            }
                          : undefined,
                      professionalProfile:
                        profileData.user?.role === "professional" &&
                        profileData.profile
                          ? {
                              title:
                                (profileData.profile as Professional).title ||
                                "",
                              specialty:
                                (profileData.profile as Professional)
                                  .specialty || "",
                              bio:
                                (profileData.profile as Professional).bio || "",
                            }
                          : undefined,
                    }));
                  }
                }}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
          )}
        </div>
      </div>
    </div>
  );
}
