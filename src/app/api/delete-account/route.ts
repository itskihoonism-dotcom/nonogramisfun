import { NextResponse } from "next/server";
import { createClient as createServerClient } from "../../../lib/supabaseServer";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const admin = createSupabaseClient(
    "https://jxwhdiwwgtnyyqenkpvw.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // user_ids 테이블에서 내 정보 삭제
  await admin.from("user_ids").delete().eq("email", user.email);

  // Supabase Authentication 계정 자체 삭제
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}