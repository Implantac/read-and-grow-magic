import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/ui/base/dialog";
import { Button } from "@/ui/base/button";
import { Textarea } from "@/ui/base/textarea";
import { Progress } from "@/ui/base/progress";
import { Star, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  usePluginReviews,
  useUpsertPluginReview,
  useDeletePluginReview,
} from "@/hooks/usePluginReviews";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pluginId: string;
  pluginName: string;
}

function Stars({ value, onChange, size = 4 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const cls = `h-${size} w-${size} ${filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`;
        return onChange ? (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} estrelas`}>
            <Star className={cls} />
          </button>
        ) : (
          <Star key={n} className={cls} />
        );
      })}
    </div>
  );
}

export function PluginReviewsDialog({ open, onOpenChange, pluginId, pluginName }: Props) {
  const { data: reviews, isLoading } = usePluginReviews(open ? pluginId : null);
  const upsert = useUpsertPluginReview();
  const del = useDeletePluginReview();

  const { data: currentUserId } = useQuery({
    queryKey: ["auth_uid"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
    staleTime: 5 * 60 * 1000,
  });

  const myReview = useMemo(
    () => (reviews ?? []).find((r) => r.user_id === currentUserId) ?? null,
    [reviews, currentUserId],
  );

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // Prime the form once with existing review.
  useMemo(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment ?? "");
    } else {
      setRating(0);
      setComment("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myReview?.id]);

  const summary = useMemo(() => {
    const hist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (reviews ?? []).forEach((r) => {
      hist[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
    });
    const count = reviews?.length ?? 0;
    const avg = count
      ? (reviews ?? []).reduce((a, r) => a + r.rating, 0) / count
      : 0;
    return { hist, count, avg };
  }, [reviews]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Avaliações — {pluginName}</DialogTitle>
          <DialogDescription>
            Compartilhe sua experiência para ajudar outros tenants a escolher.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="rounded border p-3 space-y-2">
            <div className="text-3xl font-semibold">{summary.avg.toFixed(1)}</div>
            <Stars value={summary.avg} size={5} />
            <p className="text-xs text-muted-foreground">
              {summary.count} avaliação{summary.count === 1 ? "" : "es"}
            </p>
            <div className="space-y-1 pt-2">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = summary.hist[n as 1 | 2 | 3 | 4 | 5];
                const pct = summary.count ? (c / summary.count) * 100 : 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-4 tabular-nums">{n}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="w-6 text-right tabular-nums text-muted-foreground">{c}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded border p-3 space-y-2">
              <p className="text-sm font-medium">
                {myReview ? "Editar minha avaliação" : "Deixar uma avaliação"}
              </p>
              <Stars value={rating} onChange={setRating} size={5} />
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Como foi sua experiência com este plugin? (opcional)"
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{comment.length}/500</span>
                <div className="flex gap-2">
                  {myReview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => del.mutate(myReview.id)}
                      disabled={del.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remover
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={rating < 1 || upsert.isPending}
                    onClick={() => upsert.mutate({ pluginId, rating, comment })}
                  >
                    {upsert.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    {myReview ? "Atualizar" : "Publicar"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="max-h-72 overflow-auto space-y-2">
              {isLoading ? (
                <div className="p-6 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : !reviews || reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Ainda não há avaliações. Seja o primeiro.
                </p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="rounded border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Stars value={r.rating} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm">{r.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
