import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlaybookStep {
  label: string;
  detail: string;
}

interface Playbook {
  title: string;
  severity: 'transient' | 'config' | 'data';
  steps: PlaybookStep[];
  cta: { label: string; route: string };
}

const PLAYBOOKS: Record<string, Playbook> = {
  '108': {
    title: 'SEFAZ paralisado momentaneamente',
    severity: 'transient',
    steps: [
      { label: 'Aguarde 2–5 minutos', detail: 'O orquestrador já tenta até 3× com backoff automático.' },
      { label: 'Verifique status oficial', detail: 'Consulte o status da SEFAZ do estado no monitor externo.' },
      { label: 'Retransmita em lote', detail: 'Após restabelecido, retransmita as NF-e pendentes.' },
    ],
    cta: { label: 'Abrir NF-e pendentes', route: '/fiscal/nfe?status=rejected' },
  },
  '109': {
    title: 'SEFAZ paralisado sem previsão',
    severity: 'transient',
    steps: [
      { label: 'Ative contingência', detail: 'Considere emissão em contingência (SVC) se disponível.' },
      { label: 'Notifique operações', detail: 'Avise time comercial sobre atraso previsto.' },
    ],
    cta: { label: 'Configurar contingência', route: '/fiscal/settings' },
  },
  '204': {
    title: 'Duplicidade de NF-e',
    severity: 'data',
    steps: [
      { label: 'Localize a NF-e original', detail: 'Consulte pelo número/série informados.' },
      { label: 'Cancele o rascunho duplicado', detail: 'Evite reemitir com a mesma chave.' },
      { label: 'Ajuste numeração', detail: 'Verifique série ativa no cadastro da empresa.' },
    ],
    cta: { label: 'Abrir gestão de NF-e', route: '/fiscal/nfe' },
  },
  '233': {
    title: 'Regime tributário incompatível',
    severity: 'config',
    steps: [
      { label: 'Revise regime da empresa', detail: 'Confirme Simples / Lucro Presumido / Real.' },
      { label: 'Ajuste CSOSN/CST', detail: 'Alinhe códigos com o regime vigente.' },
    ],
    cta: { label: 'Regras tributárias', route: '/fiscal/tax-rules' },
  },
  '539': {
    title: 'Data de emissão inválida',
    severity: 'data',
    steps: [
      { label: 'Verifique fuso do servidor', detail: 'Data futura em relação à SEFAZ gera rejeição.' },
      { label: 'Reemita com data corrente', detail: 'Não backdate NF-e além do permitido.' },
    ],
    cta: { label: 'Abrir NF-e', route: '/fiscal/nfe' },
  },
  '610': {
    title: 'CFOP inválido para a operação',
    severity: 'config',
    steps: [
      { label: 'Revise CFOP do item', detail: 'Confirme se a operação é interna/interestadual.' },
      { label: 'Atualize regras fiscais', detail: 'Corrija o CFOP padrão da regra aplicada.' },
      { label: 'Reprocesse em massa', detail: 'Após ajuste, retransmita as NF-e afetadas.' },
    ],
    cta: { label: 'Editar regras fiscais', route: '/fiscal/tax-rules' },
  },
};

interface Props {
  code: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SefazPlaybookDialog({ code, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  if (!code) return null;
  const pb = PLAYBOOKS[code];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Playbook SEFAZ {code}
          </DialogTitle>
          <DialogDescription>
            {pb ? pb.title : 'Rejeição sem playbook cadastrado. Investigue manualmente.'}
          </DialogDescription>
        </DialogHeader>

        {pb ? (
          <div className="space-y-3">
            <Badge
              variant="outline"
              className={
                pb.severity === 'transient'
                  ? 'border-orange-500/50 text-orange-500'
                  : pb.severity === 'config'
                    ? 'border-primary/50 text-primary'
                    : 'border-destructive/50 text-destructive'
              }
            >
              {pb.severity === 'transient' ? 'Transitório' : pb.severity === 'config' ? 'Configuração' : 'Dados do pedido'}
            </Badge>
            <ol className="space-y-2">
              {pb.steps.map((s, i) => (
                <li key={i} className="rounded-md border border-border/60 bg-muted/20 p-3">
                  <div className="text-sm font-medium">{i + 1}. {s.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.detail}</div>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Consulte a documentação SEFAZ do estado emissor para o significado do código {code}.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          {pb && (
            <Button onClick={() => { onOpenChange(false); navigate(pb.cta.route); }}>
              <ExternalLink className="h-4 w-4 mr-2" />
              {pb.cta.label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
