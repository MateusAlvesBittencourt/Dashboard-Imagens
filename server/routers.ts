import { COOKIE_NAME } from "@shared/const";
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
        emailCronograma: z.date().optional(),
        emailReforco: z.date().optional(),
        cienciaUnidade: z.date().optional(),
        listaSoftwares: z.date().optional(),
        criacao: z.date().optional(),
        testeDeploy: z.date().optional(),
        homologacao: z.date().optional(),
        aprovacao: z.date().optional(),
        implantacao: z.date().optional(),
      }))
      .mutation(({ input }) => db.createAcademicUnit(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          emailCronograma: z.date().optional(),
          emailReforco: z.date().optional(),
          cienciaUnidade: z.date().optional(),
          listaSoftwares: z.date().optional(),
          criacao: z.date().optional(),
          testeDeploy: z.date().optional(),
          homologacao: z.date().optional(),
          aprovacao: z.date().optional(),
          implantacao: z.date().optional(),
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
        license: z.string(),
      }))
      .mutation(({ input }) => db.createSoftwareInstallation(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          softwareName: z.string().optional(),
          version: z.string().optional(),
          license: z.string().optional(),
        }),
      }))
      .mutation(({ input }) => db.updateSoftwareInstallation(input.id, input.data)),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteSoftwareInstallation(input.id)),
  }),

  import: importRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;
