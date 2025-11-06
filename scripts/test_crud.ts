import axios from 'axios';

const API_URL = 'http://localhost:3000/api/trpc';

// Helpers para fazer chamadas tRPC
async function tRPCCall(path: string, input?: any) {
  try {
    const response = await axios.post(`${API_URL}/${path}`, input ? { 0: input } : {}, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error: any) {
    console.error(`Erro em ${path}:`, error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🧪 Iniciando testes de CRUD...\n');

  try {
    // 1. Testar CREATE + LIST UNIT
    console.log('📋 Teste 1: Criar e listar cronograma (units)...');
    const createUnitRes = await tRPCCall('academicUnits.create', {
      name: 'Unidade Teste ' + Date.now(),
      criacao: new Date().toISOString(),
    });
    console.log('✅ Unidade criada:', createUnitRes);

    const listUnitsRes = await tRPCCall('academicUnits.list');
    console.log('✅ Unidades listadas (total):', listUnitsRes[0]?.result?.data?.length || 0);

    // 2. Testar CREATE + LIST LABORATORY
    console.log('\n🏢 Teste 2: Criar e listar laboratório...');
    const createLabRes = await tRPCCall('laboratories.create', {
      predio: 'Prédio Teste',
      sala: '101',
      bloco: 'A',
      nomeContato: 'João Silva',
    });
    console.log('✅ Laboratório criado:', createLabRes);

    const listLabsRes = await tRPCCall('laboratories.list');
    console.log('✅ Laboratórios listados (total):', listLabsRes[0]?.result?.data?.length || 0);
    const labId = listLabsRes[0]?.result?.data?.[0]?.id;

    // 3. Testar CREATE + LIST SOFTWARE
    if (labId) {
      console.log('\n💾 Teste 3: Criar e listar software...');
      const createSoftRes = await tRPCCall('software.create', {
        laboratoryId: labId,
        softwareName: 'Software Teste',
        version: '1.0.0',
        license: 'Gratuito',
      });
      console.log('✅ Software criado:', createSoftRes);

      const listSoftRes = await tRPCCall('software.getByLaboratory', { laboratoryId: labId });
      console.log('✅ Softwares do lab listados:', listSoftRes[0]?.result?.data?.length || 0);
    }

    // 4. Testar CREATE + LIST MACHINE
    if (labId) {
      console.log('\n🖥️  Teste 4: Criar e listar máquina...');
      const createMachRes = await tRPCCall('machines.create', {
        laboratoryId: labId,
        hostname: 'PC-TESTE-001',
        patrimonio: 'PAT-001',
        formatted: false,
      });
      console.log('✅ Máquina criada:', createMachRes);

      const listMachRes = await tRPCCall('machines.getByLaboratory', { laboratoryId: labId });
      console.log('✅ Máquinas do lab listadas:', listMachRes[0]?.result?.data?.length || 0);
    }

    console.log('\n✨ Todos os testes passaram!');
  } catch (error) {
    console.error('\n❌ Teste falhou:', error);
    process.exit(1);
  }
}

runTests().catch(console.error);
