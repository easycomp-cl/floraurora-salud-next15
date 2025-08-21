import LoginButton from "@/components/ui/LoginLogoutButton";
import UserGreetText from "@/components/ui/UserGreetText";
import AuthDebug from "@/components/ui/AuthDebug";
import SignInWithGoogleButton from "@/components/google/SignInWithGoogleButton";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          FlorAurora Salud
        </h1>
        <p className="text-lg text-gray-600">
          Página principal - Lista para desarrollar
        </p>
      </div>
    </div>
  );
}
