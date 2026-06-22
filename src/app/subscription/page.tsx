// import { createClient } from "@/lib/supabase/server";
// import type { SubscriptionPlanRow } from "@/types/subscription.types";
// import SubscriptionClient from "./SubscriptionClient";

// export default async function SubscriptionPage() {
//   const supabase = await createClient();

//   const { data, error } = await supabase
//     .from("subscriptions_plans")
//     .select("*")
//     .eq("is_active", true)
//     .is("deleted_at", null)
//     .order("price", { ascending: true });

//   if (error) {
//     console.error("Error fetching subscription plans:", error);
//   }

//   const initialPlans = (data as SubscriptionPlanRow[]) || [];
//   return <SubscriptionClient initialPlans={initialPlans} />;
// }
import React from "react";

const page = () => {
  return (
    <div className="flex items-center justify-center min-h-screen text-center text-3xl font-semibold text-muted-foreground">
      Coming soon...
    </div>
  );
};

export default page;
