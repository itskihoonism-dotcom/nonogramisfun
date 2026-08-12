import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = "https://jxwhdiwwgtnyyqenkpvw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4d2hkaXd3Z3RueXlxZW5rcHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMDQ3NjgsImV4cCI6MjEwMTU4MDc2OH0.e76mCgwu-v8W-cuu3fR4_4jQ9gwP60MCCESzAgoBQaU";

// 👇 이 export 부분이 반드시 있어야 합니다!
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component에서는 쿠키 set 무시
        }
      },
    },
  });
}