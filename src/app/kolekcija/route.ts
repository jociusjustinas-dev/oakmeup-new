const DEPLOYED_CATALOG_URL = "https://produktai.oakmeup.lt";
const REVALIDATE_SECONDS = 300;
const GRID_OVERRIDE = `
<style id="catalog-grid-default-override">
  .catalog-root--grid .sub-block{grid-template-columns:repeat(4,minmax(0,1fr)) !important;}
  @media (max-width: 1024px){.catalog-root--grid .sub-block{grid-template-columns:repeat(3,minmax(0,1fr)) !important;}}
  @media (max-width: 820px){.catalog-root--grid .sub-block{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}}
  @media (max-width: 560px){.catalog-root--grid .sub-block{grid-template-columns:1fr !important;}}
</style>
`;

const applyCatalogOverrides = (html: string) => {
  let output = html;
  output = output.replace("let viewMode='list';", "let viewMode='grid';");
  output = output.replace(
    'id="view-list" class="view-toggle-btn active" onclick="setView(\'list\')" title="Sąrašas" aria-pressed="true"',
    'id="view-list" class="view-toggle-btn" onclick="setView(\'list\')" title="Sąrašas" aria-pressed="false"',
  );
  output = output.replace(
    'id="view-grid" class="view-toggle-btn" onclick="setView(\'grid\')" title="Tinklelis" aria-pressed="false"',
    'id="view-grid" class="view-toggle-btn active" onclick="setView(\'grid\')" title="Tinklelis" aria-pressed="true"',
  );
  output = output.replace(/<\/head>/i, `${GRID_OVERRIDE}\n</head>`);
  return output;
};

export async function GET() {
  try {
    const catalogResponse = await fetch(DEPLOYED_CATALOG_URL, {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!catalogResponse.ok) {
      throw new Error(`Failed to fetch deployed catalog: ${catalogResponse.status}`);
    }

    const catalogHtml = await catalogResponse.text();
    const patchedHtml = applyCatalogOverrides(catalogHtml);
    return new Response(patchedHtml, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      `<html><body><h1>Cannot load deployed catalog</h1><p>${DEPLOYED_CATALOG_URL}</p><pre>${message}</pre></body></html>`,
      {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      },
    );
  }
}
