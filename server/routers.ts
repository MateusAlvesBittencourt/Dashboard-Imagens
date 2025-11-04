import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { importRouter } from "./routers/import";
import { exportRouter } from "./routers/export";

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
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        emailCronograma: z.string().optional(),
        emailReforco: z.string().optional(),
        cienciaUnidade: z.string().optional(),
        listaSoftwares: z.string().optional(),
        criacao: z.string().optional(),
        testeDeploy: z.string().optional(),
        homologacao: z.string().optional(),
        aprovacao: z.string().optional(),
        implantacao: z.string().optional(),
      }))
      .mutation(({ input }) => db.createAcademicUnit(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          emailCronograma: z.string().optional(),
          emailReforco: z.string().optional(),
          cienciaUnidade: z.string().optional(),
          listaSoftwares: z.string().optional(),
          criacao: z.string().optional(),
          testeDeploy: z.string().optional(),
          homologacao: z.string().optional(),
          aprovacao: z.string().optional(),
          implantacao: z.string().optional(),
        }),
      }))
      .mutation(({ input }) => db.updateAcademicUnit(input.id, input.data)),
  }),

  laboratories: router({
    list: publicProcedure.query(() => db.getLaboratories()),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getLaboratoryById(input.id)),
    create: protectedProcedure
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
    update: protectedProcedure
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
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteLaboratory(input.id)),
  }),

  software: router({
    getByLaboratory: publicProcedure.input(z.object({ laboratoryId: z.number() })).query(({ input }) => db.getSoftwareByLaboratory(input.laboratoryId)),
    create: protectedProcedure
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
    update: protectedProcedure
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
    delete: protectedProcedure
      .input(z.object({ id: z.number(), laboratoryId: z.number() }))
      .mutation(({ input }) => db.deleteSoftware(input.id, input.laboratoryId)),
  }),

  machines: router({
    getByLaboratory: publicProcedure.input(z.object({ laboratoryId: z.number() })).query(({ input }) => db.getMachinesByLaboratory(input.laboratoryId)),
    create: protectedProcedure
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
    update: protectedProcedure
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
    delete: protectedProcedure
      .input(z.object({ id: z.number(), laboratoryId: z.number() }))
      .mutation(({ input }) => db.deleteMachine(input.id, input.laboratoryId)),
  }),

  import: importRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;
