import fs from 'fs';
import path from 'path';
import { appRouter } from '../server/routers';

async function main() {
  const [,, filePath] = process.argv;
  if (!filePath) {
    console.error('Uso: pnpm run import:json <caminho-do-arquivo.json>');
    process.exit(1);
  }
  const abs = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) {
    console.error('Arquivo não encontrado:', abs);
    process.exit(1);
  }
  const content = fs.readFileSync(abs, 'utf-8');

  // createCaller precisa de um contexto com user para protectedProcedure
  const caller = appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: { openId: 'local-import' } as any,
  });

  try {
    const result = await caller.import.importFromJson({ content });
    console.log('Import OK:', result);
  } catch (e) {
    console.error('Falha na importação:', e);
    process.exit(1);
  }
}

main();
