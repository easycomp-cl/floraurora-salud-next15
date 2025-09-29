"use client";

import { useState, useEffect } from "react";
import { profileService } from "@/lib/services/profileService";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  UserProfile,
  PatientProfile,
  ProfessionalProfile,
  ProfessionalTitle,
  ProfessionalSpecialty,
} from "@/lib/types/profile";

import { getFullUserProfileData } from "@/lib/userdata/profile-data";
//Datos de perfil completo

// Importamos las interfaces necesarias de profile-data.ts y services/profileService.ts
import { UserProfileData } from "@/lib/userdata/profile-data";
import { countries, genderOptions } from "@/lib/data/countries";

// Importar validaciones con Zod
import {
  profileFormSchema,
  ProfileFormData,
  formatRUT,
  formatPhone,
} from "@/lib/validations/profile";
import { ZodError } from "zod";

type FormDataState = Partial<{
  name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  birth_date: string;
  gender: string;
  nationality: string;
  rut: string;
  patientProfile: Partial<PatientProfile>;
  professionalProfile: Partial<ProfessionalProfile>;
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [professionalTitles, setProfessionalTitles] = useState<
    ProfessionalTitle[]
  >([]);
  const [professionalSpecialties, setProfessionalSpecialties] = useState<
    ProfessionalSpecialty[]
  >([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<number[]>([]);
  const [specialtyError, setSpecialtyError] = useState<string>("");

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
        setFormData(() => ({
          name: data.user?.name || "",
          last_name: data.user?.last_name || "",
          email: data.user?.email || "",
          phone_number: data.user?.phone_number || "",
          address: data.user?.address || "",
          birth_date: data.user?.birth_date || "",
          gender: data.user?.gender || "",
          nationality: data.user?.nationality || "",
          rut: data.user?.rut || "",
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
                  title_id:
                    (data.profile as ProfessionalProfile).title_id || null,
                  profile_description:
                    (data.profile as ProfessionalProfile).profile_description ||
                    "",
                  resume_url:
                    (data.profile as ProfessionalProfile).resume_url || "",
                }
              : undefined,
        }));

        // Cargar títulos profesionales si es un profesional
        if (data.user?.role === "professional") {
          const titles = await profileService.getProfessionalTitles();
          setProfessionalTitles(titles);

          // Cargar especialidades si hay un title_id
          if (data.profile && (data.profile as ProfessionalProfile).title_id) {
            const specialties = await profileService.getSpecialtiesByTitle(
              (data.profile as ProfessionalProfile).title_id!
            );
            setProfessionalSpecialties(specialties);

            // Inicializar especialidades seleccionadas con las que ya tiene el profesional
            if ((data.profile as ProfessionalProfile).specialties) {
              const selectedIds = (
                data.profile as ProfessionalProfile
              ).specialties!.map((s) => s.id);
              setSelectedSpecialties(selectedIds);
            }
          }
        }
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

    // Formatear RUT y teléfono mientras el usuario escribe
    let formattedValue = value;
    if (name === "rut") {
      formattedValue = formatRUT(value);
    } else if (
      name === "phone_number" ||
      name === "patientProfile.emergency_contact_phone"
    ) {
      formattedValue = formatPhone(value);
    }

    setFormData((prev) => {
      const [parent, child] = name.split(".");

      if (parent === "patientProfile" || parent === "professionalProfile") {
        return {
          ...prev,
          [parent]: {
            ...(prev[parent] as object),
            [child]: formattedValue,
          },
        };
      } else {
        return {
          ...prev,
          [name]: formattedValue,
        };
      }
    });

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Función para manejar el cambio de título profesional
  const handleTitleChange = async (titleId: string) => {
    const titleIdNumber = parseInt(titleId);
    setFormData((prev) => ({
      ...prev,
      professionalProfile: {
        ...prev.professionalProfile,
        title_id: titleIdNumber,
      },
    }));

    // Cargar especialidades para el nuevo título
    if (titleIdNumber) {
      const specialties = await profileService.getSpecialtiesByTitle(
        titleIdNumber
      );
      setProfessionalSpecialties(specialties);
      // Limpiar especialidades seleccionadas al cambiar título
      setSelectedSpecialties([]);
      setSpecialtyError(""); // Limpiar error de especialidades
    } else {
      setProfessionalSpecialties([]);
      setSelectedSpecialties([]);
      setSpecialtyError(""); // Limpiar error de especialidades
    }
  };

  // Función para manejar la selección de especialidades
  const handleSpecialtyToggle = (specialtyId: number) => {
    setSelectedSpecialties((prev) => {
      const newSelection = prev.includes(specialtyId)
        ? prev.filter((id) => id !== specialtyId)
        : [...prev, specialtyId];

      // Validar que se seleccione al menos una especialidad
      if (newSelection.length === 0) {
        setSpecialtyError("Debes seleccionar al menos una especialidad");
      } else {
        setSpecialtyError("");
      }

      return newSelection;
    });
  };

  const handleSave = async () => {
    if (!profileData.user) return;

    // Limpiar errores anteriores
    setFormErrors({});
    setSpecialtyError("");

    // Preparar datos para validación
    const validationData: ProfileFormData = {
      name: formData.name || "",
      last_name: formData.last_name || "",
      phone_number: formData.phone_number || "",
      address: formData.address || "",
      birth_date: formData.birth_date || "",
      gender: formData.gender || "",
      nationality: formData.nationality || "",
      rut: formData.rut || "",
      patientProfile:
        profileData.user.role === "patient" && formData.patientProfile
          ? {
              emergency_contact_name:
                formData.patientProfile.emergency_contact_name || "",
              emergency_contact_phone:
                formData.patientProfile.emergency_contact_phone || "",
              health_insurances_id:
                formData.patientProfile.health_insurances_id || 0,
            }
          : undefined,
      professionalProfile:
        profileData.user.role === "professional" && formData.professionalProfile
          ? {
              title_id: formData.professionalProfile.title_id || 0,
              profile_description:
                formData.professionalProfile.profile_description || "",
              resume_url: formData.professionalProfile.resume_url || "",
            }
          : undefined,
    };

    // Validar especialidades si es un profesional
    if (
      profileData.user.role === "professional" &&
      formData.professionalProfile?.title_id
    ) {
      if (selectedSpecialties.length === 0) {
        setSpecialtyError("Debes seleccionar al menos una especialidad");
        return;
      }
    }

    try {
      // Validar con Zod
      profileFormSchema.parse(validationData);
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const fieldName = err.path.map(String).join(".");
          errors[fieldName] = err.message;
        });
        setFormErrors(errors);
        return;
      }
    }

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
      if (formData.gender && formData.gender !== profileData.user.gender) {
        userUpdateData.gender = formData.gender;
      }
      if (
        formData.nationality &&
        formData.nationality !== profileData.user.nationality
      ) {
        userUpdateData.nationality = formData.nationality;
      }
      if (formData.rut && formData.rut !== profileData.user.rut) {
        userUpdateData.rut = formData.rut;
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
        const professionalUpdateData: Partial<ProfessionalProfile> = {
          title_id: formData.professionalProfile.title_id,
          profile_description: formData.professionalProfile.profile_description,
          resume_url: formData.professionalProfile.resume_url,
        };
        await profileService.updateProfessionalProfile(
          profileData.user.user_id,
          professionalUpdateData
        );

        // Actualizar especialidades si hay un perfil profesional
        if (
          profileData.profile &&
          (profileData.profile as ProfessionalProfile).id
        ) {
          const professionalId = (profileData.profile as ProfessionalProfile)
            .id;
          await profileService.updateProfessionalSpecialties(
            professionalId,
            selectedSpecialties
          );
        }
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
              {isEditing && (
                <span className="text-sm text-gray-500 font-normal ml-2">
                  (* Campos obligatorios)
                </span>
              )}
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                {isEditing ? (
                  <div>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name || ""}
                      onChange={handleInputChange}
                      className={formErrors.name ? "border-red-500" : ""}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.name}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {profileData.user.name || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name">Apellido *</Label>
                {isEditing ? (
                  <div>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={formData.last_name || ""}
                      onChange={handleInputChange}
                      className={formErrors.last_name ? "border-red-500" : ""}
                    />
                    {formErrors.last_name && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.last_name}
                      </p>
                    )}
                  </div>
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
                <Label htmlFor="rut">RUT *</Label>
                {isEditing ? (
                  <div>
                    <Input
                      id="rut"
                      name="rut"
                      type="text"
                      value={formData.rut || ""}
                      onChange={handleInputChange}
                      placeholder="12.345.678-9"
                      className={formErrors.rut ? "border-red-500" : ""}
                    />
                    {formErrors.rut && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.rut}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {profileData.user.rut || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phone_number">Teléfono *</Label>
                {isEditing ? (
                  <div>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      type="text"
                      value={formData.phone_number || ""}
                      onChange={handleInputChange}
                      placeholder="1234 5678 o +569 1234 5678"
                      className={
                        formErrors.phone_number ? "border-red-500" : ""
                      }
                    />
                    {formErrors.phone_number && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.phone_number}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {profileData.user.phone_number || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="address">Dirección *</Label>
                {isEditing ? (
                  <div>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address || ""}
                      onChange={handleInputChange}
                      placeholder="Calle 123, Comuna, Región"
                      className={formErrors.address ? "border-red-500" : ""}
                    />
                    {formErrors.address && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.address}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {profileData.user.address || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="birth_date">Fecha de Nacimiento *</Label>
                {isEditing ? (
                  <div>
                    <Input
                      id="birth_date"
                      name="birth_date"
                      type="date"
                      value={formData.birth_date || ""}
                      onChange={handleInputChange}
                      className={formErrors.birth_date ? "border-red-500" : ""}
                    />
                    {formErrors.birth_date && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.birth_date}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {profileData.user.birth_date || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="gender">Género *</Label>
                {isEditing ? (
                  <div>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender || ""}
                      onChange={handleInputChange}
                      className={`flex w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                        formErrors.gender ? "border-red-500" : "border-input"
                      }`}
                    >
                      <option value="">Seleccionar género</option>
                      {genderOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.gender && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.gender}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {profileData.user.gender || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="nationality">Nacionalidad *</Label>
                {isEditing ? (
                  <div>
                    <select
                      id="nationality"
                      name="nationality"
                      value={formData.nationality || ""}
                      onChange={handleInputChange}
                      className={`flex w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                        formErrors.nationality
                          ? "border-red-500"
                          : "border-input"
                      }`}
                    >
                      <option value="">Seleccionar nacionalidad</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.nationality && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.nationality}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {profileData.user.nationality || "No especificado"}
                  </p>
                )}
              </div>

              {profileData.user.role === "patient" && profileData.profile && (
                <>
                  <div>
                    <Label htmlFor="patientProfile.emergency_contact_name">
                      Nombre de Contacto de Emergencia *
                    </Label>
                    {isEditing ? (
                      <div>
                        <Input
                          id="patientProfile.emergency_contact_name"
                          name="patientProfile.emergency_contact_name"
                          type="text"
                          value={
                            formData.patientProfile?.emergency_contact_name ||
                            ""
                          }
                          onChange={handleInputChange}
                          className={
                            formErrors["patientProfile.emergency_contact_name"]
                              ? "border-red-500"
                              : ""
                          }
                        />
                        {formErrors[
                          "patientProfile.emergency_contact_name"
                        ] && (
                          <p className="text-red-500 text-sm mt-1">
                            {
                              formErrors[
                                "patientProfile.emergency_contact_name"
                              ]
                            }
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-900">
                        {(profileData.profile as PatientProfile)
                          .emergency_contact_name || "No especificado"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="patientProfile.emergency_contact_phone">
                      Teléfono de Contacto de Emergencia *
                    </Label>
                    {isEditing ? (
                      <div>
                        <Input
                          id="patientProfile.emergency_contact_phone"
                          name="patientProfile.emergency_contact_phone"
                          type="text"
                          value={
                            formData.patientProfile?.emergency_contact_phone ||
                            ""
                          }
                          onChange={handleInputChange}
                          placeholder="1234 5678 o +569 1234 5678"
                          className={
                            formErrors["patientProfile.emergency_contact_phone"]
                              ? "border-red-500"
                              : ""
                          }
                        />
                        {formErrors[
                          "patientProfile.emergency_contact_phone"
                        ] && (
                          <p className="text-red-500 text-sm mt-1">
                            {
                              formErrors[
                                "patientProfile.emergency_contact_phone"
                              ]
                            }
                          </p>
                        )}
                      </div>
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
                      <div>
                        <Input
                          id="patientProfile.health_insurances_id"
                          name="patientProfile.health_insurances_id"
                          type="number"
                          value={
                            formData.patientProfile?.health_insurances_id || ""
                          }
                          onChange={handleInputChange}
                          className={
                            formErrors["patientProfile.health_insurances_id"]
                              ? "border-red-500"
                              : ""
                          }
                        />
                        {formErrors["patientProfile.health_insurances_id"] && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors["patientProfile.health_insurances_id"]}
                          </p>
                        )}
                      </div>
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
                      <Label htmlFor="professionalProfile.title_id">
                        Profesión *
                      </Label>
                      {isEditing ? (
                        <div>
                          <select
                            id="professionalProfile.title_id"
                            name="professionalProfile.title_id"
                            value={formData.professionalProfile?.title_id || ""}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            className={`flex w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                              formErrors["professionalProfile.title_id"]
                                ? "border-red-500"
                                : "border-input"
                            }`}
                          >
                            <option value="">Seleccionar profesión</option>
                            {professionalTitles.map((title) => (
                              <option key={title.id} value={title.id}>
                                {title.title_name}
                              </option>
                            ))}
                          </select>
                          {formErrors["professionalProfile.title_id"] && (
                            <p className="text-red-500 text-sm mt-1">
                              {formErrors["professionalProfile.title_id"]}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-900">
                          {(profileData.profile as ProfessionalProfile).title
                            ?.title_name || "No especificado"}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Especialidades</Label>
                      {isEditing ? (
                        <div className="space-y-2">
                          {professionalSpecialties.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                              {professionalSpecialties.map((specialty) => (
                                <div
                                  key={specialty.id}
                                  className="flex items-center space-x-2"
                                >
                                  <input
                                    type="checkbox"
                                    id={`specialty-${specialty.id}`}
                                    className="rounded border-gray-300"
                                    checked={selectedSpecialties.includes(
                                      specialty.id
                                    )}
                                    onChange={() =>
                                      handleSpecialtyToggle(specialty.id)
                                    }
                                  />
                                  <label
                                    htmlFor={`specialty-${specialty.id}`}
                                    className="text-sm"
                                  >
                                    {specialty.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">
                              Selecciona una profesión para ver las
                              especialidades disponibles
                            </p>
                          )}
                          {specialtyError && (
                            <p className="text-red-500 text-sm mt-1">
                              {specialtyError}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {(profileData.profile as ProfessionalProfile)
                            .specialties &&
                          (profileData.profile as ProfessionalProfile)
                            .specialties!.length > 0 ? (
                            (
                              profileData.profile as ProfessionalProfile
                            ).specialties!.map((specialty) => (
                              <span
                                key={specialty.id}
                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                              >
                                {specialty.name}
                              </span>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">
                              No hay especialidades seleccionadas
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="professionalProfile.profile_description">
                        Descripción del Perfil *
                      </Label>
                      {isEditing ? (
                        <div>
                          <textarea
                            id="professionalProfile.profile_description"
                            name="professionalProfile.profile_description"
                            value={
                              formData.professionalProfile
                                ?.profile_description || ""
                            }
                            onChange={handleInputChange}
                            rows={4}
                            className={`flex w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                              formErrors[
                                "professionalProfile.profile_description"
                              ]
                                ? "border-red-500"
                                : "border-input"
                            }`}
                            placeholder="Describe tu experiencia profesional, enfoque terapéutico, etc."
                          />
                          {formErrors[
                            "professionalProfile.profile_description"
                          ] && (
                            <p className="text-red-500 text-sm mt-1">
                              {
                                formErrors[
                                  "professionalProfile.profile_description"
                                ]
                              }
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-900">
                          {(profileData.profile as ProfessionalProfile)
                            .profile_description || "No especificado"}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="professionalProfile.resume_url">
                        URL del CV
                      </Label>
                      {isEditing ? (
                        <div>
                          <Input
                            id="professionalProfile.resume_url"
                            name="professionalProfile.resume_url"
                            type="url"
                            value={
                              formData.professionalProfile?.resume_url || ""
                            }
                            onChange={handleInputChange}
                            placeholder="https://ejemplo.com/mi-cv.pdf"
                            className={
                              formErrors["professionalProfile.resume_url"]
                                ? "border-red-500"
                                : ""
                            }
                          />
                          {formErrors["professionalProfile.resume_url"] && (
                            <p className="text-red-500 text-sm mt-1">
                              {formErrors["professionalProfile.resume_url"]}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-900">
                          {(profileData.profile as ProfessionalProfile)
                            .resume_url ? (
                            <a
                              href={
                                (profileData.profile as ProfessionalProfile)
                                  .resume_url!
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Ver CV
                            </a>
                          ) : (
                            "No especificado"
                          )}
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
                  setSpecialtyError(""); // Limpiar error de especialidades
                  setFormErrors({}); // Limpiar errores de validación
                  // Restablecer formData a los datos actuales si el usuario cancela la edición
                  if (profileData.user) {
                    setFormData(() => ({
                      name: profileData.user?.name || "",
                      last_name: profileData.user?.last_name || "",
                      email: profileData.user?.email || "",
                      phone_number: profileData.user?.phone_number || "",
                      address: profileData.user?.address || "",
                      birth_date: profileData.user?.birth_date || "",
                      gender: profileData.user?.gender || "",
                      nationality: profileData.user?.nationality || "",
                      rut: profileData.user?.rut || "",
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
                              title_id:
                                (profileData.profile as ProfessionalProfile)
                                  .title_id || null,
                              profile_description:
                                (profileData.profile as ProfessionalProfile)
                                  .profile_description || "",
                              resume_url:
                                (profileData.profile as ProfessionalProfile)
                                  .resume_url || "",
                            }
                          : undefined,
                    }));

                    // Restablecer especialidades seleccionadas
                    if (
                      profileData.user?.role === "professional" &&
                      profileData.profile
                    ) {
                      const professionalProfile =
                        profileData.profile as ProfessionalProfile;
                      if (professionalProfile.specialties) {
                        const selectedIds = professionalProfile.specialties.map(
                          (s) => s.id
                        );
                        setSelectedSpecialties(selectedIds);
                      } else {
                        setSelectedSpecialties([]);
                      }
                    }
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
