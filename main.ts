// Leonida Trophy Guide — the entry program for make.fun's gta6-trophy-guide-01 bounty.
//
// What this program does: it takes this repository's app/ folder (the offline guide and
// tracker — plain static files, no build step) and its screenshots/ folder, copies both
// into the output directory, and writes output/dossier.json there. The dossier is the
// summary the judge reads: the screenshots, the first load's files and bytes, and the
// guide's source. It is built with the kit's vendored library, vendor/makefun-frontend.ts,
// which must stay exactly as the kit shipped it: the scorer rebuilds the dossier with its
// own copy of that library and requires the two to match byte for byte.
//
// Where the output goes: the grader gives this program a writable /output directory.
// Anywhere else, the MAKEFUN_OUTPUT_DIR environment variable stands in for it, so you
// can check the result locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program runs on Node 22 with the standard library only, twice, and both runs must
// write the same bytes — so it does nothing time- or randomness-dependent.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

// The folder this file lives in is the repository root.
const repoRoot = fileURLToPath(new URL(".", import.meta.url));

// The grader's output directory, or the local stand-in outside the grader.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Copy the whole guide (app/) into the output, then the screenshots beside it.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, "app"), join(outputDir, "app"), { recursive: true });

const shotsDir = join(repoRoot, "screenshots");
const shotsOut = join(outputDir, "screenshots");
mkdirSync(shotsOut, { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, shotsOut, { recursive: true });
}

// Refuse to hand in an entry with no screenshots at all: the gate needs 3 or 4.
const shots = readdirSync(shotsOut).filter((name) => !name.startsWith("."));
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
}

// The gate also needs every one of the 55 official trophies named with a non-blank
// guide, so check the data file before handing anything in.
const trophyData = JSON.parse(readFileSync(join(repoRoot, "app", "data", "trophies.json"), "utf8"));
const trophies = trophyData.trophies;
if (!Array.isArray(trophies) || trophies.length !== 55) {
  throw new Error(`expected 55 trophies, found ${Array.isArray(trophies) ? trophies.length : "none"}`);
}
const missingGuide = trophies.find((t) => typeof t.guide !== "string" || t.guide.trim() === "");
if (missingGuide) {
  throw new Error(`trophy without a guide: ${missingGuide.name ?? missingGuide.id}`);
}

// Write the dossier with the same limits the gate enforces, so a local run fails the
// same way the scorer would: at most 4 screenshots of 256 KiB each, at most 993 files
// and 48 MiB in app/, and the dossier text capped at 160 KiB.
writeFileSync(
  join(outputDir, "dossier.json"),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

console.log(`Wrote ${outputDir}/dossier.json with ${shots.length} screenshots.`);
