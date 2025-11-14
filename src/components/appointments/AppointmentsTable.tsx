import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import type {
  AppointmentWithUsers,
  BasicUserInfo,
} from "@/lib/services/appointmentService";

type AppointmentsTableMode = "patient" | "professional" | "admin";

type AppointmentRow = AppointmentWithUsers & {
  formattedDate: string;
  formattedTime: string;
};

interface AppointmentsTableProps {
  data: AppointmentWithUsers[];
  mode: AppointmentsTableMode;
  isLoading?: boolean;
  emptyMessage?: string;
}

const columnHelper = createColumnHelper<AppointmentRow>();

const buildFullName = (user: BasicUserInfo | null) => {
  if (!user) return "No registrado";
  const nameParts = [user.name, user.last_name].filter(Boolean);
  return nameParts.length ? nameParts.join(" ") : user.email ?? "Sin datos";
};

const formatPhone = (phone?: string | null) => {
  if (!phone) return "Sin teléfono";
  return phone;
};

const formatCurrency = (value?: number | null) => {
  if (typeof value !== "number") {
    return "Sin monto";
  }

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const statusColorClasses = (status?: string | null) => {
  switch ((status ?? "").toLowerCase()) {
    case "confirmed":
    case "confirmada":
      return "bg-green-100 text-green-700 ring-green-600/20";
    case "pending_confirmation":
      return "bg-amber-100 text-amber-700 ring-amber-600/20";
    case "pending":
    case "pendiente":
      return "bg-yellow-100 text-yellow-700 ring-yellow-600/20";
    case "cancelled":
    case "cancelada":
      return "bg-red-100 text-red-700 ring-red-600/20";
    case "completed":
    case "completada":
      return "bg-blue-100 text-blue-700 ring-blue-600/20";
    default:
      return "bg-gray-100 text-gray-700 ring-gray-600/20";
  }
};

const statusLabel = (status?: string | null) => {
  if (!status) return "Sin estado";

  const normalized = status.toLowerCase();
  switch (normalized) {
    case "pending_confirmation":
      return "Pendiente de confirmación";
    case "confirmed":
      return "Confirmada";
    case "pending":
      return "Pendiente";
    case "cancelled":
      return "Cancelada";
    case "completed":
      return "Completada";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export default function AppointmentsTable({
  data,
  mode,
  isLoading = false,
  emptyMessage,
}: AppointmentsTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const tableData = useMemo<AppointmentRow[]>(() => {
    return (data ?? []).map((item) => {
      const scheduledDate = item.scheduled_at ? new Date(item.scheduled_at) : null;
      return {
        ...item,
        formattedDate: scheduledDate
          ? scheduledDate.toLocaleDateString("es-CL", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "Sin fecha",
        formattedTime: scheduledDate
          ? scheduledDate.toLocaleTimeString("es-CL", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Sin hora",
      };
    });
  }, [data]);

  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseColumns: any[] = [
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("formattedDate", {
        header: "Fecha",
      }),
      columnHelper.accessor("formattedTime", {
        header: "Hora",
      }),
    ];

    if (mode !== "patient") {
      baseColumns.push(
        columnHelper.display({
          id: "patient",
          header: "Paciente",
          cell: ({ row }) => {
            const patient = row.original.patient;
            return (
              <div>
                <p className="font-medium text-gray-900">
                  {buildFullName(patient)}
                </p>
                <p className="text-xs text-gray-500">
                  {patient?.email ?? "Sin correo"}
                </p>
                <p className="text-xs text-gray-400">
                  {formatPhone(patient?.phone_number)}
                </p>
              </div>
            );
          },
        })
      );
    }

    if (mode !== "professional") {
      baseColumns.push(
        columnHelper.display({
          id: "professional",
          header: "Profesional",
          cell: ({ row }) => {
            const professional = row.original.professional;
            return (
              <div>
                <p className="font-medium text-gray-900">
                  {buildFullName(professional)}
                </p>
                <p className="text-xs text-gray-500">
                  {professional?.email ?? "Sin correo"}
                </p>
                <p className="text-xs text-gray-400">
                  {formatPhone(professional?.phone_number)}
                </p>
              </div>
            );
          },
        })
      );
    }

    baseColumns.push(
      columnHelper.accessor("service", {
        header: "Servicio",
        cell: (info) => info.getValue() ?? "Sin servicio",
      })
    );

    baseColumns.push(
      columnHelper.accessor("amount", {
        header: "Monto",
        cell: ({ getValue }) => formatCurrency(getValue<number | null>()),
      })
    );

    baseColumns.push(
      columnHelper.accessor("area", {
        header: "Área",
        cell: (info) => info.getValue() ?? "Sin área",
      })
    );

    baseColumns.push(
      columnHelper.accessor("duration_minutes", {
        header: "Duración",
        cell: (info) => {
          const value = info.getValue();
          return value ? `${value} min` : "No definida";
        },
      })
    );

    baseColumns.push(
      columnHelper.accessor("status", {
        header: "Estado",
        cell: ({ getValue }) => {
          const status = getValue<string | null>();
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColorClasses(
                status
              )}`}
            >
              {statusLabel(status)}
            </span>
          );
        },
      })
    );

    baseColumns.push(
      columnHelper.accessor("payment_status", {
        header: "Pago",
        cell: ({ getValue }) => {
          const payment = getValue<string | null>();
          return payment
            ? payment.charAt(0).toUpperCase() + payment.slice(1)
            : "Sin estado";
        },
      })
    );

    baseColumns.push(
      columnHelper.accessor("note", {
        header: "Notas",
        cell: ({ getValue }) => {
          const note = getValue<string | null>();
          return note ? (
            <span className="line-clamp-3 text-sm text-gray-600">{note}</span>
          ) : (
            <span className="text-sm text-gray-400">Sin notas</span>
          );
        },
      })
    );

    baseColumns.push(
      columnHelper.display({
        id: "meeting_url",
        header: "URL",
        cell: ({ row }) => {
          const url = row.original.meeting_url;
          if (!url) {
            return <span className="text-sm text-gray-400">Sin enlace</span>;
          }

          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors duration-200"
            >
              Unirse
            </a>
          );
        },
      })
    );

    baseColumns.push(
      columnHelper.display({
        id: "invoice_url",
        header: "Boleta",
        cell: ({ row }) => {
          const url = row.original.invoice_url;
          if (!url) {
            return <span className="text-sm text-gray-400">Sin archivo</span>;
          }

          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors duration-200"
            >
              Descargar
            </a>
          );
        },
      })
    );

    return baseColumns as ColumnDef<AppointmentRow>[];
  }, [mode]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Cargando citas...</p>
        </div>
      </div>
    );
  }

  if (!tableData.length) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-4">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {emptyMessage ?? "No hay citas registradas"}
        </h3>
        <p className="text-sm text-gray-500">
          En cuanto se agenden nuevas citas, aparecerán en este listado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Buscar en todas las columnas..."
        />
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>
            Mostrando {table.getRowModel().rows.length} de {tableData.length} citas
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-gradient-to-r from-blue-600 to-blue-400 text-white"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 border-b border-blue-200 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50 transition-colors duration-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 align-top"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount() || 1}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Filas por página:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[5, 10, 25, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}


