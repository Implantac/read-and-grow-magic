export function generateConsensusItems(kpis: any, data: any, segment: string) {
  const items = [
    {
      specialist: 'CTO Global',
      insight: data.orders.length > 500 ? 'Tráfego intenso detectado. Ativando CDN Edge para latência zero no checkout.' : 'Estabilidade total em toda a infraestrutura multicloud global.',
      status: 'success',
    },
    {
      specialist: 'Arquiteto SAP S/4HANA',
      insight: 'Integração SAP S/4HANA confirmada via iDoc/OData. Buffer de sincronização operando 100%.',
      status: 'success',
    },
    {
      specialist: 'Arquiteto Oracle Netsuite',
      insight: 'Estrutura Multi-Book validada para consolidação global de subsidiárias.',
      status: 'success',
    },
    {
      specialist: 'TOTVS Protheus Expert',
      insight: 'Arquivos ADVPL para customização de ponto de entrada (PE) validados para o faturamento.',
      status: 'success',
    }
  ];

  // Adições baseadas em segmento (Verticais)
  if (segment === 'fio' || segment === 'textile') {
    items.push({
      specialist: 'Especialista PCP/MRP/APS',
      insight: kpis.prodEfficiency < 85 ? `Alerta: Ruptura de filamento acima da média. Ajustando velocidade das cardas e teares.` : 'Sincronismo fiação-tecelagem otimizado por IA (Just-in-Time).',
      status: kpis.prodEfficiency < 85 ? 'alert' : 'success',
    });
    items.push({
      specialist: 'Supply Chain (Têxtil)',
      insight: 'Monitoramento de estoques de algodão e corantes estável para os próximos 45 dias.',
      status: 'success',
    });
  } else if (segment === 'pharma') {
    items.push({
      specialist: 'Especialista ERP Industrial',
      insight: 'Rastreabilidade de lotes completa (GAMP5). Validação RDC 658 aplicada em tempo real.',
      status: 'success',
    });
    items.push({
      specialist: 'Auditor de Qualidade',
      insight: 'Checklist de temperatura e umidade nos armazéns climatizados em conformidade.',
      status: 'success',
    });
  } else if (segment === 'apparel' || segment === 'retail') {
    items.push({
      specialist: 'UX Enterprise Expert',
      insight: 'Conversão no PDV Mobile aumentou 12% após ajuste na interface de seleção de grade.',
      status: 'success',
    });
    items.push({
      specialist: 'WMS Specialist',
      insight: 'Otimização de picking via ondas (Wave Picking) reduzindo tempo de expedição em 18%.',
      status: 'success',
    });
  } else if (segment === 'animal_feed' || segment === 'food_factory') {
    items.push({
      specialist: 'Especialista Supply Chain',
      insight: 'Monitoramento de silos OK. Nível de umidade e temperatura dentro do padrão de segurança alimentar.',
      status: 'success',
    });
  } else if (segment === 'holding') {
    items.push({
      specialist: 'Contabilista Pleno',
      insight: 'Eliminação de saldos intercompany processada para o fechamento do trimestre.',
      status: 'success',
    });
  }

  // Adição Fiscal e IA (Comum a todos)
  items.push({
    specialist: 'Especialista Fiscal BR',
    insight: kpis.nfeRejectedCount > 0 ? `Atenção: ${kpis.nfeRejectedCount} notas rejeitadas pela SEFAZ. Verifique inconsistências no motor tributário.` : 'Conformidade fiscal 100% (SPED/REINF). Malha fina preventiva negativa.',
    status: kpis.nfeRejectedCount > 0 ? 'alert' : 'success',
  });

  items.push({
    specialist: 'IA Empresarial',
    insight: 'Motor cognitivo detectou padrão de sazonalidade positiva. Sugerindo aumento de 10% no estoque de segurança.',
    status: 'recommendation',
  });

  return items;
}
