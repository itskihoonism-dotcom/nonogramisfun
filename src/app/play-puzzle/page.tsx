import { permanentRedirect, notFound } from "next/navigation";
import { createClient } from "../../lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function LegacyPlayPuzzleRedirect({
  searchParams,
}: {
  searchParams: any;
}) {
  const resolved = await Promise.resolve(searchParams);
  const id = resolved?.id;

  if (!id) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("puzzles")
    .select("slug")
    .eq("id", id)
    .single();

  if (!data?.slug) notFound();

  permanentRedirect(`/puzzle/${encodeURIComponent(data.slug)}`);
}