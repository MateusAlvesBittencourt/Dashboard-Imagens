import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/trpc';

async function testCreateUnit() {
  console.log('🧪 Testando criação de unidade (cronograma)...\n');

  try {
    const payload = {
      0: {
        name: `Teste Unidade ${Date.now()}`,
        emailCronograma: undefined,
        emailReforco: undefined,
        cienciaUnidade: undefined,
        listaSoftwares: undefined,
        criacao: undefined,
        testeDeploy: undefined,
        homologacao: undefined,
        aprovacao: undefined,
        implantacao: undefined,
      }
    };

    console.log('📤 Enviando:', JSON.stringify(payload, null, 2));

    const response = await axios.post(`${BASE_URL}/academicUnits.create`, payload, {
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true, // Aceita qualquer status
    }).catch(err => {
      console.error('Erro de conexão:', err.code, err.message);
      if (err.response) {
        console.error('Response data:', err.response.data);
      }
      throw err;
    });

    console.log('\n📥 Resposta (status', response.status + '):\n');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data?.[0]?.error) {
      console.error('\n❌ Erro:', response.data[0].error);
      return;
    }

    const result = response.data?.[0]?.result?.data;
    if (result) {
      console.log('\n✅ Unidade criada:', result);
    } else {
      console.log('\n⚠️  Resposta inesperada');
    }
  } catch (error: any) {
    console.error('\n❌ Erro na requisição:', error.message);
    if (error.response?.data) {
      console.error('Dados da resposta:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCreateUnit();
