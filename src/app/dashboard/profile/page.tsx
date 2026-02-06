"use client";

import { useState, useEffect, useRef } from "react";
import { profileService } from "@/lib/services/profileService";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import Image from "next/image";
import AvatarEditor from "@/components/profile/AvatarEditor";
import {
  UserProfile,
  PatientProfile,
  ProfessionalProfile,
  ProfessionalTitle,
  ProfessionalSpecialty,
  TherapeuticApproach,
} from "@/lib/types/profile";

import { getFullUserProfileData } from "@/lib/userdata/profile-data";
//Datos de perfil completo

// Importamos las interfaces necesarias de profile-data.ts y services/profileService.ts
import { UserProfileData, DetailedUserDataMappped } from "@/lib/userdata/profile-data";
import { countries, genderOptions } from "@/lib/data/countries";
import { supabaseTyped } from "@/utils/supabase/client";

// Importar validaciones con Zod
import {
  profileFormSchema,
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
  region: number;
  municipality: number;
  birth_date: string;
  gender: string;
  nationality: string;
  rut: string;
  patientProfile: Partial<PatientProfile>;
  professionalProfile: Partial<ProfessionalProfile>;
}>;

type Region = {
  id: number;
  name: string;
};

type Municipality = {
  id: number;
  name: string;
  region_id: number;
};

// Función para traducir el rol al español
const translateRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    admin: "Administrador",
    professional: "Profesional",
    patient: "Paciente",
  };
  return roleMap[role.toLowerCase()] || role;
};

export default function UserProfilePage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuthState();
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
  const [therapeuticApproaches, setTherapeuticApproaches] = useState<
    TherapeuticApproach[]
  >([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPosition, setAvatarPosition] = useState<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const userRegion = (data.user as DetailedUserDataMappped & { region?: number })?.region;
        const userMunicipality = (data.user as DetailedUserDataMappped & { municipality?: number })?.municipality;
        
        setFormData(() => ({
          name: data.user?.name || "",
          last_name: data.user?.last_name || "",
          email: data.user?.email || "",
          phone_number: data.user?.phone_number || "",
          address: data.user?.address || "",
          region: userRegion || undefined,
          municipality: userMunicipality || undefined,
          birth_date: data.user?.birth_date || "",
          gender: data.user?.gender || "No especificar",
          nationality: data.user?.nationality || "",
          rut: data.user?.rut || "",
          patientProfile:
            data.user?.role === "patient"
              ? {
                  emergency_contact_name:
                    (data.profile as PatientProfile)?.emergency_contact_name ||
                    "",
                  emergency_contact_phone:
                    (data.profile as PatientProfile)?.emergency_contact_phone ||
                    "",
                }
              : undefined,
                  professionalProfile:
            data.user?.role === "professional" && data.profile
              ? {
                  title_id:
                    (data.profile as ProfessionalProfile).title_id || null,
                  approach_id:
                    (data.profile as ProfessionalProfile).approach_id || null,
                  profile_description:
                    (data.profile as ProfessionalProfile).profile_description ||
                    "",
                }
              : undefined,
        }));

        // Cargar comunas si el usuario tiene una región
        if (userRegion) {
          fetchMunicipalities(userRegion);
        }

        // Cargar títulos profesionales si es un profesional
        if (data.user?.role === "professional") {
          const titles = await profileService.getProfessionalTitles();
          setProfessionalTitles(titles);

          // Cargar enfoques terapéuticos
          const approaches = await profileService.getTherapeuticApproaches();
          setTherapeuticApproaches(approaches);

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
        
        // Cargar comunas si el usuario tiene una región
        if (userRegion) {
          fetchMunicipalities(userRegion);
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

  // Función para cargar las regiones
  const fetchRegions = async () => {
    try {
      setIsLoadingRegions(true);
      const { data, error } = await supabaseTyped
        .from("regions")
        .select("id, name")
        .order("name");
      
      if (error) {
        console.error("Error fetching regions:", error);
        setRegions([]);
        return;
      }
      
      setRegions((data || []) as Region[]);
    } catch (error) {
      console.error("Error loading regions:", error);
      setRegions([]);
    } finally {
      setIsLoadingRegions(false);
    }
  };

  // Función para cargar las comunas según la región seleccionada
  const fetchMunicipalities = async (regionId: number | undefined) => {
    if (!regionId) {
      setMunicipalities([]);
      return;
    }

    try {
      setIsLoadingMunicipalities(true);
      const { data, error } = await supabaseTyped
        .from("municipalities")
        .select("id, name, region_id")
        .eq("region_id", regionId)
        .order("name");
      
      if (error) {
        console.error("Error fetching municipalities:", error);
        setMunicipalities([]);
        return;
      }
      
      setMunicipalities((data || []) as Municipality[]);
    } catch (error) {
      console.error("Error loading municipalities:", error);
      setMunicipalities([]);
    } finally {
      setIsLoadingMunicipalities(false);
    }
  };

  // Cargar comunas cuando cambie la región seleccionada
  useEffect(() => {
    if (formData.region) {
      fetchMunicipalities(formData.region);
      // Si cambia la región, limpiar la comuna seleccionada
      setFormData((prev) => {
        if (prev.municipality) {
          return { ...prev, municipality: undefined };
        }
        return prev;
      });
    } else {
      setMunicipalities([]);
    }
  }, [formData.region]);

  useEffect(() => {
    fetchUserProfile();
    fetchRegions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // El array vacío asegura que se ejecute solo una vez al montar el componente

  // Función para obtener la posición del avatar desde localStorage
  const getAvatarPosition = (avatarUrl: string | null | undefined): { x: number; y: number } | null => {
    if (!avatarUrl) return null;
    try {
      const stored = localStorage.getItem(`avatar_position_${avatarUrl}`);
      if (stored) {
        const position = JSON.parse(stored);
        return { x: position.x, y: position.y };
      }
    } catch (error) {
      console.error("Error al leer posición del avatar:", error);
    }
    return null;
  };

  // Función para guardar la posición del avatar en localStorage
  const saveAvatarPosition = (avatarUrl: string, position: { x: number; y: number }) => {
    try {
      localStorage.setItem(`avatar_position_${avatarUrl}`, JSON.stringify(position));
    } catch (error) {
      console.error("Error al guardar posición del avatar:", error);
    }
  };

  // Cargar posición del avatar cuando se carga el perfil
  useEffect(() => {
    if (profileData.user?.avatar_url) {
      const position = getAvatarPosition(profileData.user.avatar_url);
      setAvatarPosition(position);
    }
  }, [profileData.user?.avatar_url]);

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

  // No redirigir inmediatamente si hay usuario autenticado pero el perfil aún se está cargando
  // o si la sesión se está refrescando
  if (!profileData.user && !authLoading && !authUser) {
    router.push("/login");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirigiendo...</div>
      </div>
    );
  }

  // Si hay usuario autenticado pero el perfil aún se está cargando, esperar
  if (!profileData.user && (authLoading || authUser)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando perfil...</div>
      </div>
    );
  }

  // if (!isAuthenticated || !fullProfile) {
  //   redirect("/login");
  //   return null; // Ensure nothing else renders after redirect
  // }

  // Verificación de tipo para asegurar que profileData.user no sea null
  if (!profileData.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando perfil...</div>
      </div>
    );
  }

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
    } else if (name === "phone_number") {
      formattedValue = formatPhone(value);
    }
    // No formatear el teléfono de emergencia para permitir cualquier formato

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
        // Limpiar approach_id si cambia el título y no es Psicología
        approach_id: null,
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

  // Función para manejar el cambio de enfoque terapéutico
  const handleApproachChange = (approachId: string) => {
    const approachIdNumber = approachId ? parseInt(approachId) : null;
    setFormData((prev) => ({
      ...prev,
      professionalProfile: {
        ...prev.professionalProfile,
        approach_id: approachIdNumber,
      },
    }));
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileData.user) return;

    // Validar tipo de archivo
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Tipo de archivo no permitido. Solo PNG, JPG, JPEG o WEBP");
      return;
    }

    // Validar tamaño (2MB máximo)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      alert("El archivo excede el tamaño máximo de 2MB");
      return;
    }

    // Abrir el editor de avatar en lugar de subir directamente
    setSelectedAvatarFile(file);
    setIsAvatarEditorOpen(true);
    
    // Limpiar el input para permitir subir el mismo archivo nuevamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAvatarSave = async (file: File, position: { x: number; y: number }) => {
    if (!profileData.user) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", profileData.user.user_id);

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al subir la imagen");
      }

      const data = await response.json();
      
      // Guardar la posición del avatar
      saveAvatarPosition(data.url, position);
      setAvatarPosition(position);
      
      // Actualizar el avatar_url en la base de datos
      await profileService.updateUserProfile(profileData.user.user_id, {
        avatar_url: data.url,
      });

      // Recargar los datos del perfil
      await fetchUserProfile();
    } catch (error) {
      console.error("Error al subir avatar:", error);
      alert(error instanceof Error ? error.message : "Error al subir la imagen");
    } finally {
      setIsUploadingAvatar(false);
      setSelectedAvatarFile(null);
    }
  };

  const handleAvatarCancel = () => {
    setSelectedAvatarFile(null);
  };

  const handleSave = async () => {
    if (!profileData.user) return;

    // Limpiar errores anteriores
    setFormErrors({});
    setSpecialtyError("");

    // Preparar datos para validación
    // Asegurar que region sea un número válido (el esquema lo requiere)
    const regionValue = formData.region && typeof formData.region === "number" && formData.region > 0
      ? formData.region
      : undefined;
    // Asegurar que municipality sea un número válido
    const municipalityValue = formData.municipality && typeof formData.municipality === "number" && formData.municipality > 0
      ? formData.municipality
      : undefined;
    
    // El esquema tiene preprocess que maneja undefined, pero TypeScript requiere number
    // Pasamos undefined si no hay valor válido, y el esquema validará y mostrará error apropiado
    const validationData = {
      name: formData.name || "",
      last_name: formData.last_name || "",
      phone_number: formData.phone_number || "",
      address: formData.address || "",
      region: regionValue,
      municipality: municipalityValue,
      birth_date: formData.birth_date || "",
      gender: formData.gender || "No especificar",
      nationality: formData.nationality || "",
      rut: formData.rut || "",
      patientProfile:
        profileData.user.role === "patient"
          ? {
              emergency_contact_name:
                formData.patientProfile?.emergency_contact_name || "",
              emergency_contact_phone:
                formData.patientProfile?.emergency_contact_phone || "",
            }
          : undefined,
      professionalProfile:
        profileData.user.role === "professional" && formData.professionalProfile
          ? {
              title_id: formData.professionalProfile.title_id || 0,
              profile_description:
                formData.professionalProfile.profile_description || "",
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
          // Mejorar mensajes de error genéricos
          let message = err.message;
          
          // Traducir mensajes genéricos de Zod a mensajes más profesionales
          if (message === "Invalid input" || message.toLowerCase().includes("invalid")) {
            // Mensajes más específicos según el campo
            const fieldMessages: Record<string, string> = {
              region: "Debes seleccionar una región válida",
              municipality: "Debes seleccionar una comuna válida",
              birth_date: "Debes ingresar una fecha de nacimiento válida",
              name: "El nombre no es válido",
              last_name: "El apellido no es válido",
              phone_number: "El teléfono no es válido",
              address: "La dirección no es válida",
              rut: "El RUT no es válido",
              nationality: "La nacionalidad no es válida",
              "professionalProfile.title_id": "Debes seleccionar una profesión válida",
              "professionalProfile.profile_description": "La descripción del perfil no es válida",
              "patientProfile.emergency_contact_name": "El nombre del contacto de emergencia no es válido",
              "patientProfile.emergency_contact_phone": "El teléfono de contacto de emergencia no es válido",
            };
            
            message = fieldMessages[fieldName] || `El campo ${fieldName} contiene un valor inválido`;
          }
          
          errors[fieldName] = message;
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
      if (formData.region !== undefined && formData.region !== (profileData.user as DetailedUserDataMappped & { region?: number })?.region) {
        userUpdateData.region = formData.region;
      }
      if (formData.municipality !== undefined && formData.municipality !== (profileData.user as DetailedUserDataMappped & { municipality?: number })?.municipality) {
        userUpdateData.municipality = formData.municipality;
      }
      if (
        formData.birth_date &&
        formData.birth_date !== profileData.user.birth_date
      ) {
        userUpdateData.birth_date = formData.birth_date;
      }
      if (formData.gender !== undefined && formData.gender !== profileData.user.gender) {
        userUpdateData.gender = formData.gender || "No especificar";
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

      if (Object.keys(userUpdateData).length > 0) {
        await profileService.updateUserProfile(
          profileData.user.user_id, // Usar user_id (UUID) para la autenticación
          userUpdateData
        );
      }

      if (profileData.user.role === "patient") {
        const patientUpdateData: Partial<PatientProfile> = {};
        
        // Solo agregar campos que han cambiado
        if (formData.patientProfile?.emergency_contact_name !== undefined) {
          patientUpdateData.emergency_contact_name = formData.patientProfile.emergency_contact_name || "";
        }
        if (formData.patientProfile?.emergency_contact_phone !== undefined) {
          patientUpdateData.emergency_contact_phone = formData.patientProfile.emergency_contact_phone || "";
        }
        
        // Verificar si existe el perfil de paciente
        if (profileData.profile) {
          // Solo actualizar si hay cambios
          if (Object.keys(patientUpdateData).length > 0) {
            await profileService.updatePatientProfile(
              profileData.user.user_id,
              patientUpdateData
            );
          }
        } else {
          // Crear nuevo perfil de paciente solo si hay datos
          if (Object.keys(patientUpdateData).length > 0 || 
              formData.patientProfile?.emergency_contact_name || 
              formData.patientProfile?.emergency_contact_phone) {
            await profileService.createPatientProfile(
              profileData.user.user_id,
              {
                emergency_contact_name: formData.patientProfile?.emergency_contact_name || "",
                emergency_contact_phone: formData.patientProfile?.emergency_contact_phone || "",
                health_insurances_id: 0, // Valor por defecto
              }
            );
          }
        }
      } else if (
        profileData.user.role === "professional" &&
        formData.professionalProfile
      ) {
        const professionalUpdateData: Partial<ProfessionalProfile> = {};
        const currentProfile = profileData.profile as ProfessionalProfile | undefined;
        
        // Solo agregar campos que han cambiado
        if (formData.professionalProfile.title_id !== undefined && 
            formData.professionalProfile.title_id !== currentProfile?.title_id) {
          professionalUpdateData.title_id = formData.professionalProfile.title_id;
        }
        if (formData.professionalProfile.approach_id !== undefined && 
            formData.professionalProfile.approach_id !== currentProfile?.approach_id) {
          professionalUpdateData.approach_id = formData.professionalProfile.approach_id || null;
        }
        if (formData.professionalProfile.profile_description !== undefined && 
            formData.professionalProfile.profile_description !== currentProfile?.profile_description) {
          professionalUpdateData.profile_description = formData.professionalProfile.profile_description;
        }
        
        // Solo actualizar si hay cambios
        if (Object.keys(professionalUpdateData).length > 0) {
          await profileService.updateProfessionalProfile(
            profileData.user.user_id,
            professionalUpdateData
          );
        }

        // Actualizar especialidades si hay un perfil profesional y las especialidades han cambiado
        if (
          profileData.profile &&
          (profileData.profile as ProfessionalProfile).id
        ) {
          const professionalId = (profileData.profile as ProfessionalProfile).id;
          // Solo actualizar si las especialidades han cambiado
          const currentSpecialties = (profileData.profile as ProfessionalProfile).specialties?.map(s => s.id) || [];
          const specialtiesChanged = JSON.stringify(currentSpecialties.sort()) !== JSON.stringify(selectedSpecialties.sort());
          
          if (specialtiesChanged) {
            await profileService.updateProfessionalSpecialties(
              professionalId,
              selectedSpecialties
            );
          }
        }
      }
      setIsEditing(false);
      // Recargar los datos del perfil para asegurar que estén actualizados
      await fetchUserProfile(); // Volvemos a cargar los datos después de guardar
    } catch (error: unknown) {
      // Función auxiliar para extraer información del error
      const getErrorInfo = (err: unknown) => {
        if (err instanceof Error) {
          return {
            name: err.name,
            message: err.message,
            stack: err.stack,
            // Intentar obtener propiedades adicionales
            ...(err as unknown as Record<string, unknown>),
          };
        }
        if (typeof err === 'object' && err !== null) {
          // Intentar serializar todas las propiedades
          const errorObj = err as Record<string, unknown>;
          return {
            ...errorObj,
            // Intentar serializar propiedades no enumerables
            serialized: JSON.stringify(err, Object.getOwnPropertyNames(err)),
          };
        }
        return { raw: String(err) };
      };

      const errorInfo = getErrorInfo(error);
      const errorObj = error as { code?: string; message?: string; details?: string; hint?: string };
      const hasErrorInfo = errorObj?.code || errorObj?.message || errorObj?.details || errorObj?.hint || (errorInfo && 'message' in errorInfo ? errorInfo.message : undefined);
      
      // Manejar específicamente el error PGRST116 (0 rows) - actualización no afectó filas
      // También manejar errores relacionados con 406 (Not Acceptable) que pueden ocurrir
      // cuando la actualización no afecta filas y se usa .single()
      if (errorObj?.code === 'PGRST116' && errorObj?.details?.includes('0 rows')) {
        console.log("Actualización no afectó filas (valores probablemente iguales), recargando perfil");
        setIsEditing(false);
        await fetchUserProfile();
        return;
      }
      
      // Manejar errores relacionados con actualizaciones que no afectan filas
      // (pueden aparecer como diferentes códigos de error dependiendo de la versión de Supabase)
      if (errorObj?.message?.includes('0 rows') || errorObj?.details?.includes('0 rows')) {
        console.log("No se detectaron cambios en la actualización, recargando perfil");
        setIsEditing(false);
        await fetchUserProfile();
        return;
      }
      
      // Log detallado del error para debugging
      console.error("Error al guardar el perfil:", {
        errorInfo,
        errorObj,
        hasErrorInfo,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorKeys: error && typeof error === 'object' ? Object.keys(error) : [],
      });
      
      // Si el error está vacío o no tiene información útil, puede ser que no haya cambios
      // En ese caso, simplemente cerrar el modo de edición sin mostrar error
      if (!hasErrorInfo) {
        console.warn("Error sin información útil, asumiendo que no hay cambios");
        setIsEditing(false);
        await fetchUserProfile();
        return;
      }
      
      // Detectar error de RUT duplicado
      if (errorObj?.code === 'RUT_DUPLICATE' || 
          (errorObj?.code === '23505' && (errorObj?.message?.includes('Users_rut_key') || errorObj?.message?.includes('rut')))) {
        setFormErrors((prev) => ({
          ...prev,
          rut: "Este RUT ya está registrado en el sistema",
        }));
        return;
      }
      
      // Detectar otros errores de validación de RUT
      if (errorObj?.message?.includes('rut') || errorObj?.message?.includes('RUT')) {
        setFormErrors((prev) => ({
          ...prev,
          rut: errorObj.message || "Error al actualizar el RUT",
        }));
        return;
      }
      
      setProfileData((prev) => ({
        ...prev,
        error: ('message' in errorInfo ? errorInfo.message : undefined) || errorObj?.message || "Error al guardar los cambios.",
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-8">
          <div className="relative group">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
              {profileData.user.avatar_url ? (
                <Image
                  src={profileData.user.avatar_url}
                  alt={`${profileData.user.name || "Usuario"} avatar`}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: avatarPosition 
                      ? `${avatarPosition.x}% ${avatarPosition.y}%`
                      : "center center",
                  }}
                  unoptimized
                />
              ) : (
                <span className="text-white text-3xl font-bold">
                  {profileData.user.name?.[0] || profileData.user.email?.[0] || "U"}
                </span>
              )}
            </div>
            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center shadow-lg transition-all opacity-90 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed z-10"
              title="Cambiar foto de perfil"
              type="button"
            >
              {isUploadingAvatar ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Pencil className="w-4 h-4 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {profileData.user.name && profileData.user.last_name
                ? `${profileData.user.name} ${profileData.user.last_name}`
                : profileData.user.email || "Usuario"}
            </h2>
            <p className="text-gray-600 mb-2">{profileData.user.email}</p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {translateRole(profileData.user.role)}
              </span>
              <span className="text-gray-500 text-sm font-mono">
                #{String(profileData.user.id || 0).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-1 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Información Personal
                {isEditing && (
                  <span className="text-sm text-gray-500 font-normal ml-2">
                    (* Campos obligatorios)
                  </span>
                )}
              </h3>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-teal-700 via-cyan-800 to-teal-800 hover:from-teal-800 hover:via-cyan-900 hover:to-teal-900 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-6 space-y-0">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1.5 block">Nombre *</Label>
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
                  <p className="text-gray-900 font-medium py-2">
                    {profileData.user.name || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name" className="text-sm font-medium text-gray-700 mb-1.5 block">Apellido *</Label>
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
                  <p className="text-gray-900 font-medium py-2">
                    {profileData.user.last_name || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5 block">Email</Label>
                <p className="text-gray-900 font-medium py-2">{profileData.user.email}</p>
              </div>
              <div>
                <Label htmlFor="rut" className="text-sm font-medium text-gray-700 mb-1.5 block">RUT *</Label>
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
                  <p className="text-gray-900 font-medium py-2">
                    {profileData.user.rut || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phone_number" className="text-sm font-medium text-gray-700 mb-1.5 block">Teléfono *</Label>
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
                  <p className="text-gray-900 font-medium py-2">
                    {profileData.user.phone_number || "No especificado"}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address" className="text-sm font-medium text-gray-700 mb-1.5 block">Dirección *</Label>
                {isEditing ? (
                  <div>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address || ""}
                      onChange={handleInputChange}
                      placeholder="Calle 123, Comuna"
                      className={formErrors.address ? "border-red-500" : ""}
                    />
                    {formErrors.address && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.address}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900 font-medium py-2">
                    {profileData.user.address || "No especificado"}
                  </p>
                )}
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="region" className="text-sm font-medium text-gray-700 mb-1.5 block">Región *</Label>
                {isEditing ? (
                  <div>
                    {isLoadingRegions ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                        Cargando regiones...
                      </div>
                    ) : regions.length === 0 ? (
                      <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-600 text-sm">
                        No se pudieron cargar las regiones. Por favor, recarga la página.
                      </div>
                    ) : (
                      <select
                        id="region"
                        name="region"
                        value={formData.region || ""}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          setFormData((prev) => ({ ...prev, region: value }));
                          // Limpiar error al cambiar
                          if (formErrors.region) {
                            setFormErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.region;
                              return newErrors;
                            });
                          }
                        }}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.region ? "border-red-500" : ""
                        }`}
                      >
                        <option value="">Selecciona una región</option>
                        {regions.map((region) => (
                          <option key={region.id} value={region.id}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {formErrors.region && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.region}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900 font-medium py-2">
                    {regions.find((r) => r.id === (profileData.user as DetailedUserDataMappped & { region?: number })?.region)?.name || "No especificado"}
                  </p>
                )}
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="municipality" className="text-sm font-medium text-gray-700 mb-1.5 block">Comuna *</Label>
                {isEditing ? (
                  <div>
                    {!formData.region ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                        Primero selecciona una región
                      </div>
                    ) : isLoadingMunicipalities ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                        Cargando comunas...
                      </div>
                    ) : municipalities.length === 0 ? (
                      <div className="w-full px-3 py-2 border border-yellow-300 rounded-md bg-yellow-50 text-yellow-600 text-sm">
                        No se encontraron comunas para esta región
                      </div>
                    ) : (
                      <select
                        id="municipality"
                        name="municipality"
                        value={formData.municipality ? String(formData.municipality) : ""}
                        onChange={(e) => {
                          const selectedValue = e.target.value;
                          const value = selectedValue && selectedValue !== "" ? parseInt(selectedValue, 10) : undefined;
                          setFormData((prev) => ({ ...prev, municipality: value }));
                          // Limpiar error al cambiar
                          if (formErrors.municipality) {
                            setFormErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.municipality;
                              return newErrors;
                            });
                          }
                        }}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.municipality ? "border-red-500" : ""
                        }`}
                      >
                        <option value="">Selecciona una comuna</option>
                        {municipalities.map((municipality) => (
                          <option key={municipality.id} value={municipality.id}>
                            {municipality.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {formErrors.municipality && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.municipality}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900 font-medium py-2">
                    {(() => {
                      const userMunicipalityId = (profileData.user as DetailedUserDataMappped & { municipality?: number })?.municipality;
                      if (!userMunicipalityId) return "No especificado";
                      const municipality = municipalities.find((m) => m.id === userMunicipalityId);
                      // Si no está en el array de municipalities, puede que aún se estén cargando
                      return municipality?.name || "Cargando...";
                    })()}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="birth_date" className="text-sm font-medium text-gray-700 mb-1.5 block">Fecha de Nacimiento *</Label>
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
                  <p className="text-gray-900 font-medium py-2">
                    {profileData.user.birth_date || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="gender" className="text-sm font-medium text-gray-700 mb-1.5 block">Género *</Label>
                {isEditing ? (
                  <div>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender || "No especificar"}
                      onChange={handleInputChange}
                      className={`flex w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                        formErrors.gender ? "border-red-500" : "border-input"
                      }`}
                    >
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
                  <p className="text-gray-900 font-medium py-2">
                    {profileData.user.gender || "No especificado"}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="nationality" className="text-sm font-medium text-gray-700 mb-1.5 block">Nacionalidad *</Label>
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
                  <p className="text-gray-900 font-medium py-2">
                    {profileData.user.nationality || "No especificado"}
                  </p>
                )}
              </div>

              {profileData.user.role === "patient" && (
                <>
                  <div className="md:col-span-2">
                    <Label htmlFor="patientProfile.emergency_contact_name" className="text-sm font-medium text-gray-700 mb-1.5 block">
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
                      <p className="text-gray-900 font-medium py-2">
                        {(profileData.profile as PatientProfile)
                          ?.emergency_contact_name || "No especificado"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="patientProfile.emergency_contact_phone" className="text-sm font-medium text-gray-700 mb-1.5 block">
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
                      <p className="text-gray-900 font-medium py-2">
                        {(profileData.profile as PatientProfile)
                          ?.emergency_contact_phone || "No especificado"}
                      </p>
                    )}
                  </div>
                </>
              )}

              {profileData.user.role === "professional" &&
                profileData.profile && (
                  <>
                    <div>
                      <Label htmlFor="professionalProfile.title_id" className="text-sm font-medium text-gray-700 mb-1.5 block">
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
                        <p className="text-gray-900 font-medium py-2">
                          {(profileData.profile as ProfessionalProfile).title
                            ?.title_name || "No especificado"}
                        </p>
                      )}
                    </div>
                    {/* Campo de Enfoque Terapéutico - Solo para Psicología */}
                    {((isEditing && formData.professionalProfile?.title_id && 
                       professionalTitles.find(t => t.id === formData.professionalProfile?.title_id)?.title_name === "Psicología") ||
                      (!isEditing && (profileData.profile as ProfessionalProfile).title?.title_name === "Psicología")) && (
                      <div>
                        <Label htmlFor="professionalProfile.approach_id" className="text-sm font-medium text-gray-700 mb-1.5 block">
                          Enfoque Terapéutico
                        </Label>
                        {isEditing ? (
                          <div>
                            <select
                              id="professionalProfile.approach_id"
                              name="professionalProfile.approach_id"
                              value={formData.professionalProfile?.approach_id || ""}
                              onChange={(e) => handleApproachChange(e.target.value)}
                              className="flex w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 border-input"
                            >
                              <option value="">Seleccionar enfoque</option>
                              {therapeuticApproaches.map((approach) => (
                                <option key={approach.id} value={approach.id}>
                                  {approach.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <p className="text-gray-900 font-medium py-2">
                            {(profileData.profile as ProfessionalProfile).approach
                              ?.name || "No especificado"}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Especialidades</Label>
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
                    <div className="md:col-span-2">
                      <Label htmlFor="professionalProfile.profile_description" className="text-sm font-medium text-gray-700 mb-1.5 block">
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
                        <p className="text-gray-900 font-medium py-2 whitespace-pre-wrap">
                          {(profileData.profile as ProfessionalProfile)
                            .profile_description || "No especificado"}
                        </p>
                      )}
                    </div>
                  </>
                )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          {isEditing && (
            <>
              <Button onClick={handleSave} className="mr-2 bg-gradient-to-r from-teal-700 via-cyan-800 to-teal-800 hover:from-teal-800 hover:via-cyan-900 hover:to-teal-900 text-white transition-all duration-200">
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
                      gender: profileData.user?.gender || "No especificar",
                      nationality: profileData.user?.nationality || "",
                      rut: profileData.user?.rut || "",
                      patientProfile:
                        profileData.user?.role === "patient"
                          ? {
                              emergency_contact_name:
                                (profileData.profile as PatientProfile)
                                  ?.emergency_contact_name || "",
                              emergency_contact_phone:
                                (profileData.profile as PatientProfile)
                                  ?.emergency_contact_phone || "",
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
          )}
        </div>
      </div>

      <AvatarEditor
        open={isAvatarEditorOpen}
        onOpenChange={setIsAvatarEditorOpen}
        imageFile={selectedAvatarFile}
        onSave={handleAvatarSave}
        onCancel={handleAvatarCancel}
      />
    </div>
  );
}
