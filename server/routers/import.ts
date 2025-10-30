import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import fs from "fs";
import path from "path";

export const importRouter = router({
  importFromJson: protectedProcedure
    .input(z.object({
      filePath: z.string().optional(),
      content: z.string().optional(), // conteúdo JSON direto do cliente
    }))
    .mutation(async ({ input }) => {
      try {
        // 1) Se conteúdo veio do cliente, usa ele; senão tenta ler arquivo
        let data: any;
        if (input.content && input.content.trim().length > 0) {
          data = JSON.parse(input.content);
        } else {
          const dataPath = input.filePath || path.join(process.cwd(), "import_data.json");
          if (!fs.existsSync(dataPath)) {
            throw new Error("Arquivo de importação não encontrado");
          }
          const fileContent = fs.readFileSync(dataPath, "utf-8");
          data = JSON.parse(fileContent);
        }

        let importedUnits = 0;
        let importedLabs = 0;
        let importedSoftware = 0;

        // Importar unidades acadêmicas
        if (data.academic_units && Array.isArray(data.academic_units)) {
          for (const unit of data.academic_units) {
            try {
              await db.createAcademicUnit({
                name: unit.name,
                emailCronograma: unit.emailCronograma ? new Date(unit.emailCronograma) : undefined,
                emailReforco: unit.emailReforco ? new Date(unit.emailReforco) : undefined,
                cienciaUnidade: unit.cienciaUnidade ? new Date(unit.cienciaUnidade) : undefined,
                listaSoftwares: unit.listaSoftwares ? new Date(unit.listaSoftwares) : undefined,
                criacao: unit.criacao ? new Date(unit.criacao) : undefined,
                testeDeploy: unit.testeDeploy ? new Date(unit.testeDeploy) : undefined,
                homologacao: unit.homologacao ? new Date(unit.homologacao) : undefined,
                aprovacao: unit.aprovacao ? new Date(unit.aprovacao) : undefined,
                implantacao: unit.implantacao ? new Date(unit.implantacao) : undefined,
              });
              importedUnits++;
            } catch (error) {
              console.error(`Erro ao importar unidade ${unit.name}:`, error);
            }
          }
        }

        // Importar laboratórios
        if (data.laboratories && Array.isArray(data.laboratories)) {
          for (const lab of data.laboratories) {
            try {
              await db.createLaboratory({
                predio: lab.predio,
                bloco: lab.bloco,
                sala: lab.sala,
                estacao: lab.estacao,
                nomeContato: lab.nomeContato,
                emailContato: lab.emailContato,
                ramalContato: lab.ramalContato,
              });
              importedLabs++;
            } catch (error) {
              console.error(`Erro ao importar laboratório ${lab.predio}-${lab.sala}:`, error);
            }
          }
        }

        // Importar softwares dos laboratórios
        if (data.lab_details && typeof data.lab_details === "object") {
          for (const [labName, labInfo] of Object.entries(data.lab_details)) {
            try {
              // Encontrar o laboratório correspondente
              const labs = await db.getLaboratories();
              const matchingLab = labs.find((l: any) => 
                l.predio === (labInfo as any).predio && l.sala === (labInfo as any).sala
              );

              if (matchingLab && (labInfo as any).softwares) {
                for (const software of (labInfo as any).softwares) {
                  try {
                    await db.createSoftwareInstallation({
                      laboratoryId: matchingLab.id,
                      softwareName: software.name,
                      version: software.version,
                      license: software.license,
                    });
                    importedSoftware++;
                  } catch (error) {
                    console.error(`Erro ao importar software ${software.name}:`, error);
                  }
                }
              }
            } catch (error) {
              console.error(`Erro ao processar laboratório ${labName}:`, error);
            }
          }
        }

        return {
          success: true,
          message: `Importação concluída: ${importedUnits} unidades, ${importedLabs} laboratórios, ${importedSoftware} softwares`,
          stats: {
            importedUnits,
            importedLabs,
            importedSoftware,
          },
        };
      } catch (error) {
        console.error("Erro na importação:", error);
        throw new Error(`Erro ao importar dados: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      }
    }),
});
