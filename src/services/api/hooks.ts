/**
 * API Hooks using React Query
 * Provides easy-to-use hooks for data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { endpoints } from './endpoints';
import { env } from '@/config/env';
import {
  Organizacao,
  Empresa,
  Utilizador,
  Perfil,
  LoginRequest,
  LoginResponse,
  Licenca,
  CheckLicResponse,
  GenerateRequest, // ✅ ADICIONADO
} from '@/services/mockData';

// ============ Organizações ============

export const useOrganizacoes = () => {
  return useQuery({
    queryKey: ['organizacoes'],
    queryFn: async () => {
      const response = await apiClient.get<Organizacao[]>(endpoints.organizacoes.list);
      if (!response.success) throw new Error(response.error?.message);
      return response.data || [];
    },
    enabled: !env.enableMockData,
  });
};

// ============ Authentication ============

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      if (env.enableLogging) {
        console.log('login mutation payload', credentials);
      }
      const response = await apiClient.post<LoginResponse>(endpoints.auth.login, {
        body: credentials,
        contentType: 'json',
      });

      if (!response.success) {
        let msg = response.error?.message || '';
        try {
          const parsed = JSON.parse(msg);
          if (parsed && typeof parsed === 'object' && parsed.message) {
            msg = parsed.message;
          }
        } catch (_) {}

        throw new Error(msg);
      }

      return response.data;
    },
  });
};

export const useOrganizacao = (id: string) => {
  return useQuery({
    queryKey: ['organizacoes', id],
    queryFn: async () => {
      const response = await apiClient.get<Organizacao>(endpoints.organizacoes.get(id));
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    enabled: !env.enableMockData && !!id,
  });
};

export const useCreateOrganizacao = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Organizacao, 'id'>) => {
      const response = await apiClient.post<Organizacao>(endpoints.organizacoes.create, {
        body: data,
      });
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizacoes'] });
    },
  });
};

// ============ Empresas ============

export const useEmpresas = () => {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      const response = await apiClient.get<Empresa[]>(endpoints.empresas.list);
      if (!response.success) throw new Error(response.error?.message);
      return response.data || [];
    },
    enabled: !env.enableMockData,
  });
};

export const useEmpresa = (id: string) => {
  return useQuery({
    queryKey: ['empresas', id],
    queryFn: async () => {
      const response = await apiClient.get<Empresa>(endpoints.empresas.get(id));
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    enabled: !env.enableMockData && !!id,
  });
};

// ============ Utilizadores ============

export const useUtilizadores = () => {
  return useQuery({
    queryKey: ['utilizadores'],
    queryFn: async () => {
      const response = await apiClient.get<Utilizador[]>(endpoints.utilizadores.list);
      if (!response.success) throw new Error(response.error?.message);
      return response.data || [];
    },
    enabled: !env.enableMockData,
  });
};

export const useUtilizador = (id: string) => {
  return useQuery({
    queryKey: ['utilizadores', id],
    queryFn: async () => {
      const response = await apiClient.get<Utilizador>(endpoints.utilizadores.get(id));
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    enabled: !env.enableMockData && !!id,
  });
};

// ============ Perfis ============

export const usePerfis = () => {
  return useQuery({
    queryKey: ['perfis'],
    queryFn: async () => {
      const response = await apiClient.get<Perfil[]>(endpoints.perfis.list);
      if (!response.success) throw new Error(response.error?.message);
      return response.data || [];
    },
    enabled: !env.enableMockData,
  });
};

// ======= Produtos & Licenciamento =======

export interface ProdutoApi {
  id: string;
  codigoProduto: string;
  descricao: string;
  api?: boolean;
  pex?: boolean;
}

export const useProdutos = () => {
  return useQuery<ProdutoApi[]>({
    queryKey: ['produtos'],
    queryFn: async () => {
      const response = await apiClient.get<ProdutoApi[]>(endpoints.produtos.list);
      if (!response.success) throw new Error(response.error?.message);
      return response.data || [];
    },
    enabled: !env.enableMockData,
  });
};

export const useLicencaPorCliente = (codigoCliente: string) => {
  return useQuery({
    queryKey: ['licenca', codigoCliente],
    queryFn: async () => {
      const response = await apiClient.get<Licenca>(
        endpoints.licencas.byCliente(codigoCliente)
      );
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    enabled: !env.enableMockData && !!codigoCliente,
  });
};

export const useSaveLicenca = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (licenca: Licenca) => {
      const response = await apiClient.post<Licenca>(endpoints.licencas.save, {
        body: licenca,
      });
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['licenca'] });
    },
  });
};

export const useCheckLic = () => {
  return useMutation({
    mutationFn: async (codigo: string) => {
      const response = await apiClient.post<CheckLicResponse>(
        endpoints.generate.checkLic(codigo),
        { body: '' }
      );
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
  });
};

export const useGenerateLic = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: GenerateRequest) => {
      const response = await apiClient.post<any>(
        endpoints.generate.generate,
        { body: payload }
      );
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['licenca'] });
    },
  });
};