import PageHeader from "@/components/admin/PageHeader";
import { createClient } from "@/lib/supabase/server";
import ReviewsManager from "@/components/admin/ReviewsManager";

export default async function ReviewsAdminPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase.from("reviews").select("*").order("sort_order", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Manage the customer testimonials shown on your site."
      />
      <ReviewsManager reviews={reviews ?? []} />
    </div>
  );
}
