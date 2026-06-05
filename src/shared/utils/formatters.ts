import { formatBRL, formatBRLCompact, formatPercent, formatDate, formatDateTime, formatNumber } from "@/lib/formatters";

/**
 * Centralize all formatting logic to ensure consistency across the application.
 */
export const formatters = {
  currency: formatBRL,
  currencyCompact: formatBRLCompact,
  percent: formatPercent,
  date: formatDate,
  dateTime: formatDateTime,
  number: formatNumber,
};

export type FormatterType = typeof formatters;
