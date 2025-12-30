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

        // Hardcoded Master Admin
        const email = "admin@manager.com";
        const password = "f3l1p3"; // User specific password
        const name = "Master Admin";
        const role = "Administrador"; // Cargo
        const permission_level = 4;
        const origin = "Sistema";

        // Create Auth User
        const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role, permission_level, origin }
        });

        if (createError) {
            // If already exists, just return info
            if (createError.message.includes("already registered")) {
                return new Response(JSON.stringify({ message: "Admin already exists" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
            throw createError;
        }

        // Create Profile
        const { error: profileError } = await supabaseAdmin.from("profiles").insert({
            id: authUser.user.id,
            name,
            email,
            role,
            permission_level,
            origin,
            status: "active",
        });

        if (profileError) {
            // Ignore duplicate key error if partially created
            if (!profileError.message.includes("duplicate key")) {
                throw profileError;
            }
        }

        return new Response(
            JSON.stringify({ message: "Master Admin Created" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
