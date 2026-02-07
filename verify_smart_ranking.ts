
import { SCBAgent } from './src/lib/server/scb-agent';

// 1. REAL Data Snippets from Debugging
// The problematic "Deaths" result (Projections at top)
const DEATHS_SEARCH_RESULT = [
    { id: "TAB4161", label: "Number of births, deaths... Year 2025-2120", firstPeriod: "2025", lastPeriod: "2120", updated: "2025-04-14T07:54:00Z" }, // Trap!
    { id: "TAB4392", label: "Births and deaths... Year 1851-2024", firstPeriod: "1851", lastPeriod: "2024", updated: "2025-02-21T07:00:00Z" }, // Correct!
    { id: "TAB5947", label: "Projection 2021... Year 2021-2120", firstPeriod: "2021", lastPeriod: "2120", updated: "2021-04-13T07:30:00Z" }
];

// The problematic "Inflation" result (Old tables at top)
const INFLATION_SEARCH_RESULT = [
    { id: "TAB2059", label: "CPI (Old Method)... 1980M01-2004M12", firstPeriod: "1980M01", lastPeriod: "2004M12", updated: "2005-01-13T09:00:00Z" }, // Trap!
    { id: "TAB2060", label: "CPI... 1980M01-2022M11", firstPeriod: "1980M01", lastPeriod: "2022M11", updated: "2022-12-14T07:00:00Z" }, // Trap!
    { id: "TAB3673", label: "CPI monthly... 2014M01-2025M12", firstPeriod: "2014M01", lastPeriod: "2025M12", updated: "2026-01-15T07:00:00Z" } // Correct!
];

// Mock Setup
const mockAi = {
    run: async (_model: string, inputs: any) => {
        const msg = (inputs.messages && inputs.messages.length > 0)
            ? inputs.messages[inputs.messages.length - 1].content
            : "";

        // 1. Mock Search Term Extraction
        if (msg.includes("Create a concise search query")) {
            // STRICTER CHECK: Look for the specific question text, ignore examples
            if (msg.includes('User Question: "How many deaths were there in 2014?"')) {
                return { response: JSON.stringify({ term: "Deaths" }) };
            }
            if (msg.includes('User Question: "Inflation in 2023"')) {
                return { response: JSON.stringify({ term: "Inflation" }) };
            }
            // Fallback for safety
            if (msg.toLowerCase().includes("deaths")) return { response: JSON.stringify({ term: "Deaths" }) };
            return { response: JSON.stringify({ term: "General" }) };
        }

        // 2. Mock Table Selection (The core test)
        // The prompt passes a list of tables. The Smart Sorting algorithm runs BEFORE this prompt is built.
        const match = msg.match(/\[(TAB\d+)\]/);
        if (match) return { response: match[1] };

        // 3. Mock Query Mapping
        if (msg.includes("API Query Mapper")) {
            return { response: JSON.stringify({ ContentsCode: ["00"], Tid: ["2014"], Region: ["00"] }) };
        }

        return { response: "NONE" };
    }
};

// Mock the Agent to override 'search' and 'fetch' without patching global
class TestAgent extends SCBAgent {
    constructor() {
        super(mockAi as any);
    }

    // Override search to return our specific test cases
    async search(query: string) {
        console.log(`[Test] Searching for: ${query}`);
        if (query.includes("Inflation")) return [...INFLATION_SEARCH_RESULT];
        if (query.includes("Deaths")) return [...DEATHS_SEARCH_RESULT];
        return [];
    }

    // Override Metadata/Fetch to avoid network (we only test Ranking Logic here)
    async getMetadata() { return { variables: [] }; }
    async mapQuery() { return {}; }
    async fetchData() { return [{ value: 123, label: "Test Data" }]; } // Dummy data
}

async function runTest() {
    const agent = new TestAgent();

    console.log("---------------------------------------------------");
    console.log("TEST 1: 'Deaths in 2014'");
    console.log("Goal: Must pick TAB4392 (1851-2024), NOT TAB4161 (2025-2120)");

    let result = await agent.resolve("How many deaths were there in 2014?");
    // SCBAgent.resolve uses 'bestTable' which is the one selected.
    // The result 'dataset' field comes from bestTable.label.
    if (result && result[0].dataset.includes("1851-2024")) {
        console.log("✅ PASSED: Selected Historical Table (1851-2024)");
    } else {
        console.error("❌ FAILED: Selected Wrong Table");
        console.log("Got:", result ? result[0].dataset : "null");
    }

    console.log("\n---------------------------------------------------");
    console.log("TEST 2: 'Inflation in 2023'");
    console.log("Goal: Must pick TAB3673 (Updated 2026), NOT TAB2059 (Updated 2005)");

    result = await agent.resolve("Inflation in 2023");
    if (result && result[0].dataset.includes("2014M01-2025M12")) {
        console.log("✅ PASSED: Selected Active Table (2014-2025)");
    } else {
        console.error("❌ FAILED: Selected Wrong Table");
        console.log("Got:", result ? result[0].dataset : "null");
    }
}

runTest();
