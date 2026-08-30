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
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">Custom Code</h1>
        <p className="text-sm text-stone-500 mt-1">
          Developer-only. Inject raw HTML/CSS/JS into the live site (analytics, pixels, custom widgets).
        </p>
      </div>
      <CustomCodeManager snippets={snippets ?? []} />
    </div>
  );
}
