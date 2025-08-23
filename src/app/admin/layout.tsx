import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Admin Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/admin" className="text-2xl font-bold text-red-600">
                  Admin Panel
                </a>
              </div>

              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-8">
                  <a
                    href="/admin"
                    className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/admin/users"
                    className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium"
                  >
                    Usuarios
                  </a>
                  <a
                    href="/admin/professionals"
                    className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium"
                  >
                    Profesionales
                  </a>
                  <a
                    href="/admin/reports"
                    className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium"
                  >
                    Reportes
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-gray-700 text-sm">Administrador</span>
                <a
                  href="/dashboard"
                  className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium"
                >
                  Volver al Dashboard
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
