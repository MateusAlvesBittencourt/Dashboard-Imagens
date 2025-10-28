import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de Unidades Acadêmicas
 */
export const academicUnits = mysqlTable("academic_units", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  emailCronograma: timestamp("email_cronograma"),
  emailReforco: timestamp("email_reforco"),
  cienciaUnidade: timestamp("ciencia_unidade"),
  listaSoftwares: timestamp("lista_softwares"),
  criacao: timestamp("criacao"),
  testeDeploy: timestamp("teste_deploy"),
  homologacao: timestamp("homologacao"),
  aprovacao: timestamp("aprovacao"),
  implantacao: timestamp("implantacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AcademicUnit = typeof academicUnits.$inferSelect;
export type InsertAcademicUnit = typeof academicUnits.$inferInsert;

/**
 * Tabela de Laboratórios
 */
export const laboratories = mysqlTable("laboratories", {
  id: int("id").autoincrement().primaryKey(),
  predio: varchar("predio", { length: 10 }).notNull(),
  bloco: varchar("bloco", { length: 10 }),
  sala: varchar("sala", { length: 50 }).notNull(),
  estacao: varchar("estacao", { length: 100 }),
  nomeContato: varchar("nome_contato", { length: 255 }),
  emailContato: varchar("email_contato", { length: 320 }),
  ramalContato: varchar("ramal_contato", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Laboratory = typeof laboratories.$inferSelect;
export type InsertLaboratory = typeof laboratories.$inferInsert;

/**
 * Tabela de Softwares por Laboratório
 */
export const softwareInstallations = mysqlTable("software_installations", {
  id: int("id").autoincrement().primaryKey(),
  laboratoryId: int("laboratory_id").notNull(),
  softwareName: varchar("software_name", { length: 255 }).notNull(),
  version: varchar("version", { length: 100 }),
  license: varchar("license", { length: 50 }).notNull(), // 'Pago' ou 'Gratuito'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SoftwareInstallation = typeof softwareInstallations.$inferSelect;
export type InsertSoftwareInstallation = typeof softwareInstallations.$inferInsert;

/**
 * Tabela de Configurações de Laboratório
 */
export const laboratoryFeatures = mysqlTable("laboratory_features", {
  id: int("id").autoincrement().primaryKey(),
  laboratoryId: int("laboratory_id").notNull(),
  monitorShutdownMinutes: int("monitor_shutdown_minutes"),
  profileCleanupDays: int("profile_cleanup_days"),
  hideLastUser: int("hide_last_user").default(1), // 0 ou 1
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LaboratoryFeature = typeof laboratoryFeatures.$inferSelect;
export type InsertLaboratoryFeature = typeof laboratoryFeatures.$inferInsert;

/**
 * Tabela de Histórico de Alterações
 */
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(), // 'academic_unit', 'laboratory', etc
  entityId: int("entity_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(), // 'create', 'update', 'delete'
  changes: text("changes"), // JSON com as alterações
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;