import fs from 'fs/promises';
import path from 'path';

const dataDir = 'C:\\Program Files\\dashboard\\banco';
const labsPath = path.join(dataDir, 'data_labs.json');

interface Software {
  id?: number;
  laboratoryId?: number;
  softwareName: string;
  version?: string | null;
  license: 'Pago' | 'Gratuito';
}

interface Machine {
  id?: number;
  laboratoryId?: number;
  hostname: string;
  patrimonio?: string | null;
  formatted: boolean;
  formattedAt?: string | null;
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
  machines?: Machine[];
}

interface LabsData {
  laboratories: Laboratory[];
}

async function fixDataStructure() {
  try {
    console.log('[Fix] Lendo dados de laboratórios...');
    const content = await fs.readFile(labsPath, 'utf-8');
    const data: LabsData = JSON.parse(content);

    console.log(`[Fix] Encontrados ${data.laboratories.length} laboratórios`);

    // Corrigir estrutura dos softwares e máquinas
    data.laboratories.forEach((lab, labIndex) => {
      console.log(`[Fix] Processando laboratório ${lab.id}: ${lab.predio} - ${lab.sala}`);

      // Corrigir softwares
      if (lab.softwares && Array.isArray(lab.softwares)) {
        lab.softwares = lab.softwares.map((software, softIndex) => ({
          id: softIndex + 1,
          laboratoryId: lab.id,
          softwareName: software.softwareName,
          version: software.version || null,
          license: software.license as 'Pago' | 'Gratuito',
        }));
        console.log(`  - ${lab.softwares.length} softwares corrigidos`);
      }

      // Corrigir máquinas (se existirem)
      if (lab.machines && Array.isArray(lab.machines)) {
        lab.machines = lab.machines.map((machine, machIndex) => ({
          id: machIndex + 1,
          laboratoryId: lab.id,
          hostname: machine.hostname,
          patrimonio: machine.patrimonio || null,
          formatted: machine.formatted || false,
          formattedAt: machine.formattedAt || null,
        }));
        console.log(`  - ${lab.machines.length} máquinas corrigidas`);
      } else {
        lab.machines = [];
      }
    });

    // Salvar dados corrigidos
    console.log('[Fix] Salvando dados corrigidos...');
    await fs.writeFile(labsPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('[Fix] ✓ Dados corrigidos com sucesso!');

    // Estatísticas
    const totalSoftwares = data.laboratories.reduce((sum, lab) => sum + (lab.softwares?.length || 0), 0);
    const totalMachines = data.laboratories.reduce((sum, lab) => sum + (lab.machines?.length || 0), 0);
    console.log(`[Fix] Total de softwares: ${totalSoftwares}`);
    console.log(`[Fix] Total de máquinas: ${totalMachines}`);
  } catch (error) {
    console.error('[Fix] Erro ao corrigir dados:', error);
    process.exit(1);
  }
}

fixDataStructure();
