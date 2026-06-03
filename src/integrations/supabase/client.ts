// Single shared Supabase client (M36). Re-export the canonical instance from lib/supabase
// so the app never creates two GoTrueClients against the same storage key.
// Import either way:
//   import { supabase } from "@/integrations/supabase/client";
//   import { supabase } from "@/lib/supabase";
export { supabase } from '@/lib/supabase';
