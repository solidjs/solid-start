/**
 * Script to prefix `XATA_API_KEY` with `VITE_` in .env
 *
 * https://vitejs.dev/guide/env-and-mode.html#env-files
 */

const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '../.env')
const envData = fs.readFileSync(envPath, 'utf-8')
fs.writeFileSync(
  envPath,
  envData.replace(/^XATA_API_KEY=/gm, 'VITE_XATA_API_KEY=')
)
