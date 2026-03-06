# Migração de Firebase para Supabase ✨

Este projeto foi migrado de Firebase para Supabase. Abaixo estão as instruções para configurar e usar o projeto com Supabase.

## 🔧 Configuração do Supabase

### 1. Criar um Projeto Supabase

1. Aceda a [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Crie um novo projeto
4. Anote o **URL do Projeto** e a **Chave Anon** (Anonymous Key)

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
```

### 3. Criar Tabelas no Supabase

Use o SQL Editor do Supabase para criar as seguintes tabelas:

#### Tabela `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'Operator',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Tabela `products`
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_lowercase VARCHAR(255),
  code VARCHAR(100) UNIQUE NOT NULL,
  patrimony VARCHAR(100),
  type VARCHAR(50) NOT NULL,
  quantity INTEGER DEFAULT 0,
  unit VARCHAR(50),
  category VARCHAR(100),
  reference VARCHAR(255),
  image VARCHAR(500),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### Tabela `movements`
```sql
CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  date TIMESTAMP NOT NULL,
  type VARCHAR(50) NOT NULL,
  entry_type VARCHAR(50),
  quantity INTEGER NOT NULL,
  responsible VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  supplier VARCHAR(255),
  invoice VARCHAR(100),
  product_type VARCHAR(50),
  changes TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

### 4. Configurar Storage (Opcional)

Para armazenar imagens:

1. Vá para o painel do Supabase
2. Clique em "Storage"
3. Crie um novo bucket chamado "products"
4. Configure as politicas RLS (Row Level Security) conforme necessário

## 📦 Dependências

O projeto agora usa as seguintes dependências relacionadas ao Supabase:

- `@supabase/supabase-js`: Cliente JavaScript/TypeScript para Supabase

As seguintes dependências do Firebase foram removidas:
- `firebase`
- `firebase-admin`
- `firebase-functions`

## 🚀 Instalação

```bash
# Instale as dependências
npm install

# Execute o servidor de desenvolvimento
npm run dev
```

## 📝 Alterações Principais

### Arquivos Removidos
- `src/lib/firebase.ts` - Configuração do Firebase
- `apphosting.yaml` - Configuração do Firebase Hosting
- `firestore.rules` - Regras Firestore
- `firestore.indexes.json` - Índices Firestore

### Arquivos Criados
- `src/lib/supabase.ts` - Configuração do Supabase
- `.env.example` - Template de variáveis de ambiente

### Arquivos Modificados
- `src/lib/firestore.ts` - Reescrito para usar Supabase
- `src/contexts/AuthContext.tsx` - Reescrito para usar Supabase Auth
- `src/app/login/page.tsx` - Reescrito para usar Supabase Auth
- `src/app/dashboard/components/admin-sync-auth-dialog.tsx` - Adaptado para Supabase
- `src/app/dashboard/layout.tsx` - Removidas importações do Firebase
- `src/app/dashboard/page.tsx` - Removidas importações do Firebase
- `next.config.ts` - Atualizado para remotePatterns do Supabase
- `package.json` - Removidas dependências do Firebase
- `.gitignore` - Atualizado para ignorar arquivos Supabase

## 🔐 Autenticação

A autenticação agora usa o Supabase Auth. Os usuários podem fazer login com:
- Email e senha

## 📊 Funcionalidades Mantidas

Todas as funcionalidades principais foram mantidas:
- ✅ Autenticação de utilizadores
- ✅ Gestão de produtos
- ✅ Registos de movimentações
- ✅ Gestão de entradas e saídas
- ✅ Controlos de devolução
- ✅ Gestão de utilizadores (Admin)
- ✅ Upload de imagens
- ✅ Dashboard com gráficos

## ⚠️ Notas Importantes

1. **IDs**: O Supabase usa UUIDs por padrão. Se o seu código anterior esperava IDs string do Firestore, já foi adaptado.

2. **Transações**: As transações do Firestore foram substituídas por operações sequenciais com validação de erros. Para operações mais complexas que requerem transações, considere criar uma Stored Function no PostgreSQL/Supabase.

3. **Real-time**: Se precisa de atualizações em tempo real, o Supabase oferece subscriptions real-time via WebSockets. Veja a documentação do Supabase para mais detalhes.

4. **Armazenamento de Ficheiros**: As imagens são armazenadas no Storage do Supabase. Configure as RLS policies conforme necessário.

## 📞 Suporte

Para mais informações sobre Supabase, visite [supabase.com/docs](https://supabase.com/docs)
