export interface Supplier {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  notes?: string;
}

export const SUPPLIERS: Supplier[] = [
  {
    id: "sup_1",
    name: "Moussa Kane",
    company: "Immobilière Plateau",
    email: "contact@immobiliere-plateau.sn",
    phone: "+221 33 821 00 00",
    address: "Place de l'Indépendance",
    city: "Dakar",
    country: "SN",
    taxId: "SN555666777",
  },
  {
    id: "sup_2",
    name: "Service réservations",
    company: "Air Côte d'Ivoire",
    email: "b2b@aircotedivoire.com",
    phone: "+225 27 21 00 00",
    city: "Abidjan",
    country: "CI",
  },
  {
    id: "sup_3",
    name: "Support entreprises",
    company: "Orange Business",
    email: "entreprises@orange.sn",
    phone: "+221 33 839 00 00",
    city: "Dakar",
    country: "SN",
    taxId: "SN111222333",
  },
  {
    id: "sup_4",
    name: "Me Mamadou Sow",
    company: "Cabinet Sow & Associés",
    email: "m.sow@sow-associes.sn",
    phone: "+221 33 822 11 22",
    address: "Avenue Léopold Sédar Senghor",
    city: "Dakar",
    country: "SN",
  },
];
