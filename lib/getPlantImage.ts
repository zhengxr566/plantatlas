export async function getPlantImage(
  nameLatin?: string
) {
  if (!nameLatin) return null;

  const wikiTitle = nameLatin.replace(/\s+/g, "_");

  try {
    const url =
      "https://en.wikipedia.org/w/api.php" +
      `?action=query` +
      `&titles=${encodeURIComponent(wikiTitle)}` +
      `&prop=pageimages` +
      `&pithumbsize=1200` +
      `&format=json` +
      `&origin=*`;

    const res = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const data = await res.json();

    const pages = data.query?.pages;

    if (!pages) return null;

    const page = Object.values(pages)[0] as any;

    return page?.thumbnail?.source || null;
  } catch {
    return null;
  }
}