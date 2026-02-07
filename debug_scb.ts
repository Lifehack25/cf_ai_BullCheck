
// debug_scb.ts
const BASE_URL = 'https://statistikdatabasen.scb.se/api/v2';

async function search(query: string) {
    console.log(`\n🔍 SEARCHING: "${query}"`);
    const url = `${BASE_URL}/tables?query=${encodeURIComponent(query)}&lang=en`;
    const res = await fetch(url);
    if (!res.ok) {
        console.error(`Status: ${res.status}`);
        return [];
    }
    const data = await res.json();
    return data.tables || [];
}

async function getMetadata(tableId: string) {
    console.log(`\n📋 METADATA for ${tableId}`);
    try {
        // 1. Get Link
        const res = await fetch(`${BASE_URL}/tables/${tableId}?lang=en`);
        if (!res.ok) {
            console.log(`Failed to get table summary: ${res.status}`);
            return;
        }
        const data = await res.json();
        const metaLink = data.links?.find((l: any) => l.rel === 'metadata')?.href;

        if (!metaLink) {
            console.log("No metadata link.");
            return;
        }

        // 2. Get Full Meta
        const metaRes = await fetch(metaLink);
        if (!metaRes.ok) {
            console.log(`Failed to get full meta: ${metaRes.status}`);
            return;
        }
        const meta = await metaRes.json();

        // Print essential parts
        console.log("Title:", meta.label);

        if (meta.variables) {
            const timeVar = meta.variables.find((v: any) => v.id === 'Tid');
            if (timeVar) {
                console.log("Time (Tid) Values (Last 5):", timeVar.values.slice(-5));
            } else {
                console.log("No Time variable found.");
            }
            const contents = meta.variables.find((v: any) => v.code === 'ContentsCode' || v.id === 'ContentsCode');
            if (contents) {
                console.log("Contents:", contents.values);
            }
        } else {
            console.log("No variables found in metadata (likely JSON-stat2 dimension format).");
        }
    } catch (e) {
        console.error("Metadata fetch failed:", e);
    }
}

async function run() {
    // 1. Inflation
    // Try broader "Consumer Price Index"
    const inflationTables = await search("Consumer Price Index");
    console.log(`Found ${inflationTables.length} tables related to CPI.`);

    inflationTables.slice(0, 10).forEach((t: any) => {
        console.log(`- [${t.id}] ${t.label} (Updated: ${t.updated}, Start: ${t.firstPeriod})`);
    });

    // 2. Deaths
    const deathTables = await search("Deaths");
    console.log(`\n🔍 SEARCHING: "Deaths"`);
    console.log(`Found ${deathTables.length} tables related to Deaths.`);
    deathTables.slice(0, 10).forEach((t: any) => {
        console.log(`- [${t.id}] ${t.label} (Updated: ${t.updated}, Start: ${t.firstPeriod})`);
    });

    // Check specific "Total Deaths" table if obvious
    if (deathTables.length > 0) {
        await getMetadata(deathTables[0].id);
    }
}

run();
