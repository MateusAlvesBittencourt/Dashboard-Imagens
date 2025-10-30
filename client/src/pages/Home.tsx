import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Database, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Imagens 2026</h1>
            <p className="text-sm text-slate-600">Gerenciamento de Laboratórios e Cronogramas</p>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated && user && (
              <>
                <span className="text-sm text-slate-600">Bem-vindo, {user.name || "Usuário"}</span>
                <Button onClick={logout} variant="outline" size="sm">
                  Sair
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {isAuthenticated ? (
          <>
            {/* Welcome Section */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Bem-vindo ao Dashboard!</h2>
              <p className="text-lg text-slate-600 mb-6">
                Aqui você pode gerenciar o cronograma de implementação de imagens das unidades acadêmicas e os laboratórios da instituição.
              </p>

              {/* Primary CTA removido a pedido: botão 'Acessar Dashboard' */}
            </div>

            {/* Navigation Links */}
            <div className="mb-8 flex gap-4 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation("/data-management")}
              >
                Gerenciar Dados
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLocation("/settings")}
              >
                Configurações
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/dashboard?tab=units')}>
                <CardHeader>
                  <BarChart3 className="w-8 h-8 text-indigo-600 mb-2" />
                  <CardTitle className="text-lg">Cronograma</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm">
                    Visualize e edite o cronograma de implementação de todas as unidades acadêmicas.
                  </p>
                  <div className="mt-4">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setLocation('/dashboard?tab=units'); }}>
                      Ver Cronograma
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/dashboard?tab=labs')}>
                <CardHeader>
                  <Database className="w-8 h-8 text-blue-600 mb-2" />
                  <CardTitle className="text-lg">Laboratórios</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm">
                    Gerencie informações de laboratórios, softwares e configurações.
                  </p>
                  <div className="mt-4">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setLocation('/dashboard?tab=labs'); }}>
                      Ver Laboratórios
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Implementação */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/dashboard?tab=implementation')}>
                <CardHeader>
                  <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
                  <CardTitle className="text-lg">Implementação</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm">
                    Acompanhe e gerencie a fase de implantação do cronograma das unidades.
                  </p>
                  <div className="mt-4">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setLocation('/dashboard?tab=implementation'); }}>
                      Ir para Implementação
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Section */}
            <div className="mt-12 bg-white rounded-lg shadow-md p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Funcionalidades Principais</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Importação & Exportação</h4>
                  <ul className="space-y-2 text-slate-600 text-sm">
                    <li>✓ Importar dados de Excel, JSON e CSV</li>
                    <li>✓ Exportar dados em múltiplos formatos</li>
                    <li>✓ Gerar relatórios completos</li>
                    <li>✓ Backup automático de dados</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Gerenciamento</h4>
                  <ul className="space-y-2 text-slate-600 text-sm">
                    <li>✓ CRUD completo de unidades e laboratórios</li>
                    <li>✓ Rastreamento de softwares instalados</li>
                    <li>✓ Histórico de alterações</li>
                    {/* Notificações por email removidas */}
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Not Authenticated */}
            <div className="text-center py-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Bem-vindo ao Dashboard Imagens 2026</h2>
              <p className="text-lg text-slate-600 mb-8">
                Faça login para acessar o dashboard e gerenciar seus dados.
              </p>
              <Button
                size="lg"
                onClick={() => setLocation('/login')}
                className="gap-2"
              >
                Fazer Login
              </Button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p>&copy; 2025 Dashboard Imagens 2026. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
