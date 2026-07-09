import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleMutationError, toastSuccess } from "@/lib/toastHelpers";

export interface NfeCertificate {
  id: string;
  company_id: string;
  filename: string;
  subject: string | null;
  issuer: string | null;
  not_before: string | null;
  not_after: string | null;
  environment: 1 | 2;
  active: boolean;
  password_secret_name: string;
  created_at: string;
}

export function useNfeCertificates() {
  return useQuery({
    queryKey: ["nfe_certificates"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("nfe_certificates").select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NfeCertificate[];
    },
  });
}

export function useUploadNfeCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { file: File; password: string; environment: 1 | 2 }) => {
      const form = new FormData();
      form.append("file", input.file);
      form.append("password", input.password);
      form.append("environment", String(input.environment));
      const { data, error } = await supabase.functions.invoke("nfe-cert-upload", { body: form });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nfe_certificates"] });
      toastSuccess("Certificado A1 carregado com sucesso");
    },
    onError: handleMutationError,
  });
}

export function useSefazStatus(ambiente: 1 | 2 = 2) {
  return useQuery({
    queryKey: ["sefaz_status", ambiente],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("sefaz_status_uf")
        .select("*").eq("environment", ambiente)
        .order("uf");
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60_000,
  });
}

export function useRefreshSefazStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ambiente: 1 | 2 = 2) => {
      const { data, error } = await supabase.functions.invoke(`sefaz-status?ambiente=${ambiente}`);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sefaz_status"] });
      toastSuccess("Status SEFAZ atualizado");
    },
    onError: handleMutationError,
  });
}
