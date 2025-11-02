import React, { Suspense } from "react";
import { LoginForm } from "@/components/acc-to-page/login/LoginForm";

const LoginPage = () => {
  return (
    <div className="flex h-svh items-center">
      <Suspense fallback={<div>Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
};

export default LoginPage;
