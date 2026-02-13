import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const loadEnvFile = (filePath) => {
	if (!existsSync(filePath)) return;
	const content = readFileSync(filePath, "utf8");
	for (const rawLine of content.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;
		const separatorIndex = line.indexOf("=");
		if (separatorIndex <= 0) continue;
		const key = line.slice(0, separatorIndex).trim();
		if (!key || process.env[key] !== undefined) continue;
		let value = line.slice(separatorIndex + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		process.env[key] = value;
	}
};

const run = (command) => execSync(command, { stdio: "inherit" });

loadEnvFile(".env");
loadEnvFile(".env.local");

const hasClientId = Boolean(process.env.TINACLIENTID);
const hasToken = Boolean(process.env.TINATOKEN);
const hasSearchToken = Boolean(process.env.TINASEARCH);

const cloudCommand = `npx tinacms build --skip-cloud-checks${hasSearchToken ? "" : " --skip-search-index"}`;
const localFallbackCommand =
	"npx tinacms build --local --skip-search-index --skip-cloud-checks";

if (hasClientId && hasToken) {
	console.log("Using Tina Cloud build");
	try {
		run(cloudCommand);
	} catch {
		console.log(
			"Tina Cloud build failed; falling back to local Tina build (check remote schema sync)."
		);
		run(localFallbackCommand);
	}
} else {
	console.log(
		"Using local Tina build fallback (missing Tina Cloud credentials)"
	);
	run(localFallbackCommand);
}
