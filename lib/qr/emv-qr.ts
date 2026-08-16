/**
 * EMVCo QR payload builder (Mobile Money / TWINT-style).
 * Produces a TLV string with CRC16-CCITT suitable for QR encoding.
 */

function tlv(id: string, value: string): string {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16Ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export type MobileMoneyProvider =
  | "orange_money"
  | "wave"
  | "mtn"
  | "moov"
  | "mpesa"
  | "twint";

const PROVIDER_LABELS: Record<MobileMoneyProvider, string> = {
  orange_money: "Orange Money",
  wave: "Wave",
  mtn: "MTN MoMo",
  moov: "Moov Money",
  mpesa: "M-Pesa",
  twint: "TWINT",
};

export interface EmvQrInput {
  merchantName: string;
  merchantCity: string;
  merchantPhone: string;
  amount: number;
  currency: string;
  reference: string;
  provider: MobileMoneyProvider;
}

export function buildEmvQrPayload(input: EmvQrInput): string {
  const merchantAccount = tlv("00", input.provider) + tlv("01", input.merchantPhone);
  const amountStr =
    input.currency === "XOF" || input.currency === "XAF"
      ? String(Math.round(input.amount))
      : input.amount.toFixed(2);

  const currencyNumeric: Record<string, string> = {
    XOF: "952",
    XAF: "950",
    EUR: "978",
    USD: "840",
    CHF: "756",
    GBP: "826",
    MAD: "504",
    NGN: "566",
    GHS: "936",
    KES: "404",
    CAD: "124",
  };

  let payload = "";
  payload += tlv("00", "01"); // Payload Format Indicator
  payload += tlv("01", "12"); // Point of Initiation — dynamic
  payload += tlv("26", merchantAccount); // Merchant Account Info
  payload += tlv("52", "0000"); // MCC
  payload += tlv("53", currencyNumeric[input.currency] ?? "952");
  payload += tlv("54", amountStr);
  payload += tlv("58", input.provider === "twint" ? "CH" : "SN");
  payload += tlv("59", input.merchantName.slice(0, 25));
  payload += tlv("60", input.merchantCity.slice(0, 15));
  payload += tlv(
    "62",
    tlv("05", input.reference.slice(0, 25)),
  );
  payload += "6304"; // CRC placeholder
  const crc = crc16Ccitt(payload);
  return payload + crc;
}

export function providerLabel(provider: MobileMoneyProvider): string {
  return PROVIDER_LABELS[provider] ?? provider;
}
