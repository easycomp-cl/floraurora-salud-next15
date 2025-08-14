import LoginButton from "@/components/ui/LoginLogoutButton";
import UserGreetText from "@/components/ui/UserGreetText";
import AuthDebug from "@/components/ui/AuthDebug";
import SignInWithGoogleButton from "@/components/google/SignInWithGoogleButton";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Header con saludo */}
      <div className="text-center">
        <UserGreetText />
      </div>

      {/* Contenido principal */}
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">
          Bienvenido a FlorAurora Salud
        </h1>
        <p className="text-xl text-gray-600">
          Plataforma de videollamadas para sesiones de psicología
        </p>

        {/* Botón de Google */}
        <div className="pt-4">
          <SignInWithGoogleButton />
        </div>

        {/* Botón de login/logout */}
        <div className="pt-4">
          <LoginButton />
        </div>
      </div>

      {/* Componente de depuración */}
      <AuthDebug />
    </div>
  );
}
