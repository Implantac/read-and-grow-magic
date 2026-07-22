import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Progress } from "@/ui/base/progress";
import { MessageSquare } from "lucide-react";
import type { ReviewsSummary } from "./useReviewsSummary";

export function ReviewsSummaryCard({
  summary, onOpen,
}: { summary: ReviewsSummary; onOpen: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          Avaliações
          <Button size="sm" variant="ghost" onClick={onOpen}>
            <MessageSquare className="h-4 w-4 mr-1" /> Ver
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold">{summary.avg.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">
            de {summary.count} avaliação{summary.count === 1 ? "" : "es"}
          </span>
        </div>
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map((n) => {
            const c = summary.hist[n as 1 | 2 | 3 | 4 | 5];
            const pct = summary.count ? (c / summary.count) * 100 : 0;
            return (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-4 tabular-nums">{n}★</span>
                <Progress value={pct} className="h-1.5 flex-1" />
                <span className="w-6 text-right tabular-nums text-muted-foreground">{c}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
