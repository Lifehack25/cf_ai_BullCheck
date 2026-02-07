
// debug_comparison.ts
const BASE_URL = 'https://statistikdatabasen.scb.se/api/v2';
const IDS = ['TAB4323', 'TAB4667'];

async function run() {
    for (const id of IDS) {
        console.log(`\n\n------------------------------------------------`);
        console.log(`📋 INSPECTING: ${id}`);
        try {
            const res = await fetch(`${BASE_URL}/tables/${id}?lang=en`);
            if (!res.ok) { console.log("Overview fetch failed"); continue; }
            const summary = await res.json();

            // Get Metadata
            const metaLink = summary.links?.find((l: any) => l.rel === 'metadata')?.href;
            if (metaLink) {
                let url = metaLink;
                if (url.includes('lang=')) url = url.replace(/lang=[a-z]{2}/, 'lang=en');
                else url += (url.includes('?') ? '&' : '?') + 'lang=en';

                const metaRes = await fetch(url);
                const meta = await metaRes.json();
                console.log(`TITLE: ${meta.label}`);

                // Check Metrics (ContentsCode)
                let variables = meta.variables;
                if (!variables && meta.dimension) {
                    // Convert JSON-stat2 to simple view
                    // Find the metric dimension usually 'ContentsCode'
                    const dimId = Object.keys(meta.dimension).find(k => k.toLowerCase().includes('content') || k === 'ContentsCode');
                    if (dimId) {
                        const dim = meta.dimension[dimId];
                        variables = [{
                            text: dim.label,
                            values: Object.keys(dim.category.index),
                            valueTexts: Object.values(dim.category.label)
                        }];
                    }
                }

                if (variables) {
                    const contents = variables.find((v: any) => v.id === 'ContentsCode' || v.text.includes('measure') || v.text.includes('observations'));
                    if (contents) {
                        console.log(`METRICS:`);
                        contents.valueTexts.forEach((t: string) => console.log(` - ${t}`));
                    } else {
                        console.log("No explicit ContentsCode found.");
                        console.log("Dims:", variables.map((v: any) => v.text).join(', '));
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
}

run();
