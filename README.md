# 📊 Dashboard Imagens 2026

**Sistema de Gerenciamento de Laboratórios e Cronogramas de Implementação**

---

> Novo: Modo Local (sem servidor/DB)

- Agora você pode rodar tudo no navegador, sem backend nem banco, usando localStorage.
- Como ativar: crie/edite `.env` na raiz e adicione `VITE_LOCAL_MODE=true`. Depois rode em desenvolvimento.
- O app inicializa com os dados de `data_principal.json` e `data_labs.json` e permite exportar/importar JSON pela tela “Gerenciamento de Dados”.
- Quando quiser voltar ao modo normal, basta remover/colocar `VITE_LOCAL_MODE=false`.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Requisitos do Sistema](#requisitos-do-sistema)
3. [Instalação](#instalação)
4. [Configuração](#configuração)
5. [Como Usar](#como-usar)
6. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
7. [Funcionalidades](#funcionalidades)
8. [Importação e Exportação](#importação-e-exportação)
10. [Troubleshooting](#troubleshooting)
11. [Suporte](#suporte)

---

## 🎯 Visão Geral

O **Dashboard Imagens 2026** é uma aplicação web full-stack desenvolvida para gerenciar:

- **6 Unidades Acadêmicas** com cronogramas de implementação
- **32 Laboratórios** com informações de contato e configurações
- **Softwares instalados** em cada laboratório
- **Histórico completo** de alterações
<!-- Integração de email removida -->

### Tecnologias Utilizadas

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Express + tRPC + Node.js
- **Banco de Dados**: MySQL/TiDB
- **Autenticação**: OAuth (Manus)
- **Build Tool**: Vite
- **Package Manager**: pnpm

---

## 🔧 Requisitos do Sistema

### Mínimo Necessário

- **Node.js**: v18.0.0 ou superior
- **pnpm**: v8.0.0 ou superior (ou npm/yarn)
- **MySQL**: v8.0 ou TiDB
- **Git**: para controle de versão

### Recomendado

- **Node.js**: v20.0.0 ou superior
- **RAM**: 4GB mínimo
- **Espaço em disco**: 2GB para node_modules
- **Conexão**: Internet para OAuth

---

## 📦 Instalação

### Passo 1: Clonar/Extrair o Projeto

```bash
# Se estiver em um ZIP
unzip imagens_dashboard_final.zip
cd imagens_dashboard

# Ou se estiver clonando de um repositório
git clone <seu-repositorio>
cd imagens_dashboard
```

### Passo 2: Instalar Dependências

```bash
# Usando pnpm (recomendado)
pnpm install

# Ou usando npm
npm install

# Ou usando yarn
yarn install
```

### Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Banco de Dados
DATABASE_URL="mysql://usuario:senha@localhost:3306/imagens_dashboard"

# Autenticação OAuth
VITE_APP_ID="seu-app-id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://oauth.manus.im"
JWT_SECRET="sua-chave-secreta-aqui"

# Informações do Proprietário
OWNER_OPEN_ID="seu-open-id"
OWNER_NAME="Seu Nome"

<!-- Integração Gmail removida -->

# Aplicação
VITE_APP_TITLE="Dashboard Imagens 2026"
VITE_APP_LOGO="https://seu-logo.png"
```

### Passo 4: Inicializar Banco de Dados

```bash
# Criar tabelas e executar migrações
pnpm db:push

# Ou manualmente com drizzle
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### Passo 5: Iniciar o Servidor

```bash
# Modo desenvolvimento (com hot reload)
pnpm dev

# Modo produção
pnpm build
pnpm start
```

O dashboard estará disponível em: **http://localhost:3000**

---

## ⚙️ Configuração

### Configuração do Banco de Dados

#### MySQL Local

```bash
# Criar banco de dados
mysql -u root -p
CREATE DATABASE imagens_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'imagens_user'@'localhost' IDENTIFIED BY 'senha_segura';
GRANT ALL PRIVILEGES ON imagens_dashboard.* TO 'imagens_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### TiDB Cloud

1. Acesse https://tidbcloud.com
2. Crie um cluster
3. Copie a string de conexão
4. Cole em `DATABASE_URL` no `.env.local`

### Configuração do OAuth

1. Acesse o painel de administração do Manus
2. Crie uma nova aplicação
3. Configure as URLs de redirecionamento
4. Copie o `VITE_APP_ID`
5. Adicione ao arquivo `.env.local`

<!-- Configuração Gmail removida -->

---

## 🚀 Como Usar

### Acessar o Dashboard

1. Abra seu navegador
2. Acesse `http://localhost:3000`
3. Clique em "Fazer Login"
4. Autentique-se com sua conta

### Página Inicial

A página inicial apresenta:
- Bem-vindo personalizado
- Links rápidos para funcionalidades
- Cards descritivos das principais features
- Informações sobre o sistema

### Dashboard Principal

Acesse em `/dashboard` para:

**Aba: Unidades Acadêmicas**
- Visualizar 6 unidades acadêmicas
- Editar datas de cronograma
- Ver histórico de alterações
- Exportar dados

**Aba: Laboratórios**
- Visualizar 32 laboratórios
- Editar informações de contato
- Gerenciar softwares instalados
- Rastrear configurações

### Gerenciamento de Dados

Acesse em `/data-management` para:

**Importar Dados**
- Upload de arquivos JSON
- Upload de planilhas Excel
- Upload de arquivos CSV
- Validação automática

**Exportar Dados**
- Unidades em CSV
- Laboratórios em CSV
- Softwares em CSV
- Relatório completo em TXT

### Configurações

Acesse em `/settings` para:

<!-- Seção Integração Gmail removida -->

**Gerenciar Usuários**
- Controlar acesso
- Definir permissões
- Ver histórico de login

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: academic_units

Armazena informações das unidades acadêmicas.

```sql
CREATE TABLE academic_units (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  emailCronograma DATETIME,
  emailReforco DATETIME,
  cienciaUnidade DATETIME,
  listaSoftwares DATETIME,
  criacao DATETIME,
  testeDeploy DATETIME,
  homologacao DATETIME,
  aprovacao DATETIME,
  implantacao DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Campos:**
- `id`: Identificador único
- `name`: Nome da unidade (Politécnica, Negócios, Famecos, etc.)
- `*Cronograma`: Datas de marcos do projeto

### Tabela: laboratories

Armazena informações dos laboratórios.

```sql
CREATE TABLE laboratories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  predio VARCHAR(100) NOT NULL,
  bloco VARCHAR(50),
  sala VARCHAR(50) NOT NULL,
  estacao VARCHAR(100),
  nomeContato VARCHAR(255),
  emailContato VARCHAR(255),
  ramalContato VARCHAR(20),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Campos:**
- `id`: Identificador único
- `predio`: Prédio onde fica o laboratório
- `bloco`: Bloco do prédio
- `sala`: Número da sala
- `estacao`: Estação de trabalho
- `nomeContato`: Responsável pelo laboratório
- `emailContato`: Email para contato
- `ramalContato`: Ramal telefônico

### Tabela: software_installations

Armazena softwares instalados em cada laboratório.

```sql
CREATE TABLE software_installations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  laboratoryId INT NOT NULL,
  softwareName VARCHAR(255) NOT NULL,
  version VARCHAR(50),
  license VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (laboratoryId) REFERENCES laboratories(id)
);
```

**Campos:**
- `id`: Identificador único
- `laboratoryId`: Referência ao laboratório
- `softwareName`: Nome do software
- `version`: Versão instalada
- `license`: Tipo de licença

### Tabela: laboratory_features

Armazena configurações e características de cada laboratório.

```sql
CREATE TABLE laboratory_features (
  id INT PRIMARY KEY AUTO_INCREMENT,
  laboratoryId INT NOT NULL,
  featureName VARCHAR(255) NOT NULL,
  featureValue TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (laboratoryId) REFERENCES laboratories(id)
);
```

### Tabela: audit_log

Rastreia todas as alterações no sistema.

```sql
CREATE TABLE audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT,
  action VARCHAR(255) NOT NULL,
  tableName VARCHAR(100),
  recordId INT,
  oldValue JSON,
  newValue JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `id`: Identificador único
- `userId`: Usuário que fez a alteração
- `action`: Tipo de ação (CREATE, UPDATE, DELETE)
- `tableName`: Tabela afetada
- `recordId`: ID do registro alterado
- `oldValue`: Valor anterior (JSON)
- `newValue`: Novo valor (JSON)
- `timestamp`: Quando foi alterado

### Tabela: users

Armazena informações dos usuários.

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ✨ Funcionalidades

### 1. Dashboard Interativo

- **Visualização em Tempo Real**: Veja todos os dados atualizados
- **Edição Inline**: Edite diretamente nas tabelas
- **Validação**: Validação automática de dados
- **Responsivo**: Funciona em desktop, tablet e mobile

### 2. Gerenciamento de Unidades

- Criar, ler, atualizar unidades acadêmicas
- Rastrear datas de cronograma
- Visualizar progresso de implementação
- Exportar relatórios por unidade

### 3. Gerenciamento de Laboratórios

- Cadastrar novos laboratórios
- Editar informações de contato
- Rastrear softwares instalados
- Gerenciar configurações

### 4. Histórico de Alterações

- Rastreamento completo de mudanças
- Visualizar quem alterou e quando
- Valores anteriores e novos
- Auditoria completa do sistema

### 5. Autenticação Segura

- Login via OAuth
- Sessões seguras
- Controle de acesso
- Logout automático

### 6. Notificações por Email

- Enviar notificações para unidades
- Gerar e enviar relatórios
- Agendar emails
- Rastrear envios

---

## 📤 Importação e Exportação

### Importar Dados

#### Formato JSON

```json
{
  "academic_units": [
    {
      "name": "Politécnica",
      "emailCronograma": "2024-01-15",
      "criacao": "2024-02-01",
      "testeDeploy": "2024-03-01",
      "homologacao": "2024-04-01",
      "aprovacao": "2024-05-01",
      "implantacao": "2024-06-01"
    }
  ],
  "laboratories": [
    {
      "predio": "Prédio A",
      "bloco": "Bloco 1",
      "sala": "101",
      "nomeContato": "João Silva",
      "emailContato": "joao@email.com",
      "ramalContato": "1234"
    }
  ]
}
```

#### Formato CSV

```csv
ID,Nome,Email Cronograma,Criação,Teste Deploy
1,Politécnica,2024-01-15,2024-02-01,2024-03-01
2,Negócios,2024-01-20,2024-02-05,2024-03-05
```

### Exportar Dados

Acesse `/data-management` e clique em:
- **Unidades Acadêmicas (CSV)** - Exporta todas as unidades
- **Laboratórios (CSV)** - Exporta todos os laboratórios
- **Softwares (CSV)** - Exporta softwares por laboratório
- **Relatório Completo (TXT)** - Exporta relatório formatado

---

## 📧 Integração Gmail

### Configurar Gmail

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto
3. Ative a API do Gmail
4. Crie credenciais OAuth 2.0
5. Configure as URIs autorizadas:
   - `http://localhost:3000/api/gmail/callback` (desenvolvimento)
   - `https://seu-dominio.com/api/gmail/callback` (produção)

### Usar Gmail no Dashboard

1. Acesse `/settings`
2. Clique em "Conectar Gmail"
3. Autorize o acesso
4. Envie notificações e relatórios

### Procedimentos Disponíveis

- `gmail.sendEmail` - Enviar email simples
- `gmail.sendNotificationToUnit` - Enviar notificação formatada
- `gmail.sendReport` - Enviar relatório
- `gmail.scheduleEmail` - Agendar email

---

## 🔍 Estrutura de Arquivos

```
imagens_dashboard/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas do aplicativo
│   │   │   ├── Home.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── DataManagement.tsx
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── lib/              # Utilitários
│   │   └── main.tsx          # Entrada da aplicação
│   └── index.html            # HTML base
│
├── server/                    # Backend Express
│   ├── routers/              # Rotas tRPC
│   │   ├── import.ts         # Importação de dados
│   │   ├── export.ts         # Exportação de dados
│   │   └── gmail.ts          # Integração Gmail
│   ├── db.ts                 # Funções de banco de dados
│   ├── routers.ts            # Definição de rotas
│   └── _core/                # Código central
│
├── drizzle/                  # Migrações do banco de dados
│   ├── schema.ts             # Definição das tabelas
│   └── migrations/           # Histórico de migrações
│
├── shared/                   # Código compartilhado
│   ├── const.ts              # Constantes
│   └── types.ts              # Tipos TypeScript
│
├── package.json              # Dependências do projeto
├── tsconfig.json             # Configuração TypeScript
├── vite.config.ts            # Configuração Vite
└── README_COMPLETO.md        # Este arquivo
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module 'exceljs'"

```bash
# Solução: Instalar dependências novamente
pnpm install
```

### Erro: "Database connection failed"

```bash
# Verificar se MySQL está rodando
mysql -u root -p

# Verificar DATABASE_URL no .env.local
# Formato correto: mysql://usuario:senha@host:porta/banco
```

### Erro: "OAuth callback failed"

1. Verifique se `VITE_APP_ID` está correto
2. Verifique se a URL de redirecionamento está configurada
3. Limpe cookies do navegador
4. Tente novamente

### Erro: "Port 3000 already in use"

```bash
# Usar uma porta diferente
PORT=3001 pnpm dev

# Ou matar o processo na porta 3000
lsof -i :3000
kill -9 <PID>
```

### Dashboard não carrega dados

1. Verifique se o banco de dados está rodando
2. Verifique se as migrações foram executadas: `pnpm db:push`
3. Verifique os logs do servidor
4. Limpe o cache do navegador (Ctrl+Shift+Delete)

---

## 📊 Dados Inclusos

O projeto vem com dados pré-carregados:

### Unidades Acadêmicas (6)
1. Politécnica
2. Negócios
3. Famecos
4. LIVING
5. Humanidades
6. ECSV

### Laboratórios (32)
- Distribuídos entre as unidades
- Com informações de contato
- Com softwares instalados

### Arquivos de Importação
- `import_data.json` - Dados em formato JSON
- `data_principal.json` - Cronograma principal
- `data_labs.json` - Informações dos laboratórios

---

## 🔐 Segurança

### Boas Práticas Implementadas

- ✅ Autenticação OAuth segura
- ✅ Validação de entrada em todas as operações
- ✅ Senhas hasheadas no banco de dados
- ✅ HTTPS recomendado em produção
- ✅ Histórico de auditoria completo
- ✅ Controle de acesso baseado em roles
- ✅ Proteção contra CSRF
- ✅ Sanitização de dados

### Recomendações para Produção

1. **Use HTTPS**: Configure SSL/TLS
2. **Variáveis de Ambiente**: Nunca commite `.env`
3. **Backup Regular**: Faça backup do banco de dados
4. **Monitoramento**: Configure alertas
5. **Atualizações**: Mantenha dependências atualizadas
6. **Logs**: Monitore logs de erro
7. **Firewall**: Configure firewall adequadamente

---

## 📈 Performance

### Otimizações Implementadas

- Lazy loading de componentes
- Cache de dados no cliente
- Compressão de assets
- Otimização de imagens
- Queries otimizadas no banco de dados
- Índices nas tabelas principais

### Monitoramento

```bash
# Ver uso de memória
node --max-old-space-size=4096 server.js

# Habilitar profiling
node --prof server.js
```

---

## 🚀 Deploy

### Deploy em Servidor Linux

```bash
# 1. Clonar projeto
git clone <seu-repositorio>
cd imagens_dashboard

# 2. Instalar dependências
pnpm install

# 3. Build para produção
pnpm build

# 4. Iniciar com PM2
npm install -g pm2
pm2 start "pnpm start" --name "dashboard"
pm2 save
pm2 startup
```

### Deploy em Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

```bash
# Build e run
docker build -t imagens-dashboard .
docker run -p 3000:3000 --env-file .env imagens-dashboard
```

---

## 📞 Suporte

### Documentação

- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Tailwind CSS Documentation](https://tailwindcss.com)

### Contato

Para dúvidas ou problemas:
1. Verifique a seção [Troubleshooting](#troubleshooting)
2. Consulte a documentação das tecnologias
3. Abra uma issue no repositório
4. Entre em contato com o desenvolvedor

---

## 📝 Licença

Este projeto é fornecido como está. Todos os direitos reservados.

---

## 🎉 Versão

**Dashboard Imagens 2026 v1.0.0**

Data de Criação: Outubro 2025

---

## 📋 Checklist de Configuração

- [ ] Node.js v18+ instalado
- [ ] pnpm instalado
- [ ] Banco de dados MySQL/TiDB configurado
- [ ] Arquivo `.env.local` criado
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Migrações executadas (`pnpm db:push`)
- [ ] Servidor iniciado (`pnpm dev`)
- [ ] Dashboard acessível em `http://localhost:3000`
- [ ] Login funcionando
- [ ] Dados carregando corretamente
- [ ] Importação/Exportação testada
- [ ] Gmail configurado (opcional)

---

**Desenvolvido com ❤️ para gerenciamento eficiente de laboratórios e cronogramas.**
