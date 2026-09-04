import { LaravelApiError } from "@/lib/laravel/client";

const FIELD_LABELS: Record<string, string> = {
  name_company: "Nom / entreprise",
  email: "E-mail",
  phone: "Téléphone",
  adresse: "Adresse",
  ville: "Ville",
  code_postal: "Code postal",
  country: "Pays",
  devise: "Devise",
  full_name: "Nom",
  password: "Mot de passe",
  company_name: "Entreprise",
};

export function actionErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof LaravelApiError) {
    const payload = error.payload as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    const errors = payload?.errors;
    if (errors && typeof errors === "object") {
      const firstKey = Object.keys(errors)[0];
      const firstMsg = firstKey ? errors[firstKey]?.[0] : undefined;
      if (firstMsg) {
        const label = FIELD_LABELS[firstKey] ?? firstKey.replaceAll("_", " ");
        // Prefer a clean French label when Laravel returns English attribute names.
        if (/name company|name_company/i.test(firstMsg)) {
          return "Le nom de l’entreprise est obligatoire.";
        }
        return firstMsg.replace(firstKey, label).replaceAll("_", " ");
      }
    }
    if (payload?.message) return payload.message;
    return error.message.replace(/\s*\[[A-Z]+ \/[^\]]+\]\s*$/, "") || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
