import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const exportRouter = router({
  /**
   * Exportar unidades acadêmicas em Excel
   */
  exportUnitsToExcel: publicProcedure.mutation(async () => {
    try {
      const units = await db.getAcademicUnits();

      // Gerar CSV como alternativa
      let csvContent = "ID,Nome,Email Cronograma,Email Reforço,Ciência Unidade,Lista Softwares,Criação,Teste Deploy,Homologação,Aprovação,Implantação\n";
      
      units.forEach((unit) => {
        csvContent += `${unit.id},"${unit.name}",${unit.emailCronograma || ""},${unit.emailReforco || ""},${unit.cienciaUnidade || ""},${unit.listaSoftwares || ""},${unit.criacao || ""},${unit.testeDeploy || ""},${unit.homologacao || ""},${unit.aprovacao || ""},${unit.implantacao || ""}\n`;
      });

      return {
        success: true,
        data: Buffer.from(csvContent).toString("base64"),
        filename: "unidades_academicas.csv",
        mimeType: "text/csv",
      };
    } catch (error) {
      throw new Error(`Erro ao exportar unidades: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  }),

  /**
   * Exportar laboratórios em Excel
   */
  exportLaboratoriesToExcel: publicProcedure.mutation(async () => {
    try {
      const labs = await db.getLaboratories();

      let csvContent = "ID,Prédio,Bloco,Sala,Estação,Nome Contato,Email Contato,Ramal Contato\n";
      
      labs.forEach((lab) => {
        csvContent += `${lab.id},${lab.predio},${lab.bloco || ""},${lab.sala},${lab.estacao || ""},"${lab.nomeContato || ""}","${lab.emailContato || ""}",${lab.ramalContato || ""}\n`;
      });

      return {
        success: true,
        data: Buffer.from(csvContent).toString("base64"),
        filename: "laboratorios.csv",
        mimeType: "text/csv",
      };
    } catch (error) {
      throw new Error(`Erro ao exportar laboratórios: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  }),

  /**
   * Exportar softwares por laboratório
   */
  exportSoftwaresToExcel: publicProcedure.mutation(async () => {
    try {
      const labs = await db.getLaboratories();

      let csvContent = "Laboratório,Software,Versão,Licença\n";
      
      for (const lab of labs) {
        const softwares = await db.getSoftwareByLaboratory(lab.id);
        softwares.forEach((software) => {
          csvContent += `${lab.predio}-${lab.sala},"${software.softwareName}",${software.version || ""},"${software.license}"\n`;
        });
      }

      return {
        success: true,
        data: Buffer.from(csvContent).toString("base64"),
        filename: "softwares.csv",
        mimeType: "text/csv",
      };
    } catch (error) {
      throw new Error(`Erro ao exportar softwares: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  }),

  /**
   * Exportar relatório completo
   */
  exportCompleteReport: publicProcedure.mutation(async () => {
    try {
      const units = await db.getAcademicUnits();
      const labs = await db.getLaboratories();

      // Gerar relatório em formato de texto estruturado
      let reportContent = "RELATÓRIO COMPLETO - DASHBOARD IMAGENS 2026\n";
      reportContent += "=" .repeat(60) + "\n\n";
      reportContent += `Data de Geração: ${new Date().toLocaleString("pt-BR")}\n\n`;

      // Seção 1: Unidades Acadêmicas
      reportContent += "SEÇÃO 1: UNIDADES ACADÊMICAS\n";
      reportContent += "-".repeat(60) + "\n";
      reportContent += "ID,Nome,Email Cronograma,Criação,Teste Deploy,Homologação,Aprovação,Implantação\n";
      
      units.forEach((unit) => {
        reportContent += `${unit.id},"${unit.name}",${unit.emailCronograma || ""},${unit.criacao || ""},${unit.testeDeploy || ""},${unit.homologacao || ""},${unit.aprovacao || ""},${unit.implantacao || ""}\n`;
      });

      reportContent += "\n";

      // Seção 2: Laboratórios
      reportContent += "SEÇÃO 2: LABORATÓRIOS\n";
      reportContent += "-".repeat(60) + "\n";
      reportContent += "ID,Prédio,Bloco,Sala,Nome Contato,Email Contato\n";
      
      labs.forEach((lab) => {
        reportContent += `${lab.id},${lab.predio},${lab.bloco || ""},${lab.sala},"${lab.nomeContato || ""}","${lab.emailContato || ""}"\n`;
      });

      reportContent += "\n";

      // Seção 3: Softwares
      reportContent += "SEÇÃO 3: SOFTWARES POR LABORATÓRIO\n";
      reportContent += "-".repeat(60) + "\n";
      reportContent += "Laboratório,Software,Versão,Licença\n";
      
      for (const lab of labs) {
        const softwares = await db.getSoftwareByLaboratory(lab.id);
        softwares.forEach((software) => {
          reportContent += `${lab.predio}-${lab.sala},"${software.softwareName}",${software.version || ""},"${software.license}"\n`;
        });
      }

      return {
        success: true,
        data: Buffer.from(reportContent).toString("base64"),
        filename: "relatorio_completo.txt",
        mimeType: "text/plain",
      };
    } catch (error) {
      throw new Error(`Erro ao exportar relatório: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  }),

  /**
   * Exportar dados em CSV
   */
  exportToCSV: publicProcedure
    .input(z.object({
      dataType: z.enum(["units", "laboratories", "softwares"]),
    }))
    .mutation(async ({ input }) => {
      try {
        let csvContent = "";
        let filename = "";

        if (input.dataType === "units") {
          const units = await db.getAcademicUnits();
          csvContent = "ID,Nome,Email Cronograma,Criação,Teste Deploy,Homologação,Aprovação,Implantação\n";
          units.forEach((unit) => {
            csvContent += `${unit.id},"${unit.name}",${unit.emailCronograma || ""},${unit.criacao || ""},${unit.testeDeploy || ""},${unit.homologacao || ""},${unit.aprovacao || ""},${unit.implantacao || ""}\n`;
          });
          filename = "unidades_academicas.csv";
        } else if (input.dataType === "laboratories") {
          const labs = await db.getLaboratories();
          csvContent = "ID,Prédio,Bloco,Sala,Nome Contato,Email Contato,Ramal\n";
          labs.forEach((lab) => {
            csvContent += `${lab.id},${lab.predio},${lab.bloco || ""},${lab.sala},"${lab.nomeContato || ""}","${lab.emailContato || ""}",${lab.ramalContato || ""}\n`;
          });
          filename = "laboratorios.csv";
        } else if (input.dataType === "softwares") {
          const labs = await db.getLaboratories();
          csvContent = "Laboratório,Software,Versão,Licença\n";
          for (const lab of labs) {
            const softwares = await db.getSoftwareByLaboratory(lab.id);
            softwares.forEach((software) => {
              csvContent += `${lab.predio}-${lab.sala},"${software.softwareName}",${software.version || ""},"${software.license}"\n`;
            });
          }
          filename = "softwares.csv";
        }

        return {
          success: true,
          data: Buffer.from(csvContent).toString("base64"),
          filename,
          mimeType: "text/csv",
        };
      } catch (error) {
        throw new Error(`Erro ao exportar CSV: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      }
    }),
});
