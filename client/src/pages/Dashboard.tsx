import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Edit2, Trash2, Building2, Monitor, Search, CheckCircle2, XCircle, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isLocalMode } from "@/lib/env";
import BackButton from "@/components/BackButton";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APP_LOGO } from "@/const";
import { PageHero } from "@/components/PageHero";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Componente para Card de Laboratório
function LaboratoryCard({ lab, onSelect }: { lab: any; onSelect: (id: number) => void }) {
  const { data: machines } = trpc.machines.getByLaboratory.useQuery(
    { laboratoryId: lab.id },
    { enabled: true }
  );
  const machinesCount = machines?.length ?? 0;
  const formattedCount = machines?.filter((m: any) => m.formatted).length ?? 0;

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-1"
      onClick={() => onSelect(lab.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {lab.predio}
                {lab.bloco && ` • ${lab.bloco}`}
              </CardTitle>
              <CardDescription className="mt-1">Sala {lab.sala}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold text-foreground">{machinesCount}</span>
          </div>
          {machinesCount > 0 && (
            <div className="flex items-center gap-1">
              <Badge variant={formattedCount === machinesCount ? "default" : "secondary"} className="text-xs">
                {formattedCount}/{machinesCount} formatadas
              </Badge>
            </div>
          )}
        </div>
        {lab.nomeContato && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Contato: </span>
            {lab.nomeContato}
          </div>
        )}
        {lab.estacao && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Estação: </span>
            {lab.estacao}
          </div>
        )}
        <Button
          className="w-full mt-2"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(lab.id);
          }}
        >
          <Monitor className="mr-2 h-4 w-4" />
          Gerenciar Estações
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"units" | "labs" | "implementation">("units");
  // Ler ?tab=units|labs|implementation
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const tab = url.searchParams.get('tab');
      if (tab === 'units' || tab === 'labs' || tab === 'implementation') setActiveTab(tab);
    } catch {}
  }, []);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditUnitOpen, setIsEditUnitOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [softwareDialogLabId, setSoftwareDialogLabId] = useState<number | null>(null);
  const [softwareEditMode, setSoftwareEditMode] = useState(false);
  const [softwareEdits, setSoftwareEdits] = useState<Record<number, { softwareName?: string; version?: string | null; license?: string }>>({});
  const [softwareSearch, setSoftwareSearch] = useState("");
  const [softwareLicenseFilter, setSoftwareLicenseFilter] = useState<'Todos' | 'Gratuito' | 'Pago'>('Todos');
  const [softwareSort, setSoftwareSort] = useState<{ key: 'softwareName' | 'version' | 'license'; dir: 'asc' | 'desc' }>({ key: 'softwareName', dir: 'asc' });
  // Máquinas
  const [machineDialogLabId, setMachineDialogLabId] = useState<number | null>(null);
  const [machineEditMode, setMachineEditMode] = useState(false);
  const [machineEdits, setMachineEdits] = useState<Record<number, { hostname: string; patrimonio: string; formatted: boolean }>>({});
  const [machineSearch, setMachineSearch] = useState("");
  const [labSearch, setLabSearch] = useState("");

  // Queries
  const { data: units, isLoading: unitsLoading, refetch: refetchUnits } = trpc.academicUnits.list.useQuery();
  const { data: labs, isLoading: labsLoading, refetch: refetchLabs } = trpc.laboratories.list.useQuery();
  const { data: labSoftware } = trpc.software.getByLaboratory.useQuery(
    { laboratoryId: softwareDialogLabId ?? 0 },
    { enabled: softwareDialogLabId != null }
  );
  const { data: labMachines } = trpc.machines.getByLaboratory.useQuery(
    { laboratoryId: machineDialogLabId ?? 0 },
    { enabled: machineDialogLabId != null }
  );
  const activeSoftwareLab = useMemo(() => labs?.find((l: any) => l.id === softwareDialogLabId) ?? null, [labs, softwareDialogLabId]);
  const activeMachineLab = useMemo(() => labs?.find((l: any) => l.id === machineDialogLabId) ?? null, [labs, machineDialogLabId]);
  const displaySoftware = useMemo(() => {
    let items = (labSoftware as any[]) ?? [];
    // filtro de busca
    const q = softwareSearch.trim().toLowerCase();
    if (q) {
      items = items.filter(s => `${s.softwareName} ${s.version ?? ''} ${s.license}`.toLowerCase().includes(q));
    }
    // filtro de licença
    if (softwareLicenseFilter !== 'Todos') {
      items = items.filter(s => s.license === softwareLicenseFilter);
    }
    // ordenar
    const { key, dir } = softwareSort;
    items = [...items].sort((a, b) => {
      const av = (a[key] ?? '').toString().toLowerCase();
      const bv = (b[key] ?? '').toString().toLowerCase();
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [labSoftware, softwareSearch, softwareLicenseFilter, softwareSort]);
  const changeSort = (key: 'softwareName' | 'version' | 'license') => {
    setSoftwareSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };
  const utils = trpc.useUtils();
  const updateSoftwareMutation = trpc.software.update.useMutation({
    onSuccess: async () => {
      if (softwareDialogLabId != null) {
        await utils.software.getByLaboratory.invalidate({ laboratoryId: softwareDialogLabId });
      }
    },
  });
  const createSoftwareMutation = trpc.software.create.useMutation({
    onSuccess: async () => {
      if (softwareDialogLabId != null) {
        await utils.software.getByLaboratory.invalidate({ laboratoryId: softwareDialogLabId });
      }
    },
  });
  const deleteSoftwareMutation = trpc.software.delete.useMutation({
    onSuccess: async () => {
      if (softwareDialogLabId != null) {
        await utils.software.getByLaboratory.invalidate({ laboratoryId: softwareDialogLabId });
      }
    },
  });
  const updateMachineMutation = trpc.machines.update.useMutation({
    onSuccess: async () => {
      if (machineDialogLabId != null) {
        await utils.machines.getByLaboratory.invalidate({ laboratoryId: machineDialogLabId });
      }
    },
  });
  const createMachineMutation = trpc.machines.create.useMutation({
    onSuccess: async () => {
      if (machineDialogLabId != null) {
        await utils.machines.getByLaboratory.invalidate({ laboratoryId: machineDialogLabId });
      }
    },
  });
  const deleteMachineMutation = trpc.machines.delete.useMutation({
    onSuccess: async () => {
      if (machineDialogLabId != null) {
        await utils.machines.getByLaboratory.invalidate({ laboratoryId: machineDialogLabId });
      }
    },
  });

  // Mutations
  const updateUnitMutation = trpc.academicUnits.update.useMutation({
    onSuccess: () => {
      refetchUnits();
      setEditingId(null);
      toast.success('Unidade atualizada com sucesso');
    },
    onError: (error: any) => {
      console.error('[Update Unit] Erro:', error);
      toast.error(error?.message || 'Erro ao atualizar unidade.');
    }
  });

  const createUnitMutation = trpc.academicUnits.create.useMutation({
    onSuccess: () => {
      refetchUnits();
      setIsDialogOpen(false);
      toast.success('Unidade criada com sucesso');
    },
    onError: (error: any) => {
      console.error('[Create Unit] Erro:', error);
      toast.error(error?.message || 'Erro ao criar unidade. Verifique os dados e tente novamente.');
    }
  });

  const updateLabMutation = trpc.laboratories.update.useMutation({
    onSuccess: () => {
      refetchLabs();
      setEditingId(null);
      toast.success('Laboratório atualizado');
    },
    onError: (e: any) => {
      console.error(e);
      toast.error('Falha ao atualizar laboratório');
    }
  });

  const deleteLabMutation = trpc.laboratories.delete.useMutation({
    onSuccess: () => {
      refetchLabs();
      setEditingId(null);
      toast.success('Laboratório removido');
    },
    onError: (e: any) => {
      console.error(e);
      toast.error('Falha ao remover laboratório');
    }
  });

  const createLabMutation = trpc.laboratories.create.useMutation({
    onSuccess: () => {
      refetchLabs();
      setIsDialogOpen(false);
      toast.success('Laboratório criado com sucesso');
    },
    onError: (error: any) => {
      console.error('[Create Lab] Erro:', error);
      toast.error(error?.message || 'Erro ao criar laboratório. Verifique os dados e tente novamente.');
    }
  });

  const handleDateChange = (value: string) => {
    return value ? new Date(value) : undefined;
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatInputDate = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const heroMeta = (
    <>
      <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs shadow-sm">
        {labsLoading || unitsLoading ? "Sincronizando..." : "Atualizado"}
      </span>
      {user && (
        <>
          <span className="hidden sm:inline text-muted-foreground/70">&middot;</span>
          <span className="text-xs">
            Conectado como <span className="font-semibold text-foreground">{user.name}</span>
          </span>
        </>
      )}
    </>
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <PageHero
        badge="Dashboard"
        title="Dashboard Imagens 2026"
        description="Gerencie cronogramas, laboratórios, softwares e estações com uma visão integrada e moderna."
        leading={
          <div className="flex items-center gap-3">
            <img
              src={APP_LOGO}
              alt="Logotipo da empresa"
              className="h-10 w-auto rounded-lg bg-background/80 p-1 shadow-sm ring-1 ring-border/60"
            />
            <BackButton />
          </div>
        }
        meta={heroMeta}
      />

      {/* Dialog de Edição de Unidade */}
      <Dialog open={isEditUnitOpen} onOpenChange={(o)=>{ setIsEditUnitOpen(o); if(!o) setEditingId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Unidade</DialogTitle>
            <DialogDescription>Atualize as datas e confirme para salvar.</DialogDescription>
          </DialogHeader>
          {(() => {
            const unit = (units as any[] | undefined)?.find(u => u.id === editingId);
            if (!unit) return <div className="text-sm text-muted-foreground">Selecione uma unidade para editar.</div>;
            return (
              <form
                className="space-y-3"
                onSubmit={(e)=>{
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget as HTMLFormElement);
                  const data: any = {};
                  const map = ['emailCronograma','emailReforco','cienciaUnidade','listaSoftwares','criacao','testeDeploy','homologacao','aprovacao','implantacao'];
                  for (const key of map) {
                    const v = fd.get(key) as string | null;
                    data[key] = v ? new Date(v) : undefined;
                  }
                  updateUnitMutation.mutate({ id: unit.id, data });
                  setIsEditUnitOpen(false);
                  setEditingId(null);
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Email Cronograma</label>
                    <input type="date" name="emailCronograma" defaultValue={formatInputDate(unit.emailCronograma as any)} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Reforço</label>
                    <input type="date" name="emailReforco" defaultValue={formatInputDate(unit.emailReforco as any)} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Ciência</label>
                    <input type="date" name="cienciaUnidade" defaultValue={formatInputDate(unit.cienciaUnidade as any)} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Lista Softwares</label>
                    <input type="date" name="listaSoftwares" defaultValue={formatInputDate(unit.listaSoftwares as any)} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Criação</label>
                    <input type="date" name="criacao" defaultValue={formatInputDate(unit.criacao as any)} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Teste Deploy</label>
                    <input type="date" name="testeDeploy" defaultValue={formatInputDate(unit.testeDeploy as any)} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Homologação</label>
                    <input type="date" name="homologacao" defaultValue={formatInputDate(unit.homologacao as any)} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Aprovação</label>
                    <input type="date" name="aprovacao" defaultValue={formatInputDate(unit.aprovacao as any)} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Implantação</label>
                    <input type="date" name="implantacao" defaultValue={formatInputDate(unit.implantacao as any)} className="mt-1 w-full border rounded px-2 py-1 text-sm" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={()=>{ setIsEditUnitOpen(false); setEditingId(null); }}>Cancelar</Button>
                  <Button type="submit" size="sm">Salvar</Button>
                </div>
              </form>
            );
          })()}
        </DialogContent>
      </Dialog>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-12 sm:px-6 lg:px-8">
        {/* Seletor de abas */}
        <div className="flex items-center justify-center border-b border-border/80">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("units")}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium ${
                activeTab === "units"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground"
              }`}
            >
              Cronograma
            </button>
            <button
              onClick={() => setActiveTab("labs")}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium ${
                activeTab === "labs"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground"
              }`}
            >
              Laboratórios
            </button>
            <button
              onClick={() => setActiveTab("implementation")}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium ${
                activeTab === "implementation"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground"
              }`}
            >
              Implementação
            </button>
          </nav>
        </div>

        {/* Units Tab */}
        {activeTab === "units" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-foreground">Cronograma de Unidades</h2>
              {(user || isLocalMode()) && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus size={18} />
                      Nova Unidade
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Nova Unidade</DialogTitle>
                      <DialogDescription>Preencha os dados da nova unidade acadêmica</DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        createUnitMutation.mutate({
                          name: formData.get("name") as string,
                          emailCronograma: formData.get("emailCronograma") ? new Date(formData.get("emailCronograma") as string) : undefined,
                          emailReforco: formData.get("emailReforco") ? new Date(formData.get("emailReforco") as string) : undefined,
                          cienciaUnidade: formData.get("cienciaUnidade") ? new Date(formData.get("cienciaUnidade") as string) : undefined,
                          listaSoftwares: formData.get("listaSoftwares") ? new Date(formData.get("listaSoftwares") as string) : undefined,
                          criacao: formData.get("criacao") ? new Date(formData.get("criacao") as string) : undefined,
                          testeDeploy: formData.get("testeDeploy") ? new Date(formData.get("testeDeploy") as string) : undefined,
                          homologacao: formData.get("homologacao") ? new Date(formData.get("homologacao") as string) : undefined,
                          aprovacao: formData.get("aprovacao") ? new Date(formData.get("aprovacao") as string) : undefined,
                          implantacao: formData.get("implantacao") ? new Date(formData.get("implantacao") as string) : undefined,
                        });
                      }}
                      className="space-y-4"
                    >
                      <Input name="name" placeholder="Nome da Unidade" required />
                      <Input name="emailCronograma" type="date" placeholder="Email Cronograma" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input name="aprovacao" type="date" placeholder="Aprovação da Unidade" />
                        <Input name="implantacao" type="date" placeholder="Implantação" />
                      </div>
                      <Button type="submit" className="w-full">Adicionar</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {unitsLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="animate-spin text-muted-foreground/70" size={32} />
              </div>
            ) : units && units.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="min-w-[120px]">Email Cronograma</TableHead>
                      <TableHead className="min-w-[120px]">Ciência</TableHead>
                      <TableHead className="min-w-[120px]">Criação</TableHead>
                      <TableHead className="min-w-[120px]">Teste Deploy</TableHead>
                      <TableHead className="min-w-[120px]">Homologação</TableHead>
                      <TableHead className="min-w-[120px]">Aprovação</TableHead>
                      <TableHead className="min-w-[120px]">Implantação</TableHead>
                      <TableHead className="w-[120px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(units as any[]).map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell>{formatDate(unit.emailCronograma)}</TableCell>
                        <TableCell>{formatDate(unit.cienciaUnidade)}</TableCell>
                        <TableCell>{formatDate(unit.criacao)}</TableCell>
                        <TableCell>{formatDate(unit.testeDeploy)}</TableCell>
                        <TableCell>{formatDate(unit.homologacao)}</TableCell>
                        <TableCell>{formatDate(unit.aprovacao)}</TableCell>
                        <TableCell>{formatDate(unit.implantacao)}</TableCell>
                        <TableCell className="text-right">
                          {(user || isLocalMode()) && (
                            <Button size="sm" variant="ghost" onClick={() => { setEditingId(unit.id); setIsEditUnitOpen(true); }} className="gap-1">
                              <Edit2 size={16} /> Editar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground/80">
                  Nenhuma unidade acadêmica cadastrada
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Labs Tab */}
        {activeTab === "labs" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-foreground">Laboratórios</h2>
              {(user || isLocalMode()) && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" disabled={createLabMutation.isPending}>
                      <Plus size={18} />
                      Novo Laboratório
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Laboratório</DialogTitle>
                      <DialogDescription>Preencha os dados do novo laboratório</DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        createLabMutation.mutate({
                          predio: formData.get("predio") as string,
                          bloco: formData.get("bloco") as string,
                          sala: formData.get("sala") as string,
                          estacao: formData.get("estacao") as string,
                          nomeContato: formData.get("nomeContato") as string,
                          emailContato: formData.get("emailContato") as string,
                          ramalContato: formData.get("ramalContato") as string,
                        });
                      }}
                      className="space-y-4"
                    >
                      <Input name="predio" placeholder="Prédio" required />
                      <Input name="bloco" placeholder="Bloco" />
                      <Input name="sala" placeholder="Sala" required />
                      <Input name="estacao" placeholder="Estação" />
                      <Input name="nomeContato" placeholder="Nome do Contato" />
                      <Input name="emailContato" placeholder="Email do Contato" type="email" />
                      <Input name="ramalContato" placeholder="Ramal do Contato" />
                      <Button type="submit" className="w-full" disabled={createLabMutation.isPending}>
                        {createLabMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {labsLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="animate-spin text-muted-foreground/70" size={32} />
              </div>
            ) : labs && labs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {labs.map((lab: any) => (
                  <Card key={lab.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">
                            Prédio {lab.predio} - Sala {lab.sala}
                          </CardTitle>
                          <CardDescription>Bloco {lab.bloco || "N/A"}</CardDescription>
                        </div>
                        {(user || isLocalMode()) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(lab.id)}
                            className="gap-1"
                          >
                            <Edit2 size={16} />
                            Editar
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      {lab.nomeContato && (
                        <div>
                          <p className="text-muted-foreground font-medium">Contato</p>
                          <p className="text-foreground">{lab.nomeContato}</p>
                        </div>
                      )}
                      {lab.emailContato && (
                        <div>
                          <p className="text-muted-foreground font-medium">Email</p>
                          <p className="text-foreground break-all">{lab.emailContato}</p>
                        </div>
                      )}
                      {lab.ramalContato && (
                        <div>
                          <p className="text-muted-foreground font-medium">Ramal</p>
                          <p className="text-foreground">{lab.ramalContato}</p>
                        </div>
                      )}
                      {editingId === lab.id ? (
                        <form
                          className="space-y-3"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget as HTMLFormElement);
                            const data: any = {
                              predio: (fd.get('predio') as string) || undefined,
                              bloco: (fd.get('bloco') as string) || undefined,
                              sala: (fd.get('sala') as string) || undefined,
                              estacao: (fd.get('estacao') as string) || undefined,
                              nomeContato: (fd.get('nomeContato') as string) || undefined,
                              emailContato: (fd.get('emailContato') as string) || undefined,
                              ramalContato: (fd.get('ramalContato') as string) || undefined,
                            };
                            updateLabMutation.mutate({ id: lab.id, data });
                          }}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input name="predio" defaultValue={lab.predio} placeholder="Prédio" />
                            <Input name="bloco" defaultValue={lab.bloco ?? ''} placeholder="Bloco" />
                            <Input name="sala" defaultValue={lab.sala} placeholder="Sala" />
                            <Input name="estacao" defaultValue={lab.estacao ?? ''} placeholder="Estação" />
                            <Input name="nomeContato" defaultValue={lab.nomeContato ?? ''} placeholder="Nome do Contato" />
                            <Input name="emailContato" type="email" defaultValue={lab.emailContato ?? ''} placeholder="Email do Contato" />
                            <Input name="ramalContato" defaultValue={lab.ramalContato ?? ''} placeholder="Ramal do Contato" />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button type="submit" size="sm">Salvar</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
                            <Button type="button" size="sm" variant="secondary" onClick={() => setSoftwareDialogLabId(lab.id)}>Ver Softwares</Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (!confirm('Tem certeza que deseja excluir este laboratório? Esta ação também removerá os softwares associados.')) return;
                                deleteLabMutation.mutate({ id: lab.id });
                              }}
                            >
                              Excluir
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="pt-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSoftwareDialogLabId(lab.id)}>
                            Ver Softwares
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground/80">
                  Nenhum laboratório cadastrado
                </CardContent>
              </Card>
            )}
          </div>
    )}
    {/* Dialog de Softwares por Laboratório */}
        <Dialog open={softwareDialogLabId != null} onOpenChange={(open) => {
          if (!open) {
            setSoftwareDialogLabId(null);
            setSoftwareEditMode(false);
            setSoftwareEdits({});
          }
        }}>
          <DialogContent className="max-w-none w-[60vw] sm:max-w-[98vw] md:max-w-[98vw] lg:max-w-[98vw] xl:max-w-[98vw] max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-card z-10">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>
                    Softwares {activeSoftwareLab ? `- Prédio ${activeSoftwareLab.predio} - Sala ${activeSoftwareLab.sala}` : ''}
                  </DialogTitle>
                  <DialogDescription>
                    Lista de softwares do laboratório selecionado • {displaySoftware?.length ?? 0} itens
                  </DialogDescription>
                </div>
                {(user || isLocalMode()) && (
                  <Button size="sm" variant={softwareEditMode ? 'secondary' : 'default'} onClick={() => {
                    setSoftwareEditMode((v) => {
                      const next = !v;
                      if (next && labSoftware) {
                        const map: Record<number, any> = {};
                        for (const s of labSoftware as any[]) {
                          map[s.id] = { softwareName: s.softwareName, version: s.version ?? '', license: s.license };
                        }
                        setSoftwareEdits(map);
                      } else {
                        setSoftwareEdits({});
                      }
                      return next;
                    });
                  }}>
                    {softwareEditMode ? 'Concluir edição' : 'Editar'}
                  </Button>
                )}
              </div>
            </DialogHeader>
            <div className="overflow-auto px-6 py-4 space-y-3" style={{ maxHeight: 'calc(90vh - 72px)' }}>
              {/* Barra de filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  placeholder="Buscar por descrição, versão ou licença"
                  value={softwareSearch}
                  onChange={(e) => setSoftwareSearch(e.target.value)}
                />
                <select
                  className="border rounded px-2 py-1"
                  value={softwareLicenseFilter}
                  onChange={(e) => setSoftwareLicenseFilter(e.target.value as any)}
                >
                  <option value="Todos">Todas as licenças</option>
                  <option value="Gratuito">Gratuito</option>
                  <option value="Pago">Pago</option>
                </select>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSoftwareSearch(''); setSoftwareLicenseFilter('Todos'); }}>Limpar filtros</Button>
                </div>
              </div>
              <table className="w-full text-sm table-auto">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3 w-1/2 cursor-pointer select-none" onClick={() => changeSort('softwareName')}>
                      Descrição {softwareSort.key === 'softwareName' ? (softwareSort.dir === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th className="py-2 pr-3 w-1/5 cursor-pointer select-none" onClick={() => changeSort('version')}>
                      Versão {softwareSort.key === 'version' ? (softwareSort.dir === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th className="py-2 w-1/6 cursor-pointer select-none" onClick={() => changeSort('license')}>
                      Licença {softwareSort.key === 'license' ? (softwareSort.dir === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    {softwareEditMode && <th className="py-2 w-[140px]">Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {displaySoftware && displaySoftware.length > 0 ? (
                    displaySoftware.map((s: any) => {
                      if (!softwareEditMode) {
                        return (
                          <tr key={s.id} className="border-b last:border-0 odd:bg-muted/40">
                            <td className="py-2 pr-3 wrap-break-word whitespace-normal">{s.softwareName}</td>
                            <td className="py-2 pr-3 wrap-break-word whitespace-normal">{s.version ?? '—'}</td>
                            <td className="py-2 wrap-break-word whitespace-normal">{s.license}</td>
                          </tr>
                        );
                      }
                      const edit = softwareEdits[s.id] ?? { softwareName: s.softwareName, version: s.version ?? '', license: s.license };
                      return (
                        <tr key={s.id} className="border-b last:border-0 odd:bg-muted/40">
                          <td className="py-2 pr-3">
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={edit.softwareName}
                              onChange={(e) => setSoftwareEdits(prev => ({ ...prev, [s.id]: { ...edit, softwareName: e.target.value } }))}
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <input
                              className="w-full border rounded px-2 py-1"
                              value={edit.version ?? ''}
                              onChange={(e) => setSoftwareEdits(prev => ({ ...prev, [s.id]: { ...edit, version: e.target.value } }))}
                            />
                          </td>
                          <td className="py-2">
                            <select
                              className="w-full border rounded px-2 py-1"
                              value={edit.license}
                              onChange={(e) => setSoftwareEdits(prev => ({ ...prev, [s.id]: { ...edit, license: e.target.value } }))}
                            >
                              <option value="Gratuito">Gratuito</option>
                              <option value="Pago">Pago</option>
                            </select>
                          </td>
                          <td className="py-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const payload: any = {};
                                const cur = softwareEdits[s.id];
                                if (cur) {
                                  payload.softwareName = cur.softwareName;
                                  payload.version = cur.version;
                                  payload.license = cur.license;
                                }
                                updateSoftwareMutation.mutate({ id: s.id, data: payload });
                              }}
                            >
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteSoftwareMutation.mutate({ id: s.id })}
                            >
                              Remover
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-muted-foreground/80">Nenhum software cadastrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {(user || isLocalMode()) && softwareEditMode && softwareDialogLabId != null && (
              <form
                className="px-6 pb-6 mt-2 grid grid-cols-1 sm:grid-cols-4 gap-2 border-t pt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget as HTMLFormElement);
                  const softwareName = (fd.get('new_name') as string)?.trim();
                  if (!softwareName) return;
                  createSoftwareMutation.mutate({
                    laboratoryId: softwareDialogLabId,
                    softwareName,
                    version: (fd.get('new_version') as string) || undefined,
                    license: (fd.get('new_license') as string) || 'Gratuito',
                  });
                  (e.currentTarget as HTMLFormElement).reset();
                }}
              >
                <Input name="new_name" placeholder="Novo software (Descrição)" required />
                <Input name="new_version" placeholder="Versão" />
                <select name="new_license" className="border rounded px-2 py-1">
                  <option value="Gratuito">Gratuito</option>
                  <option value="Pago">Pago</option>
                </select>
                <Button type="submit">Adicionar</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
        {/* Implementation Tab */}
        {activeTab === 'implementation' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Implementação • Estações por Laboratório</h2>
                <p className="text-sm text-muted-foreground mt-1">Gerencie as estações de trabalho de cada laboratório</p>
              </div>
            </div>

            {/* Barra de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar laboratório por prédio, sala ou contato..."
                value={labSearch}
                onChange={(e) => setLabSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Grid de Cards de Laboratórios */}
            {labsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {((labs as any[] | undefined) ?? [])
                  .filter((lab: any) => {
                    const search = labSearch.trim().toLowerCase();
                    if (!search) return true;
                    const searchText = `${lab.predio ?? ''} ${lab.sala ?? ''} ${lab.bloco ?? ''} ${lab.nomeContato ?? ''} ${lab.emailContato ?? ''}`.toLowerCase();
                    return searchText.includes(search);
                  })
                  .map((lab: any) => {
                    // Buscar máquinas deste laboratório para mostrar contagem
                    const machinesQuery = trpc.machines.getByLaboratory.useQuery(
                      { laboratoryId: lab.id },
                      { enabled: false }
                    );
                    const machinesCount = machinesQuery.data?.length ?? 0;

                    return (
                      <Card
                        key={lab.id}
                        className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-1"
                        onClick={() => setMachineDialogLabId(lab.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">
                                  {lab.predio}
                                  {lab.bloco && ` • ${lab.bloco}`}
                                </CardTitle>
                                <CardDescription className="mt-1">Sala {lab.sala}</CardDescription>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Estações:</span>
                            <span className="font-semibold text-foreground">{machinesCount}</span>
                          </div>
                          {lab.nomeContato && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Contato: </span>
                              {lab.nomeContato}
                            </div>
                          )}
                          {lab.estacao && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Estação: </span>
                              {lab.estacao}
                            </div>
                          )}
                          <Button
                            className="w-full mt-2"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMachineDialogLabId(lab.id);
                            }}
                          >
                            <Monitor className="mr-2 h-4 w-4" />
                            Gerenciar Estações
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}

            {((labs as any[] | undefined) ?? []).filter((lab: any) => {
              const search = labSearch.trim().toLowerCase();
              if (!search) return true;
              const searchText = `${lab.predio ?? ''} ${lab.sala ?? ''} ${lab.bloco ?? ''} ${lab.nomeContato ?? ''} ${lab.emailContato ?? ''}`.toLowerCase();
              return searchText.includes(search);
            }).length === 0 && !labsLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum laboratório encontrado</p>
                {labSearch && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setLabSearch('')}>
                    Limpar busca
                  </Button>
                )}
              </div>
            )}
          </div>
        )}        {/* Dialog de Máquinas por Laboratório */}
        <Dialog open={machineDialogLabId != null} onOpenChange={(open) => {
          if (!open) {
            setMachineDialogLabId(null);
            setMachineEditMode(false);
            setMachineEdits({});
          }
        }}>
          <DialogContent className="max-w-none w-[60vw] sm:max-w-[98vw] md:max-w-[98vw] lg:max-w-[98vw] xl:max-w-[98vw] max-h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-card z-10">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>
                    Estações {activeMachineLab ? `- Prédio ${activeMachineLab.predio} - Sala ${activeMachineLab.sala}` : ''}
                  </DialogTitle>
                  <DialogDescription>
                    Lista de estações do laboratório selecionado • {labMachines?.length ?? 0} itens
                  </DialogDescription>
                </div>
                {(user || isLocalMode()) && (
                  <Button size="sm" variant={machineEditMode ? 'secondary' : 'default'} onClick={() => {
                    setMachineEditMode((v) => {
                      const next = !v;
                      if (next && labMachines) {
                        const map: Record<number, any> = {};
                        for (const m of (labMachines as any[])) {
                          map[m.id] = { hostname: m.hostname ?? '', patrimonio: m.patrimonio ?? '', formatted: Boolean(m.formatted) };
                        }
                        setMachineEdits(map);
                      } else {
                        setMachineEdits({});
                      }
                      return next;
                    });
                  }}>
                    {machineEditMode ? 'Concluir edição' : 'Editar'}
                  </Button>
                )}
              </div>
            </DialogHeader>
            <div className="overflow-auto px-6 py-4 space-y-3" style={{ maxHeight: 'calc(90vh - 72px)' }}>
              {/* Barra de busca */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  placeholder="Buscar por descrição ou patrimônio"
                  value={machineSearch}
                  onChange={(e) => setMachineSearch(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setMachineSearch(''); }}>Limpar busca</Button>
                </div>
              </div>
              <table className="w-full text-sm table-auto">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3 w-1/5">Patrimônio</th>
                    <th className="py-2 pr-3 w-2/5">Descrição</th>
                    <th className="py-2 pr-3 w-1/5">Formatada</th>
                    {machineEditMode && <th className="py-2 w-[140px]">Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {(labMachines as any[] | undefined)?.filter(m => {
                    const q = machineSearch.trim().toLowerCase();
                    if (!q) return true;
                    return `${m.hostname ?? ''} ${m.patrimonio ?? ''}`.toLowerCase().includes(q);
                  }).map((m: any) => {
                    if (!machineEditMode) {
                      return (
                        <tr key={m.id} className="border-b last:border-0 odd:bg-muted/40">
                          <td className="py-2 pr-3 wrap-break-word whitespace-normal">{m.patrimonio ?? '—'}</td>
                          <td className="py-2 pr-3 wrap-break-word whitespace-normal">{m.hostname}</td>
                          <td className="py-2 pr-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${m.formatted ? 'bg-green-100 text-green-700' : 'bg-muted/60 text-muted-foreground'}`}>
                              {m.formatted ? 'Sim' : 'Não'}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                    const edit = machineEdits[m.id] ?? { hostname: m.hostname ?? '', patrimonio: m.patrimonio ?? '', formatted: Boolean(m.formatted) };
                    return (
                      <tr key={m.id} className="border-b last:border-0 odd:bg-muted/40">
                        <td className="py-2 pr-3">
                          <input
                            className="w-full border rounded px-2 py-1"
                            value={edit.patrimonio}
                            onChange={(e) => setMachineEdits(prev => ({ ...prev, [m.id]: { ...edit, patrimonio: e.target.value } }))}
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            className="w-full border rounded px-2 py-1"
                            value={edit.hostname}
                            onChange={(e) => setMachineEdits(prev => ({ ...prev, [m.id]: { ...edit, hostname: e.target.value } }))}
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={edit.formatted}
                              onChange={(e) => setMachineEdits(prev => ({ ...prev, [m.id]: { ...edit, formatted: e.target.checked } }))}
                            />
                            Formatada
                          </label>
                        </td>
                        <td className="py-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const cur = machineEdits[m.id];
                              const payload: any = {};
                              if (cur) {
                                payload.hostname = cur.hostname; // descrição
                                payload.patrimonio = cur.patrimonio || null;
                                payload.formatted = Boolean(cur.formatted);
                                if (cur.formatted && !m.formatted) {
                                  payload.formattedAt = new Date().toISOString();
                                }
                                if (!cur.formatted) {
                                  payload.formattedAt = null;
                                }
                              }
                              updateMachineMutation.mutate({ id: m.id, data: payload });
                            }}
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMachineMutation.mutate({ id: m.id })}
                          >
                            Remover
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {(!labMachines || labMachines.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted-foreground/80">Nenhuma estação cadastrada</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {(user || isLocalMode()) && machineEditMode && machineDialogLabId != null && (
              <form
                className="px-6 pb-6 mt-2 grid grid-cols-1 sm:grid-cols-4 gap-2 border-t pt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget as HTMLFormElement);
                  const patrimonio = (fd.get('new_patrimonio') as string)?.trim();
                  const descricao = (fd.get('new_descricao') as string)?.trim();
                  if (!descricao) return;
                  createMachineMutation.mutate({
                    laboratoryId: machineDialogLabId,
                    hostname: descricao,
                    patrimonio: patrimonio || null,
                    formatted: false,
                    formattedAt: null,
                  } as any);
                  (e.currentTarget as HTMLFormElement).reset();
                }}
              >
                <Input name="new_patrimonio" placeholder="Patrimônio" />
                <Input name="new_descricao" placeholder="Descrição" required />
                <div></div>
                <Button type="submit">Adicionar</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Botão de tema fixo no canto inferior direito */}
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle />
      </div>
    </div>
  );
}
