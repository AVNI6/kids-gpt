/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://tytlgaxulpqfrkvnekfr.supabase.co",
  "sb_publishable_YE2l44RrCWmj8agKCIg6Bw_vOU80RE1" // Wait, I need the SERVICE ROLE KEY to insert dummy users!
);
