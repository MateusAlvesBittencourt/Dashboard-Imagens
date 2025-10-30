import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Download, Upload, FileText, Database } from "lucide-react";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";
import { isLocalMode } from "@/lib/env";
import { localdb } from "@/lib/localdb";

export default function DataManagement() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Mutations para exportação
  const exportUnitsMutation = trpc.export.exportUnitsToExcel.useMutation();
  const exportLabsMutation = trpc.export.exportLaboratoriesToExcel.useMutation();
  const exportSoftwareMutation = trpc.export.exportSoftwaresToExcel.useMutation();
  const exportReportMutation = trpc.export.exportCompleteReport.useMutation();
  const exportCSVMutation = trpc.export.exportToCSV.useMutation();

  // Mutation para importação
  const importDataMutation = trpc.import.importFromJson.useMutation();

  const downloadFile = (data: string, filename: string, mimeType: string = "text/csv") => {
    const binaryString = atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExportUnits = async () => {
    try {
      if (isLocalMode()) {
        const json = JSON.stringify({ academicUnits: localdb.listUnits() }, null, 2);
        downloadFile(btoa(json), `unidades.json`, 'application/json');
      } else {
        const result = await exportUnitsMutation.mutateAsync();
        downloadFile(result.data, result.filename, result.mimeType);
      }
      toast.success("Unidades acadêmicas exportadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar unidades");
      console.error(error);
    }
  };

  const handleExportLabs = async () => {
    try {
      if (isLocalMode()) {
        const json = JSON.stringify({ laboratories: localdb.listLabs() }, null, 2);
        downloadFile(btoa(json), `laboratorios.json`, 'application/json');
      } else {
        const result = await exportLabsMutation.mutateAsync();
        downloadFile(result.data, result.filename, result.mimeType);
      }
      toast.success("Laboratórios exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar laboratórios");
      console.error(error);
    }
  };

  const handleExportSoftware = async () => {
    try {
      if (isLocalMode()) {
        toast.info("Exportação de softwares indisponível no modo local");
        return;
      }
      const result = await exportSoftwareMutation.mutateAsync();
      downloadFile(result.data, result.filename, result.mimeType);
      toast.success("Softwares exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar softwares");
      console.error(error);
    }
  };

  const handleExportReport = async () => {
    try {
      if (isLocalMode()) {
        toast.info("Relatório completo indisponível no modo local");
        return;
      }
      const result = await exportReportMutation.mutateAsync();
      downloadFile(result.data, result.filename, result.mimeType);
      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar relatório");
      console.error(error);
    }
  };

  const handleExportCSV = async (dataType: "units" | "laboratories" | "softwares") => {
    try {
      if (isLocalMode()) {
        if (dataType === 'units') {
          const json = JSON.stringify(localdb.listUnits(), null, 2);
          downloadFile(btoa(json), `unidades.json`, 'application/json');
        } else if (dataType === 'laboratories') {
          const json = JSON.stringify(localdb.listLabs(), null, 2);
          downloadFile(btoa(json), `laboratorios.json`, 'application/json');
        } else {
          toast.info("Exportação de softwares indisponível no modo local");
        }
      } else {
        const result = await exportCSVMutation.mutateAsync({ dataType });
        downloadFile(result.data, result.filename, result.mimeType);
      }
      toast.success(`Dados de ${dataType} exportados em CSV!`);
    } catch (error) {
      toast.error("Erro ao exportar CSV");
      console.error(error);
    }
  };

  const handleClearLabsLocal = () => {
    if (!isLocalMode()) {
      toast.info("Limpeza em massa disponível apenas no modo local");
      return;
    }
    if (!confirm('Tem certeza que deseja apagar TODOS os laboratórios e softwares? Essa ação não pode ser desfeita.')) return;
    try {
      localdb.clearLabs();
      toast.success('Laboratórios e softwares removidos do armazenamento local');
    } catch (e) {
      console.error(e);
      toast.error('Falha ao limpar laboratórios');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsImporting(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          if (isLocalMode()) {
            try {
              localdb.import(content);
              toast.success("Dados importados no navegador");
              // invalidar caches para atualizar telas imediatamente
              await Promise.all([
                utils.academicUnits.list.invalidate(),
                utils.laboratories.list.invalidate(),
              ]);
            } catch (err) {
              toast.error("JSON inválido para importação local");
              console.error(err);
            }
          } else {
            // Envia o conteúdo do arquivo para o backend processar
            const result = await importDataMutation.mutateAsync({ content });
            toast.success(result.message);
            await Promise.all([
              utils.academicUnits.list.invalidate(),
              utils.laboratories.list.invalidate(),
            ]);
          }
          setImportFile(null);
        } catch (error) {
          toast.error("Erro ao processar arquivo de importação");
          console.error(error);
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      toast.error("Erro ao ler arquivo");
      console.error(error);
      setIsImporting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-slate-600">Você precisa estar autenticado para acessar esta página.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <BackButton className="mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gerenciamento de Dados</h1>
          <p className="text-slate-600">Importe e exporte dados do dashboard em vários formatos</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Importação */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Upload className="w-6 h-6 text-blue-600" />
                <div>
                  <CardTitle>Importar Dados</CardTitle>
                  <CardDescription>Importe dados de arquivo JSON ou Excel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".json,.xlsx,.csv"
                  onChange={handleImportFile}
                  disabled={isImporting}
                  className="hidden"
                  id="import-file"
                />
                <label htmlFor="import-file" className="cursor-pointer block">
                  <Database className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">
                    {importFile ? importFile.name : "Clique para selecionar arquivo"}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">JSON, XLSX ou CSV</p>
                </label>
              </div>

              {importFile && (
                <Button
                  onClick={() => {
                    const input = document.getElementById("import-file") as HTMLInputElement;
                    if (input) input.click();
                  }}
                  className="w-full"
                  disabled={isImporting}
                >
                  {isImporting ? "Importando..." : "Importar Dados"}
                </Button>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Dica:</strong> Use o arquivo import_data.json fornecido no projeto para importar os dados da planilha Excel.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Exportação */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Download className="w-6 h-6 text-green-600" />
                <div>
                  <CardTitle>Exportar Dados</CardTitle>
                  <CardDescription>Exporte dados em CSV ou relatórios completos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleExportUnits}
                disabled={exportUnitsMutation.isPending}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <Download size={18} />
                {exportUnitsMutation.isPending ? "Exportando..." : "Unidades Acadêmicas (CSV)"}
              </Button>

              <Button
                onClick={handleExportLabs}
                disabled={exportLabsMutation.isPending}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <Download size={18} />
                {exportLabsMutation.isPending ? "Exportando..." : "Laboratórios (CSV)"}
              </Button>

              <Button
                onClick={handleExportSoftware}
                disabled={exportSoftwareMutation.isPending}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <Download size={18} />
                {exportSoftwareMutation.isPending ? "Exportando..." : "Softwares (CSV)"}
              </Button>

              <Button
                onClick={handleExportReport}
                disabled={exportReportMutation.isPending}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <FileText size={18} />
                {exportReportMutation.isPending ? "Gerando..." : "Relatório Completo (TXT)"}
              </Button>

              {isLocalMode() && (
                <>
                  <div className="border-t my-3" />
                  <Button
                    onClick={handleClearLabsLocal}
                    className="w-full justify-start gap-2"
                    variant="destructive"
                  >
                    Apagar TODOS os Laboratórios (Local)
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Formatos Suportados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Importação</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>JSON:</strong> Arquivo de importação com estrutura de dados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>Excel:</strong> Planilhas .xlsx com dados estruturados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>CSV:</strong> Arquivos separados por vírgula</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Exportação</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>CSV:</strong> Formato universal compatível com Excel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>TXT:</strong> Relatório estruturado em texto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>JSON:</strong> Dados estruturados em JSON</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
