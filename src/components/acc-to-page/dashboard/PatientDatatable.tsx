import { appointmentsData } from "@/app/dashboard/dashboardData";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';

type Appointment = (typeof appointmentsData)[0];

export default function PatientDatatable() {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);

  const columnHelper = createColumnHelper<Appointment>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Id',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('servicio', {
        header: 'Servicio',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('profesional', {
        header: 'Profesional',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('fecha', {
        header: 'Fecha',
        cell: info => new Date(info.getValue()).toLocaleDateString('es-CL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
      }),
      columnHelper.accessor('hora', {
        header: 'Hora',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('duracion', {
        header: 'Duración',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('monto', {
        header: 'Monto',
        cell: info => `$${info.getValue().toLocaleString('es-CL')}`,
      }),
      columnHelper.accessor('url', {
        header: 'URL',
        cell: info => info.getValue() ? (
          <a
            href={info.getValue()}
            className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors duration-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Unirse
          </a>
        ) : null,
      }),
      columnHelper.accessor('boleta', {
        header: 'Boleta',
        cell: info => info.getValue() ? 
          <span className="font-medium">{info.getValue()}</span> : 
          <span className="text-gray-400">-</span>,
      }),
      columnHelper.accessor('estado', {
        header: 'Estado',
        cell: info => (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            info.getValue() === 'Confirmada' ? 'bg-green-100 text-green-700 ring-green-600/20' :
            info.getValue() === 'Pendiente' ? 'bg-yellow-100 text-yellow-700 ring-yellow-600/20' :
            info.getValue() === 'Cancelada' ? 'bg-red-100 text-red-700 ring-red-600/20' :
            info.getValue() === 'Completada' ? 'bg-blue-100 text-blue-700 ring-blue-600/20' :
            'bg-gray-100 text-gray-700 ring-gray-600/20'
          }`}>
            {info.getValue()}
          </span>
        ),
      }),
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: appointmentsData,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Filtro global */}
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Buscar en todas las columnas..."
        />
        <div className="space-x-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {table.getState().pagination.pageIndex + 1} de{' '}
            {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-gradient-to-r from-blue-600 to-blue-400 text-white">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 border-b border-blue-200 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50 transition-colors duration-200 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selector de tamaño de página */}
      <div className="flex items-center justify-end space-x-2">
        <span className="text-sm text-gray-600">Filas por página:</span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value));
          }}
          className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {[1, 2, 3, 4, 5,10].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
