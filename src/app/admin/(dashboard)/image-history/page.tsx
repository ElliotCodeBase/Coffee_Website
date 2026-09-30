import PageHeader from "@/components/admin/PageHeader";
import { getImageHistoryDiagnostics } from "@/lib/data/public";
import ImageHistoryManager from "@/components/admin/ImageHistoryManager";

export default async function ImageHistoryAdminPage() {
  const diagnostics = await getImageHistoryDiagnostics();

  return (
    <div>
      <PageHeader
        title="Image History"
        description="Every previous logo, hero, and story image saved from Supabase, in one place."
      />
      <ImageHistoryManager diagnostics={diagnostics} />
    </div>
  );
}
