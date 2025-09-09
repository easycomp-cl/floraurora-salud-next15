"use client";
import React, { useState } from "react";
import { supabase } from "@/utils/supabase/client";

interface TableInfo {
  name: string;
  columns: string[];
  rowCount: number;
  sampleData: Record<string, unknown>[];
}

const GoogleAuthDebugger: React.FC = () => {
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDebugLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const checkTableStructure = async () => {
    setIsLoading(true);
    setError(null);
    addLog("🔍 Verificando estructura de la base de datos...");

    try {
      // Verificar tabla 'users' (minúsculas)
      addLog('📋 Verificando tabla "users"...');
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .limit(5);

      if (usersError) {
        addLog(`⚠️ Error con tabla "users": ${usersError.message}`);

        // Verificar tabla 'Users' (mayúsculas)
        addLog('📋 Verificando tabla "Users"...');
        const { data: UsersData, error: UsersError } = await supabase
          .from("Users")
          .select("*")
          .limit(5);

        if (UsersError) {
          addLog(`❌ Error con tabla "Users": ${UsersError.message}`);
          setError("No se puede acceder a ninguna tabla de usuarios");
          return;
        }

        // Obtener información de la tabla Users
        addLog('📊 Obteniendo estructura de tabla "Users"...');

        if (UsersData && UsersData.length > 0) {
          const columns = Object.keys(UsersData[0]);
          setTableInfo({
            name: "Users",
            columns,
            rowCount: UsersData?.length || 0,
            sampleData: UsersData || [],
          });
          addLog(`✅ Tabla "Users" encontrada con ${columns.length} columnas`);
          addLog(`📊 Columnas: ${columns.join(", ")}`);
        } else {
          // La tabla existe pero está vacía, obtener estructura mediante metadatos
          addLog(
            '⚠️ Tabla "Users" está vacía, intentando obtener estructura...'
          );

          try {
            const { error: metaError } = await supabase
              .from("Users")
              .select("*")
              .limit(0); // No traer datos, solo estructura

            if (!metaError) {
              addLog("✅ Estructura obtenida mediante metadatos");
              // Definir estructura mínima esperada para usuarios
              const defaultColumns = [
                "id",
                "user_id",
                "email",
                "created_at",
                "name",
                "last_name",
                "role",
                "is_active",
              ];
              setTableInfo({
                name: "Users",
                columns: defaultColumns,
                rowCount: 0,
                sampleData: [],
              });
              addLog(
                `✅ Tabla "Users" configurada con estructura predeterminada`
              );
              addLog(`📊 Columnas esperadas: ${defaultColumns.join(", ")}`);
            } else {
              addLog(`❌ Error al obtener metadatos: ${metaError.message}`);
            }
          } catch (e) {
            addLog(`❌ Error inesperado: ${e}`);
          }
        }
      } else {
        // Obtener información de la tabla users
        addLog('📊 Obteniendo estructura de tabla "users"...');

        if (usersData && usersData.length > 0) {
          const columns = Object.keys(usersData[0]);
          setTableInfo({
            name: "users",
            columns,
            rowCount: usersData?.length || 0,
            sampleData: usersData || [],
          });
          addLog(`✅ Tabla "users" encontrada con ${columns.length} columnas`);
          addLog(`📊 Columnas: ${columns.join(", ")}`);
        } else {
          // La tabla existe pero está vacía, obtener estructura mediante inserción de prueba
          addLog(
            '⚠️ Tabla "users" está vacía, intentando obtener estructura...'
          );

          try {
            // Intentar obtener metadatos de la tabla
            const { error: metaError } = await supabase
              .from("users")
              .select("*")
              .limit(0); // No traer datos, solo estructura

            if (!metaError) {
              addLog("✅ Estructura obtenida mediante metadatos");
              // Definir estructura mínima esperada para usuarios
              const defaultColumns = [
                "id",
                "user_id",
                "email",
                "created_at",
                "name",
                "last_name",
                "role",
                "is_active",
              ];
              setTableInfo({
                name: "users",
                columns: defaultColumns,
                rowCount: 0,
                sampleData: [],
              });
              addLog(
                `✅ Tabla "users" configurada con estructura predeterminada`
              );
              addLog(`📊 Columnas esperadas: ${defaultColumns.join(", ")}`);
            } else {
              addLog(`❌ Error al obtener metadatos: ${metaError.message}`);
            }
          } catch (e) {
            addLog(`❌ Error inesperado: ${e}`);
          }
        }
      }

      // Verificar permisos RLS
      addLog("🔐 Verificando permisos RLS...");
      try {
        const { data: rlsData, error: rlsError } = await supabase.rpc(
          "get_table_info",
          { table_name: "users" }
        );

        if (!rlsError) {
          addLog(`✅ Información RLS obtenida: ${JSON.stringify(rlsData)}`);
        } else {
          addLog(`⚠️ No se pudo obtener información RLS: ${rlsError.message}`);
        }
      } catch (e) {
        addLog(`⚠️ Función RLS no disponible: ${e}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      addLog(`❌ Error inesperado: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const testInsert = async () => {
    if (!tableInfo) {
      setError("Primero verifica la estructura de la tabla");
      return;
    }

    setIsLoading(true);
    setError(null);
    addLog("🧪 Probando inserción de datos...");

    // Obtener el usuario autenticado actual
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      addLog(
        "❌ No hay usuario autenticado. Necesitas iniciar sesión primero."
      );
      setError(
        "No hay usuario autenticado. Inicia sesión para probar la inserción."
      );
      setIsLoading(false);
      return;
    }

    addLog(`✅ Usuario autenticado: ${user.email}`);

    const testData = {
      id: Date.now(), // Usar timestamp como ID numérico
      user_id: user.id, // UUID del usuario autenticado
      name: "Usuario Test",
      last_name: "Apellido Test",
      email: `test${Date.now()}@example.com`,
      role: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    addLog(`📝 Intentando insertar: ${JSON.stringify(testData)}`);

    try {
      const { data, error } = await supabase
        .from(tableInfo.name)
        .insert(testData)
        .select()
        .single();

      if (error) {
        addLog(`❌ Error en inserción: ${error.message}`);
        setError(`Error en inserción: ${error.message}`);
      } else {
        addLog(`✅ Inserción exitosa: ${JSON.stringify(data)}`);

        // Limpiar el dato de prueba
        addLog("🧹 Limpiando dato de prueba...");
        await supabase.from(tableInfo.name).delete().eq("id", testData.id);
        addLog("✅ Dato de prueba eliminado");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      addLog(`❌ Error inesperado en inserción: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        🐛 Debugger de Google Auth
      </h2>

      {/* Botones de acción */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={checkTableStructure}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Verificando..." : "🔍 Verificar Estructura"}
        </button>

        <button
          onClick={testInsert}
          disabled={isLoading || !tableInfo}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? "Probando..." : "🧪 Probar Inserción"}
        </button>

        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          🗑️ Limpiar Logs
        </button>
      </div>

      {/* Información de la tabla */}
      {tableInfo && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            📋 Información de la Tabla: {tableInfo.name}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Columnas:</strong> {tableInfo.columns.length}
              </p>
              <p>
                <strong>Filas:</strong> {tableInfo.rowCount}
              </p>
            </div>
            <div>
              <p>
                <strong>Columnas disponibles:</strong>
              </p>
              <code className="text-sm bg-gray-100 p-1 rounded">
                {tableInfo.columns.join(", ")}
              </code>
            </div>
          </div>

          {tableInfo.sampleData.length > 0 && (
            <div className="mt-4">
              <p>
                <strong>Datos de ejemplo:</strong>
              </p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(tableInfo.sampleData[0], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Logs de debug */}
      <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">📝 Logs de Debug</h3>
          <span className="text-xs text-gray-400">
            {debugLogs.length} entradas
          </span>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {debugLogs.length === 0 ? (
            <p className="text-gray-500">
              No hay logs aún. Haz clic en &quot;Verificar Estructura&quot; para
              comenzar.
            </p>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instrucciones */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          📋 Instrucciones de Uso
        </h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>
            Haz clic en &quot;Verificar Estructura&quot; para revisar la tabla
            de usuarios
          </li>
          <li>Revisa la información de la tabla y las columnas disponibles</li>
          <li>
            Usa &quot;Probar Inserción&quot; para verificar que puedes crear
            usuarios
          </li>
          <li>Revisa los logs para entender qué está pasando</li>
          <li>Si hay errores, comparte los logs con el equipo de desarrollo</li>
        </ol>
      </div>
    </div>
  );
};

export default GoogleAuthDebugger;
