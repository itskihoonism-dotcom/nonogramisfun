import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = "https://jxwhdiwwgtnyyqenkpvw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4d2hkaXd3Z3RueXlxZW5rcHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMDQ3NjgsImV4cCI6MjEwMTU4MDc2OH0.e76mCgwu-v8W-cuu3fR4_4jQ9gwP60MCCESzAgoBQaU";

// 👇 여기도 export 가 있어야 합니다!
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}