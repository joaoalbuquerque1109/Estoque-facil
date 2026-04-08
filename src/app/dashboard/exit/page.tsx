"use client";

import { useAuth } from "@/contexts/AuthContext";
import ConsumptionRequestForm from "./components/ConsumptionRequestForm";
import ExitApprovalsTab from "./components/ExitApprovalsTab";

export default function ExitPage() {
  const { user, userRole } = useAuth();
  const isAdmin = userRole === "Admin";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Requisicao de Consumo</h1>
        <p className="text-muted-foreground">
          O usuario envia a solicitacao, o admin aprova e a confirmacao da saida acontece apenas ao gerar o termo.
        </p>
      </div>

      <ConsumptionRequestForm />

      {isAdmin ? <ExitApprovalsTab adminEmail={user?.email || "admin@local"} /> : null}
    </div>
  );
}
