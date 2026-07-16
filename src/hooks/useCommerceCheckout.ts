import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleMutationError, toastSuccess } from "@/lib/toastHelpers";

export interface CheckoutItem {
  product_id?: string | null;
  product_name: string;
  product_sku?: string | null;
  quantity: number;
  unit_price: number;
}

export interface CheckoutAddress {
  zip: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface CheckoutInput {
  storefront_id: string;
  company_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_document?: string;
  shipping_address: CheckoutAddress;
  payment_method: "credit_card" | "pix" | "boleto";
  items: CheckoutItem[];
  shipping?: number;
  discount?: number;
  notes?: string;
  // credit card (mocked / would be tokenized in production)
  card_last4?: string;
  card_brand?: string;
}

export interface StorefrontOrder {
  id: string;
  storefront_id: string;
  company_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_document: string | null;
  shipping_address: CheckoutAddress;
  payment_method: "credit_card" | "pix" | "boleto";
  payment_status:
    | "pending"
    | "processing"
    | "paid"
    | "failed"
    | "refunded"
    | "expired";
  order_status:
    | "created"
    | "confirmed"
    | "preparing"
    | "shipped"
    | "delivered"
    | "cancelled";
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  pix_qr_code: string | null;
  pix_copy_paste: string | null;
  pix_expires_at: string | null;
  card_last4: string | null;
  card_brand: string | null;
  paid_at: string | null;
  created_at: string;
}

function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `PED${y}${m}${d}-${rand}`;
}

function generatePixPayload(orderNumber: string, total: number): {
  qr: string;
  copy: string;
  expiresAt: string;
} {
  // Simulação de payload PIX EMV BR Code (em produção, integrar com PSP: Efí, Mercado Pago, PagSeguro, Asaas, etc.)
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const copy = `00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540${total
    .toFixed(2)
    .padStart(6, "0")}5802BR5913USE COMMERCE6009SAO PAULO62070503${orderNumber}6304ABCD`;
  // QR data URL simplificado — apenas placeholder visual
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    copy,
  )}`;
  return { qr, copy, expiresAt };
}

export function useCreateStorefrontOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CheckoutInput): Promise<StorefrontOrder> => {
      const subtotal = input.items.reduce(
        (s, i) => s + i.quantity * i.unit_price,
        0,
      );
      const shipping = input.shipping ?? 0;
      const discount = input.discount ?? 0;
      const total = Math.max(0, subtotal + shipping - discount);
      const orderNumber = generateOrderNumber();

      const basePayload: Record<string, unknown> = {
        storefront_id: input.storefront_id,
        company_id: input.company_id,
        order_number: orderNumber,
        customer_name: input.customer_name,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone ?? null,
        customer_document: input.customer_document ?? null,
        shipping_address: input.shipping_address,
        payment_method: input.payment_method,
        subtotal,
        shipping,
        discount,
        total,
        currency: "BRL",
        notes: input.notes ?? null,
      };

      if (input.payment_method === "pix") {
        const pix = generatePixPayload(orderNumber, total);
        Object.assign(basePayload, {
          payment_status: "pending",
          order_status: "created",
          pix_qr_code: pix.qr,
          pix_copy_paste: pix.copy,
          pix_expires_at: pix.expiresAt,
        });
      } else if (input.payment_method === "credit_card") {
        // Simulação — em produção usar tokenização + gateway (Stripe/Pagar.me/Mercado Pago)
        Object.assign(basePayload, {
          payment_status: "paid",
          order_status: "confirmed",
          card_last4: input.card_last4 ?? null,
          card_brand: input.card_brand ?? null,
          paid_at: new Date().toISOString(),
        });
      } else {
        Object.assign(basePayload, {
          payment_status: "pending",
          order_status: "created",
        });
      }

      const { data: order, error } = await supabase
        .from("storefront_orders")
        .insert(basePayload as never)
        .select()
        .single();
      if (error) throw error;

      const items = input.items.map((i) => ({
        order_id: (order as { id: string }).id,
        product_id: i.product_id ?? null,
        product_name: i.product_name,
        product_sku: i.product_sku ?? null,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.quantity * i.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from("storefront_order_items")
        .insert(items as never);

      if (itemsError) {
        await supabase
          .from("storefront_orders")
          .delete()
          .eq("id", (order as { id: string }).id);
        throw itemsError;
      }

      return order as unknown as StorefrontOrder;
    },
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ["storefront_orders"] });
      qc.invalidateQueries({
        queryKey: ["storefront_orders", order.storefront_id],
      });
      toastSuccess(`Pedido ${order.order_number} criado com sucesso!`);
    },
    onError: handleMutationError,
  });
}

export function useStorefrontBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["storefront_by_slug", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storefronts")
        .select("*")
        .eq("slug", slug!)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useStorefrontOrders(storefrontId: string | undefined) {
  return useQuery({
    queryKey: ["storefront_orders", storefrontId],
    enabled: !!storefrontId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storefront_orders")
        .select("*, items:storefront_order_items(*)")
        .eq("storefront_id", storefrontId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payment_status,
      order_status,
    }: {
      id: string;
      payment_status?: StorefrontOrder["payment_status"];
      order_status?: StorefrontOrder["order_status"];
    }) => {
      const patch: Record<string, unknown> = {};
      if (payment_status) {
        patch.payment_status = payment_status;
        if (payment_status === "paid") patch.paid_at = new Date().toISOString();
      }
      if (order_status) patch.order_status = order_status;
      const { error } = await supabase
        .from("storefront_orders")
        .update(patch as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["storefront_orders"] });
      toastSuccess("Pedido atualizado");
    },
    onError: handleMutationError,
  });
}
