import type { SupabaseClient } from "@supabase/supabase-js";

// Rows of `table` for a list of ids, keyed by id.
//
// Used instead of embedding a related table in a select ("trainer:profiles(...)")
// where the database may hold more than one relationship between the two
// tables: PostgREST then refuses the whole query ("more than one relationship
// was found"), and the page shows nothing. A second query by id cannot be
// ambiguous. Ids are sent in chunks so the request address stays short.
export async function byId<T extends { id: string }>(supabase: SupabaseClient, table: string, columns: string, ids: (string | null | undefined)[]): Promise<Map<string, T>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const found = new Map<string, T>();
  for (let i = 0; i < unique.length; i += 100) {
    const { data } = await supabase.from(table).select(columns).in("id", unique.slice(i, i + 100));
    for (const row of (data ?? []) as unknown as T[]) found.set(row.id, row);
  }
  return found;
}
