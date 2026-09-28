import { createClient } from "@/lib/supabase/server";
import ServicesManager from "@/components/admin/ServicesManager";

export default async function ServicesAdminPage() {
  const supabase = await createClient();
  // Admins see every row (including hidden ones) — unlike the public site
  // query which filters to is_visible = true only.
  const { data: items } = await supabase.from("service_items").select("*").order("sort_order", { ascending: true });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">Our Services</h1>
        <p className="text-sm text-stone-500 mt-1">
          The icon grid shown on the front page between your story and the menu.
        </p>
      </div>
      <ServicesManager items={items ?? []} />
    </div>
  );
}
