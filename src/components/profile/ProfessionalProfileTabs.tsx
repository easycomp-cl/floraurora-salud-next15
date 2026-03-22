"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Briefcase, CreditCard } from "lucide-react";
import type { ProfessionalProfile, ProfessionalTitle, ProfessionalSpecialty, TherapeuticApproach } from "@/lib/types/profile";
import type { DetailedUserDataMappped } from "@/lib/userdata/profile-data";
import { countries, genderOptions } from "@/lib/data/countries";
import { chileanBanks, accountTypes } from "@/lib/data/banks";

type Region = { id: number; name: string };
type Municipality = { id: number; name: string; region_id: number };

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
  professionalProfile: Partial<ProfessionalProfile>;
  bankAccount: { bank: string; account_type: string; account_number: string };
}>;

interface ProfessionalProfileTabsProps {
  profileData: { user: DetailedUserDataMappped & { region?: number; municipality?: number; avatar_url?: string }; profile: ProfessionalProfile | null };
  formData: FormDataState;
  formErrors: Record<string, string>;
  isEditing: boolean;
  regions: Region[];
  municipalities: Municipality[];
  isLoadingRegions: boolean;
  isLoadingMunicipalities: boolean;
  professionalTitles: ProfessionalTitle[];
  therapeuticApproaches: TherapeuticApproach[];
  professionalSpecialties: ProfessionalSpecialty[];
  selectedSpecialties: number[];
  specialtyError: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onTitleChange: (titleId: string) => void;
  onApproachChange: (approachId: string) => void;
  onSpecialtyToggle: (specialtyId: number) => void;
  onRegionChange: (regionId: number | undefined) => void;
  onMunicipalityChange: (municipalityId: number | undefined) => void;
}

export function ProfessionalProfileTabs({
  profileData,
  formData,
  formErrors,
  isEditing,
  regions,
  municipalities,
  isLoadingRegions,
  isLoadingMunicipalities,
  professionalTitles,
  therapeuticApproaches,
  professionalSpecialties,
  selectedSpecialties,
  specialtyError,
  onInputChange,
  onTitleChange,
  onApproachChange,
  onSpecialtyToggle,
  onRegionChange,
  onMunicipalityChange,
}: ProfessionalProfileTabsProps) {
  const userRegion = profileData.user?.region;
  const userMunicipality = profileData.user?.municipality;

  return (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="personal" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Información Personal
        </TabsTrigger>
        <TabsTrigger value="professional" className="flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Información Profesional
        </TabsTrigger>
        <TabsTrigger value="bank" className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Información Bancaria
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Información Personal */}
      <TabsContent value="personal" className="space-y-6">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Información Personal
            {isEditing && (
              <span className="text-sm text-gray-500 font-normal ml-2">
                (* Campos obligatorios)
              </span>
            )}
          </h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1.5 block">Nombre *</Label>
            {isEditing ? (
              <div>
                <Input id="name" name="name" type="text" value={formData.name || ""} onChange={onInputChange} className={formErrors.name ? "border-red-500" : ""} />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>
            ) : (
              <p className="text-gray-900 font-medium py-2">{profileData.user?.name || "No especificado"}</p>
            )}
          </div>
          <div>
            <Label htmlFor="last_name" className="text-sm font-medium text-gray-700 mb-1.5 block">Apellido *</Label>
            {isEditing ? (
              <div>
                <Input id="last_name" name="last_name" type="text" value={formData.last_name || ""} onChange={onInputChange} className={formErrors.last_name ? "border-red-500" : ""} />
                {formErrors.last_name && <p className="text-red-500 text-sm mt-1">{formErrors.last_name}</p>}
              </div>
            ) : (
              <p className="text-gray-900 font-medium py-2">{profileData.user?.last_name || "No especificado"}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5 block">Email</Label>
            <p className="text-gray-900 font-medium py-2">{profileData.user?.email}</p>
          </div>
          <div>
            <Label htmlFor="phone_number" className="text-sm font-medium text-gray-700 mb-1.5 block">Teléfono *</Label>
            {isEditing ? (
              <div>
                <Input id="phone_number" name="phone_number" type="text" value={formData.phone_number || ""} onChange={onInputChange} placeholder="1234 5678 o +569 1234 5678" className={formErrors.phone_number ? "border-red-500" : ""} />
                {formErrors.phone_number && <p className="text-red-500 text-sm mt-1">{formErrors.phone_number}</p>}
              </div>
            ) : (
              <p className="text-gray-900 font-medium py-2">{profileData.user?.phone_number || "No especificado"}</p>
            )}
          </div>
          <div>
            <Label htmlFor="rut" className="text-sm font-medium text-gray-700 mb-1.5 block">RUT *</Label>
            {isEditing ? (
              <div>
                <Input id="rut" name="rut" type="text" value={formData.rut || ""} onChange={onInputChange} placeholder="12.345.678-9" className={formErrors.rut ? "border-red-500" : ""} />
                {formErrors.rut && <p className="text-red-500 text-sm mt-1">{formErrors.rut}</p>}
              </div>
            ) : (
              <p className="text-gray-900 font-medium py-2">{profileData.user?.rut || "No especificado"}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address" className="text-sm font-medium text-gray-700 mb-1.5 block">Dirección *</Label>
            {isEditing ? (
              <div>
                <Input id="address" name="address" type="text" value={formData.address || ""} onChange={onInputChange} placeholder="Calle 123, Comuna" className={formErrors.address ? "border-red-500" : ""} />
                {formErrors.address && <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>}
              </div>
            ) : (
              <p className="text-gray-900 font-medium py-2">{profileData.user?.address || "No especificado"}</p>
            )}
          </div>
          <div>
            <Label htmlFor="region" className="text-sm font-medium text-gray-700 mb-1.5 block">Región *</Label>
            {isEditing ? (
              <div>
                {isLoadingRegions ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">Cargando regiones...</div>
                ) : (
                  <select
                    id="region"
                    name="region"
                    value={formData.region || ""}
                    onChange={(e) => onRegionChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className={`w-full px-3 py-2 border rounded-md ${formErrors.region ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Selecciona una región</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                )}
                {formErrors.region && <p className="text-red-500 text-sm mt-1">{formErrors.region}</p>}
              </div>
            ) : (
              <p className="text-gray-900 font-medium py-2">{regions.find((r) => r.id === userRegion)?.name || "No especificado"}</p>
            )}
          </div>
          <div>
            <Label htmlFor="municipality" className="text-sm font-medium text-gray-700 mb-1.5 block">Comuna *</Label>
            {isEditing ? (
              <div>
                {!formData.region ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">Primero selecciona una región</div>
                ) : isLoadingMunicipalities ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">Cargando comunas...</div>
                ) : (
                  <select
                    id="municipality"
                    name="municipality"
                    value={formData.municipality ? String(formData.municipality) : ""}
                    onChange={(e) => onMunicipalityChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className={`w-full px-3 py-2 border rounded-md ${formErrors.municipality ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Selecciona una comuna</option>
                    {municipalities.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )}
                {formErrors.municipality && <p className="text-red-500 text-sm mt-1">{formErrors.municipality}</p>}
              </div>
            ) : (
              <p className="text-gray-900 font-medium py-2">{municipalities.find((m) => m.id === userMunicipality)?.name || "No especificado"}</p>
            )}
          </div>
          <div>
            <Label htmlFor="birth_date" className="text-sm font-medium text-gray-700 mb-1.5 block">Fecha de Nacimiento *</Label>
            {isEditing ? (
              <div>
                <Input id="birth_date" name="birth_date" type="date" value={formData.birth_date || ""} onChange={onInputChange} className={formErrors.birth_date ? "border-red-500" : ""} />
                {formErrors.birth_date && <p className="text-red-500 text-sm mt-1">{formErrors.birth_date}</p>}
              </div>
            ) : (
              <p className="text-gray-900 font-medium py-2">{profileData.user?.birth_date || "No especificado"}</p>
            )}
          </div>
          <div>
            <Label htmlFor="gender" className="text-sm font-medium text-gray-700 mb-1.5 block">Género *</Label>
            {isEditing ? (
              <div>
                <select id="gender" name="gender" value={formData.gender || "No especificar"} onChange={onInputChange} className={`w-full px-3 py-2 border rounded-md ${formErrors.gender ? "border-red-500" : "border-gray-300"}`}>
                  {genderOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {formErrors.gender && <p className="text-red-500 text-sm mt-1">{formErrors.gender}</p>}
              </div>
            ) : (
              <p className="text-gray-900 font-medium py-2">{profileData.user?.gender || "No especificado"}</p>
            )}
          </div>
          <div>
            <Label htmlFor="nationality" className="text-sm font-medium text-gray-700 mb-1.5 block">Nacionalidad *</Label>
            {isEditing ? (
              <div>
                <select id="nationality" name="nationality" value={formData.nationality || ""} onChange={onInputChange} className={`w-full px-3 py-2 border rounded-md ${formErrors.nationality ? "border-red-500" : "border-gray-300"}`}>
                  <option value="">Seleccionar nacionalidad</option>
                  {countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
                {formErrors.nationality && <p className="text-red-500 text-sm mt-1">{formErrors.nationality}</p>}
              </div>
            ) : (
              <p className="text-gray-900 font-medium py-2">{profileData.user?.nationality || "No especificado"}</p>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Tab 2: Información Profesional */}
      <TabsContent value="professional" className="space-y-6">
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 mb-4">
          <p className="text-sm text-blue-800 font-medium">
            Esta información será visible para los pacientes.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="professionalProfile.title_id" className="text-sm font-medium text-gray-700 mb-1.5 block">Profesión *</Label>
            {isEditing ? (
              <div>
                <select
                  id="professionalProfile.title_id"
                  name="professionalProfile.title_id"
                  value={formData.professionalProfile?.title_id || ""}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${formErrors["professionalProfile.title_id"] ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Seleccionar profesión</option>
                  {professionalTitles.map((t) => <option key={t.id} value={t.id}>{t.title_name}</option>)}
                </select>
                {formErrors["professionalProfile.title_id"] && <p className="text-red-500 text-sm mt-1">{formErrors["professionalProfile.title_id"]}</p>}
              </div>
            ) : (
              <p className="text-gray-900 font-medium py-2">{(profileData.profile as ProfessionalProfile)?.title?.title_name || "No especificado"}</p>
            )}
          </div>
          {((isEditing && formData.professionalProfile?.title_id && professionalTitles.find((t) => t.id === formData.professionalProfile?.title_id)?.title_name === "Psicología") ||
            (!isEditing && (profileData.profile as ProfessionalProfile)?.title?.title_name === "Psicología")) && (
            <div>
              <Label htmlFor="professionalProfile.approach_id" className="text-sm font-medium text-gray-700 mb-1.5 block">Enfoque Terapéutico</Label>
              {isEditing ? (
                <select
                  id="professionalProfile.approach_id"
                  name="professionalProfile.approach_id"
                  value={formData.professionalProfile?.approach_id || ""}
                  onChange={(e) => onApproachChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Seleccionar enfoque</option>
                  {therapeuticApproaches.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              ) : (
                <p className="text-gray-900 font-medium py-2">{(profileData.profile as ProfessionalProfile)?.approach?.name || "No especificado"}</p>
              )}
            </div>
          )}
          <div className="md:col-span-2">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Especialidades</Label>
            {isEditing ? (
              <div className="space-y-2">
                {professionalSpecialties.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {professionalSpecialties.map((s) => (
                      <div key={s.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`specialty-${s.id}`}
                          className="rounded border-gray-300"
                          checked={selectedSpecialties.includes(s.id)}
                          onChange={() => onSpecialtyToggle(s.id)}
                        />
                        <label htmlFor={`specialty-${s.id}`} className="text-sm">{s.name}</label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Selecciona una profesión para ver las especialidades disponibles</p>
                )}
                {specialtyError && <p className="text-red-500 text-sm mt-1">{specialtyError}</p>}
              </div>
            ) : (
              <div>
                {(profileData.profile as ProfessionalProfile)?.specialties?.length ? (
                  (profileData.profile as ProfessionalProfile).specialties!.map((s) => (
                    <span key={s.id} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">{s.name}</span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No hay especialidades seleccionadas</p>
                )}
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="professionalProfile.profile_description" className="text-sm font-medium text-gray-700 mb-1.5 block">Descripción del Perfil *</Label>
            {isEditing ? (
              <div>
                <textarea
                  id="professionalProfile.profile_description"
                  name="professionalProfile.profile_description"
                  value={formData.professionalProfile?.profile_description || ""}
                  onChange={onInputChange}
                  rows={4}
                  className={`w-full rounded-md border px-3 py-1 text-sm ${formErrors["professionalProfile.profile_description"] ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Describe tu experiencia profesional, enfoque terapéutico, etc."
                />
                {formErrors["professionalProfile.profile_description"] && <p className="text-red-500 text-sm mt-1">{formErrors["professionalProfile.profile_description"]}</p>}
              </div>
            ) : (
              <p className="text-gray-900 font-medium py-2 whitespace-pre-wrap">{(profileData.profile as ProfessionalProfile)?.profile_description || "No especificado"}</p>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Tab 3: Información Bancaria */}
      <TabsContent value="bank" className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</Label>
            <p className="text-gray-900 font-medium py-2">{profileData.user?.email}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">RUT</Label>
            <p className="text-gray-900 font-medium py-2">{profileData.user?.rut || "No especificado"}</p>
          </div>
          <div>
            <Label htmlFor="bankAccount.bank" className="text-sm font-medium text-gray-700 mb-1.5 block">Banco</Label>
            {isEditing ? (
              <select
                id="bankAccount.bank"
                name="bankAccount.bank"
                value={formData.bankAccount?.bank || ""}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar banco</option>
                {chileanBanks.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            ) : (
              <p className="text-gray-900 font-medium py-2">{formData.bankAccount?.bank || "No especificado"}</p>
            )}
          </div>
          <div>
            <Label htmlFor="bankAccount.account_type" className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo de cuenta</Label>
            {isEditing ? (
              <select
                id="bankAccount.account_type"
                name="bankAccount.account_type"
                value={formData.bankAccount?.account_type || ""}
                onChange={onInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar tipo</option>
                {accountTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            ) : (
              <p className="text-gray-900 font-medium py-2">{formData.bankAccount?.account_type || "No especificado"}</p>
            )}
          </div>
          <div>
            <Label htmlFor="bankAccount.account_number" className="text-sm font-medium text-gray-700 mb-1.5 block">Número de cuenta</Label>
            {isEditing ? (
              <Input
                id="bankAccount.account_number"
                name="bankAccount.account_number"
                type="text"
                value={formData.bankAccount?.account_number || ""}
                onChange={onInputChange}
                placeholder="Ej: 12345678"
                className="w-full"
              />
            ) : (
              <p className="text-gray-900 font-medium py-2">{formData.bankAccount?.account_number || "No especificado"}</p>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
