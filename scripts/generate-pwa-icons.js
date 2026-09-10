const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const dir = path.join(__dirname, "..", "public", "icons")
fs.mkdirSync(dir, { recursive: true })

function svg(size, pad = 0.18) {
  const inset = Math.round(size * pad)
  const r = Math.round(size * 0.22)
  const stroke = Math.max(3, Math.round(size * 0.055))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#0f766e"/>
  <g fill="none" stroke="#ecfdf5" stroke-width="${stroke}" stroke-linecap="round">
    <path d="M ${inset} ${size * 0.42} Q ${size * 0.33} ${size * 0.28} ${size * 0.5} ${size * 0.42} T ${size - inset} ${size * 0.42}"/>
    <path d="M ${inset} ${size * 0.58} Q ${size * 0.33} ${size * 0.44} ${size * 0.5} ${size * 0.58} T ${size - inset} ${size * 0.58}"/>
    <path d="M ${inset} ${size * 0.74} Q ${size * 0.33} ${size * 0.6} ${size * 0.5} ${size * 0.74} T ${size - inset} ${size * 0.74}"/>
  </g>
</svg>`
}

async function write(name, size, maskable = false) {
  const buf = Buffer.from(svg(size, maskable ? 0.22 : 0.18))
  await sharp(buf).png().toFile(path.join(dir, name))
  console.log("wrote", name)
}

;(async () => {
  await write("icon-192.png", 192)
  await write("icon-512.png", 512)
  await write("maskable-512.png", 512, true)
  await write("apple-touch-icon.png", 180)
})()
