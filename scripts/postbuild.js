import fs from 'fs';
import path from 'path';

const workerPath = path.join(process.cwd(), '.svelte-kit/cloudflare/_worker.js');
const exportStatement = "\nexport { BullCheckAgent } from '../../src/lib/agent';\n";

try {
	if (fs.existsSync(workerPath)) {
		fs.appendFileSync(workerPath, exportStatement);
		console.log('Successfully appended BullCheckAgent export to worker.');
	} else {
		console.error('Worker file not found at:', workerPath);
		process.exit(1);
	}
} catch (err) {
	console.error('Failed to append export to worker:', err);
	process.exit(1);
}
