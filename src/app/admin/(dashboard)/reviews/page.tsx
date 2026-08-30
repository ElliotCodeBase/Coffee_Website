import { createClient } from "@/lib/supabase/server";
import ReviewsManager from "@/components/admin/ReviewsManager";

export default async function ReviewsAdminPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase.from("reviews").select("*").order("sort_order", { ascending: true });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">Reviews</h1>
        <p className="text-sm text-stone-500 mt-1">Manage the customer testimonials shown on your site.</p>
      </div>
      <ReviewsManager reviews={reviews ?? []} />
    </div>
  );
}
