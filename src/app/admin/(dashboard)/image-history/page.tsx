import { getImageHistoryDiagnostics } from "@/lib/data/public";
import ImageHistoryManager from "@/components/admin/ImageHistoryManager";

export default async function ImageHistoryAdminPage() {
  const diagnostics = await getImageHistoryDiagnostics();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">Image History</h1>
        <p className="text-sm text-stone-500 mt-1">
          Every previous logo, hero, and story image saved from Supabase, in one place.
        </p>
      </div>
      <ImageHistoryManager diagnostics={diagnostics} />
    </div>
  );
}
