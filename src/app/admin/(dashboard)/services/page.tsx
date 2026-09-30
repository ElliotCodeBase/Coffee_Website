import PageHeader from "@/components/admin/PageHeader";
import { createClient } from "@/lib/supabase/server";
import ServicesManager from "@/components/admin/ServicesManager";

export default async function ServicesAdminPage() {
  const supabase = await createClient();
  // Admins see every row (including hidden ones) — unlike the public site
  // query which filters to is_visible = true only.
  const { data: items } = await supabase.from("service_items").select("*").order("sort_order", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Our Services"
        description="The icon grid shown on the front page between your story and the menu."
      />
      <ServicesManager items={items ?? []} />
    </div>
  );
}
