// Supabase returns at most 1,000 rows per request. Lists that can grow past
// that (members) are read page by page until a short page comes back.
// `page` must apply a stable order, or rows can repeat or go missing.
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
  pageSize = 1000
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = [];
  for (let from = 0; from < 50_000; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) return { data: rows, error };
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < pageSize) break;
  }
  return { data: rows, error: null };
}
