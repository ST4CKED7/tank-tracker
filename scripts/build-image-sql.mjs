import { readFileSync, writeFileSync } from "node:fs"

const { updates } = JSON.parse(readFileSync("scripts/species-image-updates.json", "utf8"))
const esc = (s) => s.replace(/\?utm_[^'"]*/g, "").replace(/'/g, "''")
const chunks = []
for (let i = 0; i < updates.length; i += 20) {
  const slice = updates.slice(i, i + 20)
  const values = slice.map((u) => `('${u.id}'::uuid, '${esc(u.url)}')`).join(",\n")
  chunks.push(
    `update public.species_catalog s set image_url = v.url from (values ${values}) as v(id, url) where s.id = v.id and (s.image_url is null or s.image_url = '');`,
  )
}
writeFileSync("scripts/species-image-sql-chunks.json", JSON.stringify(chunks, null, 2))
console.log(`${chunks.length} chunks, ${updates.length} updates`)
