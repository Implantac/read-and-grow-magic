import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { toastSuccess } from '@/lib/toastHelpers';

export interface CnpjData {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
}

function cleanCnpj(cnpj: string) {
  return cnpj.replace(/\D/g, '');
}

export function useCnpjLookup() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const lookup = async (cnpj: string): Promise<CnpjData | null> => {
    const clean = cleanCnpj(cnpj);
    if (clean.length !== 14) {
      toast({ title: 'CNPJ inválido', description: 'O CNPJ deve conter 14 dígitos.', variant: 'destructive' });
      return null;
    }

    setLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'CNPJ não encontrado');
      }
      const data = await res.json();
      toastSuccess('Dados carregados!', `Empresa: ${data.razao_social}`);
      return {
        razao_social: data.razao_social || '',
        nome_fantasia: data.nome_fantasia || '',
        cnpj: data.cnpj || clean,
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        cep: data.cep || '',
        telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.substring(0, 2)}) ${data.ddd_telefone_1.substring(2)}` : '',
        email: data.email || '',
      };
    } catch (e: any) {
      toast({ title: 'Erro ao consultar CNPJ', description: e.message || 'Verifique o número e tente novamente.', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { lookup, loading };
}
