# Guia de Persistência de Dados

## Visão Geral

O sistema foi modificado para armazenar dados localmente no caminho padrão do Windows: **`C:\Program Files\dashboard\banco`**

Em vez de usar S3 ou armazenamento em nuvem, todos os dados agora são persistidos em arquivos JSON neste diretório.

## Estrutura de Dados

### Diretório Padrão
```
C:\Program Files\dashboard\banco\
├── data_principal.json    (Unidades Acadêmicas / Cronogramas)
└── data_labs.json         (Laboratórios, Software, Máquinas)
```

### Formato dos Dados

#### `data_principal.json`
Armazena informações sobre as unidades acadêmicas:
```json
{
  "academicUnits": [
    {
      "id": 1,
      "name": "Unidade de TI",
      "emailCronograma": "email@pucrs.br",
      "emailReforco": "email@pucrs.br",
      "cienciaUnidade": "2025-01-15",
      "listaSoftwares": "2025-01-15",
      "criacao": "2025-01-15",
      "testeDeploy": "2025-01-15",
      "homologacao": "2025-01-15",
      "aprovacao": "2025-01-15",
      "implantacao": "2025-01-15"
    }
  ]
}
```

#### `data_labs.json`
Armazena informações sobre laboratórios, software e máquinas:
```json
{
  "laboratories": [
    {
      "id": 1,
      "predio": "Prédio A",
      "bloco": "Bloco 1",
      "sala": "101",
      "estacao": "Estação 1",
      "nomeContato": "João",
      "emailContato": "joao@pucrs.br",
      "ramalContato": "1234",
      "softwares": [
        {
          "id": 1,
          "laboratoryId": 1,
          "softwareName": "Visual Studio Code",
          "version": "1.95.0",
          "license": "Gratuito"
        }
      ],
      "machines": [
        {
          "id": 1,
          "laboratoryId": 1,
          "hostname": "LAB-PC-01",
          "patrimonio": "PAT-001",
          "formatted": true,
          "formattedAt": "2025-01-15"
        }
      ]
    }
  ]
}
```

## Como Funciona

### Inicialização do Sistema

1. **Na primeira vez que o servidor inicia**, o sistema:
   - Verifica se o diretório `C:\Program Files\dashboard\banco` existe
   - Se não existir, cria o diretório automaticamente com permissões apropriadas
   - Se os arquivos JSON não existirem, cria com estrutura vazia

2. **A cada operação de leitura/escrita**:
   - Garante que o diretório existe
   - Lê dados do arquivo correspondente
   - Se o arquivo não existir, retorna estrutura padrão vazia
   - Escreve dados no arquivo correspondente

### Fluxo de Dados

```
Cliente (UI)
    ↓
tRPC Endpoint (ex: academicUnits.create)
    ↓
db.ts (createAcademicUnit)
    ↓
ensureDataDirectory() [Cria pasta se necessária]
    ↓
readData() [Lê arquivo JSON]
    ↓
Modifica dados em memória
    ↓
writeData() [Escreve arquivo JSON]
    ↓
Retorna dados para Cliente
```

## Endpoints do Sistema

### Verificar Status dos Dados

**Endpoint**: `GET /api/trpc/system.dataStatus`

**Resposta**:
```json
{
  "path": "C:\\Program Files\\dashboard\\banco",
  "exists": true,
  "message": "Diretório de dados configurado em: C:\\Program Files\\dashboard\\banco"
}
```

Este endpoint é chamado automaticamente na página de **Configurações** para mostrar:
- Caminho completo do armazenamento
- Status se o diretório existe
- Mensagem descritiva

## Permissões Necessárias

O usuário que executa o aplicativo precisa ter permissões de **leitura e escrita** em:
```
C:\Program Files\dashboard\banco\
```

Se houver problemas de permissão:
1. Verifique as permissões da pasta
2. Execute o aplicativo como Administrador (se necessário)
3. Altere as permissões da pasta para o usuário atual

## Recuperação de Dados

Todos os dados são persistidos em JSON para facilitar:
- **Backup**: Simplesmente copie o diretório `C:\Program Files\dashboard\banco\`
- **Migração**: Copie os arquivos JSON para outro computador
- **Recuperação**: Restaure os arquivos JSON do backup

## Segurança

### Considerações Atuais:
- Dados armazenados em texto plano no disco
- Sem criptografia nativa
- Sem controle de acesso por usuário

### Recomendações Futuras:
- Implementar criptografia dos arquivos JSON
- Adicionar autenticação por usuário
- Implementar versionamento de dados
- Adicionar logs de auditoria

## Troubleshooting

### Erro: "Diretório não pode ser criado"
- Verifique permissões em `C:\Program Files\`
- Tente executar como Administrador
- Considere usar `C:\Users\{user}\AppData\Local\dashboard\banco` como alternativa

### Erro: "Arquivo corrompido"
- Verifique se o JSON está bem formatado
- Restaure do backup
- Considere implementar validação de schema

### Dados não persistem
- Verifique se o servidor está salvando corretamente (logs)
- Verifique permissões de escrita na pasta
- Reinicie o servidor

## Migração de Dados

Se você tinha dados em S3:
1. Exporte os dados do S3
2. Importe-os usando a interface de **Gerenciamento de Dados**
3. Os dados serão salvos automaticamente no novo local

## Futuros Melhoramentos

- [ ] Sincronização com backup em nuvem
- [ ] Compressão automática de dados antigos
- [ ] Interface para mudar local de armazenamento
- [ ] Suporte a múltiplos usuários com dados isolados
- [ ] Sistema de versionamento de dados
