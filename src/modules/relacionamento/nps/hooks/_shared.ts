import { useEnterprise } from '@/core/auth/EnterpriseContext';

export const QK = {
  stats: (cid?: string) => ['nps', 'stats', cid],
  campaigns: (cid?: string) => ['nps', 'campaigns', cid],
  answers: (cid?: string, campaignId?: string | null) => ['nps', 'answers', cid, campaignId],
  invites: (cid?: string) => ['nps', 'invites', cid],
  templates: (cid?: string) => ['nps', 'templates', cid],
  automations: (cid?: string) => ['nps', 'automations', cid],
  webhooks: (cid?: string) => ['nps', 'webhooks', cid],
  questions: (cid?: string, cpn?: string) => ['nps', 'questions', cid, cpn],
  clientHistory: (cid?: string, cliId?: string) => ['nps', 'client-history', cid, cliId],
};

export function useCompanyId() {
  const { currentCompany } = useEnterprise() as any;
  return currentCompany?.id as string | undefined;
}
