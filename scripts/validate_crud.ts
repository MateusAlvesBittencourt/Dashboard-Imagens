import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function callEndpoint(path: string, input?: any): Promise<any> {
  const url = `${BASE_URL}/api/trpc/${path}`;
  const body = input ? { 0: input } : {};

  console.log(`\n📡 POST ${path}`);
  if (input) console.log(`   Input:`, JSON.stringify(input, null, 2).slice(0, 100));

  try {
    const response = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
    });

    const result = response.data?.[0]?.result?.data;
    console.log(`   ✅ Response:`, typeof result === 'object' ? JSON.stringify(result, null, 2).slice(0, 150) : result);
    return result;
  } catch (error: any) {
    console.log(`   ❌ Error:`, error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('🧪 CRUD Integration Tests\n');

  // Health check
  try {
    await axios.get(`${BASE_URL}/healthz`);
    console.log('✅ Servidor respondendo\n');
  } catch {
    console.error('❌ Servidor não respondendo em', BASE_URL);
    process.exit(1);
  }

  // Test 1: List Units
  console.log('--- Teste 1: Listar Cronograma ---');
  const units = await callEndpoint('academicUnits.list');
  console.log(`Total de unidades: ${Array.isArray(units) ? units.length : 0}`);

  // Test 2: Create Unit
  console.log('\n--- Teste 2: Criar Cronograma ---');
  const newUnit = await callEndpoint('academicUnits.create', {
    name: `Unit-${Date.now()}`,
  });
  console.log(`Unidade criada com ID: ${newUnit?.id}`);

  // Test 3: List Labs
  console.log('\n--- Teste 3: Listar Laboratórios ---');
  const labs = await callEndpoint('laboratories.list');
  console.log(`Total de laboratórios: ${Array.isArray(labs) ? labs.length : 0}`);

  // Test 4: Create Lab
  console.log('\n--- Teste 4: Criar Laboratório ---');
  const newLab = await callEndpoint('laboratories.create', {
    predio: `Predio-${Date.now()}`,
    sala: '101',
    bloco: 'A',
  });
  console.log(`Lab criado com ID: ${newLab?.id}`);

  if (newLab?.id) {
    // Test 5: Create Software
    console.log('\n--- Teste 5: Criar Software ---');
    const newSoft = await callEndpoint('software.create', {
      laboratoryId: newLab.id,
      softwareName: `SW-${Date.now()}`,
      version: '1.0',
      license: 'Gratuito',
    });
    console.log(`Software criado com ID: ${newSoft?.id}`);

    // Test 6: Get Software by Lab
    console.log('\n--- Teste 6: Listar Software do Lab ---');
    const labSofts = await callEndpoint('software.getByLaboratory', {
      laboratoryId: newLab.id,
    });
    console.log(`Total de softwares: ${Array.isArray(labSofts) ? labSofts.length : 0}`);

    // Test 7: Create Machine
    console.log('\n--- Teste 7: Criar Máquina ---');
    const newMach = await callEndpoint('machines.create', {
      laboratoryId: newLab.id,
      hostname: `PC-${Date.now()}`,
      patrimonio: 'PAT-123',
      formatted: false,
    });
    console.log(`Máquina criada com ID: ${newMach?.id}`);

    // Test 8: Get Machines by Lab
    console.log('\n--- Teste 8: Listar Máquinas do Lab ---');
    const labMachs = await callEndpoint('machines.getByLaboratory', {
      laboratoryId: newLab.id,
    });
    console.log(`Total de máquinas: ${Array.isArray(labMachs) ? labMachs.length : 0}`);
  }

  console.log('\n✨ Testes concluídos!\n');
}

main().catch(console.error);
