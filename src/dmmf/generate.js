const SDK = require('@prisma/internals')
const path = require('path')
const fs = require('fs')

// Allow specifying schema path via environment variable
let schemaPath = process.env.PRISMA_SCHEMA_PATH

if (!schemaPath) {
  // Find schema.prisma in common locations
  const possiblePaths = [
    path.join(process.cwd(), 'prisma', 'schema.prisma'),
    path.join(process.cwd(), 'schema.prisma'),
  ]

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      schemaPath = p
      break
    }
  }
}

if (!schemaPath || !fs.existsSync(schemaPath)) {
  console.error('Could not find schema.prisma. Set PRISMA_SCHEMA_PATH environment variable or place schema in prisma/schema.prisma')
  process.exit(1)
}

const datamodel = fs.readFileSync(schemaPath, 'utf-8')

// Prisma 7+ uses 'datamodel' parameter
SDK.getDMMF({
  datamodel,
}).then((dmmf) => {
  console.log(JSON.stringify(dmmf))
}).catch((err) => {
  console.error('Failed to get DMMF:', err.message)
  process.exit(1)
})
