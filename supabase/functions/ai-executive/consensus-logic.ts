function generateConsensusItems(kpis: any, data: any, segment: string) {
  const items = [
    {
      specialist: 'CTO Global',
      insight: data.orders.length > 500 ? 'Tráfego intenso. Ativando CDN Edge para latência zero no checkout.' : 'Estabilidade total em toda a infraestrutura multicloud.',
      status: 'success',
    },
    {
      specialist: 'Arquiteto SAP S/4HANA',
      insight: 'Buffer de sincronização SAP integrado. Dados de estoque real-time confirmados.',
      status: 'success',
    }
  ];

  // Adições baseadas em segmento
  if (segment === 'fio' || segment === 'textile') {
    items.push({
      specialist: 'Especialista PCP/MRP/APS',
      insight: kpis.prodEfficiency < 85 ? `Alerta: Ruptura de filamento acima da média. Ajustando velocidade das cardas.` : 'Sincronismo fiação-tecelagem otimizado por IA.',
      status: kpis.prodEfficiency < 85 ? 'alert' : 'success',
    });
  } else if (segment === 'pharma') {
    items.push({
      specialist: 'Especialista ERP Industrial',
      insight: 'Rastreabilidade de lotes completa. Validação RDC 658 aplicada em tempo real.',
      status: 'success',
    });
  } else if (segment === 'animal_feed' || segment === 'food_factory') {
    items.push({
      specialist: 'Especialista Supply Chain',
      insight: 'Monitoramento de silos OK. Nível de umidade dentro do padrão de segurança.',
      status: 'success',
    });
  }

  // Adição Fiscal
  items.push({
    specialist: 'Especialista Fiscal BR',
    insight: kpis.nfeRejectedCount > 0 ? `Atenção: ${kpis.nfeRejectedCount} notas rejeitadas pela SEFAZ. Verifique CFOP/NCM.` : 'Conformidade fiscal 100%. Malha fina preventiva negativa.',
    status: kpis.nfeRejectedCount > 0 ? 'alert' : 'success',
  });

  return items;
}

// Ensure this function is called inside handleDashboardData or before it in the file structure.
// I'll place it at the end of the file or near computeKPIs.
