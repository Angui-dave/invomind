import type { CurrencyCode } from "@/lib/money";

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  currency?: CurrencyCode;
  paymentTermDays?: number;
  remindersEnabled: boolean;
  portalToken: string;
}

export const CLIENTS: Client[] = [
  {
    id: "cli_1",
    name: "Aminata Diallo",
    company: "Diallo & Fils SARL",
    email: "aminata@diallo-fils.sn",
    phone: "+221 77 123 45 67",
    address: "12 Avenue Cheikh Anta Diop",
    city: "Dakar",
    postalCode: "BP 1234",
    country: "SN",
    taxId: "SN123456789",
    currency: "XOF",
    paymentTermDays: 30,
    remindersEnabled: true,
    portalToken: "cli-aminata-diallo",
  },
  {
    id: "cli_2",
    name: "Kofi Mensah",
    company: "Mensah Digital",
    email: "kofi@mensah-digital.ci",
    phone: "+225 07 00 11 22 33",
    address: "Plateau, Rue du Commerce",
    city: "Abidjan",
    postalCode: "01 BP 5678",
    country: "CI",
    taxId: "CI987654321",
    currency: "XOF",
    paymentTermDays: 15,
    remindersEnabled: true,
    portalToken: "cli-kofi-mensah",
  },
  {
    id: "cli_3",
    name: "Fatou Ndiaye",
    company: "Ndiaye Consulting",
    email: "fatou@ndiaye-consulting.sn",
    phone: "+221 76 987 65 43",
    address: "Almadies, Lot 45",
    city: "Dakar",
    postalCode: "BP 900",
    country: "SN",
    currency: "XOF",
    paymentTermDays: 30,
    remindersEnabled: false,
    portalToken: "cli-fatou-ndiaye",
  },
  {
    id: "cli_4",
    name: "Ibrahim Traoré",
    company: "Traoré Industries",
    email: "ibrahim@traore-industries.bf",
    phone: "+226 70 11 22 33",
    address: "Zone industrielle de Kossodo",
    city: "Ouagadougou",
    country: "BF",
    taxId: "BF112233445",
    currency: "XOF",
    paymentTermDays: 45,
    remindersEnabled: true,
    portalToken: "cli-ibrahim-traore",
  },
  {
    id: "cli_5",
    name: "Aïcha Bamba",
    company: "Bamba Studio",
    email: "aicha@bamba-studio.ml",
    phone: "+223 76 55 44 33",
    address: "Hippodrome",
    city: "Bamako",
    country: "ML",
    currency: "XOF",
    paymentTermDays: 30,
    remindersEnabled: true,
    portalToken: "cli-aicha-bamba",
  },
];

export function clientInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function portalUrl(token: string): string {
  return `https://invomind.app/f/${token}`;
}
