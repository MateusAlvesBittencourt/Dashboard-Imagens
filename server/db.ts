import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

import { academicUnits, laboratories, softwareInstallations, laboratoryFeatures, auditLog, InsertAcademicUnit, InsertLaboratory, InsertSoftwareInstallation, InsertLaboratoryFeature, InsertAuditLog } from "../drizzle/schema";

// Academic Units
export async function getAcademicUnits() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(academicUnits).execute();
}

export async function getAcademicUnitById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(academicUnits).where(eq(academicUnits.id, id)).limit(1).execute();
  return result.length > 0 ? result[0] : null;
}

export async function createAcademicUnit(data: InsertAcademicUnit) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db.insert(academicUnits).values(data).execute();
}

export async function updateAcademicUnit(id: number, data: Partial<InsertAcademicUnit>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db.update(academicUnits).set(data).where(eq(academicUnits.id, id)).execute();
}

// Laboratories
export async function getLaboratories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(laboratories).execute();
}

export async function getLaboratoryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(laboratories).where(eq(laboratories.id, id)).limit(1).execute();
  return result.length > 0 ? result[0] : null;
}

export async function createLaboratory(data: InsertLaboratory) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db.insert(laboratories).values(data).execute();
}

export async function updateLaboratory(id: number, data: Partial<InsertLaboratory>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db.update(laboratories).set(data).where(eq(laboratories.id, id)).execute();
}

export async function deleteLaboratory(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  // Remover softwares vinculados ao laboratório para manter integridade
  await db.delete(softwareInstallations).where(eq(softwareInstallations.laboratoryId, id)).execute();
  // Remover features e auditoria se aplicável
  await db.delete(laboratoryFeatures).where(eq(laboratoryFeatures.laboratoryId, id)).execute();
  return db.delete(laboratories).where(eq(laboratories.id, id)).execute();
}

// Software Installations
export async function getSoftwareByLaboratory(laboratoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(softwareInstallations).where(eq(softwareInstallations.laboratoryId, laboratoryId)).execute();
}

export async function createSoftwareInstallation(data: InsertSoftwareInstallation) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db.insert(softwareInstallations).values(data).execute();
}

export async function updateSoftwareInstallation(id: number, data: Partial<InsertSoftwareInstallation>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db.update(softwareInstallations).set(data).where(eq(softwareInstallations.id, id)).execute();
}

export async function deleteSoftwareInstallation(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db.delete(softwareInstallations).where(eq(softwareInstallations.id, id)).execute();
}

// Laboratory Features
export async function getLaboratoryFeatures(laboratoryId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(laboratoryFeatures).where(eq(laboratoryFeatures.laboratoryId, laboratoryId)).limit(1).execute();
  return result.length > 0 ? result[0] : null;
}

export async function createLaboratoryFeatures(data: InsertLaboratoryFeature) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db.insert(laboratoryFeatures).values(data).execute();
}

export async function updateLaboratoryFeatures(id: number, data: Partial<InsertLaboratoryFeature>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db.update(laboratoryFeatures).set(data).where(eq(laboratoryFeatures.id, id)).execute();
}

// Audit Log
export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return db.insert(auditLog).values(data).execute();
}

export async function getAuditLog(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLog).where(
    eq(auditLog.entityType, entityType) && eq(auditLog.entityId, entityId)
  ).execute();
}
