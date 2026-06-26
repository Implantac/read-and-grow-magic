import { forwardRef, useState, useEffect, useCallback } from "react";
import { Input } from "@/ui/base/input";
import { cn } from "@/lib/utils";
import {
  parseNumericInput,
  parseLocaleNumber,
  type ParseNumericOptions,
} from "@/lib/numericValidation";

export interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number | null | undefined;
  onValueChange: (value: number | null) => void;
  /** Validação delegada ao parseNumericInput. */
  validation?: ParseNumericOptions;
  /** Quando true, formata como moeda (R$) no blur. */
  currency?: boolean;
  /** Callback opcional de erro de validação (após blur). */
  onValidationError?: (error: string | null) => void;
}

/**
 * Input controlado para números e valores monetários (pt-BR).
 *
 * - Permite digitação livre (strings intermediárias como "1,2" são aceitas).
 * - No blur: valida via parseNumericInput; se inválido, devolve null + onValidationError.
 * - Default: rejeita negativos. Para moeda use `currency` (2 casas, >= 0).
 */
export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  function NumericInput(
    {
      value,
      onValueChange,
      validation,
      currency = false,
      onValidationError,
      onBlur,
      className,
      placeholder,
      inputMode,
      ...rest
    },
    ref,
  ) {
    const opts: ParseNumericOptions = currency
      ? { allowNegative: false, maxDecimals: 2, ...validation }
      : { allowNegative: false, ...validation };

    const formatDisplay = useCallback(
      (n: number | null | undefined): string => {
        if (n === null || n === undefined || Number.isNaN(n)) return "";
        if (currency) {
          return n.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        }
        return String(n);
      },
      [currency],
    );

    const [text, setText] = useState<string>(() => formatDisplay(value));
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      // Sync quando o valor externo muda e o usuário não está editando.
      const parsed = parseLocaleNumber(text);
      if (parsed !== value && !(Number.isNaN(parsed) && (value === null || value === undefined))) {
        setText(formatDisplay(value));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const next = e.target.value;
      setText(next);
      if (error) setError(null);
    }

    function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
      if (text.trim() === "") {
        onValueChange(null);
        setError(null);
        onValidationError?.(null);
        onBlur?.(e);
        return;
      }
      const r = parseNumericInput(text, opts);
      if (!r.ok) {
        setError(r.error);
        onValidationError?.(r.error);
        onValueChange(null);
      } else {
        setError(null);
        onValidationError?.(null);
        onValueChange(r.value);
        setText(formatDisplay(r.value));
      }
      onBlur?.(e);
    }

    return (
      <div className="w-full">
        <Input
          ref={ref}
          type="text"
          inputMode={inputMode ?? (currency || (opts.maxDecimals ?? 0) > 0 ? "decimal" : "numeric")}
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder ?? (currency ? "0,00" : "")}
          className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
          aria-invalid={!!error}
          {...rest}
        />
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
