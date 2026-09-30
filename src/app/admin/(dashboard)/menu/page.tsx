import PageHeader from "@/components/admin/PageHeader";
import { createClient } from "@/lib/supabase/server";
import MenuItemsManager from "@/components/admin/MenuItemsManager";

export default async function MenuAdminPage() {
  const supabase = await createClient();
  // Admins see ALL items (including hidden/unavailable ones) — unlike the
  // public site query which filters to is_available = true only.
  const { data: items } = await supabase.from("menu_items").select("*").order("sort_order", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Menu items"
        description="Add, edit, hide or remove the drinks and pastries shown on your website."
        tips={["Use “Hide” instead of deleting when something is just sold out for a while."]}
      />
      <MenuItemsManager items={items ?? []} />
    </div>
  );
}
