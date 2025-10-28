import principal from '../../../data_principal.json';
import labs from '../../../data_labs.json';

// Tipos simplificados para o modo local
export type LocalAcademicUnit = {
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

export type LocalLaboratory = {
  id: number;
  predio: string;
  bloco?: string | null;
  sala: string;
  estacao?: string | null;
  nomeContato?: string | null;
  emailContato?: string | null;
  ramalContato?: string | null;
};

export type LocalSoftwareInstallation = {
  id: number;
  laboratoryId: number;
  softwareName: string;
  version?: string | null;
  license: string; // 'Pago' | 'Gratuito'
};

const NS = 'imagens_dashboard_localdb_v1';

type DBShape = {
  academicUnits: LocalAcademicUnit[];
  laboratories: LocalLaboratory[];
  softwareInstallations: LocalSoftwareInstallation[];
};

function loadDB(): DBShape {
  const raw = localStorage.getItem(NS);
  if (raw) {
    const parsed = JSON.parse(raw) as DBShape | any;
    // migração leve: garantir propriedade softwareInstallations
    if (!('softwareInstallations' in parsed)) {
      (parsed as any).softwareInstallations = [];
      localStorage.setItem(NS, JSON.stringify(parsed));
    }
    return parsed as DBShape;
  }
  // seed inicial
  const units: LocalAcademicUnit[] = [];
  let id = 1;
  // pular a primeira linha de cabeçalho no data_principal.json
  for (const row of (principal as any[]).slice(1)) {
    units.push({
      id: id++,
      name: row.name,
      emailCronograma: row.email_cronograma,
      emailReforco: row.email_reforco,
      cienciaUnidade: row.ciencia_unidade,
      listaSoftwares: row.lista_softwares,
      criacao: row.criacao,
      testeDeploy: row.teste_deploy,
      homologacao: row.homologacao,
      aprovacao: row.aprovacao,
      implantacao: row.implantacao,
    });
  }

  const laboratories: LocalLaboratory[] = [];
  let labId = 1;
  for (const l of labs as any[]) {
    laboratories.push({
      id: labId++,
      predio: String(l.predio),
      bloco: null,
      sala: String(l.sala),
    });
  }

  // Garantir existência do laboratório "P50A - 913"
  let p50a913 = laboratories.find(l => l.predio === 'P50A' && String(l.sala) === '913');
  if (!p50a913) {
    p50a913 = {
      id: (laboratories.at(-1)?.id ?? 0) + 1,
      predio: 'P50A',
      bloco: null,
      sala: '913',
    };
    laboratories.push(p50a913);
  }

  // Seed de softwares para o P50A-913
  const softwareInstallations: LocalSoftwareInstallation[] = [];
  const sLabId = p50a913.id;
  const seedSoftwares: Array<[string, string | null, string]> = [
    ['Bizagi Modeler', 'Mais recente', 'Gratuito'],
    ['Democracy', '3', 'Pago'],
    ['Dosvox', 'Mais recente', 'Gratuito'],
    ['Dominio', 'Mais recente', 'Pago'],
    ['E-Views', '13', 'Pago'],
    ['EndNote', 'Mais recente', 'Gratuito'],
    ['GeoDa', 'Mais recente', 'Gratuito'],
    ['Gempack + Fortan', '11', 'Pago'],
    ['GNU Octave', 'Mais recente', 'Gratuito'],
    ['Google Chrome', 'Mais recente', 'Gratuito'],
    ['Grap', 'Mais recente', 'Gratuito'],
    ['Jamovi', 'Mais recente', 'Gratuito'],
    ['Jasp Statistics', 'Mais recente', 'Gratuito'],
    ['Make Money', '10', 'Pago'],
    ['Mendeley Desktop', 'Mais recente', 'Gratuito'],
    ['Microsoft Office', '2019', 'Pago'],
    ['Microsoft Project', '2019', 'Pago'],
    ['Microsoft PowerBI', 'Mais recente', 'Pago'],
    ['Microsoft Visio', '2019', 'Pago'],
    ['Minitab', '17', 'Pago'],
    ['Mozilla Firefox', 'Mais recente', 'Gratuito'],
    ['Open LCA', 'Mais recente', 'Gratuito'],
    ['Orange', 'Mais recente', 'Gratuito'],
    ['Python', 'Mais recente', 'Gratuito'],
    ['R for Windows', 'Mais recente', 'Gratuito'],
    ['RStudio', 'Mais recente', 'Gratuito'],
    ['Safe Exam Browser', 'Mais recente', 'Gratuito'],
    ['Scilab', 'Mais recente', 'Gratuito'],
    ['SPSS Statistics', '17', 'Pago'],
    ['Stata', '12', 'Pago'],
    ['Stata', '18', 'Pago'],
    ['Vs code', 'Mais recente', 'Gratuito'],
    ['Zotero', 'Mais recente', 'Gratuito'],
  ];
  let softId = 1;
  for (const [name, version, license] of seedSoftwares) {
    softwareInstallations.push({
      id: softId++,
      laboratoryId: sLabId,
      softwareName: name,
      version: version ?? null,
      license,
    });
  }

  const seeded: DBShape = { academicUnits: units, laboratories, softwareInstallations };
  localStorage.setItem(NS, JSON.stringify(seeded));
  return seeded;
}

function saveDB(db: DBShape) {
  localStorage.setItem(NS, JSON.stringify(db));
}

// Util genérico
export const localdb = {
  reset() {
    localStorage.removeItem(NS);
  },
  export(): string {
    return localStorage.getItem(NS) ?? JSON.stringify(loadDB());
  },
  import(json: string) {
    const raw = JSON.parse(json) as any;
    // Normalizar estrutura de importação
    const academicUnits: LocalAcademicUnit[] = Array.isArray(raw.academicUnits) ? raw.academicUnits : [];
    let laboratories: LocalLaboratory[] = Array.isArray(raw.laboratories) ? raw.laboratories.map((l: any, idx: number) => {
      const id = typeof l.id === 'number' ? l.id : (idx + 1);
      return {
        id,
        predio: String(l.predio ?? ''),
        bloco: l.bloco ?? null,
        sala: String(l.sala ?? ''),
        estacao: l.estacao ?? null,
        nomeContato: l.nomeContato ?? null,
        emailContato: l.emailContato ?? null,
        ramalContato: l.ramalContato ?? null,
      } as LocalLaboratory;
    }) : [];

    // Se já vier pronto (softwareInstallations), usa direto; caso contrário, busca labs[*].softwares e achata
    let softwareInstallations: LocalSoftwareInstallation[] = [];
    if (Array.isArray(raw.softwareInstallations)) {
      softwareInstallations = raw.softwareInstallations.map((s: any, idx: number) => ({
        id: typeof s.id === 'number' ? s.id : (idx + 1),
        laboratoryId: Number(s.laboratoryId),
        softwareName: s.softwareName || s.descricao || '',
        version: s.version ?? s.versao ?? null,
        license: s.license ?? s.licenca ?? 'Gratuito',
      }));
    } else if (Array.isArray(raw.laboratories)) {
      let sid = 1;
      for (const l of raw.laboratories) {
        const labId = typeof l.id === 'number' ? l.id : (laboratories.find(x => x.sala === String(l.sala) && x.predio === String(l.predio))?.id ?? sid++);
        const list = Array.isArray(l.softwares) ? l.softwares : [];
        for (const s of list) {
          softwareInstallations.push({
            id: sid++,
            laboratoryId: labId,
            softwareName: s.softwareName ?? s.descricao ?? '',
            version: s.version ?? s.versao ?? null,
            license: s.license ?? s.licenca ?? 'Gratuito',
          });
        }
      }
      // Remover qualquer propriedade temporária `softwares` dos labs ao salvar
      laboratories = laboratories.map(l => ({ ...l }));
    }

    const normalized: DBShape = {
      academicUnits,
      laboratories,
      softwareInstallations,
    };
    saveDB(normalized);
  },
  // Academic Units
  listUnits(): LocalAcademicUnit[] {
    return loadDB().academicUnits;
  },
  createUnit(input: Omit<LocalAcademicUnit, 'id'>): LocalAcademicUnit {
    const db = loadDB();
    const id = (db.academicUnits.at(-1)?.id ?? 0) + 1;
    const unit = { id, ...input };
    db.academicUnits.push(unit);
    saveDB(db);
    return unit;
  },
  updateUnit(id: number, patch: Partial<Omit<LocalAcademicUnit, 'id'>>): LocalAcademicUnit | null {
    const db = loadDB();
    const idx = db.academicUnits.findIndex(u => u.id === id);
    if (idx === -1) return null;
    db.academicUnits[idx] = { ...db.academicUnits[idx], ...patch };
    saveDB(db);
    return db.academicUnits[idx];
  },
  // Laboratories
  listLabs(): LocalLaboratory[] {
    return loadDB().laboratories;
  },
  createLab(input: Omit<LocalLaboratory, 'id'>): LocalLaboratory {
    const db = loadDB();
    const id = (db.laboratories.at(-1)?.id ?? 0) + 1;
    const lab = { id, ...input };
    db.laboratories.push(lab);
    saveDB(db);
    return lab;
  },
  updateLab(id: number, patch: Partial<Omit<LocalLaboratory, 'id'>>): LocalLaboratory | null {
    const db = loadDB();
    const idx = db.laboratories.findIndex(l => l.id === id);
    if (idx === -1) return null;
    db.laboratories[idx] = { ...db.laboratories[idx], ...patch };
    saveDB(db);
    return db.laboratories[idx];
  },
  deleteLab(id: number): boolean {
    const db = loadDB();
    const before = db.laboratories.length;
    db.laboratories = db.laboratories.filter(l => l.id !== id);
    // apagar softwares relacionados
    db.softwareInstallations = db.softwareInstallations.filter(s => s.laboratoryId !== id);
    saveDB(db);
    return db.laboratories.length < before;
  },
    clearLabs(): void {
      const db = loadDB();
      db.laboratories = [];
      db.softwareInstallations = [];
      saveDB(db);
    },
  // Software by Lab
  listSoftwareByLab(laboratoryId: number): LocalSoftwareInstallation[] {
    const db = loadDB();
    return db.softwareInstallations.filter(s => s.laboratoryId === laboratoryId);
  },
  createSoftware(input: Omit<LocalSoftwareInstallation, 'id'>): LocalSoftwareInstallation {
    const db = loadDB();
    const id = (db.softwareInstallations.at(-1)?.id ?? 0) + 1;
    const inst = { id, ...input };
    db.softwareInstallations.push(inst);
    saveDB(db);
    return inst;
  },
  updateSoftware(id: number, patch: Partial<Omit<LocalSoftwareInstallation, 'id'>>): LocalSoftwareInstallation | null {
    const db = loadDB();
    const idx = db.softwareInstallations.findIndex(s => s.id === id);
    if (idx === -1) return null;
    db.softwareInstallations[idx] = { ...db.softwareInstallations[idx], ...patch };
    saveDB(db);
    return db.softwareInstallations[idx];
  },
  deleteSoftware(id: number): boolean {
    const db = loadDB();
    const before = db.softwareInstallations.length;
    db.softwareInstallations = db.softwareInstallations.filter(s => s.id !== id);
    saveDB(db);
    return db.softwareInstallations.length < before;
  }
};
