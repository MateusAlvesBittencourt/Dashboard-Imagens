import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { importRouter } from "./routers/import";
import { exportRouter } from "./routers/export";

// Verifica se está em modo local (sem autenticação obrigatória)
const isLocalMode = () => {
  return process.env.NODE_ENV !== "production" || 
         !process.env.VITE_APP_ID || 
         process.env.VITE_LOCAL_MODE === "true";
};

// Procedimento que permite criação em modo local ou quando autenticado
const createProcedure = isLocalMode() ? publicProcedure : protectedProcedure;
const updateProcedure = isLocalMode() ? publicProcedure : protectedProcedure;
const deleteProcedure = isLocalMode() ? publicProcedure : protectedProcedure;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  academicUnits: router({
    list: publicProcedure.query(() => db.getAcademicUnits()),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getAcademicUnitById(input.id)),
    create: createProcedure
      .input(z.object({
        name: z.string(),
        emailCronograma: z.union([z.string(), z.date()]).optional(),
        emailReforco: z.union([z.string(), z.date()]).optional(),
        cienciaUnidade: z.union([z.string(), z.date()]).optional(),
        listaSoftwares: z.union([z.string(), z.date()]).optional(),
        criacao: z.union([z.string(), z.date()]).optional(),
        testeDeploy: z.union([z.string(), z.date()]).optional(),
        homologacao: z.union([z.string(), z.date()]).optional(),
        aprovacao: z.union([z.string(), z.date()]).optional(),
        implantacao: z.union([z.string(), z.date()]).optional(),
      }))
      .mutation(async ({ input }) => {
        // Converte strings para Date se necessário
        const normalizeDateField = (value: string | Date | undefined): Date | undefined => {
          if (!value) return undefined;
          if (value instanceof Date) return value;
          if (typeof value === 'string') {
            const date = new Date(value);
            return isNaN(date.getTime()) ? undefined : date;
          }
          return undefined;
        };
        
        return db.createAcademicUnit({
          name: input.name,
          emailCronograma: normalizeDateField(input.emailCronograma),
          emailReforco: normalizeDateField(input.emailReforco),
          cienciaUnidade: normalizeDateField(input.cienciaUnidade),
          listaSoftwares: normalizeDateField(input.listaSoftwares),
          criacao: normalizeDateField(input.criacao),
          testeDeploy: normalizeDateField(input.testeDeploy),
          homologacao: normalizeDateField(input.homologacao),
          aprovacao: normalizeDateField(input.aprovacao),
          implantacao: normalizeDateField(input.implantacao),
        });
      }),
    update: updateProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          emailCronograma: z.union([z.string(), z.date()]).optional(),
          emailReforco: z.union([z.string(), z.date()]).optional(),
          cienciaUnidade: z.union([z.string(), z.date()]).optional(),
          listaSoftwares: z.union([z.string(), z.date()]).optional(),
          criacao: z.union([z.string(), z.date()]).optional(),
          testeDeploy: z.union([z.string(), z.date()]).optional(),
          homologacao: z.union([z.string(), z.date()]).optional(),
          aprovacao: z.union([z.string(), z.date()]).optional(),
          implantacao: z.union([z.string(), z.date()]).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        // Converte strings para Date se necessário
        const normalizeDateField = (value: string | Date | undefined): Date | undefined => {
          if (!value) return undefined;
          if (value instanceof Date) return value;
          if (typeof value === 'string') {
            const date = new Date(value);
            return isNaN(date.getTime()) ? undefined : date;
          }
          return undefined;
        };
        
        const updateData: any = {};
        if (input.data.name !== undefined) updateData.name = input.data.name;
        if (input.data.emailCronograma !== undefined) updateData.emailCronograma = normalizeDateField(input.data.emailCronograma);
        if (input.data.emailReforco !== undefined) updateData.emailReforco = normalizeDateField(input.data.emailReforco);
        if (input.data.cienciaUnidade !== undefined) updateData.cienciaUnidade = normalizeDateField(input.data.cienciaUnidade);
        if (input.data.listaSoftwares !== undefined) updateData.listaSoftwares = normalizeDateField(input.data.listaSoftwares);
        if (input.data.criacao !== undefined) updateData.criacao = normalizeDateField(input.data.criacao);
        if (input.data.testeDeploy !== undefined) updateData.testeDeploy = normalizeDateField(input.data.testeDeploy);
        if (input.data.homologacao !== undefined) updateData.homologacao = normalizeDateField(input.data.homologacao);
        if (input.data.aprovacao !== undefined) updateData.aprovacao = normalizeDateField(input.data.aprovacao);
        if (input.data.implantacao !== undefined) updateData.implantacao = normalizeDateField(input.data.implantacao);
        
        return db.updateAcademicUnit(input.id, updateData);
      }),
  }),

  laboratories: router({
    list: publicProcedure.query(() => db.getLaboratories()),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getLaboratoryById(input.id)),
    create: createProcedure
      .input(z.object({
        predio: z.string(),
        bloco: z.string().optional(),
        sala: z.string(),
        estacao: z.string().optional(),
        nomeContato: z.string().optional(),
        emailContato: z.string().optional(),
        ramalContato: z.string().optional(),
      }))
      .mutation(({ input }) => db.createLaboratory(input)),
    update: updateProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          predio: z.string().optional(),
          bloco: z.string().optional(),
          sala: z.string().optional(),
          estacao: z.string().optional(),
          nomeContato: z.string().optional(),
          emailContato: z.string().optional(),
          ramalContato: z.string().optional(),
        }),
      }))
      .mutation(({ input }) => db.updateLaboratory(input.id, input.data)),
    delete: deleteProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteLaboratory(input.id)),
  }),

  software: router({
    getByLaboratory: publicProcedure.input(z.object({ laboratoryId: z.number() })).query(({ input }) => db.getSoftwareByLaboratory(input.laboratoryId)),
    create: createProcedure
      .input(z.object({
        laboratoryId: z.number(),
        softwareName: z.string(),
        version: z.string().optional(),
        license: z.enum(['Pago', 'Gratuito']),
      }))
      .mutation(({ input }) => {
        const { laboratoryId, ...softwareData } = input;
        return db.createSoftware(laboratoryId, softwareData);
      }),
    update: updateProcedure
      .input(z.object({
        id: z.number(),
        laboratoryId: z.number(),
        data: z.object({
          softwareName: z.string().optional(),
          version: z.string().optional(),
          license: z.enum(['Pago', 'Gratuito']).optional(),
        }),
      }))
      .mutation(({ input }) => db.updateSoftware(input.id, input.laboratoryId, input.data)),
    delete: deleteProcedure
      .input(z.object({ id: z.number(), laboratoryId: z.number() }))
      .mutation(({ input }) => db.deleteSoftware(input.id, input.laboratoryId)),
  }),

  machines: router({
    getByLaboratory: publicProcedure.input(z.object({ laboratoryId: z.number() })).query(({ input }) => db.getMachinesByLaboratory(input.laboratoryId)),
    create: createProcedure
      .input(z.object({
        laboratoryId: z.number(),
        hostname: z.string(),
        patrimonio: z.string().optional(),
        formatted: z.boolean(),
        formattedAt: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { laboratoryId, ...machineData } = input;
        return db.createMachine(laboratoryId, machineData);
      }),
    update: updateProcedure
      .input(z.object({
        id: z.number(),
        laboratoryId: z.number(),
        data: z.object({
            hostname: z.string().optional(),
            patrimonio: z.string().optional(),
            formatted: z.boolean().optional(),
            formattedAt: z.string().optional(),
        }),
      }))
      .mutation(({ input }) => db.updateMachine(input.id, input.laboratoryId, input.data)),
    delete: deleteProcedure
      .input(z.object({ id: z.number(), laboratoryId: z.number() }))
      .mutation(({ input }) => db.deleteMachine(input.id, input.laboratoryId)),
  }),

  import: importRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;
