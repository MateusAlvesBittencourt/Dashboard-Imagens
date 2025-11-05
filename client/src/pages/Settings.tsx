import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageHero } from "@/components/PageHero";
import { APP_LOGO } from "@/const";
import { Loader2 } from "lucide-react";

type UnitSummary = {
  id: number;
  name: string;
  emailCronograma?: string | null;
} & Record<string, unknown>;

export default function Settings() {
  const { user } = useAuth();
  const { data: units, isLoading: unitsLoading } = trpc.academicUnits.list.useQuery();
  const unitList = (units ?? []) as UnitSummary[];
  const hasUnits = unitList.length > 0;

  if (!user) {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <PageHero
          title="Autenticacao necessaria"
          description="Faca login para acessar as configuracoes e utilitarios do sistema."
          leading={
            <div className="flex items-center gap-3">
              <img
                src={APP_LOGO}
                alt="Logotipo da empresa"
                className="h-10 w-auto rounded-lg bg-background/80 p-1 shadow-sm ring-1 ring-border/60"
              />
              <BackButton className="h-9 w-fit rounded-full border-border/70 px-4 text-sm font-medium tracking-tight hover:border-primary/50 hover:bg-primary/10" />
            </div>
          }
          actions={
            <Button
              size="sm"
              className="rounded-full px-5"
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              Ir para login
            </Button>
          }
          containerClassName="min-h-[420px]"
        />
      </div>
    );
  }

  const heroMeta = (
    <>
      <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 shadow-sm">
        Usuario: <span className="font-semibold text-foreground">{user.name || user.email}</span>
      </span>
      <span className="hidden sm:inline text-muted-foreground/70">-</span>
      <span>Total de unidades: {unitList.length}</span>
    </>
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <PageHero
        badge="Configuracoes"
        title="Configuracoes gerais"
        description="Ajuste utilitarios do sistema e acompanhe o estado das unidades academicas cadastradas."
        leading={
          <div className="flex items-center gap-3">
            <img
              src={APP_LOGO}
              alt="Logotipo da empresa"
              className="h-10 w-auto rounded-lg bg-background/80 p-1 shadow-sm ring-1 ring-border/60"
            />
            <BackButton className="h-9 rounded-full border-border/70 px-4 text-sm font-medium tracking-tight hover:border-primary/50 hover:bg-primary/10" />
          </div>
        }
        meta={heroMeta}
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Card className="border border-border/50 bg-background/80 shadow-sm">
          <CardHeader>
            <CardTitle>Utilitarios</CardTitle>
            <CardDescription>Funcoes auxiliares e informacoes das unidades</CardDescription>
          </CardHeader>
          <CardContent>
            {unitsLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="ml-3 text-sm">Carregando unidades...</span>
              </div>
            ) : hasUnits ? (
              <div className="grid gap-4">
                {unitList.map(unit => (
                  <div
                    key={unit.id}
                    className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur transition hover:border-primary/40 hover:shadow-lg"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{unit.name}</h3>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Unidade academica</p>
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full border border-border/60 px-3 py-1">ID {unit.id}</span>
                        {unit.emailCronograma && (
                          <span className="rounded-full border border-border/60 px-3 py-1">
                            Cronograma: {unit.emailCronograma}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Consulte o cronograma e use o gerenciamento de dados para atualizar informacoes desta unidade.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => {
                          window.location.href = "/dashboard?tab=units";
                        }}
                      >
                        Abrir cronograma
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          window.location.href = "/data-management";
                        }}
                      >
                        Gerenciar dados
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-12 text-center text-muted-foreground">
                <p className="text-base font-medium text-foreground">Nenhuma unidade cadastrada</p>
                <p className="max-w-md text-sm">
                  Importe dados pela tela de gerenciamento ou crie unidades diretamente no dashboard.
                </p>
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    window.location.href = "/data-management";
                  }}
                >
                  Ir para gerenciamento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Botão de tema fixo no canto inferior direito */}
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle />
      </div>
    </div>
  );
}
