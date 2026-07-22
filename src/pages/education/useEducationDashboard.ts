import { useMemo, useState } from "react";
import {
  useCreateClass,
  useCreateEnrollment,
  useCreateSchool,
  useCreateStudent,
  useEduClasses,
  useEduEnrollments,
  useEduReceivables,
  useEduSchools,
  useEduStudents,
  useGenerateEnrollmentInvoice,
  useMarkEduReceivablePaid,
} from "@/hooks/useEducation";
import { toastSuccess, toastError } from "@/lib/toastHelpers";

export function useEducationDashboard() {
  const schools = useEduSchools();
  const classes = useEduClasses();
  const students = useEduStudents();
  const enrollments = useEduEnrollments();
  const createSchool = useCreateSchool();
  const createClass = useCreateClass();
  const createStudent = useCreateStudent();
  const createEnrollment = useCreateEnrollment();
  const generateInvoice = useGenerateEnrollmentInvoice();
  const receivables = useEduReceivables();
  const markPaid = useMarkEduReceivablePaid();

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ student_id: "", class_id: "", monthly_fee: 0 });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", inep_code: "", phone: "", email: "" });

  const [billingStatus, setBillingStatus] = useState<"all" | "paid" | "open" | "overdue">("all");
  const [billingSearch, setBillingSearch] = useState("");
  const [billingMonth, setBillingMonth] = useState<string>(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });

  const [classOpen, setClassOpen] = useState(false);
  const [classForm, setClassForm] = useState({
    name: "",
    school_id: "",
    academic_year: new Date().getFullYear(),
    grade: "",
    shift: "matutino" as "matutino" | "vespertino" | "noturno" | "integral",
    capacity: 30,
  });

  const [studentOpen, setStudentOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({
    full_name: "",
    document: "",
    guardian_name: "",
    guardian_phone: "",
    email: "",
  });

  const activeEnrollments = useMemo(
    () => (enrollments.data ?? []).filter((e) => e.status === "active"),
    [enrollments.data],
  );
  const mrr = useMemo(
    () => activeEnrollments.reduce((acc, e) => acc + Number(e.monthly_fee || 0), 0),
    [activeEnrollments],
  );

  async function handleCreate() {
    if (!form.name.trim()) {
      toastError("Informe o nome da escola.");
      return;
    }
    try {
      await createSchool.mutateAsync(form);
      toastSuccess("Escola criada com sucesso.");
      setOpen(false);
      setForm({ name: "", inep_code: "", phone: "", email: "" });
    } catch {
      toastError("Não foi possível criar a escola.");
    }
  }

  async function handleCreateClass() {
    if (!classForm.name.trim() || !classForm.school_id) {
      toastError("Informe nome da turma e a escola.");
      return;
    }
    try {
      await createClass.mutateAsync(classForm);
      toastSuccess("Turma criada.");
      setClassOpen(false);
      setClassForm({
        name: "",
        school_id: "",
        academic_year: new Date().getFullYear(),
        grade: "",
        shift: "matutino",
        capacity: 30,
      });
    } catch {
      toastError("Não foi possível criar a turma.");
    }
  }

  async function handleCreateStudent() {
    if (!studentForm.full_name.trim()) {
      toastError("Informe o nome do aluno.");
      return;
    }
    try {
      await createStudent.mutateAsync(studentForm);
      toastSuccess("Aluno cadastrado.");
      setStudentOpen(false);
      setStudentForm({
        full_name: "",
        document: "",
        guardian_name: "",
        guardian_phone: "",
        email: "",
      });
    } catch {
      toastError("Não foi possível cadastrar o aluno.");
    }
  }

  async function handleCreateEnrollment() {
    if (!enrollForm.student_id || !enrollForm.class_id) {
      toastError("Selecione aluno e turma.");
      return;
    }
    try {
      await createEnrollment.mutateAsync(enrollForm);
      toastSuccess("Matrícula registrada.");
      setEnrollOpen(false);
      setEnrollForm({ student_id: "", class_id: "", monthly_fee: 0 });
    } catch {
      toastError("Não foi possível registrar a matrícula.");
    }
  }

  const [bulkRunning, setBulkRunning] = useState(false);
  async function handleBulkGenerate() {
    if (activeEnrollments.length === 0) return;
    setBulkRunning(true);
    let ok = 0;
    let skip = 0;
    let fail = 0;
    for (const en of activeEnrollments) {
      const aluno = (students.data ?? []).find((s) => s.id === en.student_id);
      const turma = (classes.data ?? []).find((c) => c.id === en.class_id);
      if (!aluno || !turma) {
        fail++;
        continue;
      }
      try {
        await generateInvoice.mutateAsync({
          enrollment: en,
          studentName: aluno.full_name,
          className: turma.name,
        });
        ok++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("já foi gerada")) skip++;
        else fail++;
      }
    }
    setBulkRunning(false);
    if (ok > 0) toastSuccess(`${ok} mensalidade(s) geradas. ${skip} já existiam. ${fail} falhas.`);
    else toastError(`Nenhuma gerada. ${skip} já existiam. ${fail} falhas.`);
  }

  return {
    queries: { schools, classes, students, enrollments, receivables },
    mutations: { createSchool, createClass, createStudent, createEnrollment, generateInvoice, markPaid },
    dialogs: {
      open, setOpen, form, setForm,
      classOpen, setClassOpen, classForm, setClassForm,
      studentOpen, setStudentOpen, studentForm, setStudentForm,
      enrollOpen, setEnrollOpen, enrollForm, setEnrollForm,
    },
    billing: { billingStatus, setBillingStatus, billingSearch, setBillingSearch, billingMonth, setBillingMonth },
    computed: { activeEnrollments, mrr, bulkRunning },
    handlers: { handleCreate, handleCreateClass, handleCreateStudent, handleCreateEnrollment, handleBulkGenerate },
  };
}
