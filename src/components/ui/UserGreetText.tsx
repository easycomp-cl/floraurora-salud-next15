"use client";
import { useAuthState } from "@/lib/hooks/useAuthState";
import React from "react";

export default function UserGreetText() {
  const { user, isLoading } = useAuthState();

  console.log("User data: ", user);
  console.log("User metadata: ", user?.user_metadata);

  // Función para obtener el nombre del usuario
  const getUserDisplayName = () => {
    if (!user) return "user";

    // Para usuarios de Google OAuth
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }

    // Para usuarios de Google OAuth (nombre y apellido por separado)
    if (user.user_metadata?.name) {
      return user.user_metadata.name;
    }

    // Para usuarios registrados con email/password
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }

    // Fallback al email
    return user.email || "user";
  };

  if (isLoading) {
    return (
      <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
        Loading...
      </p>
    );
  }

  if (user !== null) {
    return (
      <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
        hello&nbsp;
        <code className="font-mono font-bold">{getUserDisplayName()}!</code>
      </p>
    );
  }
  return (
    <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
      Get started editing&nbsp;
      <code className="font-mono font-bold">app/page.tsx</code>
    </p>
  );
}
