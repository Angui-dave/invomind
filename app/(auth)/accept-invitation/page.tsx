import type { Metadata } from "next";
import { AcceptInvitationForm } from "@/components/auth/accept-invitation-form";

export const metadata: Metadata = {
  title: "Accepter l’invitation",
};

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return <AcceptInvitationForm token={token ?? ""} />;
}
