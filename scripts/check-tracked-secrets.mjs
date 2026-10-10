import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);

const findings = [];
const secretAssignment =
  /^\s*(?:export\s+)?([A-Z][A-Z0-9_]*(?:SECRET|TOKEN|PRIVATE_KEY|API_KEY|PASSWORD|ACCESS_KEY|DEPLOY_KEY)[A-Z0-9_]*)\s*=\s*(.+?)\s*$/gm;
const highConfidenceSecret =
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:sk_(?:live|test)_[A-Za-z0-9]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})/;
const placeholder =
  /^(?:["']?(?:your(?:[-_ ].*)?|replace(?:[-_ ].*)?|change[_ -]?me|placeholder|example|<[^>]+>|todo|none)["']?)$/i;

for (const path of trackedFiles) {
  if (!existsSync(resolve(path))) continue;
  const isExample = path === ".env.example";
  if (
    /(^|\/)\.env(?:\..+)?$/.test(path) &&
    !isExample
  ) {
    findings.push(`${path}: tracked environment/secret file`);
  }

  let contents;
  contents = readFileSync(resolve(path), "utf8");

  if (contents.includes("\0")) continue;
  if (highConfidenceSecret.test(contents)) {
    findings.push(`${path}: private-key/token pattern`);
  }

  for (const match of contents.matchAll(secretAssignment)) {
    const value = match[2].split(/\s+#/, 1)[0].trim();
    if (value && !placeholder.test(value)) {
      findings.push(`${path}: populated ${match[1]} assignment`);
    }
  }
}

if (findings.length) {
  console.error("Potential secrets found in tracked working-tree files:");
  for (const finding of findings) console.error(`- ${finding}`);
  console.error("Review the named files without copying secret values into logs.");
  process.exitCode = 1;
} else {
  console.log(`Checked ${trackedFiles.length} tracked files; no secret patterns found.`);
}
