import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/auth";

export default async function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.profile?.role !== "developer") {
    redirect("/admin");
  }

  return <>{children}</>;
}
