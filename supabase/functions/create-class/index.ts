// POST /create-class
// Auth: JWT. Identity from the token. CORS is allowlisted (M35); no PII logging (C7).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { handlePreflight } from "../_shared/cors.ts";
import { withErrors, ok, AppError } from "../_shared/http.ts";
import { getUserFromJWT } from "../_shared/auth.ts";

Deno.serve((req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  return withErrors(req, async () => {
    if (req.method !== "POST") throw new AppError(405, "method", "POST only");

    const { userId } = await getUserFromJWT(req);

    const { className, gradeLevel, classSize, classLevel, classTime } = await req.json().catch(() => ({}));
    if (!className || !gradeLevel || !classSize || !classTime) {
      throw new AppError(400, "input", "Missing required fields");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data, error } = await supabase
      .from("classes")
      .insert({
        user_id: userId,
        class_name: className,
        details_jsonb: { grade: gradeLevel, size: parseInt(classSize), level: classLevel, time: classTime },
      })
      .select()
      .single();

    if (error) throw new AppError(500, "db", "Could not create class");

    return ok(req, { success: true, class: data });
  });
});
