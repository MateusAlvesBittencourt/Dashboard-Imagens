import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRef, useState, type ChangeEvent } from "react";
import { Upload, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";
import { isLocalMode } from "@/lib/env";
import { localdb } from "@/lib/localdb";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageHero } from "@/components/PageHero";
import { APP_LOGO } from "@/const";

const downloadBase64 = (data: string, filename: string, mimeType: string = "text/csv") => {
  const binaryString = window.atob(data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
};

const downloadText = (text: string, filename: string, mimeType: string = "application/json; charset=utf-8") => {
  const blob = new Blob([text], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
};

type NormalizedUnit = {
  id: number;
  name: string;
  emailCronograma?: string | null;
  emailReforco?: string | null;
  cienciaUnidade?: string | null;
  listaSoftwares?: string | null;
  criacao?: string | null;
  testeDeploy?: string | null;
  homologacao?: string | null;
  aprovacao?: string | null;
  implantacao?: string | null;
};

type NormalizedSoftware = {
  softwareName: string;
  version?: string | null;
  license: string;
};

type NormalizedLab = {
  id: number;
  predio: string;
  bloco?: string | null;
  sala: string;
  estacao?: string | null;
  nomeContato?: string | null;
  emailContato?: string | null;
  ramalContato?: string | null;
  softwares?: NormalizedSoftware[];
};

type NormalizedMachine = {
  id: number;
  laboratoryId: number;
  hostname: string;
  patrimonio?: string | null;
  formatted: boolean;
  formattedAt?: string | null;
};

const normalizeCronogramaUnits = (rawUnits: any[]): NormalizedUnit[] => {
  return rawUnits.map((unit, index) => {
    const name = unit?.name ?? unit?.nome ?? "";
    if (!name) {
      throw new Error(`Linha ${index + 1}: campo "name" obrigatorio.`);
    }

    const pick = (primary: any, secondary: any) => {
      if (primary === undefined || primary === null || primary === "") {
        return secondary ?? null;
      }
      return String(primary);
    };

    return {
      id: typeof unit?.id === "number" ? unit.id : index + 1,
      name: String(name),
      emailCronograma: pick(unit?.emailCronograma, unit?.email_cronograma),
      emailReforco: pick(unit?.emailReforco, unit?.email_reforco),
      cienciaUnidade: pick(unit?.cienciaUnidade, unit?.ciencia_unidade),
      listaSoftwares: pick(unit?.listaSoftwares, unit?.lista_softwares),
      criacao: pick(unit?.criacao, unit?.criacao_data),
      testeDeploy: pick(unit?.testeDeploy, unit?.teste_deploy),
      homologacao: pick(unit?.homologacao, unit?.homologacao_data),
      aprovacao: pick(unit?.aprovacao, unit?.aprovacao_data),
      implantacao: pick(unit?.implantacao, unit?.implantacao_data),
    };
  });
};

const normalizeLaboratories = (rawLabs: any[]): NormalizedLab[] => {
  return rawLabs.map((lab, index) => {
    const predio = lab?.predio ?? lab?.building ?? "";
    const sala = lab?.sala ?? lab?.room ?? "";
    if (!predio || !sala) {
      throw new Error(`Linha ${index + 1}: campos "predio" e "sala" sao obrigatorios.`);
    }

    const sanitize = (value: any) => {
      if (value === undefined || value === null || value === "") {
        return null;
      }
      return String(value);
    };

    const normalizeLicense = (value: any) => {
      const sanitized = sanitize(value);
      return sanitized ?? "Gratuito";
    };

    const softwareSource = Array.isArray(lab?.softwares)
      ? lab.softwares
      : Array.isArray(lab?.software)
      ? lab.software
      : Array.isArray(lab?.softwareList)
      ? lab.softwareList
      : Array.isArray(lab?.softwareInstallations)
      ? lab.softwareInstallations
      : [];

    const softwares: NormalizedSoftware[] = Array.isArray(softwareSource)
      ? softwareSource.map((software: any, softwareIndex: number) => {
          const softwareName =
            software?.softwareName ??
            software?.name ??
            software?.descricao ??
            software?.descricaoSoftware ??
            "";
          if (!softwareName) {
            throw new Error(
              `Linha ${index + 1}, software ${softwareIndex + 1}: campo "softwareName" obrigatorio.`
            );
          }
          return {
            softwareName: String(softwareName),
            version: sanitize(software?.version ?? software?.versao),
            license: normalizeLicense(software?.license ?? software?.licenca),
          };
        })
      : [];

    return {
      id: typeof lab?.id === "number" ? lab.id : index + 1,
      predio: String(predio),
      bloco: sanitize(lab?.bloco),
      sala: String(sala),
      estacao: sanitize(lab?.estacao ?? lab?.estacaoTrabalho),
      nomeContato: sanitize(lab?.nomeContato ?? lab?.contatoNome),
      emailContato: sanitize(lab?.emailContato ?? lab?.contatoEmail),
      ramalContato: sanitize(lab?.ramalContato ?? lab?.contatoRamal),
      softwares,
    };
  });
};

const normalizeSoftwareInstallationsFromLabs = (
  labs: NormalizedLab[]
): Array<{
  id: number;
  laboratoryId: number;
  softwareName: string;
  version?: string | null;
  license: string;
}> => {
  const installations: Array<{
    id: number;
    laboratoryId: number;
    softwareName: string;
    version?: string | null;
    license: string;
  }> = [];
  let nextId = 1;
  for (const lab of labs) {
    const softwares = Array.isArray(lab.softwares) ? lab.softwares : [];
    for (const software of softwares) {
      installations.push({
        id: nextId++,
        laboratoryId: lab.id,
        softwareName: software.softwareName,
        version: software.version ?? null,
        license: software.license ?? "Gratuito",
      });
    }
  }
  return installations;
};

const normalizeMachines = (rawMachines: any[]): NormalizedMachine[] => {
  return rawMachines.map((machine, index) => {
    const rawLabId = machine?.laboratoryId ?? machine?.laboratory_id ?? machine?.labId ?? machine?.lab_id;
    const laboratoryId = Number(rawLabId);
    if (!laboratoryId || Number.isNaN(laboratoryId)) {
      throw new Error(`Linha ${index + 1}: campo "laboratoryId" obrigatorio.`);
    }

    const normalizeNullableString = (value: any) => {
      if (value === undefined || value === null) {
        return null;
      }
      const str = String(value).trim();
      return str.length === 0 ? null : str;
    };

    const hostname = String(machine?.hostname ?? machine?.name ?? "").trim();
    const formattedRaw = machine?.formatted;
    let formatted = false;
    if (typeof formattedRaw === "string") {
      formatted = ["true", "1", "yes", "sim"].includes(formattedRaw.toLowerCase());
    } else {
      formatted = Boolean(formattedRaw);
    }

    return {
      id: typeof machine?.id === "number" ? machine.id : index + 1,
      laboratoryId,
      hostname,
      patrimonio: normalizeNullableString(machine?.patrimonio ?? machine?.assetTag ?? machine?.patrimonioNumero),
      formatted,
      formattedAt: normalizeNullableString(machine?.formattedAt ?? machine?.formatted_at),
    };
  });
};

export default function DataManagement() {
  const { user } = useAuth();
  const { data: units, isLoading: unitsLoading } = trpc.academicUnits.list.useQuery();
  const hasUnits = (units?.length ?? 0) > 0;
  const utils = trpc.useUtils();
  const hasLocalAuth = (() => {
    try {
      return Boolean(localStorage.getItem("local-auth"));
    } catch {
      return false;
    }
  })();
  const useLocal = isLocalMode() || hasLocalAuth;

  const [cronogramaFile, setCronogramaFile] = useState<File | null>(null);
  const [labsFile, setLabsFile] = useState<File | null>(null);
  const [machinesFile, setMachinesFile] = useState<File | null>(null);
  const [isImportingCronograma, setIsImportingCronograma] = useState(false);
  const [isImportingLabs, setIsImportingLabs] = useState(false);
  const [isImportingMachines, setIsImportingMachines] = useState(false);

  const cronogramaFileRef = useRef<HTMLInputElement | null>(null);
  const labsFileRef = useRef<HTMLInputElement | null>(null);
  const machinesFileRef = useRef<HTMLInputElement | null>(null);

  const importCronogramaMutation = trpc.import.importFromJson.useMutation();
  const importLabsMutation = trpc.import.importFromJson.useMutation();
  const exportCronogramaMutation = trpc.export.exportUnitsToExcel.useMutation();
  const exportLabsMutation = trpc.export.exportLaboratoriesToExcel.useMutation();

  const handleCronogramaFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setCronogramaFile(file);
  };

  const handleLabsFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setLabsFile(file);
  };

  const handleMachinesFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setMachinesFile(file);
  };

  const clearCronogramaFile = () => {
    setCronogramaFile(null);
    if (cronogramaFileRef.current) {
      cronogramaFileRef.current.value = "";
    }
  };

  const clearLabsFile = () => {
    setLabsFile(null);
    if (labsFileRef.current) {
      labsFileRef.current.value = "";
    }
  };

  const clearMachinesFile = () => {
    setMachinesFile(null);
    if (machinesFileRef.current) {
      machinesFileRef.current.value = "";
    }
  };

  const handleImportCronograma = async () => {
    if (!cronogramaFile) {
      toast.error("Selecione um arquivo JSON antes de importar.");
      return;
    }

    setIsImportingCronograma(true);
    try {
      const rawContent = await cronogramaFile.text();
      let parsed: any;
      try {
        parsed = JSON.parse(rawContent);
      } catch (error) {
        toast.error("Arquivo JSON invalido.");
        return;
      }

      const rawUnits = Array.isArray(parsed?.academicUnits)
        ? parsed.academicUnits
        : Array.isArray(parsed?.academic_units)
        ? parsed.academic_units
        : Array.isArray(parsed?.cronograma)
        ? parsed.cronograma
        : Array.isArray(parsed)
        ? parsed
        : null;

      if (!rawUnits || rawUnits.length === 0) {
        toast.error("Nenhum dado de cronograma encontrado no arquivo.");
        return;
      }

      let normalizedUnits: NormalizedUnit[];
      try {
        normalizedUnits = normalizeCronogramaUnits(rawUnits);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao normalizar dados.");
        return;
      }

      if (useLocal) {
        const current = JSON.parse(localdb.export());
        current.academicUnits = normalizedUnits;
        localdb.import(JSON.stringify(current));
        toast.success("Cronograma importado no modo local.");
      } else {
        const payload = JSON.stringify({
          academic_units: normalizedUnits.map(({ id, ...rest }) => rest),
        });
        const result = await importCronogramaMutation.mutateAsync({ content: payload });
        toast.success(result.message ?? "Cronograma importado com sucesso.");
      }

      await Promise.all([
        utils.academicUnits.list.invalidate(),
        utils.laboratories.list.invalidate(),
      ]).catch(console.error);

      clearCronogramaFile();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao importar cronograma.");
    } finally {
      setIsImportingCronograma(false);
    }
  };

  const handleImportLaboratories = async () => {
    if (!labsFile) {
      toast.error("Selecione um arquivo JSON antes de importar.");
      return;
    }

    setIsImportingLabs(true);
    try {
      const rawContent = await labsFile.text();
      let parsed: any;
      try {
        parsed = JSON.parse(rawContent);
      } catch (error) {
        toast.error("Arquivo JSON invalido.");
        return;
      }

      const rawLabs = Array.isArray(parsed?.laboratories)
        ? parsed.laboratories
        : Array.isArray(parsed?.labs)
        ? parsed.labs
        : Array.isArray(parsed)
        ? parsed
        : null;

      if (!rawLabs || rawLabs.length === 0) {
        toast.error("Nenhum laboratorio encontrado no arquivo.");
        return;
      }

      let normalizedLabs: NormalizedLab[];
      try {
        normalizedLabs = normalizeLaboratories(rawLabs);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao normalizar dados de laboratorios.");
        return;
      }

        if (useLocal) {
          const current = JSON.parse(localdb.export());
          const labsWithoutSoftwares = normalizedLabs.map(({ softwares, ...lab }) => lab);
          current.laboratories = labsWithoutSoftwares;
          const softwareInstallations = normalizeSoftwareInstallationsFromLabs(normalizedLabs);
          current.softwareInstallations = softwareInstallations;
          localdb.import(JSON.stringify(current));
          toast.success("Laboratorios importados no modo local.");
        } else {
          const labsForImport = normalizedLabs.map(({ id, softwares, ...rest }) => {
            const normalizedSoftwares = Array.isArray(softwares) ? softwares : [];
            return {
              ...rest,
              softwares: normalizedSoftwares.map((software) => ({
                softwareName: software.softwareName,
                version: software.version ?? null,
                license: software.license ?? "Gratuito",
              })),
            };
          });
          const payload = JSON.stringify({
            laboratories: labsForImport,
          });
          const result = await importLabsMutation.mutateAsync({ content: payload });
          toast.success(result.message ?? "Laboratorios importados com sucesso.");
        }

      await Promise.all([
        utils.academicUnits.list.invalidate(),
        utils.laboratories.list.invalidate(),
      ]).catch(console.error);

      clearLabsFile();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao importar laboratorios.");
    } finally {
      setIsImportingLabs(false);
    }
  };

  const handleImportMachines = async () => {
    if (!machinesFile) {
      toast.error("Selecione um arquivo JSON antes de importar.");
      return;
    }

    if (!useLocal) {
      toast.info("Importacao de implementacao disponivel apenas no modo local.");
      return;
    }

    setIsImportingMachines(true);
    try {
      const rawContent = await machinesFile.text();
      let parsed: any;
      try {
        parsed = JSON.parse(rawContent);
      } catch (error) {
        toast.error("Arquivo JSON invalido.");
        return;
      }

      const rawMachines = Array.isArray(parsed?.machines)
        ? parsed.machines
        : Array.isArray(parsed)
        ? parsed
        : null;

      if (!rawMachines || rawMachines.length === 0) {
        toast.error("Nenhuma maquina encontrada no arquivo.");
        return;
      }

      let normalizedMachines: NormalizedMachine[];
      try {
        normalizedMachines = normalizeMachines(rawMachines);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao normalizar dados de implementacao.");
        return;
      }

      const current = JSON.parse(localdb.export());
      current.machines = normalizedMachines;
      localdb.import(JSON.stringify(current));
      toast.success("Lista de implementacao importada no modo local.");

      await Promise.all([
        utils.academicUnits.list.invalidate(),
        utils.laboratories.list.invalidate(),
      ]).catch(console.error);

      clearMachinesFile();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao importar lista de implementacao.");
    } finally {
      setIsImportingMachines(false);
    }
  };

  const handleExportCronograma = async () => {
    try {
      if (useLocal) {
        const units = localdb.listUnits();
        const payload = { academicUnits: units };
        downloadText(JSON.stringify(payload, null, 2), "cronograma_local.json");
        toast.success("Cronograma exportado em JSON.");
        return;
      }

      const result = await exportCronogramaMutation.mutateAsync();
      downloadBase64(
        result.data,
        result.filename ?? "cronograma.csv",
        result.mimeType ?? "text/csv"
      );
      toast.success("Cronograma exportado.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar cronograma.");
    }
  };

  const handleExportLaboratories = async () => {
    try {
      if (useLocal) {
        const labs = localdb.listLabs();
        const payload = {
          laboratories: labs.map((lab) => {
            const softwares = localdb
              .listSoftwareByLab(lab.id)
              .map((software) => ({
                softwareName: software.softwareName,
                version: software.version ?? null,
                license: software.license ?? "Gratuito",
              }));
            return {
              ...lab,
              softwares,
            };
          }),
        };
        downloadText(JSON.stringify(payload, null, 2), "laboratorios_local.json");
        toast.success("Laboratorios exportados em JSON.");
        return;
      }

      const result = await exportLabsMutation.mutateAsync();
      downloadBase64(
        result.data,
        result.filename ?? "laboratorios.csv",
        result.mimeType ?? "text/csv"
      );
      toast.success("Laboratorios exportados.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar laboratorios.");
    }
  };

  const handleExportMachines = async () => {
    try {
      if (useLocal) {
        const snapshot = JSON.parse(localdb.export());
        const machines = Array.isArray(snapshot?.machines) ? snapshot.machines : [];
        downloadText(JSON.stringify({ machines }, null, 2), "implementacao_local.json");
        toast.success("Lista de implementacao exportada em JSON.");
        return;
      }

      if (!trpc.machines || !trpc.machines.getByLaboratory || typeof trpc.machines.getByLaboratory.fetch !== "function") {
        toast.info("Exportacao de implementacao ainda nao disponivel no modo servidor.");
        return;
      }

      const labs = await trpc.laboratories.list.fetch(undefined);
      const machinesByLab = await Promise.all(
        (labs ?? []).map(async (lab: any) => {
          try {
            const data = await trpc.machines.getByLaboratory.fetch({ laboratoryId: lab.id });
            return (data ?? []).map((machine: any) => ({
              ...machine,
              laboratoryId: lab.id,
              laboratoryName: `${lab.predio}-${lab.sala}`,
            }));
          } catch (error) {
            console.error("Falha ao buscar maquinas do laboratorio", lab?.id, error);
            return [];
          }
        })
      );

      const machines = machinesByLab.flat();
      downloadText(JSON.stringify({ machines }, null, 2), "implementacao.json");
      toast.success("Lista de implementacao exportada.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar lista de implementacao.");
    }
  };

  const handleClearLabsLocal = async () => {
    if (!useLocal) {
      toast.info("Limpeza em massa disponivel apenas no modo local.");
      return;
    }

    const confirmed = window.confirm(
      "Tem certeza que deseja apagar TODOS os laboratorios e softwares? Essa acao nao pode ser desfeita."
    );
    if (!confirmed) {
      return;
    }

    try {
      localdb.clearLabs();
      await Promise.all([
        utils.academicUnits.list.invalidate(),
        utils.laboratories.list.invalidate(),
      ]).catch(console.error);
      toast.success("Laboratorios e softwares removidos do armazenamento local.");
    } catch (error) {
      console.error(error);
      toast.error("Falha ao limpar laboratorios.");
    }
  };

  if (!user) {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <PageHero
          title="Autenticacao necessaria"
          description="Faca login para importar ou exportar dados do cronograma, laboratorios e implementacao."
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
        {useLocal ? "Modo local ativo" : "Modo servidor"}
      </span>
      <span className="hidden sm:inline text-muted-foreground/70">-</span>
      <span>
        Sessao de <span className="font-semibold text-foreground">{user.name}</span>
      </span>
    </>
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <PageHero
        badge="Dados"
        title="Gerenciamento de Dados"
        description="Importe, exporte e sincronize informacoes das unidades academicas, laboratorios e implementacao."
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
        actions={<ThemeToggle />}
        meta={heroMeta}
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-lg shadow-primary/5 backdrop-blur lg:p-8">
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
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Upload className="h-6 w-6 text-blue-600" />
                        <div>
                          <CardTitle>Importar Cronograma</CardTitle>
                          <CardDescription>Atualize as datas a partir de um arquivo JSON.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="border-2 border-dashed border-border/60 rounded-lg p-6 text-center">
                        <input
                          ref={cronogramaFileRef}
                          type="file"
                          accept=".json"
                          onChange={handleCronogramaFileChange}
                          className="hidden"
                          id="cronograma-file-input"
                        />
                        <label htmlFor="cronograma-file-input" className="cursor-pointer block">
                          <p className="text-sm font-medium text-foreground">
                            {cronogramaFile ? cronogramaFile.name : "Clique para selecionar um arquivo JSON"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Estrutura esperada: academicUnits[] ou academic_units[]</p>
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => cronogramaFileRef.current?.click()} disabled={isImportingCronograma}>
                          <Upload className="mr-2 h-4 w-4" />
                          Selecionar arquivo
                        </Button>
                        {cronogramaFile && (
                          <Button variant="outline" onClick={clearCronogramaFile} disabled={isImportingCronograma}>
                            Remover
                          </Button>
                        )}
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleImportCronograma}
                        disabled={isImportingCronograma || importCronogramaMutation.isPending}
                      >
                        {isImportingCronograma || importCronogramaMutation.isPending ? "Importando..." : "Importar cronograma"}
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Download className="h-6 w-6 text-green-600" />
                        <div>
                          <CardTitle>Exportar Cronograma</CardTitle>
                          <CardDescription>Baixe os dados das unidades para planilhas ou backup.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {useLocal
                          ? "O cronograma sera exportado como JSON com todas as unidades do armazenamento local."
                          : "O cronograma sera exportado como CSV gerado pelo servidor."}
                      </p>
                      <Button
                        className="w-full"
                        onClick={handleExportCronograma}
                        disabled={exportCronogramaMutation.isPending}
                      >
                        {exportCronogramaMutation.isPending ? "Gerando arquivo..." : "Exportar cronograma"}
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Upload className="h-6 w-6 text-blue-600" />
                        <div>
                          <CardTitle>Importar Laboratorios</CardTitle>
                          <CardDescription>Atualize os laboratorios a partir de um arquivo JSON.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="border-2 border-dashed border-border/60 rounded-lg p-6 text-center">
                        <input
                          ref={labsFileRef}
                          type="file"
                          accept=".json"
                          onChange={handleLabsFileChange}
                          className="hidden"
                          id="labs-file-input"
                        />
                        <label htmlFor="labs-file-input" className="cursor-pointer block">
                          <p className="text-sm font-medium text-foreground">
                            {labsFile ? labsFile.name : "Clique para selecionar um arquivo JSON"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Estrutura esperada: laboratories[] ou labs[]</p>
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => labsFileRef.current?.click()} disabled={isImportingLabs}>
                          <Upload className="mr-2 h-4 w-4" />
                          Selecionar arquivo
                        </Button>
                        {labsFile && (
                          <Button variant="outline" onClick={clearLabsFile} disabled={isImportingLabs}>
                            Remover
                          </Button>
                        )}
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleImportLaboratories}
                        disabled={isImportingLabs || importLabsMutation.isPending}
                      >
                        {isImportingLabs || importLabsMutation.isPending ? "Importando..." : "Importar laboratorios"}
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Download className="h-6 w-6 text-green-600" />
                        <div>
                          <CardTitle>Exportar Laboratorios</CardTitle>
                          <CardDescription>Baixe os dados para planilhas ou backup.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {useLocal
                          ? "Os laboratorios serao exportados como JSON do armazenamento local."
                          : "Os laboratorios serao exportados como CSV gerado pelo servidor."}
                      </p>
                      <Button
                        className="w-full"
                        onClick={handleExportLaboratories}
                        disabled={exportLabsMutation.isPending}
                      >
                        {exportLabsMutation.isPending ? "Gerando arquivo..." : "Exportar laboratorios"}
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Upload className="h-6 w-6 text-blue-600" />
                        <div>
                          <CardTitle>Importar Implementacao</CardTitle>
                          <CardDescription>Traga a lista de maquinas e patrimonios via JSON.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="border-2 border-dashed border-border/60 rounded-lg p-6 text-center">
                        <input
                          ref={machinesFileRef}
                          type="file"
                          accept=".json"
                          onChange={handleMachinesFileChange}
                          className="hidden"
                          id="machines-file-input"
                        />
                        <label htmlFor="machines-file-input" className="cursor-pointer block">
                          <p className="text-sm font-medium text-foreground">
                            {machinesFile ? machinesFile.name : "Clique para selecionar um arquivo JSON"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Estrutura esperada: machines[]</p>
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => machinesFileRef.current?.click()} disabled={isImportingMachines || !useLocal}>
                          <Upload className="mr-2 h-4 w-4" />
                          Selecionar arquivo
                        </Button>
                        {machinesFile && (
                          <Button variant="outline" onClick={clearMachinesFile} disabled={isImportingMachines}>
                            Remover
                          </Button>
                        )}
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleImportMachines}
                        disabled={isImportingMachines || !useLocal}
                      >
                        {isImportingMachines ? "Importando..." : "Importar implementacao"}
                      </Button>
                      {!useLocal && (
                        <p className="text-xs text-muted-foreground/80">
                          Disponivel apenas no modo local por enquanto.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Download className="h-6 w-6 text-green-600" />
                        <div>
                          <CardTitle>Exportar Implementacao</CardTitle>
                          <CardDescription>Obtenha os patrimonios para auditoria ou planilhas.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {useLocal
                          ? "Exporta um JSON com todas as maquinas armazenadas localmente."
                          : "Tenta coletar todas as maquinas via servidor (quando suportado)."}
                      </p>
                      <Button className="w-full" onClick={handleExportMachines}>
                        Exportar implementacao
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Operacoes adicionais</CardTitle>
                      <CardDescription>Ferramentas extras para administracao local.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {useLocal ? (
                        <Button
                          onClick={handleClearLabsLocal}
                          className="w-full justify-start gap-2"
                          variant="destructive"
                        >
                          Apagar TODOS os laboratorios (Local)
                        </Button>
                      ) : (
                        <div className="rounded-lg border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
                          Ative o modo local para habilitar a limpeza de laboratorios e softwares nesta tela.
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
      </div>
    </div>
  );
}
