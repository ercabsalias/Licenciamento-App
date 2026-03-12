// Mock data simulating API responses

// --- AUTH INTERFACES ---

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  token: string;
}

export interface Organizacao {
  id: string;
  nome: string;
  codigo: string;
  activo: boolean;
}

export interface Empresa {
  id: string;
  nome: string;
  codigo: string;
  organizacaoId: string;
  activo: boolean;
}

export interface Utilizador {
  id: string;
  utilizador: string;
  nome: string;
  email: string;
  perfilId: string;
  empresaId: string;
  activo: boolean;
}

export interface Perfil {
  id: string;
  nome: string;
  codigo: string;
  permissoes: string[];
  activo: boolean;
}

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  preco: number;
  macAddresses: string[];
  activo: boolean;
  licencaValida: boolean;
  suporteIncluido: boolean;
  versao: string;
  dataExpiracao: string;
}

export interface Cliente {
  codigo: string;
  codigoLic: string;
  nome: string;
  numeroContribuinte: string;
  codigoERP: string;
  jsonLic?: string;
  macAddress?: string;
  activo?: boolean;
}

export interface LinhaProduto {
  id: string;
  produto: string;
  descricao: string;
  dataInicio: string;
  dataFinal: string;
  activo: boolean;
  selected: boolean;
}

export interface MacEntry {
  id: string;
  macAddress: string;
}

export interface Licenca {
  id?: string;
  cliente: Cliente;
  linhasProdutos: LinhaProduto[];
  macAddresses: MacEntry[]; // ✅ Corrigido
}

// ===== CHECK LIC ENDPOINT RESPONSE =====

export interface CheckLicLicEnt {
  id: string;
  codLic: string;
  codigo: string;
  codigoErp: string;
  nome: string;
  nif: string;
  jsonLic: string | null;
  macAddress: string;
  activo: boolean;
}

export interface CheckLicMac {
  id: string;
  codLic: string;
  macAddress: string;
}

export interface CheckLicProduto {
  id: string;
  idLicEnt: string;
  codProduto: string;
  tipoSubscricao: number;
  validadeDe: string;
  validadeAte: string;
  activo: boolean;
  funcionalidades: string | null;
}

export interface CheckLicResponse {
  licEnt: CheckLicLicEnt;
  macs: CheckLicMac[];
  produtos: CheckLicProduto[];
}

// ==== GENERATE REQUEST/RESPONSE TYPES ====

export interface GenerateFuncionalidade {
  id: string;
  idLicEntDet: string;
  codProdPai: string;
  codFuncionalidade: string;
  descricaoFunc: string;
}

export interface GenerateProduto {
  id: string;
  idLicEnt: string;
  codProduto: string;
  tipoSubscricao: number;
  validadeDe: string;
  validadeAte: string;
  activo: boolean;
  funcionalidades?: GenerateFuncionalidade[];
}

export interface GenerateRequest {
  licEnt: {
    // id may be omitted when creating a new record; server will assign a GUID
    id?: string;
    codLic: string;
    codigo: string;
    codigoErp: string;
    nome: string;
    nif: string;
    jsonLic: string;
    macAddress: string;
    activo: boolean;
  };
  macs: {
    id: string;
    codLic: string;
    macAddress: string;
  }[];
  // older swagger examples called this "produtos", but the backend actually
  // validates a required `Licencas` property (see error message).  keep both
  // names so the types stay backwards‑compatible, but the client will send
  // `licencas` when posting.
  produtos?: GenerateProduto[];
  licencas: GenerateProduto[];
}

// --- MOCK DATA ---

export const mockProdutos: Produto[] = [
  {
    id: "1",
    codigo: "PROD001",
    nome: "Software Licença Básica",
    descricao: "Licença básica para uso do software",
    preco: 100000,
    macAddresses: ["00:1B:44:11:3A:B7", "00:1B:44:11:3A:B8"],
    activo: true,
    licencaValida: true,
    suporteIncluido: false,
    versao: "1.0.0",
    dataExpiracao: "2026-12-31",
  },
  {
    id: "2",
    codigo: "PROD002",
    nome: "Software Licença Premium",
    descricao: "Licença premium com funcionalidades avançadas",
    preco: 250000,
    macAddresses: ["00:1B:44:11:3A:B9"],
    activo: true,
    licencaValida: true,
    suporteIncluido: true,
    versao: "2.1.0",
    dataExpiracao: "2027-06-30",
  },
];

export const mockLicencas: Licenca[] = [
  {
    cliente: {
      codigo: "DEPAYLIQ",
      codigoLic: "LIC001",
      nome: "Demo E-Payment Liquidacao",
      numeroContribuinte: "5417832901",
      codigoERP: "ERP001",
    },
    linhasProdutos: [
      {
        id: "1",
        produto: "PROD001",
        descricao: "Software Licença Básica",
        dataInicio: "2024-01-01",
        dataFinal: "2026-12-31",
        activo: true,
        selected: false,
      },
      {
        id: "2",
        produto: "PROD002",
        descricao: "Software Licença Premium",
        dataInicio: "2024-01-01",
        dataFinal: "2027-06-30",
        activo: true,
        selected: true,
      },
    ],
    macAddresses: [
      { id: "1", macAddress: "00:1B:44:11:3A:B7" },
      { id: "2", macAddress: "00:1B:44:11:3A:B8" },
    ],
  },
  {
    cliente: {
      codigo: "DOEPAYMENT",
      codigoLic: "LIC002",
      nome: "Demo E-Payment",
      numeroContribuinte: "5417832902",
      codigoERP: "ERP002",
    },
    linhasProdutos: [
      {
        id: "6",
        produto: "PROD001",
        descricao: "Software Licença Básica",
        dataInicio: "2024-02-01",
        dataFinal: "2026-12-31",
        activo: false,
        selected: false,
      },
    ],
    macAddresses: [
      { id: "3", macAddress: "00:1B:44:11:3A:B9" },
    ],
  },
];

// API service layer

export const api = {
  getProdutoByCode: async (codigo: string): Promise<Produto | null> => {
    return new Promise((resolve) =>
      setTimeout(() => {
        const produto = mockProdutos.find((p) => p.codigo === codigo);
        resolve(produto || null);
      }, 300)
    );
  },

  updateProduto: async (produto: Produto): Promise<void> => {
    return new Promise((resolve) =>
      setTimeout(() => {
        const index = mockProdutos.findIndex((p) => p.id === produto.id);
        if (index !== -1) {
          mockProdutos[index] = produto;
        }
        resolve();
      }, 300)
    );
  },

  getLicencaByCode: async (codigoLic: string): Promise<Licenca | null> => {
    return new Promise((resolve) =>
      setTimeout(() => {
        const licenca = mockLicencas.find(
          (l) => l.cliente.codigoLic === codigoLic
        );
        resolve(licenca || null);
      }, 300)
    );
  },

  getLicencaByClientCode: async (
    codigoCliente: string
  ): Promise<Licenca | null> => {
    return new Promise((resolve) =>
      setTimeout(() => {
        const licenca = mockLicencas.find(
          (l) => l.cliente.codigo === codigoCliente
        );
        resolve(licenca || null);
      }, 300)
    );
  },

  updateLicenca: async (licenca: Licenca): Promise<void> => {
    return new Promise((resolve) =>
      setTimeout(() => {
        const index = mockLicencas.findIndex(
          (l) => l.cliente.codigoLic === licenca.cliente.codigoLic
        );
        if (index !== -1) {
          mockLicencas[index] = licenca;
        }
        resolve();
      }, 300)
    );
  },
};