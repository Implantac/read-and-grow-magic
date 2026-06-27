
-- Vertical Educação v1
CREATE TABLE IF NOT EXISTS public.edu_schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  inep_code TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edu_schools TO authenticated;
GRANT ALL ON public.edu_schools TO service_role;
ALTER TABLE public.edu_schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY edu_schools_tenant ON public.edu_schools
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE TABLE IF NOT EXISTS public.edu_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  school_id UUID NOT NULL REFERENCES public.edu_schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT,
  shift TEXT CHECK (shift IN ('matutino','vespertino','noturno','integral')),
  academic_year INT NOT NULL,
  capacity INT NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edu_classes TO authenticated;
GRANT ALL ON public.edu_classes TO service_role;
ALTER TABLE public.edu_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY edu_classes_tenant ON public.edu_classes
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE TABLE IF NOT EXISTS public.edu_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  document TEXT,
  birth_date DATE,
  guardian_name TEXT,
  guardian_phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edu_students TO authenticated;
GRANT ALL ON public.edu_students TO service_role;
ALTER TABLE public.edu_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY edu_students_tenant ON public.edu_students
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE TABLE IF NOT EXISTS public.edu_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES public.edu_students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.edu_classes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','transferred','cancelled','completed')),
  enrolled_at DATE NOT NULL DEFAULT CURRENT_DATE,
  monthly_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, class_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edu_enrollments TO authenticated;
GRANT ALL ON public.edu_enrollments TO service_role;
ALTER TABLE public.edu_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY edu_enrollments_tenant ON public.edu_enrollments
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- updated_at triggers (reusing existing helper)
CREATE TRIGGER trg_edu_schools_updated BEFORE UPDATE ON public.edu_schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_edu_classes_updated BEFORE UPDATE ON public.edu_classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_edu_students_updated BEFORE UPDATE ON public.edu_students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_edu_enrollments_updated BEFORE UPDATE ON public.edu_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_edu_classes_school ON public.edu_classes(school_id);
CREATE INDEX IF NOT EXISTS idx_edu_enroll_student ON public.edu_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_edu_enroll_class ON public.edu_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_edu_students_company ON public.edu_students(company_id);
