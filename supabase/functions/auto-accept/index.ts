// supabase/functions/auto-accept/index.ts
// Call: POST /functions/v1/auto-accept  (protect with Authorization header / JWT)
// Schedule via Supabase cron to run every few minutes/hours.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

serve(async (_req) => {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !serviceKey) {
        return new Response(JSON.stringify({ ok: false, error: "Missing env" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }

    const supabase = createClient(url, serviceKey);
    const { data, error } = await supabase.rpc("auto_accept_due_milestones_v2", { p_limit: 200 });

    if (error) {
        return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ ok: true, data }), {
        status: 200,
        headers: { "content-type": "application/json" },
    });
});
