# Guia de Configuração de API para o Projeto

## Estrutura de Configuração

Criei uma estrutura robusta para gerenciar APIs e variáveis de ambiente. Aqui está o que foi implementado:

### 1. **Variáveis de Ambiente** (`.env.*`)

Existem 3 arquivos de configuração:
- **`.env.example`** - Template com todas as variáveis disponíveis
- **`.env.development`** - Configuração para desenvolvimento local
- **`.env.production`** - Configuração para produção

**Localização**: Raiz do projeto

**Como usar**:
```bash
# Para desenvolvimento (automático com `npm run dev`)
# Usa .env.development

# Para produção (automático com `npm run build`)
# Usa .env.production

# Para criar seu próprio arquivo:
cp .env.example .env.local  # Este será ignorado pelo git
```

### 2. **Configuração de Ambiente** (`src/config/env.ts`)

Arquivo centralizado que carrega e exporta todas as variáveis de ambiente com type safety.

```typescript
import { env } from '@/config/env';

console.log(env.apiBaseUrl);      // URL da API
console.log(env.appEnv);          // 'development' ou 'production'
console.log(env.enableMockData);  // Ativa dados pré-configurados
```

### 3. **Cliente HTTP** (`src/services/api/client.ts`)

Classe `ApiClient` que gerencia todas as requisições HTTP com:
- Suporte a autenticação (Bearer Token)
- Timeout configurável
- Tratamento de erros
- Logging opcional

```typescript
import { apiClient } from '@/services/api/client';

// Definir token de autenticação
apiClient.setToken('seu-token-jwt');

// Fazer requisição
const response = await apiClient.get<Dados>('/endpoint');
```

### 4. **Endpoints** (`src/services/api/endpoints.ts`)

Configuração centralizada de todos os endpoints da API.

```typescript
import { endpoints } from '@/services/api/endpoints';

endpoints.organizacoes.list      // '/organizacoes'
endpoints.organizacoes.get('1')  // '/organizacoes/1'
endpoints.auth.login             // '/auth/login'
```

### 5. **Hooks React Query** (`src/services/api/hooks.ts`)

Hooks prontos para usar com React Query para data fetching e mutations.

```typescript
import { useOrganizacoes, useCreateOrganizacao } from '@/services/api/hooks';

// No seu componente:
const { data, isLoading, error } = useOrganizacoes();
const createMutation = useCreateOrganizacao();
```

## Passo a Passo para Começar

### 1. Configurar o Backend

Edite `.env.development` com a URL do seu backend:

```env
VITE_API_BASE_URL=http://seu-backend:3000/api
VITE_APP_ENV=development
VITE_ENABLE_MOCK_DATA=false  # Desativar dados fake
```

### 2. Atualizar Endpoints (se necessário)

Se sua API tiver uma estrutura diferente, edite `src/services/api/endpoints.ts`:

```typescript
export const endpoints = {
  auth: {
    login: '/v1/auth/login',  // Adapte conforme necessário
  },
  // ... resto dos endpoints
};
```

### 3. Usar os Hooks nos Componentes

```typescript
import { useOrganizacoes } from '@/services/api/hooks';

export function OrganizacoesPage() {
  const { data, isLoading, error } = useOrganizacoes();

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <div>
      {data?.map(org => (
        <div key={org.id}>{org.nome}</div>
      ))}
    </div>
  );
}
```

### 4. Autenticação

Para adicionar autenticação (JWT):

```typescript
import { apiClient } from '@/services/api/client';

// Após fazer login:
const response = await apiClient.post('/auth/login', {
  body: { email, password }
});

if (response.success) {
  // Guardar token
  apiClient.setToken(response.data?.token);
  localStorage.setItem('token', response.data?.token);
}
```

## Estrutura de Pastas Criada

```
src/
├── config/
│   └── env.ts              # Variáveis de ambiente centralizadas
├── services/
│   └── api/
│       ├── client.ts       # Cliente HTTP
│       ├── endpoints.ts    # Endpoints centralizados
│       └── hooks.ts        # Hooks do React Query
```

## Variáveis de Ambiente Disponíveis

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_API_BASE_URL` | URL base da API | `http://localhost:3000/api` |
| `VITE_API_TIMEOUT` | Timeout em ms | `30000` |
| `VITE_APP_ENV` | Ambiente | `development` ou `production` |
| `VITE_AUTH_DOMAIN` | Domain de auth | `auth.openlimits.com` |
| `VITE_SESSION_TIMEOUT` | Timeout da sessão (ms) | `3600000` |
| `VITE_ENABLE_MOCK_DATA` | Usar dados fake | `true` ou `false` |
| `VITE_ENABLE_LOGGING` | Ativar logs | `true` ou `false` |

## Mode Desenvolvimento vs Produção

### Desenvolvimento
```bash
npm run dev  # Usa .env.development
# - API local (localhost:3000)
# - Mock data ativado
# - Logging ativado
```

### Produção
```bash
npm run build  # Usa .env.production
# - API production (api.openlimits.com)
# - Mock data desativado
# - Logging desativado
```

## Exemplo Completo: Página com dados da API

```typescript
import { useOrganizacoes } from '@/services/api/hooks';
import { DataTable } from '@/components/DataTable';

export function OrganizacaoPage() {
  const { data: organizacoes, isLoading, error } = useOrganizacoes();

  if (isLoading) return <div>Carregando organizações...</div>;
  if (error) return <div>Erro ao carregar: {error.message}</div>;

  return (
    <div>
      <h1>Organizações</h1>
      <DataTable 
        data={organizacoes || []} 
        columns={... } 
      />
    </div>
  );
}
```

## Próximos Passos

1. ✅ Estrutura criada
2. ⏭️ Atualizar `.env.development` com URL real do backend
3. ⏭️ Desativar `VITE_ENABLE_MOCK_DATA` quando tiver backend
4. ⏭️ Testar cada endpoint
5. ⏭️ Implementar autenticação/login
6. ⏭️ Adicionar tratamento de erros personalizados

## Dúvidas Comuns

**P: Como desativar mock data?**
A: Edite `.env.development` e mude `VITE_ENABLE_MOCK_DATA=false`

**P: A autenticação é obrigatória?**
A: Não imediatamente, mas adicione depois no `apiClient.setToken()`

**P: Como adicionar novos endpoints?**
A: Edite `src/services/api/endpoints.ts` e adicione em `export const endpoints = { ... }`

**P: O projeto React Query já está instalado?**
A: Sim! Vem no `package.json` como `@tanstack/react-query`
