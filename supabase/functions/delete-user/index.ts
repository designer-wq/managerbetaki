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

        // Check if Caller is Admin
        const { data: callerProfile } = await supabaseAdmin
            .from("profiles")
            .select("permission_level")
            .eq("id", caller.id)
            .single();

        if (!callerProfile || callerProfile.permission_level < 4) {
            throw new Error("Unauthorized: Only Admins can delete users.");
        }

        const { userId } = await req.json();

        if (!userId) {
            throw new Error("Missing userId");
        }

        // Prevent self-deletion
        if (userId === caller.id) {
            throw new Error("Cannot delete your own account");
        }

        // 2. Delete from profiles table first (foreign key constraints)
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", userId);

        if (profileError) {
            console.error("Error deleting profile:", profileError);
            // Continue anyway - maybe profile doesn't exist
        }

        // 3. Delete from auth.users
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authDeleteError) {
            throw authDeleteError;
        }

        return new Response(
            JSON.stringify({ success: true, message: "User deleted successfully" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
