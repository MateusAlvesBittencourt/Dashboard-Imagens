import fs from 'fs/promises';
import path from 'path';

// Tipos para os dados - podem ser movidos para shared/types.ts se necessário
interface AcademicUnit {
  id: number;
  name: string;
  emailCronograma?: string | Date;
  emailReforco?: string | Date;
  cienciaUnidade?: string | Date;
  listaSoftwares?: string | Date;
  criacao?: string | Date;
  testeDeploy?: string | Date;
  homologacao?: string | Date;
  aprovacao?: string | Date;
  implantacao?: string | Date;
}

interface Machine {
    id: number;
    laboratoryId: number;
    hostname: string;
    patrimonio?: string | null;
    formatted: boolean;
    formattedAt?: string | Date | null;
}

interface Software {
    id: number;
    laboratoryId: number;
    softwareName: string;
    version?: string | null;
    license: 'Pago' | 'Gratuito';
}

interface Laboratory {
  id: number;
  predio: string;
  bloco?: string;
  sala: string;
  estacao?: string;
  nomeContato?: string;
  emailContato?: string;
  ramalContato?: string;
  softwares: Software[];
  machines: Machine[];
}

// --- Configuração de caminho de dados ---
// Diretório padrão para armazenar dados: C:\Program Files\dashboard\banco
const getDataDirectory = (): string => {
  const dataDir = 'C:\\Program Files\\dashboard\\banco';
  return dataDir;
};

// Caminhos para os arquivos JSON
const principalDataPath = path.join(getDataDirectory(), 'data_principal.json');
const labsDataPath = path.join(getDataDirectory(), 'data_labs.json');

// --- Funções auxiliares para ler e escrever JSON ---

// Garante que o diretório de dados existe, criando-o se necessário
async function ensureDataDirectory(): Promise<void> {
  try {
    const dataDir = getDataDirectory();
    await fs.mkdir(dataDir, { recursive: true });
    console.log(`[DB] Diretório de dados confirmado/criado: ${dataDir}`);
  } catch (error) {
    console.error(`Erro ao criar diretório de dados:`, error);
    throw error;
  }
}

async function readData<T>(filePath: string): Promise<T> {
  try {
    // Garante que o diretório existe antes de tentar ler
    await ensureDataDirectory();
    
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Erro ao ler o arquivo ${filePath}:`, error);
    // Se o arquivo não existir ou for inválido, retorna um estado padrão
    if (filePath.includes('principal')) return { academicUnits: [] } as any;
    if (filePath.includes('labs')) return { laboratories: [] } as any;
    return {} as T;
  }
}

async function writeData(filePath: string, data: any): Promise<void> {
  try {
    // Garante que o diretório existe antes de tentar escrever
    await ensureDataDirectory();
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[DB] Dados salvos em: ${filePath}`);
  } catch (error) {
    console.error(`Erro ao escrever no arquivo ${filePath}:`, error);
    throw error;
  }
}

// --- Implementação das funções de acesso a dados ---

// Função para verificar status e localização dos dados
export async function getDataStatus(): Promise<{ path: string; exists: boolean; message: string }> {
  try {
    const dataDir = getDataDirectory();
    await ensureDataDirectory();
    return {
      path: dataDir,
      exists: true,
      message: `Diretório de dados configurado em: ${dataDir}`
    };
  } catch (error: any) {
    return {
      path: getDataDirectory(),
      exists: false,
      message: `Erro ao acessar diretório: ${error?.message || 'Desconhecido'}`
    };
  }
}

// Academic Units
export async function getAcademicUnits(): Promise<AcademicUnit[]> {
  const data = await readData<{ academicUnits: AcademicUnit[] }>(principalDataPath);
  return data.academicUnits || [];
}

export async function getAcademicUnitById(id: number): Promise<AcademicUnit | null> {
    const units = await getAcademicUnits();
    return units.find(u => u.id === id) || null;
}

export async function createAcademicUnit(unitData: Omit<AcademicUnit, 'id'>): Promise<AcademicUnit> {
    const data = await readData<{ academicUnits: AcademicUnit[] }>(principalDataPath);
    const units = data.academicUnits || [];
    const newId = units.length > 0 ? Math.max(...units.map(u => u.id)) + 1 : 1;
    const newUnit: AcademicUnit = { id: newId, ...unitData };
    units.push(newUnit);
    await writeData(principalDataPath, { ...data, academicUnits: units });
    return newUnit;
}

export async function updateAcademicUnit(id: number, updateData: Partial<AcademicUnit>): Promise<AcademicUnit | null> {
    const data = await readData<{ academicUnits: AcademicUnit[] }>(principalDataPath);
    const units = data.academicUnits || [];
    const unitIndex = units.findIndex(u => u.id === id);
    if (unitIndex === -1) return null;

    const updatedUnit = { ...units[unitIndex], ...updateData };
    units[unitIndex] = updatedUnit;
    await writeData(principalDataPath, { ...data, academicUnits: units });
    return updatedUnit;
}


// Laboratories
export async function getLaboratories(): Promise<Omit<Laboratory, 'softwares' | 'machines'>[]> {
    const data = await readData<{ laboratories: Laboratory[] }>(labsDataPath);
    // Retorna os laboratórios com ID e sem os arrays de software e máquinas para a lista principal
    return (data.laboratories || []).map(({ softwares, machines, ...lab }) => ({
        id: lab.id,
        predio: lab.predio,
        bloco: lab.bloco,
        sala: lab.sala,
        estacao: lab.estacao,
        nomeContato: lab.nomeContato,
        emailContato: lab.emailContato,
        ramalContato: lab.ramalContato,
    }));
}

export async function getLaboratoryById(id: number): Promise<Laboratory | null> {
    const data = await readData<{ laboratories: Laboratory[] }>(labsDataPath);
    return (data.laboratories || []).find(l => l.id === id) || null;
}

export async function createLaboratory(labData: Partial<Pick<Laboratory, 'id'>> & Omit<Laboratory, 'softwares' | 'machines'>): Promise<Laboratory> {
  const data = await readData<{ laboratories: Laboratory[] }>(labsDataPath);
  const labs = data.laboratories || [];

  // Se ID foi fornecido e já existe, atualiza o laboratório existente
  if (typeof labData.id === 'number') {
    const existingIndex = labs.findIndex(l => l.id === labData.id);
    if (existingIndex !== -1) {
      const existing = labs[existingIndex];
      const updated: Laboratory = {
        ...existing,
        predio: labData.predio,
        bloco: labData.bloco,
        sala: labData.sala,
        estacao: labData.estacao,
        nomeContato: labData.nomeContato,
        emailContato: labData.emailContato,
        ramalContato: labData.ramalContato,
      } as Laboratory;
      labs[existingIndex] = updated;
      await writeData(labsDataPath, { ...data, laboratories: labs });
      return updated;
    }
    // Se não existe, cria com o ID fornecido
    const newLab: Laboratory = {
      id: labData.id,
      predio: labData.predio!,
      bloco: labData.bloco,
      sala: labData.sala!,
      estacao: labData.estacao,
      nomeContato: labData.nomeContato,
      emailContato: labData.emailContato,
      ramalContato: labData.ramalContato,
      softwares: [],
      machines: [],
    };
    labs.push(newLab);
    await writeData(labsDataPath, { ...data, laboratories: labs });
    return newLab;
  }

  // Se não foi fornecido ID, gera um novo
  const newId = labs.length > 0 ? Math.max(...labs.map(l => l.id)) + 1 : 1;
  const newLab: Laboratory = {
    id: newId,
    predio: labData.predio!,
    bloco: labData.bloco,
    sala: labData.sala!,
    estacao: labData.estacao,
    nomeContato: labData.nomeContato,
    emailContato: labData.emailContato,
    ramalContato: labData.ramalContato,
    softwares: [],
    machines: [],
  };
  labs.push(newLab);
  await writeData(labsDataPath, { ...data, laboratories: labs });
  return newLab;
}

export async function updateLaboratory(id: number, updateData: Partial<Omit<Laboratory, 'id' | 'softwares' | 'machines'>>): Promise<Laboratory | null> {
    const data = await readData<{ laboratories: Laboratory[] }>(labsDataPath);
    const labs = data.laboratories || [];
    const labIndex = labs.findIndex(l => l.id === id);
    if (labIndex === -1) return null;

    const updatedLab = { ...labs[labIndex], ...updateData };
    labs[labIndex] = updatedLab;
    await writeData(labsDataPath, { ...data, laboratories: labs });
    return updatedLab;
}

export async function deleteLaboratory(id: number): Promise<{ success: boolean }> {
    const data = await readData<{ laboratories: Laboratory[] }>(labsDataPath);
    const labs = data.laboratories || [];
    const updatedLabs = labs.filter(l => l.id !== id);
    
    if (labs.length === updatedLabs.length) return { success: false }; // Nenhum lab foi removido

    await writeData(labsDataPath, { ...data, laboratories: updatedLabs });
    return { success: true };
}

// Software
export async function getSoftwareByLaboratory(laboratoryId: number): Promise<Software[]> {
    const lab = await getLaboratoryById(laboratoryId);
    return lab?.softwares || [];
}

export async function createSoftware(laboratoryId: number, softwareData: Omit<Software, 'id' | 'laboratoryId'>): Promise<Software> {
    const data = await readData<{ laboratories: Laboratory[] }>(labsDataPath);
    const labs = data.laboratories || [];
    const labIndex = labs.findIndex(l => l.id === laboratoryId);
    if (labIndex === -1) throw new Error('Laboratório não encontrado');

    const lab = labs[labIndex];
    const newId = lab.softwares.length > 0 ? Math.max(...lab.softwares.map(s => s.id)) + 1 : 1;
    const newSoftware: Software = { id: newId, laboratoryId, ...softwareData };
    lab.softwares.push(newSoftware);

    await writeData(labsDataPath, { ...data, laboratories: labs });
    return newSoftware;
}

export async function updateSoftware(id: number, laboratoryId: number, updateData: Partial<Software>): Promise<Software | null> {
    const data = await readData<{ laboratories: Laboratory[] }>(labsDataPath);
    const labs = data.laboratories || [];
    const labIndex = labs.findIndex(l => l.id === laboratoryId);
    if (labIndex === -1) return null;

    const lab = labs[labIndex];
    const swIndex = lab.softwares.findIndex(s => s.id === id);
    if (swIndex === -1) return null;

    const updatedSoftware = { ...lab.softwares[swIndex], ...updateData };
    lab.softwares[swIndex] = updatedSoftware;

    await writeData(labsDataPath, { ...data, laboratories: labs });
    return updatedSoftware;
}

export async function deleteSoftware(id: number, laboratoryId: number): Promise<{ success: boolean }> {
    const data = await readData<{ laboratories: Laboratory[] }>(labsDataPath);
    const labs = data.laboratories || [];
    const labIndex = labs.findIndex(l => l.id === laboratoryId);
    if (labIndex === -1) return { success: false };

    const lab = labs[labIndex];
    const originalLength = lab.softwares.length;
    lab.softwares = lab.softwares.filter(s => s.id !== id);

    if (lab.softwares.length === originalLength) return { success: false };

    await writeData(labsDataPath, { ...data, laboratories: labs });
    return { success: true };
}


// Machines
export async function getMachinesByLaboratory(laboratoryId: number): Promise<Machine[]> {
    const lab = await getLaboratoryById(laboratoryId);
    return lab?.machines || [];
}

export async function createMachine(laboratoryId: number, machineData: Omit<Machine, 'id' | 'laboratoryId'>): Promise<Machine> {
    const data = await readData<{ laboratories: Laboratory[] }>(labsDataPath);
    const labs = data.laboratories || [];
    const labIndex = labs.findIndex(l => l.id === laboratoryId);
    if (labIndex === -1) throw new Error('Laboratório não encontrado');

    const lab = labs[labIndex];
    const newId = lab.machines.length > 0 ? Math.max(...lab.machines.map(m => m.id)) + 1 : 1;
    const newMachine: Machine = { id: newId, laboratoryId, ...machineData, formatted: machineData.formatted ?? false };
    lab.machines.push(newMachine);

    await writeData(labsDataPath, { ...data, laboratories: labs });
    return newMachine;
}

export async function updateMachine(id: number, laboratoryId: number, updateData: Partial<Machine>): Promise<Machine | null> {
    const data = await readData<{ laboratories: Laboratory[] }>(labsDataPath);
    const labs = data.laboratories || [];
    const labIndex = labs.findIndex(l => l.id === laboratoryId);
    if (labIndex === -1) return null;

    const lab = labs[labIndex];
    const machineIndex = lab.machines.findIndex(m => m.id === id);
    if (machineIndex === -1) return null;

    const updatedMachine = { ...lab.machines[machineIndex], ...updateData };
    lab.machines[machineIndex] = updatedMachine;

    await writeData(labsDataPath, { ...data, laboratories: labs });
    return updatedMachine;
}

export async function deleteMachine(id: number, laboratoryId: number): Promise<{ success: boolean }> {
    const data = await readData<{ laboratories: Laboratory[] }>(labsDataPath);
    const labs = data.laboratories || [];
    const labIndex = labs.findIndex(l => l.id === laboratoryId);
    if (labIndex === -1) return { success: false };

    const lab = labs[labIndex];
    const originalLength = lab.machines.length;
    lab.machines = lab.machines.filter(m => m.id !== id);

    if (lab.machines.length === originalLength) return { success: false };

    await writeData(labsDataPath, { ...data, laboratories: labs });
    return { success: true };
}
