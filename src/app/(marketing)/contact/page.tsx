"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  contactFormSchema,
  type ContactFormData,
} from "@/lib/validations/contact";
import { useState } from "react";
import Image from "next/image";
import { Mail, MessageCircle } from "lucide-react";
import logoImge from "../../../components/Fotos/logo.png";
import contactoImg from "../../../components/Fotos/contacto.jpg";

export default function ContactPage() {
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      setSubmitStatus({ type: null, message: "" });

      console.log("📧 Enviando datos del formulario:", data);

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Mensaje de error más específico para créditos excedidos
        if (result.errorCode === 'CREDITS_EXCEEDED') {
          throw new Error(result.error || "El servicio de email temporalmente no está disponible. Por favor, contacta directamente a contacto@floraurorasalud.cl o al WhatsApp +56 9 5868 5129.");
        }
        throw new Error(result.error || "Error al enviar el mensaje");
      }

      setSubmitStatus({
        type: "success",
        message: "¡Mensaje enviado exitosamente! Te contactaremos pronto.",
      });

      reset();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Hubo un error al enviar el mensaje. Por favor, intenta nuevamente.";
      setSubmitStatus({
        type: "error",
        message: errorMessage,
      });
      console.error("❌ Error al enviar formulario:", error);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header Section con estilo similar a Nosotros */}
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
        <Image
          src={contactoImg}
          alt="Contacto FlorAurora"
          fill
          priority
          className="object-cover brightness-90"
        />
        {/* Overlay oscuro pero balanceado para mejor legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/65 via-teal-900/70 to-gray-900/65" />
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 md:px-8 flex flex-col items-center justify-center text-center">
          {/* Logo */}
          <Image
            src={logoImge}
            alt="Logo FlorAurora Salud"
            width={80}
            height={80}
            className="absolute top-6 left-6 md:top-8 md:left-8 z-20 rounded-lg shadow-xl bg-white p-2"
            priority
          />
          
          {/* Contenido principal */}
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-2xl">
                Contáctanos
              </h1>
              <div className="w-32 h-1.5 bg-teal-400 mx-auto rounded-full shadow-lg"></div>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <p className="text-lg md:text-xl lg:text-2xl text-white leading-relaxed drop-shadow-xl font-normal">
                Estamos aquí para ayudarte. Contáctanos para cualquier consulta,
                agendar una cita o resolver dudas sobre nuestros servicios.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="bg-gradient-to-br from-teal-50 via-teal-100/50 to-teal-200/30 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
              <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-8 tracking-wide">
                Información de Contacto
              </h2>
              <div className="w-24 h-1 bg-teal-500 rounded-full mb-8"></div>

              <div className="space-y-8">
                {/* Email */}
                <div className="flex items-start transform transition-all hover:translate-x-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mr-6 shadow-lg flex-shrink-0">
                    <Mail className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Email
                    </h3>
                    <a
                      href="mailto:contacto@floraurorasalud.cl"
                      className="text-gray-600 hover:text-teal-600 transition-colors text-lg"
                    >
                      contacto@floraurorasalud.cl
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start transform transition-all hover:translate-x-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full mr-6 shadow-lg flex-shrink-0">
                    <MessageCircle className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      WhatsApp
                    </h3>
                    <a
                      href="https://wa.me/56958685129"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-green-600 transition-colors text-lg"
                    >
                      +56 9 5868 5129
                    </a>
                  </div>
                </div>

              </div>

              {/* Social Media */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Síguenos
                </h3>
                <div className="flex space-x-4">
                  {/* Facebook */}
                  <a
                    href="https://www.facebook.com/profile.php?id=61583826515401"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-blue-800 rounded-full flex items-center justify-center hover:bg-blue-900 transition-all transform hover:scale-110 shadow-md hover:shadow-lg"
                    aria-label="Facebook"
                  >
                    <svg
                      role="img"
                      viewBox="0 0 24 24"
                      className="w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <title>Facebook</title>
                      <path
                        fill="#fff"
                        d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
                      />
                    </svg>
                  </a>
                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/floraurorasalud?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-90 transition-all transform hover:scale-110 shadow-md hover:shadow-lg"
                    aria-label="Instagram"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 110%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
                    }}
                  >
                    <svg
                      role="img"
                      viewBox="0 0 24 24"
                      className="w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <title>Instagram</title>
                      <path
                        fill="#fff"
                        d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"
                      />
                    </svg>
                  </a>
                  {/* TikTok */}
                  <a
                    href="https://www.tiktok.com/@floraurora.salud?_r=1&_t=ZM-91Tr4EhECmx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-all transform hover:scale-110 shadow-md hover:shadow-lg border border-gray-200"
                    aria-label="TikTok"
                  >
                    <svg
                      role="img"
                      viewBox="0 0 24 24"
                      className="w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <title>TikTok</title>
                      <path
                        fill="#000"
                        d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
              <h2 className="text-3xl md:text-4xl font-bold text-teal-900 mb-6 tracking-wide">
                Envíanos un Mensaje
              </h2>
              <div className="w-24 h-1 bg-teal-500 rounded-full mb-8"></div>

              {/* Mensaje de estado */}
              {submitStatus.type && (
                <div
                  className={`mb-6 p-4 rounded-lg ${
                    submitStatus.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <p className="font-medium">{submitStatus.message}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      {...register("firstName")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                      errors.firstName ? "border-red-500" : "border-gray-300"
                    }`}
                      placeholder="Tu nombre"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Apellido
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      {...register("lastName")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                      errors.lastName ? "border-red-500" : "border-gray-300"
                    }`}
                      placeholder="Tu apellido"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    {...register("email")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="tu@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    {...register("phone")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="+56 9 1234 5678"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Asunto
                  </label>
                  <select
                    id="subject"
                    {...register("subject")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                      errors.subject ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Selecciona un asunto</option>
                    <option value="consulta">Consulta General</option>
                    <option value="cita">Agendar Cita</option>
                    <option value="soporte">Soporte Técnico</option>
                    <option value="facturacion">Facturación</option>
                    <option value="otro">Otro</option>
                  </select>
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    {...register("message")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                      errors.message ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Cuéntanos en qué podemos ayudarte..."
                  ></textarea>
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-lg font-semibold text-lg transition-all shadow-md hover:shadow-lg ${
                    isSubmitting
                      ? "bg-teal-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
                  } text-white`}
                >
                  {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
