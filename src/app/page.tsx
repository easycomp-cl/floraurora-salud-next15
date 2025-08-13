import LoginButton from "@/components/ui/LoginLogoutButton";
import UserGreetText from "@/components/ui/UserGreetText";
import AuthDebug from "@/components/ui/AuthDebug";

export default function Home() {
  return (
    <div>
      <UserGreetText />
      <LoginButton />
      <AuthDebug />
    </div>
  );
}
