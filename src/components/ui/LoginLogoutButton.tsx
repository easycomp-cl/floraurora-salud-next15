"use client";
import React from "react";
import { Button } from "./button";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/lib/hooks/useAuthState";

export default function LoginLogoutButton() {
  const { user, signOut } = useAuthState();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    // El hook se encargará de actualizar el estado automáticamente
  };

  if (user) {
    return <Button onClick={handleSignOut}>Log out</Button>;
  }

  return (
    <Button
      variant="outline"
      onClick={() => {
        router.push("/login");
      }}
    >
      Login
    </Button>
  );
}
