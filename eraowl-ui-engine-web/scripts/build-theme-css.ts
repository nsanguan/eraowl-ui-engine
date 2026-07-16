import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const THEMES_DIR = join(__dirname, "../src/themes/eut/styles");
const OUTPUT_DIR = join(__dirname, "../src/styles");

function buildThemeCss() {
  const files = readdirSync(THEMES_DIR).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const styleName = file.replace(".json", "");
    const styleData = JSON.parse(
      readFileSync(join(THEMES_DIR, file), "utf-8")
    );

    const cssLines: string[] = [
      `/* Auto-generated: ${styleName} */`,
      `[data-eut-theme="${styleName}"] {`,
    ];

    if (styleData.overrides) {
      for (const [category, tokens] of Object.entries(
        styleData.overrides as Record<string, Record<string, string>>
      )) {
        for (const [key, value] of Object.entries(tokens)) {
          cssLines.push(`  --eut-${category}-${key}: ${value};`);
        }
      }
    }

    cssLines.push("}");

    const outputPath = join(OUTPUT_DIR, `eut-theme-${styleName}.css`);
    writeFileSync(outputPath, cssLines.join("\n"), "utf-8");
    console.log(`Generated: ${outputPath}`);
  }
}

buildThemeCss();
