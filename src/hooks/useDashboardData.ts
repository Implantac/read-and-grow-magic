import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return fmt(v);
};

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard-consolidated'],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();
      const prevMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
      const prevMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();

      // Parallel queries
      const [
        salesRes, prevSalesRes, ordersRes, clientsRes, productsRes,
        receivableRes, payableRes, nfeRes, productionRes, purchaseRes,
        stockMovRes, overduePayableRes, overdueReceivableRes,
        lowStockRes, recentOrdersRes,
      ] = await Promise.all([
        // Current month sales
        supabase.from('sales').select('total, status').gte('date', monthStart).lte('date', monthEnd),
        // Previous month sales
        supabase.from('sales').select('total, status').gte('date', prevMonthStart).lte('date', prevMonthEnd),
        // Current month orders
        supabase.from('orders').select('id, status, total, priority, created_at').gte('date', monthStart).lte('date', monthEnd),
        // Active clients
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        // Active products
        supabase.from('products').select('id, cost_price, sale_price, min_stock, reorder_point, status', { count: 'exact' }).eq('status', 'active'),
        // Accounts receivable pending
        supabase.from('accounts_receivable').select('amount, status, due_date').eq('status', 'pending'),
        // Accounts payable pending
        supabase.from('accounts_payable').select('amount, status, due_date').eq('status', 'pending'),
        // NF-e this month
        supabase.from('nfe').select('id, status, total').gte('issue_date', monthStart),
        // Production orders active
        supabase.from('production_orders').select('id, status, quantity, produced_quantity'),
        // Purchase orders
        supabase.from('purchase_orders').select('id, status, total'),
        // Stock movements this month
        supabase.from('stock_movements').select('id, direction, quantity').gte('created_at', monthStart),
        // Overdue payables
        supabase.from('accounts_payable').select('amount').eq('status', 'pending').lt('due_date', now.toISOString()),
        // Overdue receivables
        supabase.from('accounts_receivable').select('amount').eq('status', 'pending').lt('due_date', now.toISOString()),
        // Low stock products
        supabase.from('products').select('id, name, min_stock, reorder_point').eq('status', 'active'),
        // Recent orders for activity feed
        supabase.from('orders').select('number, client_name, total, status, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      // === COMMERCIAL ===
      const sales = salesRes.data || [];
      const prevSales = prevSalesRes.data || [];
      const completedSales = sales.filter(s => s.status === 'completed');
      const currentRevenue = completedSales.reduce((s, r) => s + Number(r.total), 0);
      const prevRevenue = prevSales.filter(s => s.status === 'completed').reduce((s, r) => s + Number(r.total), 0);
      const revenueTrend = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100) : 0;

      const orders = ordersRes.data || [];
      const activeClients = clientsRes.count || 0;
      const avgTicket = completedSales.length > 0 ? currentRevenue / completedSales.length : 0;

      // === FINANCIAL ===
      const receivables = receivableRes.data || [];
      const payables = payableRes.data || [];
      const totalReceivable = receivables.reduce((s, r) => s + Number(r.amount), 0);
      const totalPayable = payables.reduce((s, r) => s + Number(r.amount), 0);
      const balance = totalReceivable - totalPayable;
      const overduePayables = overduePayableRes.data || [];
      const overdueReceivables = overdueReceivableRes.data || [];
      const totalOverduePayable = overduePayables.reduce((s, r) => s + Number(r.amount), 0);

      // === INVENTORY ===
      const products = productsRes.data || [];
      const skuCount = productsRes.count || products.length;
      const stockValue = products.reduce((s, p) => s + Number(p.cost_price), 0); // simplified
      const lowStockProducts = (lowStockRes.data || []).filter(p => Number(p.min_stock) > 0); // would need current stock
      const stockMoves = stockMovRes.data || [];
      const inMoves = stockMoves.filter(m => m.direction === 'in').length;
      const outMoves = stockMoves.filter(m => m.direction === 'out').length;

      // === PRODUCTION ===
      const prodOrders = productionRes.data || [];
      const activeProdOrders = prodOrders.filter(o => ['in_progress', 'started'].includes(o.status));
      const completedProdOrders = prodOrders.filter(o => o.status === 'completed');
      const totalProduced = completedProdOrders.reduce((s, o) => s + Number(o.produced_quantity), 0);
      const prodEfficiency = prodOrders.length > 0
        ? prodOrders.reduce((s, o) => s + (Number(o.quantity) > 0 ? Number(o.produced_quantity) / Number(o.quantity) : 0), 0) / prodOrders.length * 100
        : 0;

      // === PURCHASING ===
      const purchOrders = purchaseRes.data || [];
      const openPurchases = purchOrders.filter(o => !['completed', 'cancelled'].includes(o.status));
      const pendingApproval = purchOrders.filter(o => o.status === 'draft' || o.status === 'pending');
      const inTransit = purchOrders.filter(o => o.status === 'sent' || o.status === 'approved');
      const inTransitValue = inTransit.reduce((s, o) => s + Number(o.total), 0);

      // === NFe ===
      const nfes = nfeRes.data || [];
      const authorizedNfes = nfes.filter(n => n.status === 'authorized');

      // === ALERTS ===
      const alerts: Array<{ id: string; type: 'error' | 'warning' | 'info' | 'success'; module: string; message: string; timestamp: string }> = [];

      if (overduePayables.length > 0) {
        alerts.push({ id: 'a1', type: 'error', module: 'Financeiro', message: `${overduePayables.length} conta(s) a pagar vencida(s) (${fmt(totalOverduePayable)})`, timestamp: 'Agora' });
      }
      if (overdueReceivables.length > 0) {
        alerts.push({ id: 'a2', type: 'warning', module: 'Financeiro', message: `${overdueReceivables.length} conta(s) a receber vencida(s)`, timestamp: 'Agora' });
      }
      const pendingOrders = orders.filter(o => o.status === 'pending');
      if (pendingOrders.length > 0) {
        alerts.push({ id: 'a3', type: 'info', module: 'Comercial', message: `${pendingOrders.length} pedido(s) pendente(s) de confirmação`, timestamp: 'Agora' });
      }
      if (pendingApproval.length > 0) {
        alerts.push({ id: 'a4', type: 'warning', module: 'Compras', message: `${pendingApproval.length} pedido(s) aguardando aprovação`, timestamp: 'Agora' });
      }
      if (completedProdOrders.length > 0) {
        alerts.push({ id: 'a5', type: 'success', module: 'Produção', message: `${completedProdOrders.length} OP(s) concluída(s) este mês`, timestamp: 'Agora' });
      }
      const draftNfes = nfes.filter(n => n.status === 'draft');
      if (draftNfes.length > 0) {
        alerts.push({ id: 'a6', type: 'info', module: 'Fiscal', message: `${draftNfes.length} NF-e(s) em rascunho aguardando transmissão`, timestamp: 'Agora' });
      }

      // === MAIN KPIs ===
      const mainKPIs = [
        { title: 'Faturamento Mensal', value: fmt(currentRevenue), change: Number(revenueTrend.toFixed(1)), color: 'primary' as const },
        { title: 'Saldo Líquido', value: fmt(balance), change: balance >= 0 ? Math.abs(balance / (totalPayable || 1) * 100) : -(totalPayable / (totalReceivable || 1) * 100), color: 'success' as const },
        { title: 'A Receber', value: fmt(totalReceivable), change: overdueReceivables.length > 0 ? -overdueReceivables.length : receivables.length, color: 'info' as const },
        { title: 'A Pagar', value: fmt(totalPayable), change: overduePayables.length > 0 ? -overduePayables.length : 0, color: 'warning' as const },
      ];

      // === MODULE KPIs ===
      const commercialKPIs = [
        { label: 'Faturamento Mensal', value: fmtShort(currentRevenue), trend: revenueTrend >= 0 ? 'up' as const : 'down' as const, trendValue: `${revenueTrend >= 0 ? '+' : ''}${revenueTrend.toFixed(1)}%` },
        { label: 'Pedidos no Mês', value: String(orders.length), trend: 'neutral' as const },
        { label: 'Clientes Ativos', value: String(activeClients), trend: 'up' as const },
        { label: 'Ticket Médio', value: fmtShort(avgTicket), trend: 'neutral' as const },
      ];

      const financialKPIs = [
        { label: 'A Receber', value: fmtShort(totalReceivable), trend: 'neutral' as const },
        { label: 'A Pagar', value: fmtShort(totalPayable), trend: 'neutral' as const },
        { label: 'Saldo', value: fmtShort(balance), trend: balance >= 0 ? 'up' as const : 'down' as const },
        { label: 'Vencidos', value: fmt(totalOverduePayable), trend: overduePayables.length > 0 ? 'down' as const : 'up' as const, trendValue: `${overduePayables.length} título(s)` },
      ];

      const inventoryKPIs = [
        { label: 'SKUs Ativos', value: String(skuCount), trend: 'up' as const },
        { label: 'Movimentações', value: String(stockMoves.length), trend: 'neutral' as const },
        { label: 'Entradas', value: String(inMoves), trend: 'up' as const },
        { label: 'Saídas', value: String(outMoves), trend: 'neutral' as const },
      ];

      const productionKPIs = [
        { label: 'OPs em Andamento', value: String(activeProdOrders.length), trend: 'neutral' as const },
        { label: 'Produzido', value: `${totalProduced} un`, trend: 'up' as const },
        { label: 'Eficiência', value: `${prodEfficiency.toFixed(1)}%`, trend: prodEfficiency >= 90 ? 'up' as const : 'down' as const },
        { label: 'OPs Concluídas', value: String(completedProdOrders.length), trend: 'up' as const },
      ];

      const purchasingKPIs = [
        { label: 'Pedidos Abertos', value: String(openPurchases.length), trend: 'neutral' as const },
        { label: 'Aguardando Aprov.', value: String(pendingApproval.length), trend: 'neutral' as const },
        { label: 'Em Trânsito', value: fmtShort(inTransitValue), trend: 'neutral' as const },
        { label: 'NF-e Autorizadas', value: String(authorizedNfes.length), trend: 'up' as const },
      ];

      const wmsKPIs = [
        { label: 'Movimentações', value: String(stockMoves.length), trend: 'neutral' as const },
        { label: 'Entradas', value: String(inMoves), trend: 'up' as const },
        { label: 'Saídas', value: String(outMoves), trend: 'neutral' as const },
        { label: 'NF-e no Mês', value: String(nfes.length), trend: 'neutral' as const },
      ];

      // === STATUS DISTRIBUTION ===
      const completedCount = orders.filter(o => o.status === 'delivered').length + completedSales.length + completedProdOrders.length;
      const processingCount = orders.filter(o => ['processing', 'separated', 'invoiced', 'shipped'].includes(o.status)).length + activeProdOrders.length;
      const pendingCount = pendingOrders.length + pendingApproval.length;
      const criticalCount = overduePayables.length + overdueReceivables.length;

      const statusDistribution = [
        { name: 'Concluído', value: completedCount, color: 'hsl(var(--success))' },
        { name: 'Em Andamento', value: processingCount, color: 'hsl(var(--info))' },
        { name: 'Pendente', value: pendingCount, color: 'hsl(var(--warning))' },
        { name: 'Crítico', value: criticalCount, color: 'hsl(var(--destructive))' },
      ];

      // === RECENT ACTIVITIES ===
      const recentActivities = (recentOrdersRes.data || []).map((o: any) => ({
        id: o.number,
        description: `Pedido ${o.number} - ${o.client_name}`,
        value: fmt(Number(o.total)),
        status: o.status,
        time: o.created_at,
      }));

      // === PERFORMANCE DATA ===
      const modulePerformance = [
        { name: 'Comercial', value: Math.min(100, (currentRevenue / 10000) * 100), color: 'hsl(var(--primary))' },
        { name: 'Financeiro', value: Math.min(100, (totalReceivable / (totalPayable || 1)) * 50), color: 'hsl(var(--success))' },
        { name: 'Estoque', value: Math.min(100, (skuCount / 10) * 10), color: 'hsl(var(--info))' },
        { name: 'WMS', value: Math.min(100, (stockMoves.length / 5) * 10), color: 'hsl(var(--warning))' },
        { name: 'Produção', value: Number(prodEfficiency.toFixed(1)), color: 'hsl(142, 76%, 36%)' },
        { name: 'Compras', value: Math.min(100, (authorizedNfes.length / 2) * 20), color: 'hsl(262, 83%, 58%)' },
      ];

      return {
        mainKPIs,
        commercialKPIs,
        financialKPIs,
        inventoryKPIs,
        productionKPIs,
        purchasingKPIs,
        wmsKPIs,
        statusDistribution,
        modulePerformance,
        alerts,
        recentActivities,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
