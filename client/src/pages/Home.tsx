import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APP_LOGO } from "@/const";
import { BarChart3, Database, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-500/25 via-indigo-500/15 to-purple-500/10 blur-[120px] dark:from-blue-500/20 dark:via-indigo-600/10 dark:to-purple-700/15" />
        <div className="absolute right-[-120px] bottom-[-160px] h-[360px] w-[360px] rounded-full bg-gradient-to-br from-cyan-400/25 via-teal-400/10 to-transparent blur-3xl dark:from-cyan-400/15 dark:via-teal-400/10 dark:to-transparent" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <img
              src={APP_LOGO}
              alt="Logotipo da empresa"
              className="h-12 w-auto rounded-lg bg-background/80 p-1 shadow-sm ring-1 ring-border/60"
            />
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
                Painel
              </span>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Dashboard Imagens 2026
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Gerencie cronogramas, laboratorios e infraestrutura com uma experiencia moderna e responsiva.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated && user && (
              <div className="hidden flex-col items-end text-xs text-muted-foreground/80 sm:flex">
                <span className="text-sm font-medium text-foreground">
                  Olá, {user.name || "Usuário"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="mt-1 h-8 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  Sair
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8">
        {isAuthenticated ? (
          <>
            <section className="overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-8 shadow-xl shadow-primary/5 backdrop-blur">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-3xl space-y-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    visão geral
                  </span>
                  <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Bem-vindo ao Dashboard!
                  </h2>
                  <p className="text-base text-muted-foreground">
                    Acompanhe o cronograma de implementação das unidades
                    acadêmicas e mantenha o controle sobre laboratórios,
                    softwares e estações em um só lugar.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    className="rounded-full px-5 shadow-lg shadow-primary/20"
                    onClick={() => setLocation("/data-management")}
                  >
                    Gerenciar dados
                  </Button>
                </div>
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="group border border-border/60 bg-card/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Cronograma</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    Visualize e mantenha atualizado o cronograma de
                    implementação de todas as unidades acadêmicas.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full px-4"
                    onClick={e => {
                      e.stopPropagation();
                      setLocation("/dashboard?tab=units");
                    }}
                  >
                    Ver cronograma
                  </Button>
                </CardContent>
              </Card>

              <Card className="group border border-border/60 bg-card/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20">
                    <Database className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Laboratórios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    Gerencie dados críticos de laboratórios, softwares, contatos
                    e recursos disponíveis.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full px-4"
                    onClick={e => {
                      e.stopPropagation();
                      setLocation("/dashboard?tab=labs");
                    }}
                  >
                    Ver laboratórios
                  </Button>
                </CardContent>
              </Card>

              <Card className="group border border-border/60 bg-card/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Implementação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    Acompanhe o avanço da implantação e mantenha a equipe
                    alinhada com as próximas etapas.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full px-4"
                    onClick={e => {
                      e.stopPropagation();
                      setLocation("/dashboard?tab=implementation");
                    }}
                  >
                    Ver status
                  </Button>
                </CardContent>
              </Card>
            </section>

            <section className="rounded-3xl border border-border/60 bg-card/70 p-8 shadow-lg shadow-primary/5">
              <h3 className="text-2xl font-semibold tracking-tight">
                Funcionalidades Principais
              </h3>
              <div className="mt-6 grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground/80">
                    Importação &amp; Exportação
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Importar dados a partir de Excel, JSON e CSV</li>
                    <li>• Exportar dados em múltiplos formatos</li>
                    <li>• Gerar relatórios consolidados</li>
                    <li>• Manter backups seguros</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground/80">
                    Gestão de Operações
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• CRUD completo de unidades e laboratórios</li>
                    <li>• Rastreamento de softwares e licenças</li>
                    <li>• Histórico de alterações e auditoria</li>
                    <li>• Visão integrada de estações e contatos</li>
                  </ul>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="mx-auto max-w-2xl rounded-3xl border border-border/70 bg-card/80 p-10 text-center shadow-xl shadow-primary/5">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Bem-vindo ao Dashboard Imagens 2026
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Faça login para acessar o painel completo e gerenciar cronogramas,
              laboratórios e dados da sua instituição.
            </p>
            <Button
              size="lg"
              className="mt-6 rounded-full px-8 shadow-lg shadow-primary/20"
              onClick={() => setLocation("/login")}
            >
              Fazer login
            </Button>
          </section>
        )}
      </main>

      <footer className="border-t border-border/60 bg-background/80">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          <p>© 2025 Dashboard Imagens 2026. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Botão de tema fixo no canto inferior direito */}
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle />
      </div>
    </div>
  );
}
