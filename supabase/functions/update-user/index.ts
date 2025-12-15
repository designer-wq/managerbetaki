import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing Authorization header");

        const token = authHeader.replace("Bearer ", "");
        const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !caller) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Admin Check
        const { data: callerProfile } = await supabaseAdmin.from("profiles").select("permission_level").eq("id", caller.id).single();
        if (!callerProfile || callerProfile.permission_level < 4) {
            return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { id, email, password, name, role, permission_level, origin } = await req.json();

        if (!id) throw new Error("User ID required");

        // 1. Update Auth User
        const updateAttrs: any = {
            email,
            user_metadata: { name, role, permission_level, origin }
        };
        if (password) updateAttrs.password = password;

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, updateAttrs);
        if (updateError) throw updateError;

        // 2. Update Profile
        const { error: profileError } = await supabaseAdmin.from("profiles").update({
            name,
            email,
            role,
            permission_level,
            origin
        }).eq("id", id);

        if (profileError) throw profileError;

        return new Response(
            JSON.stringify({ message: "User updated" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
