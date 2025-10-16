"use client";

import { CheckCircle } from "lucide-react";

interface Step {
  number: number;
  title: string;
  description: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
}

export default function ProgressStepper({
  steps,
  currentStep,
}: ProgressStepperProps) {
  return (
    <div className="mb-6 px-4">
      {/* Versión Desktop - Horizontal */}
      <div className="hidden md:flex items-center justify-center space-x-2 lg:space-x-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  currentStep >= step.number
                    ? "bg-primary border-primary text-white shadow-lg"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6" />
                ) : (
                  <span className="text-xs lg:text-sm font-semibold">
                    {step.number}
                  </span>
                )}
              </div>
              <div className="mt-2 lg:mt-3 text-center max-w-20 lg:max-w-24">
                <p
                  className={`text-xs lg:text-sm font-medium transition-colors ${
                    currentStep >= step.number
                      ? "text-primary"
                      : "text-gray-500"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-400 mt-1 hidden lg:block">
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 lg:w-20 h-1 mx-2 lg:mx-4 rounded-full transition-all duration-300 ${
                  currentStep > step.number ? "bg-primary" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Versión Mobile - Vertical Compacta */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="flex flex-col items-center flex-1"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  currentStep >= step.number
                    ? "bg-primary border-primary text-white shadow-lg"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-semibold">{step.number}</span>
                )}
              </div>
              <div className="mt-1 text-center">
                <p
                  className={`text-xs font-medium transition-colors ${
                    currentStep >= step.number
                      ? "text-primary"
                      : "text-gray-500"
                  }`}
                >
                  {step.title.split(" ")[0]}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-full h-1 mt-2 rounded-full transition-all duration-300 ${
                    currentStep > step.number ? "bg-primary" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Información del paso actual */}
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-primary">
            Paso {currentStep} de {steps.length}:{" "}
            {steps[currentStep - 1]?.title}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {steps[currentStep - 1]?.description}
          </p>
        </div>
      </div>
    </div>
  );
}
