import PageHeader from "@/components/admin/PageHeader";
import { createClient } from "@/lib/supabase/server";
import CustomCodeManager from "@/components/admin/CustomCodeManager";

export default async function CustomCodeAdminPage() {
  const supabase = await createClient();
  const { data: snippets } = await supabase
    .from("custom_code_snippets")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Custom Code"
        description="Developer-only. Inject raw HTML/CSS/JS into the live site (analytics, pixels, custom widgets)."
      />
      <CustomCodeManager snippets={snippets ?? []} />
    </div>
  );
}
