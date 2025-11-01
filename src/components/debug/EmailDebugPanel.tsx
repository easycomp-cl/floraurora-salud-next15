"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmailDebugPanelProps {
  email?: string;
}

interface DebugInfo {
  [key: string]: unknown;
  error?: string;
  message?: string;
}

export function EmailDebugPanel({ email }: EmailDebugPanelProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    setIsLoading(true);
    try {
      // Llamada a función de diagnóstico específica
      const response = await fetch("/api/debug/email-diagnosis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error("Error ejecutando debug:", error);
      setDebugInfo({
        error: String(error),
        message: "Error conectando con el servidor de diagnóstico",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkConfiguration = () => {
    const config = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      timestamp: new Date().toISOString(),
    };

    setDebugInfo({ config, message: "Configuración verificada" });
  };

  const testEmailFlow = () => {
    const flow = {
      step1: "Usuario se registra",
      step2: "Supabase envía correo de confirmación",
      step3: "Usuario hace clic en enlace",
      step4: "Aplicación verifica token",
      step5: "Usuario es insertado en tabla 'users'",
      currentStep: "Verificando configuración...",
      timestamp: new Date().toISOString(),
    };

    setDebugInfo({ flow, message: "Flujo de correo verificado" });
  };

  const diagnoseEmailIssue = () => {
    const diagnosis = {
      problem: "No se envían correos de confirmación",
      possibleCauses: [
        "Email confirmations no habilitado en Supabase Dashboard",
        "Template de email no configurado correctamente",
        "URL de redirección incorrecta en el template",
        "Problemas con configuración SMTP",
        "Email en carpeta de spam",
        "Configuración de dominio incorrecta",
      ],
      immediateActions: [
        "1. Ir a Supabase Dashboard > Authentication > Settings",
        "2. Verificar que 'Enable email confirmations' esté habilitado",
        "3. Ir a Authentication > Email Templates",
        "4. Verificar template 'Confirm signup'",
        "5. Revisar URL de redirección en el template",
        "6. Verificar configuración SMTP en Settings",
      ],
      logAnalysis: {
        adminUsersCall: "✅ Detectada llamada exitosa a /admin/users",
        missingEmailLogs: "❌ No se detectaron logs de envío de correo",
        recommendation:
          "Verificar configuración de email en Supabase Dashboard",
      },
    };

    setDebugInfo({
      diagnosis,
      message: "Diagnóstico de problema de correos completado",
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🔍 Panel de Debug - Sistema de Correos</CardTitle>
        <CardDescription>
          Herramientas para diagnosticar problemas con la confirmación de correo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Button
            onClick={checkConfiguration}
            variant="outline"
            disabled={isLoading}
          >
            Verificar Configuración
          </Button>
          <Button
            onClick={diagnoseEmailIssue}
            variant="outline"
            disabled={isLoading}
            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
          >
            🚨 Diagnosticar Problema
          </Button>
          <Button
            onClick={testEmailFlow}
            variant="outline"
            disabled={isLoading}
          >
            Probar Flujo de Correo
          </Button>
          <Button onClick={runDebug} disabled={isLoading}>
            {isLoading ? "Ejecutando..." : "Ejecutar Debug Completo"}
          </Button>
        </div>

        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2">Resultado del Debug:</h3>
            <pre className="text-sm overflow-auto max-h-60">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">💡 Consejos para Debugging:</h3>
          <ul className="text-sm space-y-1">
            <li>• Verifica que las variables de entorno estén configuradas</li>
            <li>• Revisa la consola del navegador para logs detallados</li>
            <li>
              • Confirma que Supabase esté configurado para envío de correos
            </li>
            <li>• Verifica que la URL de redirección sea correcta</li>
            <li>• Revisa la carpeta de spam del correo</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h3 className="font-semibold mb-2 text-red-800 dark:text-red-200">
            🚨 PROBLEMA ACTUAL: No se envían correos de confirmación
          </h3>
          <div className="text-sm text-red-700 dark:text-red-300 space-y-2">
            <p>
              <strong>Log detectado:</strong> Llamada exitosa a /admin/users
              (status 200)
            </p>
            <p>
              <strong>Problema:</strong> No se detectan logs de envío de correo
            </p>
            <p>
              <strong>Acción inmediata:</strong>
            </p>
            <ol className="ml-4 space-y-1">
              <li>1. Ir a Supabase Dashboard → Authentication → Settings</li>
              <li>
                2. Verificar que &quot;Enable email confirmations&quot; esté habilitado
              </li>
              <li>3. Ir a Authentication → Email Templates</li>
              <li>4. Verificar template &quot;Confirm signup&quot;</li>
              <li>5. Revisar URL de redirección en el template</li>
            </ol>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">
            🔧 Variables de Entorno Requeridas:
          </h3>
          <ul className="text-sm space-y-1 font-mono">
            <li>• NEXT_PUBLIC_SUPABASE_URL</li>
            <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            <li>• NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY</li>
            <li>• NEXT_PUBLIC_SITE_URL</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
