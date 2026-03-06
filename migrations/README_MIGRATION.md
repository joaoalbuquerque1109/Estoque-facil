# Guia de Migração para Supabase

## Instruções para Executar a Migração

### Opção 1: Via Supabase Dashboard (Recomendado para iniciantes)

1. **Acesse o Supabase Dashboard**
   - Vá para [https://app.supabase.com](https://app.supabase.com)
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Clique em "SQL Editor" no menu lateral esquerdo
   - Clique em "+ New Query"

3. **Copie e Execute o Script**
   - Abra o arquivo `migrations/001_initial_schema.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em "RUN" para executar

4. **Aguarde a Conclusão**
   - Você verá confirmações de cada comando executado
   - Se houver erros, verifique as mensagens de erro

### Opção 2: Via Supabase CLI

```bash
# 1. Instale a Supabase CLI
npm install -g supabase

# 2. Faça login na sua conta Supabase
supabase login

# 3. Link seu projeto local ao projeto Supabase
supabase link --project-ref seu_project_id

# 4. Execute a migration
supabase db push
```

### Opção 3: Via pgAdmin ou DBeaver (Para usuários avançados)

1. Obtenha as credenciais de banco de dados em Project Settings
2. Conecte-se ao banco via pgAdmin ou DBeaver
3. Execute o script SQL

---

## Estrutura do Banco de Dados

### Tabelas Criadas

#### 1. **profiles** (Usuários)
- `id` (UUID) - ID do usuário (vem do auth.users)
- `email` (TEXT) - Email do usuário
- `role` (ENUM) - Papel do usuário (Admin ou Operator)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### 2. **products** (Produtos)
- `id` (UUID) - Identificador único
- `name` (TEXT) - Nome do produto
- `name_lowercase` (TEXT) - Nome em minúsculas (para busca)
- `code` (TEXT) - Código único do produto
- `patrimony` (TEXT) - Número de patrimônio
- `type` (ENUM) - Tipo: 'consumo' ou 'permanente'
- `quantity` (INTEGER) - Quantidade em estoque
- `unit` (TEXT) - Unidade de medida (und, Resma, caixa, etc)
- `category` (TEXT) - Categoria do produto
- `image` (TEXT) - URL da imagem do produto
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### 3. **movements** (Movimentações)
- `id` (UUID) - Identificador único
- `product_id` (UUID) - Referência ao produto
- `date` (TIMESTAMP) - Data da movimentação
- `type` (ENUM) - Tipo: 'Entrada', 'Saída', 'Devolução', 'Auditoria'
- `entry_type` (ENUM) - Tipo de entrada: 'Oficial' ou 'Não Oficial' (opcional)
- `quantity` (INTEGER) - Quantidade movimentada
- `responsible` (TEXT) - Responsável pela movimentação
- `department` (TEXT) - Departamento envolvido
- `supplier` (TEXT) - Fornecedor (para entradas)
- `invoice` (TEXT) - Número da nota fiscal
- `product_type` (ENUM) - Tipo do produto na época da movimentação
- `changes` (TEXT) - Descrição de alterações
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## Políticas de Segurança (RLS)

### Permissões por Papel

#### **Admin**
- ✅ Ler todas as tabelas
- ✅ Criar, atualizar e deletar produtos
- ✅ Criar, atualizar e deletar movimentações
- ✅ Gerenciar usuários e papéis

#### **Operator**
- ✅ Ler produtos
- ✅ Ler movimentações
- ✅ Criar movimentações (registrar entrada/saída)
- ❌ Editar/deletar dados de outra pessoa
- ❌ Gerenciar usuários

---

## Próximas Etapas

### 1. Criar Bucket de Armazenamento

```bash
# Via Supabase Dashboard:
# 1. Vá para Storage > Buckets
# 2. Clique em "New Bucket"
# 3. Nomeie como "products"
# 4. Marque como Public
# 5. Clique em Create Bucket
```

### 2. Configurar Autenticação

```bash
# Via Supabase Dashboard:
# 1. Vá para Authentication > Providers
# 2. Configure Email/Password (já vem ativado)
# 3. (Opcional) Configure Google OAuth:
#    - Vá para Google Cloud Console
#    - Crie OAuth credentials
#    - Configure em Supabase
```

### 3. Variáveis de Ambiente

Adicione ao seu `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key_aqui
```

---

## Dados de Teste

O script incluir 10 produtos de exemplo:
- 4 produtos de consumo (canetas, papel)
- 3 produtos permanentes (monitor, mouse, teclado)
- 2 móveis
- 1 grampeador

Você pode deletar esses dados depois ou usar como base para testes.

---

## Troubleshooting

### Erro: "UUID extension not found"
- Supabase já vem com uuid-ossp habilitado
- Se receber esse erro, verifique a versão do PostgreSQL

### Erro: "Role or permission denied"
- Verifique se você está usando uma conta Admin
- Confirme que as variáveis de ambiente estão corretas

### Erro: "Duplicate key value violates unique constraint"
- Alguns produtos podem ter o mesmo código
- Altere a query de INSERT ou delete dados duplicados

---

## Verificando se Funcionou

Após executar o script, verifique:

1. **No SQL Editor:**
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   ```

2. **Contar produtos:**
   ```sql
   SELECT COUNT(*) FROM public.products;
   ```

3. **Verificar permissões:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename IN ('products', 'movements', 'profiles');
   ```

---

## Backup e Recovery

Para fazer backup do banco:

```bash
# Via pg_dump (se tiver acesso direto)
pg_dump "postgresql://user:password@host/database" > backup.sql

# Via Supabase Dashboard:
# 1. Project Settings > Database > Backups
# 2. Clique em "Download" para um backup existente
```

---

## Documentação Adicional

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)

---

**Data:** 5 de março de 2026
**Versão:** 1.0
**Autor:** Migração Firebase → Supabase
