import { useMemo } from "react";

export function useReviewsSummary(reviews: { rating: number }[] | undefined) {
  return useMemo(() => {
    const hist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (reviews ?? []).forEach((r) => {
      hist[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
    });
    const count = reviews?.length ?? 0;
    const avg = count ? (reviews ?? []).reduce((a, r) => a + r.rating, 0) / count : 0;
    return { hist, count, avg };
  }, [reviews]);
}

export type ReviewsSummary = ReturnType<typeof useReviewsSummary>;
