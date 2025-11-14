"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AdminLogEntry } from "@/lib/services/auditService";

const formatDateTime = (value: string) =>
  format(new Date(value), "dd MMM yyyy HH:mm:ss", { locale: es });

const defaultRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
};

export default function AuditLogsPanel() {
  const [{ from, to }, setRange] = useState(defaultRange);
  const [actorId, setActorId] = useState("");
  const [entity, setEntity] = useState("");
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("from", `${from}T00:00:00Z`);
    params.set("to", `${to}T23:59:59Z`);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (actorId) params.set("actorId", actorId);
    if (entity) params.set("entity", entity);
    return params.toString();
  }, [from, to, page, pageSize, actorId, entity]);

  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/logs?${queryString}`, { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudieron obtener los registros");
      }
      const payload = await response.json();
      setLogs(payload.data ?? []);
      setTotal(payload.total ?? 0);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al cargar los registros.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          Auditoría de acciones administrativas
        </CardTitle>
        <CardDescription>
          Revisa quién hizo qué cambios en la plataforma y en qué momento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="from">Desde</Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(event) => {
                  setRange((prev) => ({ ...prev, from: event.target.value }));
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to">Hasta</Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={(event) => {
                  setRange((prev) => ({ ...prev, to: event.target.value }));
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="actor">ID actor (opcional)</Label>
              <Input
                id="actor"
                placeholder="ID numérico"
                value={actorId}
                onChange={(event) => {
                  setActorId(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="entity">Entidad (opcional)</Label>
              <Input
                id="entity"
                placeholder="users, services, etc."
                value={entity}
                onChange={(event) => {
                  setEntity(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="outline" onClick={loadLogs} disabled={isLoading}>
              Aplicar filtros
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 bg-white text-xs md:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Fecha</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Acción</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Entidad</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Actor</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Metadatos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Cargando registros...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    No se encontraron registros para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2">{formatDateTime(log.created_at)}</td>
                    <td className="px-3 py-2">{log.action}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{log.entity}</span>
                        {log.entity_id && (
                          <span className="text-xs text-gray-500">ID: {log.entity_id}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {log.actor_id ? `#${log.actor_id}` : "Sistema"}
                      {log.ip_address && (
                        <span className="ml-1 text-xs text-gray-500">({log.ip_address})</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <pre className="max-w-[320px] whitespace-pre-wrap break-all text-gray-600">
                        {log.metadata ? JSON.stringify(log.metadata, null, 2) : "—"}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 text-sm text-gray-600 md:flex-row">
          <span>
            Mostrando {logs.length} registros de {total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1 || isLoading}
            >
              Anterior
            </Button>
            <span>
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages || isLoading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

