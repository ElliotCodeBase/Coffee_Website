import { createClient } from "@/lib/supabase/server";
import MenuItemsManager from "@/components/admin/MenuItemsManager";

export default async function MenuAdminPage() {
  const supabase = await createClient();
  // Admins see ALL items (including hidden/unavailable ones) — unlike the
  // public site query which filters to is_available = true only.
  const { data: items } = await supabase.from("menu_items").select("*").order("sort_order", { ascending: true });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">Menu Items</h1>
        <p className="text-sm text-stone-500 mt-1">Add, edit, or remove drinks and pastries shown on your site.</p>
      </div>
      <MenuItemsManager items={items ?? []} />
    </div>
  );
}
