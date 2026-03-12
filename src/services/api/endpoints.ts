/**
 * API Endpoints Configuration
 * Defines all API endpoints for the application
 */

export const endpoints = {
  // Authentication
  auth: {
    login: '/Users/Login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    validate: '/auth/validate',
  },

  // Organizações
  organizacoes: {
    list: '/organizacoes',
    create: '/organizacoes',
    get: (id: string) => `/organizacoes/${id}`,
    update: (id: string) => `/organizacoes/${id}`,
    delete: (id: string) => `/organizacoes/${id}`,
  },

  // Empresas
  empresas: {
    list: '/empresas',
    create: '/empresas',
    get: (id: string) => `/empresas/${id}`,
    update: (id: string) => `/empresas/${id}`,
    delete: (id: string) => `/empresas/${id}`,
  },

  // Utilizadores
  utilizadores: {
    list: '/utilizadores',
    create: '/utilizadores',
    get: (id: string) => `/utilizadores/${id}`,
    update: (id: string) => `/utilizadores/${id}`,
    delete: (id: string) => `/utilizadores/${id}`,
  },

  // Perfis
  perfis: {
    list: '/perfis',
    create: '/perfis',
    get: (id: string) => `/perfis/${id}`,
    update: (id: string) => `/perfis/${id}`,
    delete: (id: string) => `/perfis/${id}`,
  },

  // Providers
  providers: {
    list: '/providers',
    create: '/providers',
    get: (id: string) => `/providers/${id}`,
    update: (id: string) => `/providers/${id}`,
    delete: (id: string) => `/providers/${id}`,
  },

  // Referências
  referencias: {
    list: '/referencias',
    create: '/referencias',
    get: (id: string) => `/referencias/${id}`,
    update: (id: string) => `/referencias/${id}`,
    delete: (id: string) => `/referencias/${id}`,
    search: '/referencias/search',
    monitor: '/referencias/monitor',
  },

  // Produtos & Licenciamento
  produtos: {
    // O backend expõe um GET simples para recuperar todos os produtos
    list: '/Products/GetProducts',
  },

  licencas: {
    // busca por código de cliente (query string) e gravação/atualização
    byCliente: (codigo: string) => `/Licencas/GetByCliente?codigo=${codigo}`,
    save: '/Licencas/Save',
  },

  // Geração e verificação de licenças
  generate: {
    checkLic: (codigo: string) => `/Lic/CheckLic?Codigo=${codigo}`,
    generate: '/Lic/Generate',
    getLic: (codigoLic: string) => `/Lic/GetLic?CodigoLic=${codigoLic}`,
  },
} as const;
