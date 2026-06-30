import { redirect } from "next/navigation";

export default function LegacyAppAuthRedirectPage() {
  redirect("/auth");
}
