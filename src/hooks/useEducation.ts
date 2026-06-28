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

export function useCreateClass() {
  const qc = useQueryClient();
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      school_id: string;
      academic_year: number;
      grade?: string;
      shift?: "matutino" | "vespertino" | "noturno" | "integral";
      capacity?: number;
    }) => {
      if (!companyId) throw new Error("Sem empresa ativa");
      const { error } = await supabase
        .from("edu_classes")
        .insert({ ...payload, company_id: companyId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["edu_classes"] }),
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useMutation({
    mutationFn: async (payload: Partial<EduStudent> & { full_name: string }) => {
      if (!companyId) throw new Error("Sem empresa ativa");
      const { error } = await supabase
        .from("edu_students")
        .insert({ ...payload, company_id: companyId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["edu_students"] }),
  });
}

export function useCreateEnrollment() {
  const qc = useQueryClient();
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useMutation({
    mutationFn: async (payload: {
      student_id: string;
      class_id: string;
      monthly_fee: number;
    }) => {
      if (!companyId) throw new Error("Sem empresa ativa");
      const { error } = await supabase.from("edu_enrollments").insert({
        ...payload,
        company_id: companyId,
        status: "active",
        enrolled_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["edu_enrollments"] }),
  });
}

/**
 * Generates a monthly accounts_receivable row for an active enrollment.
 * Due date is set to the 10th of the next month (school billing convention).
 * Idempotent per month: refuses to create a duplicate if a receivable for the
 * same enrollment + competence month already exists (matched via source_id +
 * description prefix).
 */
export function useGenerateEnrollmentInvoice() {
  const qc = useQueryClient();
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useMutation({
    mutationFn: async (args: {
      enrollment: EduEnrollment;
      studentName: string;
      className: string;
    }) => {
      if (!companyId) throw new Error("Sem empresa ativa");
      const { enrollment, studentName, className } = args;
      const now = new Date();
      const competence = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 10);
      const description = `Mensalidade ${competence} · ${className}`;

      // Idempotency check
      const { data: existing } = await supabase
        .from("accounts_receivable")
        .select("id")
        .eq("company_id", companyId)
        .eq("source_type", "edu_enrollment")
        .eq("source_id", enrollment.id)
        .ilike("description", `Mensalidade ${competence}%`)
        .limit(1);
      if (existing && existing.length > 0) {
        throw new Error("Mensalidade deste mês já foi gerada.");
      }

      const amount = Number(enrollment.monthly_fee || 0);
      if (amount <= 0) throw new Error("Mensalidade inválida.");

      const { error } = await supabase.from("accounts_receivable").insert({
        company_id: companyId,
        description,
        client_name: studentName,
        category: "Educação",
        amount,
        original_amount: amount,
        open_amount: amount,
        due_date: dueDate.toISOString(),
        issue_date: now.toISOString(),
        status: "pending",
        source_type: "edu_enrollment",
        source_id: enrollment.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts_receivable"] });
      qc.invalidateQueries({ queryKey: ["edu_receivables"] });
    },
  });
}

export interface EduReceivable {
  id: string;
  description: string;
  client_name: string;
  amount: number;
  open_amount: number | null;
  paid_amount: number | null;
  due_date: string;
  payment_date: string | null;
  status: string;
  source_id: string | null;
}

/** Receivables generated from education enrollments, scoped to the active tenant. */
export function useEduReceivables() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ["edu_receivables", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts_receivable")
        .select(
          "id, description, client_name, amount, open_amount, paid_amount, due_date, payment_date, status, source_id",
        )
        .eq("company_id", companyId!)
        .eq("source_type", "edu_enrollment")
        .order("due_date", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as EduReceivable[];
    },
  });
}
