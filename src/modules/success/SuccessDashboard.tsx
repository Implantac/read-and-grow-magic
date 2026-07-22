import { Heart } from "lucide-react";
import { useSuccessData } from "./useSuccessData";
import { Skeleton } from "@/ui/base/skeleton";
import { GradePill } from "./dashboard/utils";
import { HealthCard } from "./dashboard/HealthCard";
import { MonthGoalCard } from "./dashboard/MonthGoalCard";
import { KpiRow } from "./dashboard/KpiRow";
import { RevenueCashflowRow } from "./dashboard/RevenueCashflowRow";
import { ProductsCustomersGrid } from "./dashboard/ProductsCustomersGrid";
import { AIRecommendations } from "./dashboard/AIRecommendations";

export default function SuccessDashboard() {
  const { data, isLoading } = useSuccessData();

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const {
    health, revenue12m, cashflow, slowMoving, topMargin, bestSellers,
    subcategoryStock, topSuppliers, topCustomers,
    delinquents, monthGoal, recommendations, totals,
  } = data;
  const monthDelta = totals.revenuePrevMonth > 0
    ? ((totals.revenueMonth - totals.revenuePrevMonth) / totals.revenuePrevMonth) * 100
    : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Use Success</h1>
              <p className="text-sm text-muted-foreground">
                A visão do dono do negócio — saúde, resultados e ações da IA.
              </p>
            </div>
          </div>
        </div>
        <GradePill grade={health.grade} score={health.score} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HealthCard health={health} />
        <MonthGoalCard monthGoal={monthGoal} monthDelta={monthDelta} />
      </div>

      <KpiRow totals={totals} cashflow={cashflow} />
      <RevenueCashflowRow revenue12m={revenue12m} cashflow={cashflow} />
      <ProductsCustomersGrid
        slowMoving={slowMoving}
        topMargin={topMargin}
        bestSellers={bestSellers}
        subcategoryStock={subcategoryStock}
        topCustomers={topCustomers}
        topSuppliers={topSuppliers}
        delinquents={delinquents}
        totals={totals}
      />
      <AIRecommendations recommendations={recommendations} />
    </div>
  );
}
