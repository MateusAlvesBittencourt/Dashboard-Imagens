#!/usr/bin/env node

/**
 * Teste de CRUD simplificado
 * Valida endpoints de units, labs, software e machines
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

interface tRPCRequest {
  0?: any;
}

async function callEndpoint(path: string, input?: any): Promise<any> {
  const url = `${BASE_URL}/api/trpc/${path}`;
  const body: tRPCRequest = input ? { 0: input } : {};

  console.log(`\n📡 POST ${path}`);
  console.log(`   Input:`, JSON.stringify(input || {}, null, 2).slice(0, 100));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json() as any;
    const result = data?.[0]?.result?.data;
    console.log(`   ✅ Response:`, JSON.stringify(result || data, null, 2).slice(0, 150));
    return result;
  } catch (error: any) {
    console.log(`   ❌ Error:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🧪 CRUD Integration Tests\n');
  console.log('⏳ Aguardando servidor em', BASE_URL);

  // Health check
  try {
    const health = await fetch(`${BASE_URL}/healthz`);
    if (!health.ok) throw new Error('Unhealthy');
    console.log('✅ Servidor respondendo\n');
  } catch {
    console.error('❌ Servidor não respondendo');
    process.exit(1);
  }

  // Test 1: List Units (READ)
  console.log('\n--- Teste 1: Listar Cronograma ---');
  const units = await callEndpoint('academicUnits.list');
  console.log(`   Total de unidades: ${Array.isArray(units) ? units.length : 0}`);

  // Test 2: Create Unit
  console.log('\n--- Teste 2: Criar Cronograma ---');
  const newUnit = await callEndpoint('academicUnits.create', {
    name: `Unit-${Date.now()}`,
    criacao: new Date().toISOString().split('T')[0],
  });
  console.log(`   ID da nova unidade: ${newUnit?.id}`);

  // Test 3: List Laboratories
  console.log('\n--- Teste 3: Listar Laboratórios ---');
  const labs = await callEndpoint('laboratories.list');
  console.log(`   Total de laboratórios: ${Array.isArray(labs) ? labs.length : 0}`);

  // Test 4: Create Laboratory
  console.log('\n--- Teste 4: Criar Laboratório ---');
  const newLab = await callEndpoint('laboratories.create', {
    predio: `Predio-${Date.now()}`,
    sala: '101',
    bloco: 'A',
    nomeContato: 'Teste',
  });
  console.log(`   ID do novo lab: ${newLab?.id}`);

  // Test 5: Create Software (if lab was created)
  if (newLab?.id) {
    console.log('\n--- Teste 5: Criar Software ---');
    const newSoft = await callEndpoint('software.create', {
      laboratoryId: newLab.id,
      softwareName: `SW-${Date.now()}`,
      version: '1.0',
      license: 'Gratuito',
    });
    console.log(`   ID do software: ${newSoft?.id}`);

    // Test 6: Get Software by Lab
    console.log('\n--- Teste 6: Listar Software do Lab ---');
    const labSofts = await callEndpoint('software.getByLaboratory', {
      laboratoryId: newLab.id,
    });
    console.log(`   Total de softwares: ${Array.isArray(labSofts) ? labSofts.length : 0}`);

    // Test 7: Create Machine
    console.log('\n--- Teste 7: Criar Máquina ---');
    const newMach = await callEndpoint('machines.create', {
      laboratoryId: newLab.id,
      hostname: `PC-${Date.now()}`,
      patrimonio: 'PAT-123',
      formatted: false,
    });
    console.log(`   ID da máquina: ${newMach?.id}`);

    // Test 8: Get Machines by Lab
    console.log('\n--- Teste 8: Listar Máquinas do Lab ---');
    const labMachs = await callEndpoint('machines.getByLaboratory', {
      laboratoryId: newLab.id,
    });
    console.log(`   Total de máquinas: ${Array.isArray(labMachs) ? labMachs.length : 0}`);
  }

  console.log('\n✨ Testes finalizados!\n');
}

main().catch(console.error);
