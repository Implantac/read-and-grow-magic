import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnterpriseStore } from "@/core/stores/useEnterpriseStore";

export interface EduSchool {
  id: string;
  company_id: string;
  name: string;
  inep_code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface EduClass {
  id: string;
  company_id: string;
  school_id: string;
  name: string;
  grade: string | null;
  shift: "matutino" | "vespertino" | "noturno" | "integral" | null;
  academic_year: number;
  capacity: number;
}

export interface EduStudent {
  id: string;
  company_id: string;
  full_name: string;
  document: string | null;
  birth_date: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  email: string | null;
}

export interface EduEnrollment {
  id: string;
  company_id: string;
  student_id: string;
  class_id: string;
  status: "active" | "transferred" | "cancelled" | "completed";
  enrolled_at: string;
  monthly_fee: number;
}

export function useEduSchools() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ["edu_schools", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("edu_schools")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as EduSchool[];
    },
  });
}

export function useEduClasses() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ["edu_classes", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("edu_classes")
        .select("*")
        .order("academic_year", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EduClass[];
    },
  });
}

export function useEduStudents() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ["edu_students", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("edu_students")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as EduStudent[];
    },
  });
}

export function useEduEnrollments() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ["edu_enrollments", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("edu_enrollments")
        .select("*")
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EduEnrollment[];
    },
  });
}

export function useCreateSchool() {
  const qc = useQueryClient();
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useMutation({
    mutationFn: async (payload: Partial<EduSchool> & { name: string }) => {
      if (!companyId) throw new Error("Sem empresa ativa");
      const { error } = await supabase
        .from("edu_schools")
        .insert({ ...payload, company_id: companyId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["edu_schools"] }),
  });
}
