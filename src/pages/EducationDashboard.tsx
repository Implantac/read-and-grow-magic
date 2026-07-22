import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { KPICard } from "@/shared/components/KPICard";
import { Button } from "@/ui/base/button";
import { Building2, GraduationCap, Users, Wallet, FileText, Loader2 } from "lucide-react";
import { SchoolDialog, ClassDialog, StudentDialog, EnrollmentDialog } from "./education/EducationDialogs";
import { BillingCard } from "./education/BillingCard";
import { useEducationDashboard } from "./education/useEducationDashboard";
import { SchoolsTable } from "./education/SchoolsTable";
import { ClassesTable } from "./education/ClassesTable";
import { EnrollmentsTable } from "./education/EnrollmentsTable";

const formatCurrencyPtBr = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function EducationDashboard() {
  const { queries, mutations, dialogs, billing, computed, handlers } = useEducationDashboard();
  const { schools, classes, students, enrollments, receivables } = queries;
  const { createSchool, createClass, createStudent, createEnrollment, generateInvoice, markPaid } = mutations;
  const { activeEnrollments, mrr, bulkRunning } = computed;

  return (
    <PageContainer>
      <PageHeader
        title="Educação"
        description="Gestão de escolas, turmas, alunos e matrículas."
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              disabled={bulkRunning || activeEnrollments.length === 0}
              onClick={handlers.handleBulkGenerate}
            >
              {bulkRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              Gerar mensalidades do mês
            </Button>
            <SchoolDialog
              open={dialogs.open} onOpenChange={dialogs.setOpen}
              form={dialogs.form} setForm={dialogs.setForm}
              onSubmit={handlers.handleCreate} isPending={createSchool.isPending}
            />
            <ClassDialog
              open={dialogs.classOpen} onOpenChange={dialogs.setClassOpen}
              form={dialogs.classForm} setForm={dialogs.setClassForm}
              onSubmit={handlers.handleCreateClass} isPending={createClass.isPending}
              schools={schools.data ?? []}
            />
            <StudentDialog
              open={dialogs.studentOpen} onOpenChange={dialogs.setStudentOpen}
              form={dialogs.studentForm} setForm={dialogs.setStudentForm}
              onSubmit={handlers.handleCreateStudent} isPending={createStudent.isPending}
            />
            <EnrollmentDialog
              open={dialogs.enrollOpen} onOpenChange={dialogs.setEnrollOpen}
              form={dialogs.enrollForm} setForm={dialogs.setEnrollForm}
              onSubmit={handlers.handleCreateEnrollment} isPending={createEnrollment.isPending}
              students={students.data ?? []} classes={classes.data ?? []}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Escolas" value={(schools.data?.length ?? 0).toString()} icon={Building2} />
        <KPICard title="Turmas" value={(classes.data?.length ?? 0).toString()} icon={GraduationCap} />
        <KPICard title="Alunos" value={(students.data?.length ?? 0).toString()} icon={Users} />
        <KPICard title="Receita mensal estimada" value={formatCurrencyPtBr(mrr)} icon={Wallet} />
      </div>

      <SchoolsTable schools={schools.data ?? []} classes={classes.data ?? []} isLoading={schools.isLoading} />
      <ClassesTable classes={classes.data ?? []} schools={schools.data ?? []} activeEnrollments={activeEnrollments} isLoading={classes.isLoading} />
      <EnrollmentsTable
        activeEnrollments={activeEnrollments}
        students={students.data ?? []}
        classes={classes.data ?? []}
        isLoading={enrollments.isLoading}
        generateInvoice={generateInvoice}
      />

      <BillingCard
        receivables={receivables}
        markPaid={markPaid}
        billingMonth={billing.billingMonth}
        setBillingMonth={billing.setBillingMonth}
        billingStatus={billing.billingStatus}
        setBillingStatus={billing.setBillingStatus}
        billingSearch={billing.billingSearch}
        setBillingSearch={billing.setBillingSearch}
      />
    </PageContainer>
  );
}
