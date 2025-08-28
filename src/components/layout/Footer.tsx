const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FA</span>
              </div>
              <span className="text-xl font-bold">FlorAurora Salud</span>
            </div>
            <p className="text-gray-300 max-w-md">
              Plataforma de videollamadas para sesiones de psicología.
              Conectamos pacientes con profesionales de la salud mental de
              manera segura y confidencial.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <a href="/main" className="text-gray-300 hover:text-white">
                  Inicio
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-300 hover:text-white">
                  Acerca de
                </a>
              </li>
              <li>
                <a href="/contact" className="text-gray-300 hover:text-white">
                  Contacto
                </a>
              </li>
              <li>
                <a
                  href="/auth/signup-pro"
                  className="text-gray-300 hover:text-white"
                >
                  Trabaja con nosotros
                </a>
              </li>
            </ul>
          </div>

          {/* Información de contacto */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contacto</h3>
            <ul className="space-y-2 text-gray-300">
              <li>info@floraurora.com</li>
              <li>+1 (555) 123-4567</li>
              <li>Lun - Vie: 9:00 - 18:00</li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 FlorAurora Salud. Todos los derechos reservados.
            </p>
            <p className="text-gray-400 text-sm mt-1">Powered by EasyComp</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="/privacy"
                className="text-gray-400 hover:text-white text-sm"
              >
                Privacidad
              </a>
              <a
                href="/terms"
                className="text-gray-400 hover:text-white text-sm"
              >
                Términos
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
