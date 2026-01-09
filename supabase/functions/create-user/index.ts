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

        // 1. Check Caller Permission (must be Admin)
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing Authorization header");
        }
        const token = authHeader.replace("Bearer ", "");
        const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !caller) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Check if Caller is Admin in Profiles (Level 4) or if it's the very first user (bootstrapping)?
        // For Migration purposes, we might need to allow this to run if NO users exist?
        // Or we assume the caller has a valid token.
        // The Master Admin needs to use this.
        // Let's implement Admin check:
        const { data: callerProfile } = await supabaseAdmin
            .from("profiles")
            .select("permission_level")
            .eq("id", caller.id)
            .single();

        // Allow if Level 4 OR if we are using the Service Role directly (which we are not, we are calling from client).
        // EXCEPT: If we are creating the FIRST user (Master), we can't be logged in yet.
        // However, user said "4.1 Backend / Server (Admin API)".
        // And "Executar no SQL Editor...".
        // Usually bootstrapping is done via SQL or CLI.
        // This function is for "Create User" form in the App (Day 2 op).
        // So enforcing Admin check is good.
        // BUT for the "Migration" step of creating the Master Admin, I might need to run this manually or disable check?
        // I'll assume this is for the APP usage.
        // If strict, I check level >= 4.

        if (!callerProfile || callerProfile.permission_level < 4) {
            throw new Error("Unauthorized: Only Admins can create users.");
        }

        const { email, password, name, role, permission_level, origin } = await req.json();

        // 2. Create Auth User
        const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role, permission_level, origin } // Store metadata for recovering if needed
        });

        if (createError) throw createError;
        if (!authUser.user) throw new Error("User creation failed");

        // 3. Create Profile
        const { error: profileError } = await supabaseAdmin.from("profiles").insert({
            id: authUser.user.id,
            name,
            email,
            role, // Cargo
            permission_level,
            origin,
            status: "active",
            // job_title_id: ?? User didn't pass it in "4.2".
        });

        if (profileError) {
            // Rollback Auth User?
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            throw profileError;
        }

        return new Response(
            JSON.stringify(authUser),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
