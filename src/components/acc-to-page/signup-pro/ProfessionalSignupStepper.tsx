"use client";

import { useState } from "react";
import PersonalDataStep from "./steps/PersonalDataStep";
import AcademicDataStep from "./steps/AcademicDataStep";
import DocumentsStep from "./steps/DocumentsStep";
import PaymentPlanStep from "./steps/PaymentPlanStep";
import PaymentConfirmationStep from "./steps/PaymentConfirmationStep";
import ProgressStepper from "./ProgressStepper";
import {
  PersonalDataFormData,
  AcademicDataFormData,
  DocumentsFormData,
  PaymentPlanFormData,
  personalDataSchema,
  academicDataSchema,
  documentsSchema,
  paymentPlanSchema,
} from "@/lib/validations/professional-signup";

type Step = 1 | 2 | 3 | 4 | 5;

interface StepData {
  personalData: PersonalDataFormData;
  academicData: AcademicDataFormData;
  documents: DocumentsFormData;
  paymentPlan: PaymentPlanFormData;
}

const initialStepData: StepData = {
  personalData: {
    first_name: "",
    last_name_p: "",
    last_name_m: "",
    rut: "",
    birth_date: "",
    email: "",
    phone_number: "",
  },
  academicData: {
    university: "",
    profession: "",
    study_year_start: "",
    study_year_end: "",
    extra_studies: "",
    superintendence_number: "",
  },
  documents: {
    degree_copy: new File([], "placeholder.pdf", { type: "application/pdf" }),
    id_copy: undefined,
    professional_certificate: undefined,
    additional_certificates: [],
  },
  paymentPlan: {
    plan_type: "light" as "light" | "monthly",
  },
};

export default function ProfessionalSignupStepper() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [stepData, setStepData] = useState<StepData>(initialStepData);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>(
    {}
  );

  const steps = [
    { number: 1, title: "Datos Personales", description: "Información básica" },
    {
      number: 2,
      title: "Datos Académicos",
      description: "Formación profesional",
    },
    { number: 3, title: "Documentos", description: "Archivos requeridos" },
    { number: 4, title: "Plan de Pago", description: "Selección de plan" },
    { number: 5, title: "Confirmación", description: "Procesando pago" },
  ];

  const validateStep = (step: Step): boolean => {
    let validation;
    let stepKey: keyof StepData;

    switch (step) {
      case 1:
        validation = personalDataSchema.safeParse(stepData.personalData);
        stepKey = "personalData";
        break;
      case 2:
        validation = academicDataSchema.safeParse(stepData.academicData);
        stepKey = "academicData";
        break;
      case 3:
        validation = documentsSchema.safeParse(stepData.documents);
        stepKey = "documents";
        break;
      case 4:
        validation = paymentPlanSchema.safeParse(stepData.paymentPlan);
        stepKey = "paymentPlan";
        break;
      default:
        return true;
    }

    if (!validation.success) {
      const flat = validation.error.flatten();
      const fieldErrors: Record<string, string> = {};
      Object.entries(flat.fieldErrors).forEach(([key, msgs]) => {
        if (msgs && msgs[0]) fieldErrors[key] = msgs[0];
      });

      // Mostrar errores inmediatamente
      setErrors((prev) => ({ ...prev, [stepKey]: fieldErrors }));

      // Scroll al primer error si existe
      setTimeout(() => {
        const firstErrorElement = document.querySelector(".text-red-600");
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);

      return false;
    }

    // Limpiar errores si la validación es exitosa
    setErrors((prev) => ({ ...prev, [stepKey]: {} }));
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5) as Step);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  const handleRetry = () => {
    setCurrentStep(4); // Volver al paso de selección de plan
  };

  const updateStepData = <K extends keyof StepData>(
    stepKey: K,
    data: StepData[K]
  ) => {
    setStepData((prev) => ({
      ...prev,
      [stepKey]: data,
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalDataStep
            data={stepData.personalData}
            onChange={(data) => updateStepData("personalData", data)}
            errors={errors.personalData || {}}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <AcademicDataStep
            data={stepData.academicData}
            onChange={(data) => updateStepData("academicData", data)}
            errors={errors.academicData || {}}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <DocumentsStep
            data={stepData.documents}
            onChange={(data) => updateStepData("documents", data)}
            errors={errors.documents || {}}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <PaymentPlanStep
            data={stepData.paymentPlan}
            onChange={(data) => updateStepData("paymentPlan", data)}
            errors={errors.paymentPlan || {}}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <PaymentConfirmationStep
            onPrevious={handlePrevious}
            onRetry={handleRetry}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Progress Stepper */}
        <ProgressStepper steps={steps} currentStep={currentStep} />

        {/* Step Content */}
        <div className="flex justify-center">{renderStep()}</div>
      </div>
    </div>
  );
}
