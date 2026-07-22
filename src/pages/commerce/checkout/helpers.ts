export function formatCardNumber(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function detectBrand(num: string): string {
  if (/^4/.test(num)) return "Visa";
  if (/^5[1-5]/.test(num)) return "Mastercard";
  if (/^3[47]/.test(num)) return "Amex";
  if (/^6(?:011|5)/.test(num)) return "Discover";
  if (/^(4011|4312|4389|5041|6277|6362|6363|6504|6505|6516)/.test(num))
    return "Elo";
  return "Cartão";
}

export interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  document: string;
  zip: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  notes: string;
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
}

export const emptyCheckoutForm: CheckoutForm = {
  name: "", email: "", phone: "", document: "",
  zip: "", street: "", number: "", complement: "",
  neighborhood: "", city: "", state: "", notes: "",
  cardNumber: "", cardName: "", cardExpiry: "", cardCvv: "",
};

export type PaymentMethod = "credit_card" | "pix" | "boleto";
