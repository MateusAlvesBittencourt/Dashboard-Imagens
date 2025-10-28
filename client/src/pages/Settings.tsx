import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import BackButton from "@/components/BackButton";

export default function Settings() {
  const { user } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);

  const { data: units } = trpc.academicUnits.list.useQuery();

  // Integrações de e-mail removidas

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-slate-600">Você precisa estar autenticado para acessar as configurações.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <BackButton className="mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Configurações</h1>
          <p className="text-slate-600">Preferências e utilitários do sistema</p>
        </div>
        {/* Integração de email removida */}

        {/* Send Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Utilitários</CardTitle>
            <CardDescription>Funções auxiliares para o sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {units && units.length > 0 ? (
              <div className="space-y-4">
                {units.map((unit) => (
                  <div key={unit.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-slate-900">{unit.name}</h3>
                        <p className="text-sm text-slate-600">ID: {unit.id}</p>
                      </div>
                    </div>

                    {/* Ações relacionadas a email removidas */}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-600">Nenhuma unidade acadêmica cadastrada</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
