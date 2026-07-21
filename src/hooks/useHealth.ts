import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { toastSuccess, handleMutationError } from '@/lib/toastHelpers';

export interface HealthPatient {
  id: string;
  company_id: string;
  full_name: string;
  cpf: string | null;
  birth_date: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HealthProfessional {
  id: string;
  company_id: string;
  full_name: string;
  registry_number: string | null;
  specialty: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
}

export interface HealthAppointment {
  id: string;
  company_id: string;
  patient_id: string;
  professional_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  reason: string | null;
  notes: string | null;
}

export interface HealthRecord {
  id: string;
  company_id: string;
  patient_id: string;
  appointment_id: string | null;
  complaint: string | null;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
  created_at: string;
}

// PATIENTS
export function useHealthPatients() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ['health_patients', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_patients' as any)
        .select('*')
        .order('full_name');
      if (error) throw error;
      return (data || []) as unknown as HealthPatient[];
    },
  });
}

export function useCreateHealthPatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<HealthPatient>) => {
      const { data, error } = await supabase
        .from('health_patients' as any)
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health_patients'] });
      toastSuccess('Paciente cadastrado');
    },
    onError: handleMutationError,
  });
}

export function useDeleteHealthPatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('health_patients' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health_patients'] });
      toastSuccess('Paciente removido');
    },
    onError: handleMutationError,
  });
}

// PROFESSIONALS
export function useHealthProfessionals() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ['health_professionals', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_professionals' as any)
        .select('*')
        .order('full_name');
      if (error) throw error;
      return (data || []) as unknown as HealthProfessional[];
    },
  });
}

export function useCreateHealthProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<HealthProfessional>) => {
      const { data, error } = await supabase
        .from('health_professionals' as any)
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health_professionals'] });
      toastSuccess('Profissional cadastrado');
    },
    onError: handleMutationError,
  });
}

// APPOINTMENTS
export function useHealthAppointments(patientId?: string) {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ['health_appointments', companyId, patientId ?? 'all'],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from('health_appointments' as any).select('*').order('scheduled_at', { ascending: false });
      if (patientId) q = q.eq('patient_id', patientId);
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return (data || []) as unknown as HealthAppointment[];
    },
  });
}

export function useCreateHealthAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<HealthAppointment>) => {
      const { data, error } = await supabase
        .from('health_appointments' as any)
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health_appointments'] });
      toastSuccess('Consulta agendada');
    },
    onError: handleMutationError,
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('health_appointments' as any)
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health_appointments'] });
      toastSuccess('Status atualizado');
    },
    onError: handleMutationError,
  });
}

// RECORDS
export function useHealthRecords(patientId?: string) {
  return useQuery({
    queryKey: ['health_records', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_records' as any)
        .select('*')
        .eq('patient_id', patientId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as HealthRecord[];
    },
  });
}

export function useCreateHealthRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<HealthRecord>) => {
      const { data, error } = await supabase
        .from('health_records' as any)
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars: any) => {
      qc.invalidateQueries({ queryKey: ['health_records', vars.patient_id] });
      toastSuccess('Prontuário registrado');
    },
    onError: handleMutationError,
  });
}
