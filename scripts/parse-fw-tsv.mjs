import { readFileSync, writeFileSync } from "node:fs"

const raw = readFileSync("scripts/fw-missing-raw.json", "utf8")
const { tsv } = JSON.parse(raw)
const rows = tsv
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [id, common_name, scientific_name] = line.split("\t")
    return { id, common_name, scientific_name: scientific_name || null }
  })
writeFileSync("scripts/missing-fw.json", JSON.stringify(rows))
console.log(rows.length)
