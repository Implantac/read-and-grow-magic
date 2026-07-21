import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildRevenue12m } from "./compute/revenue";
import { buildCashflow } from "./compute/cashflow";
import { buildProductInsights } from "./compute/products";
import { buildSuppliers, buildCustomers, buildDelinquents } from "./compute/customers";
import { buildHealth } from "./compute/health";
import { buildRecommendations } from "./compute/recommendations";
import type { SuccessData } from "./types";

export type {
  SuccessMonthlyRevenue,
  SuccessTopCustomer,
  SuccessDelinquent,
  SuccessProductInsight,
  SuccessSubcategoryStock,
  SuccessSupplierSpend,
  SuccessCashFlow90d,
  HealthPillarKey,
  HealthPillar,
  SuccessHealthBreakdown,
  SuccessAIRecommendation,
  SuccessData,
} from "./types";

export function useSuccessData() {
  return useQuery({
    queryKey: ["success_dashboard"],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<SuccessData> => {
      const now = new Date();
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);

      const [salesRes, arRes, apRes, productsRes, stockRes, ordersRes, saleItemsRes, saleItems12mRes, poRes] = await Promise.all([
        supabase.from("sales").select("id, client_id, client_name, total, date").gte("date", twelveMonthsAgo.toISOString()),
        supabase.from("accounts_receivable").select("client_name, amount, due_date, status, invoice_number, payment_date, category"),
        supabase.from("accounts_payable").select("amount, due_date, status, payment_date"),
        supabase.from("products").select("id, code, name, sale_price, cost_price, unit, subcategory").eq("status", "active"),
        supabase.from("stock_balances").select("product_id, product_code, product_name, quantity, unit"),
        supabase.from("orders").select("id, status, total").in("status", ["pending", "approved", "processing"]),
        supabase
          .from("sale_items")
          .select("product_id, product_code, product_name, quantity, total, sale_id, sales!inner(date, client_id, client_name)")
          .gte("sales.date", ninetyDaysAgo.toISOString()),
        supabase
          .from("sale_items")
          .select("product_code, sales!inner(date)")
          .gte("sales.date", twelveMonthsAgo.toISOString()),
        supabase
          .from("purchase_orders")
          .select("supplier_name, total, date, status")
          .gte("date", ninetyDaysAgo.toISOString()),
      ]);

      const sales = salesRes.data ?? [];
      const ar = arRes.data ?? [];
      const ap = apRes.data ?? [];
      const products = productsRes.data ?? [];
      const stock = stockRes.data ?? [];
      const orders = ordersRes.data ?? [];
      const saleItems90 = (saleItemsRes.data ?? []) as any[];
      const saleItems12m = (saleItems12mRes.data ?? []) as any[];
      const purchaseOrders90 = poRes.data ?? [];

      const { revenue12m, revenueMonth, revenuePrevMonth, revenueYTD, revenueWeek, revenuePrevWeek } =
        buildRevenue12m(sales, now);

      const cashflow = buildCashflow(ar, ap, now);

      const {
        productInsights, slowMoving, topMargin, bestSellers,
        stagnantSkuCount, stagnantCapital, subcategoryStock,
      } = buildProductInsights(products, stock, saleItems90, saleItems12m, now);

      const topSuppliers = buildSuppliers(purchaseOrders90);
      const { topCustomers, inactiveTopCustomers, activeCustomers } = buildCustomers(sales, now);
      const delinquents = buildDelinquents(ar, now);

      const goal = revenuePrevMonth > 0 ? revenuePrevMonth * 1.05 : revenueYTD / 12;
      const pct = goal > 0 ? (revenueMonth / goal) * 100 : 0;

      const health = buildHealth({ productInsights, ar, cashflow, revenueMonth, revenuePrevMonth });

      const recommendations = buildRecommendations({
        subcategoryStock, slowMoving, stagnantSkuCount,
        revenueWeek, revenuePrevWeek,
        inactiveTopCustomers, topSuppliers,
        cashflow, delinquents, delinquencyRatio: health.delinquencyRatio,
        topMargin, pct, goal, revenueMonth,
      });

      return {
        health: {
          score: health.score,
          grade: health.grade,
          financial: health.financial,
          operational: health.operational,
          commercial: health.commercial,
          drivers: health.drivers,
          pillars: health.pillars,
        },
        revenue12m,
        cashflow,
        slowMoving,
        topMargin,
        bestSellers,
        allProductInsights: productInsights,
        subcategoryStock,
        topSuppliers,
        topCustomers,
        inactiveTopCustomers,
        delinquents,
        monthGoal: { goal, achieved: revenueMonth, pct },
        recommendations,
        totals: {
          revenueYTD,
          revenueMonth,
          revenuePrevMonth,
          revenueWeek,
          revenuePrevWeek,
          activeCustomers,
          ordersOpen: orders.length,
          stagnantSkuCount,
          stagnantCapital,
        },
      };
    },
  });
}
