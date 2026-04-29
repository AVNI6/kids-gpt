import { createClient } from "@/lib/supabase/client";

export default async function Home() {
  const supabase = createClient();

  const { data } = await supabase.from("demos").select();

  return (
    <div>
      <div>Kids-GPT</div>
      {data?.map((demo) => (
        <li key={demo.id}>{demo.name}</li>
      ))}
    </div>
  );
}
