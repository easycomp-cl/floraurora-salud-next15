export default function TestPage() {
  return (
    <div className="text-center py-8">
      <h1 className="text-2xl font-bold text-green-600 mb-4">
        ✅ Ruta /main funcionando correctamente!
      </h1>
      <p className="text-gray-600">
        Esta es una página de prueba para verificar que la ruta /main esté
        funcionando.
      </p>
      <div className="mt-4">
        <a href="/main" className="text-blue-600 hover:text-blue-800 underline">
          Volver a /main
        </a>
      </div>
    </div>
  );
}
