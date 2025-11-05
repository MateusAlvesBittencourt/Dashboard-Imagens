import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import fs from "fs";
import path from "path";

// Verifica se está em modo local (sem autenticação obrigatória)
// Em produção, se não houver autenticação configurada, permite importação pública
const isLocalMode = () => {
  // Verifica se está em desenvolvimento ou se não há configuração de autenticação
  return process.env.NODE_ENV !== "production" || 
         !process.env.VITE_APP_ID || 
         process.env.VITE_LOCAL_MODE === "true";
};

const importProcedure = isLocalMode() ? publicProcedure : protectedProcedure;

export const importRouter = router({
  importFromJson: importProcedure
    .input(z.object({
      filePath: z.string().optional(),
      content: z.string().optional(), // conteúdo JSON direto do cliente
    }))
    .mutation(async ({ input }) => {
      try {
        // Log para debug
        console.log('[Import] Iniciando importação...', {
          hasContent: !!input.content,
          contentLength: input.content?.length || 0,
          filePath: input.filePath,
          mode: process.env.NODE_ENV,
          localMode: isLocalMode()
        });

        // 1) Se conteúdo veio do cliente, usa ele; senão tenta ler arquivo
        let data: any;
        if (input.content && input.content.trim().length > 0) {
          try {
            data = JSON.parse(input.content);
          } catch (parseError) {
            console.error('[Import] Erro ao fazer parse do JSON:', parseError);
            throw new Error(`Erro ao processar JSON: ${parseError instanceof Error ? parseError.message : 'Erro desconhecido'}`);
          }
        } else {
          const dataPath = input.filePath || path.join(process.cwd(), "import_data.json");
          if (!fs.existsSync(dataPath)) {
            throw new Error(`Arquivo de importação não encontrado: ${dataPath}`);
          }
          const fileContent = fs.readFileSync(dataPath, "utf-8");
          data = JSON.parse(fileContent);
        }

        let importedUnits = 0;
        let importedLabs = 0;
        let importedSoftware = 0;
        let importedMachines = 0;

        const labsInlineSoftwares: Array<{
          key: string;
          predio: string;
          sala: string;
          softwares: any[];
        }> = [];
        const labsWithInlineSoftwareKeys = new Set<string>();
        const makeLabKey = (predio: any, sala: any) => {
          const normPredio = String(predio ?? "").trim().toLowerCase();
          const normSala = String(sala ?? "").trim().toLowerCase();
          return `${normPredio}|${normSala}`;
        };
        const normalizeNullableString = (value: any) => {
          if (value === undefined || value === null) {
            return null;
          }
          const str = String(value).trim();
          return str.length === 0 ? null : str;
        };
        const normalizeLicense = (value: any) => {
          const normalized = normalizeNullableString(value);
          return normalized ?? "Gratuito";
        };
        let labsMap: Map<string, any> | null = null;
        const getLabsMap = async () => {
          if (labsMap) {
            return labsMap;
          }
          const labsList = await db.getLaboratories();
          labsMap = new Map(
            labsList.map((l: any) => [makeLabKey(l.predio, l.sala), l])
          );
          return labsMap;
        };

        // Função auxiliar para normalizar datas (aceita vários formatos)
        const normalizeDate = (value: any): Date | undefined => {
          if (!value || value === null || value === "") return undefined;
          
          // Se já é um objeto Date, retorna diretamente
          if (value instanceof Date) {
            return isNaN(value.getTime()) ? undefined : value;
          }
          
          // Se é string, tenta converter
          if (typeof value === "string") {
            const trimmed = value.trim();
            if (trimmed === "" || trimmed === "null" || trimmed === "undefined") return undefined;
            
            try {
              // Tenta formato ISO primeiro (2025-07-25T00:00:00.000Z)
              let date = new Date(trimmed);
              
              // Se não funcionou, tenta formato brasileiro (2025-07-25 00:00:00)
              if (isNaN(date.getTime())) {
                const dateOnly = trimmed.split(" ")[0]; // Pega só a parte da data
                date = new Date(dateOnly);
              }
              
              // Se ainda não funcionou, tenta formato DD/MM/YYYY
              if (isNaN(date.getTime()) && trimmed.includes("/")) {
                const [day, month, year] = trimmed.split("/");
                date = new Date(`${year}-${month}-${day}`);
              }
              
              // Verifica se é uma data válida
              if (isNaN(date.getTime())) {
                console.warn(`[Import] Data inválida ignorada: ${trimmed}`);
                return undefined;
              }
              
              return date;
            } catch (error) {
              console.warn(`[Import] Erro ao converter data "${trimmed}":`, error);
              return undefined;
            }
          }
          
          // Se é número (timestamp), converte
          if (typeof value === "number") {
            const date = new Date(value);
            return isNaN(date.getTime()) ? undefined : date;
          }
          
          return undefined;
        };

        // Importar unidades acadêmicas: aceita academic_units | academicUnits | cronograma | array direta
        const rawUnits = Array.isArray((data as any)?.academic_units)
          ? (data as any).academic_units
          : Array.isArray((data as any)?.academicUnits)
          ? (data as any).academicUnits
          : Array.isArray((data as any)?.cronograma)
          ? (data as any).cronograma
          : Array.isArray(data)
          ? (data as any)
          : null;
        if (rawUnits && Array.isArray(rawUnits)) {
          const existingUnits = await db.getAcademicUnits();
          for (const unit of rawUnits) {
            try {
              const unitId = typeof unit.id === "number" ? unit.id : null;
              const unitName = String(unit.name || "").trim();
              
              if (!unitName) {
                console.warn(`[Import] Unidade sem nome ignorada.`);
                continue;
              }

              // Verifica se já existe por ID ou por nome
              const existingById = unitId ? existingUnits.find(u => u.id === unitId) : null;
              const existingByName = existingUnits.find(u => u.name === unitName);
              const existingUnit = existingById || existingByName;

              const unitData = {
                name: unitName,
                emailCronograma: normalizeDate(unit.emailCronograma),
                emailReforco: normalizeDate(unit.emailReforco),
                cienciaUnidade: normalizeDate(unit.cienciaUnidade),
                listaSoftwares: normalizeDate(unit.listaSoftwares),
                criacao: normalizeDate(unit.criacao),
                testeDeploy: normalizeDate(unit.testeDeploy),
                homologacao: normalizeDate(unit.homologacao),
                aprovacao: normalizeDate(unit.aprovacao),
                implantacao: normalizeDate(unit.implantacao),
              };

              if (existingUnit) {
                // Atualiza unidade existente
                await db.updateAcademicUnit(existingUnit.id, unitData);
              } else {
                // Cria nova unidade
                await db.createAcademicUnit(unitData);
              }
              importedUnits++;
            } catch (error) {
              console.error(`Erro ao importar unidade ${unit.name}:`, error);
            }
          }
        }

        // Importar laboratórios: aceita laboratories | labs
        const rawLabs = Array.isArray((data as any)?.laboratories)
          ? (data as any).laboratories
          : Array.isArray((data as any)?.labs)
          ? (data as any).labs
          : null;
        if (rawLabs && Array.isArray(rawLabs)) {
          for (const lab of rawLabs) {
            try {
              // createLaboratory agora aceita ID opcional; se fornecido e existir, atualiza
              await db.createLaboratory({
                id: typeof lab.id === "number" ? lab.id : undefined,
                predio: lab.predio,
                bloco: lab.bloco,
                sala: lab.sala,
                estacao: lab.estacao,
                nomeContato: lab.nomeContato,
                emailContato: lab.emailContato,
                ramalContato: lab.ramalContato,
              });
              importedLabs++;
              if (lab?.predio && lab?.sala) {
                const key = makeLabKey(lab.predio, lab.sala);
                const softwares = Array.isArray(lab.softwares) ? lab.softwares : [];
                labsInlineSoftwares.push({
                  key,
                  predio: String(lab.predio ?? ""),
                  sala: String(lab.sala ?? ""),
                  softwares,
                });
              }
            } catch (error) {
              console.error(`Erro ao importar laboratório ${lab.predio}-${lab.sala}:`, error);
            }
          }
        }

        // Importar softwares descritos dentro dos próprios registros de laboratório
        if (labsInlineSoftwares.length > 0) {
          const map = await getLabsMap();
          for (const labEntry of labsInlineSoftwares) {
            if (!labEntry.softwares || labEntry.softwares.length === 0) {
              continue;
            }
            const matchingLab = map.get(labEntry.key);
            if (!matchingLab) {
              console.warn(`[Import] Não foi possível localizar laboratório ${labEntry.predio}-${labEntry.sala} para vincular softwares.`);
              continue;
            }
            for (const software of labEntry.softwares) {
              const softwareName =
                software?.softwareName ??
                software?.name ??
                software?.descricao ??
                software?.descricaoSoftware ??
                "";
              if (!softwareName) {
                console.warn(`[Import] Software sem nome ignorado no laboratório ${labEntry.predio}-${labEntry.sala}.`);
                continue;
              }
              try {
                await db.createSoftware(matchingLab.id, {
                  softwareName: String(softwareName),
                  version: normalizeNullableString(software?.version ?? software?.versao) ?? undefined,
                  license: normalizeLicense(software?.license ?? software?.licenca) as any,
                });
                importedSoftware++;
              } catch (error) {
                console.error(`Erro ao importar software ${softwareName} para ${labEntry.predio}-${labEntry.sala}:`, error);
              }
            }
            labsWithInlineSoftwareKeys.add(labEntry.key);
          }
        }

        // Importar softwares dos laboratórios
        if (data.lab_details && typeof data.lab_details === "object") {
          const map = await getLabsMap();
          for (const [labName, labInfo] of Object.entries(data.lab_details)) {
            try {
              const key = makeLabKey((labInfo as any).predio, (labInfo as any).sala);
              if (key && labsWithInlineSoftwareKeys.has(key)) {
                continue;
              }
              const matchingLab = map.get(key);

              if (matchingLab && (labInfo as any).softwares) {
                for (const software of (labInfo as any).softwares) {
                  const softwareName =
                    software?.softwareName ??
                    software?.name ??
                    software?.descricao ??
                    software?.descricaoSoftware ??
                    "";
                  if (!softwareName) {
                    console.warn(`[Import] Software sem nome ignorado no bloco de detalhes ${labName}.`);
                    continue;
                  }
                  try {
                    await db.createSoftware(matchingLab.id, {
                      softwareName: String(softwareName),
                      version: normalizeNullableString(software?.version ?? software?.versao) ?? undefined,
                      license: normalizeLicense(software?.license ?? software?.licenca) as any,
                    });
                    importedSoftware++;
                  } catch (error) {
                    console.error(`Erro ao importar software ${softwareName}:`, error);
                  }
                }
              }
            } catch (error) {
              console.error(`Erro ao processar laboratório ${labName}:`, error);
            }
          }
        }

        // Importar máquinas (implementação)
        if (data.machines && Array.isArray(data.machines)) {
          console.log(`[Import] Processando ${data.machines.length} máquinas...`);
          for (const machine of data.machines) {
            try {
              const rawLabId = machine?.laboratoryId ?? machine?.laboratory_id ?? machine?.labId ?? machine?.lab_id;
              const laboratoryId = Number(rawLabId);
              if (!laboratoryId || Number.isNaN(laboratoryId)) {
                console.warn(`[Import] Máquina sem laboratoryId válido ignorada. Dados:`, {
                  id: machine?.id,
                  hostname: machine?.hostname,
                  patrimonio: machine?.patrimonio
                });
                continue;
              }
              
              const lab = await db.getLaboratoryById(laboratoryId as any);
              if (!lab) {
                console.warn(`[Import] Laboratório ${laboratoryId} não encontrado para vincular máquina. Hostname: ${machine?.hostname}`);
                continue;
              }
              
              const hostname = String(machine?.hostname ?? machine?.name ?? "").trim();
              if (!hostname) {
                console.warn(`[Import] Máquina sem hostname ignorada. LaboratoryId: ${laboratoryId}`);
                continue;
              }
              
              const patrimonio = machine?.patrimonio ?? machine?.assetTag ?? null;
              let formatted = Boolean(machine?.formatted);
              if (typeof machine?.formatted === "string") {
                formatted = ["true", "1", "yes", "sim"].includes(machine.formatted.toLowerCase());
              }
              
              // Normalizar formattedAt
              const formattedAt = machine?.formattedAt ?? machine?.formatted_at ?? null;
              const normalizedFormattedAt = formattedAt ? normalizeDate(formattedAt) : null;
              
              await db.createMachine(laboratoryId, {
                hostname,
                patrimonio: patrimonio ? String(patrimonio).trim() : null,
                formatted,
                formattedAt: normalizedFormattedAt ?? null,
              } as any);
              importedMachines++;
            } catch (error) {
              console.error(`[Import] Erro ao importar máquina:`, {
                error: error instanceof Error ? error.message : String(error),
                machine: {
                  id: machine?.id,
                  laboratoryId: machine?.laboratoryId ?? machine?.laboratory_id,
                  hostname: machine?.hostname,
                  patrimonio: machine?.patrimonio
                }
              });
            }
          }
        }

        return {
          success: true,
          message: `Importação concluída: ${importedUnits} unidades, ${importedLabs} laboratórios, ${importedSoftware} softwares, ${importedMachines} máquinas`,
          stats: {
            importedUnits,
            importedLabs,
            importedSoftware,
            importedMachines,
          },
        };
      } catch (error) {
        console.error("[Import] Erro na importação:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("[Import] Detalhes do erro:", {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          input: {
            hasContent: !!input.content,
            contentLength: input.content?.length || 0,
            filePath: input.filePath
          }
        });
        throw new Error(`Erro ao importar dados: ${errorMessage}`);
      }
    }),
});
