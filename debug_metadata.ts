
// debug_metadata.ts
const BASE_URL = 'https://statistikdatabasen.scb.se/api/v2';
const TABLE_ID = 'TAB4392';

async function run() {
    console.log(`\n📋 METADATA for ${TABLE_ID}`);

    // 1. Get Link
    const res = await fetch(`${BASE_URL}/tables/${TABLE_ID}?lang=en`);
    if (!res.ok) {
        console.error("Failed to get table summary");
        return;
    }
    const data = await res.json();
    const metaLink = data.links?.find((l: any) => l.rel === 'metadata')?.href;

    if (!metaLink) {
        console.log("No metadata link.");
        return;
    }

    // Fix lang param
    let url = metaLink;
    if (url.includes('lang=')) url = url.replace(/lang=[a-z]{2}/, 'lang=en');
    else url += (url.includes('?') ? '&' : '?') + 'lang=en';

    // 2. Get Full Meta
    const metaRes = await fetch(url);
    const meta = await metaRes.json();

    console.log("Title:", meta.label);

    // 3. Inspect Structure
    if (meta.variables) {
        console.log(">>> Format: SCB Legacy (variables)");
        meta.variables.forEach((v: any) => {
            console.log(`[${v.id}] ${v.text} (Count: ${v.values.length})`);
        });
    } else if (meta.dimension) {
        console.log(">>> Format: JSON-stat 2.0 (dimension)");
        Object.keys(meta.dimension).forEach(dimId => {
            const dim = meta.dimension[dimId];
            console.log(`\nDimension: [${dimId}] ${dim.label}`);

            const categories = dim.category;
            const index = categories.index || {};
            const label = categories.label || {};
            const codes = Object.keys(index).sort((a, b) => index[a] - index[b]);

            console.log(`Values Count: ${codes.length}`);

            // Print values
            if (codes.length > 20) {
                codes.slice(0, 5).forEach(c => console.log(`  - ${label[c] || c} (${c})`));
                console.log("  ... (skipped) ...");
                codes.slice(-5).forEach(c => console.log(`  - ${label[c] || c} (${c})`));
            } else {
                codes.forEach(c => console.log(`  - ${label[c] || c} (${c})`));
            }
        });
    } else {
        console.log("Unknown format.");
        console.log(JSON.stringify(meta, null, 2));
    }
}

run();
