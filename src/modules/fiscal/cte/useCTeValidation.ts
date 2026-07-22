import { useMemo } from 'react';
import { STEPS, type CTeForm, type StepValidation } from './constants';

export function useCTeValidation(form: CTeForm, selectedNFeId: string, step: number) {
  const validationByStep = useMemo(() => {
    const steps: StepValidation = {};
    STEPS.forEach((_, i) => (steps[i] = { errors: [], warnings: [] }));

    if (step > 0 && !selectedNFeId) {
      steps[0].warnings.push('CT-e criado sem importar dados de NF-e. Certifique-se de que os dados manuais estão corretos.');
    }
    if (!form.sender_name) steps[1].errors.push('O remetente é obrigatório.');
    if (!form.recipient_name) steps[1].errors.push('O destinatário é obrigatório.');
    if (form.sender_document && form.sender_document.replace(/\D/g, '').length < 11) {
      steps[1].warnings.push('Documento do remetente parece inválido.');
    }
    if (!form.sender_uf) steps[2].errors.push('UF de origem é obrigatória.');
    if (!form.recipient_uf) steps[2].errors.push('UF de destino é obrigatória.');
    if (!form.origin_city) steps[2].errors.push('Cidade de origem é obrigatória.');
    if (!form.destination_city) steps[2].errors.push('Cidade de destino é obrigatória.');
    if (form.cargo_value <= 0) steps[3].errors.push('O valor da carga deve ser maior que zero.');
    if (form.freight_value <= 0) steps[3].errors.push('O valor do frete é obrigatório.');
    if (form.icms_rate <= 0) steps[3].warnings.push('Alíquota de ICMS zerada. Verifique se há isenção.');

    return steps;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, selectedNFeId]);

  const allIssues = useMemo(() => {
    const errors: { step: number; message: string }[] = [];
    const warnings: { step: number; message: string }[] = [];
    Object.entries(validationByStep).forEach(([s, data]) => {
      const stepIdx = Number(s);
      data.errors.forEach((m) => errors.push({ step: stepIdx, message: m }));
      data.warnings.forEach((m) => warnings.push({ step: stepIdx, message: m }));
    });
    return { errors, warnings, total: errors.length + warnings.length };
  }, [validationByStep]);

  return { validationByStep, allIssues };
}
