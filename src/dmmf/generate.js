const SDK = require('@prisma/internals')
const path = require('path')
const fs = require('fs')

const schemaPath = path.join(process.cwd(), '/node_modules/.prisma/client/schema.prisma')
const prismaSchema = fs.readFileSync(schemaPath, 'utf-8')

// Prisma 7.x uses 'prismaSchema' instead of 'datamodel'
SDK.getDMMF({
  prismaSchema,
}).then((dmmf) => console.log(JSON.stringify(dmmf))).catch((err) => {
  // Fallback for older Prisma versions that use 'datamodel'
  SDK.getDMMF({
    datamodel: prismaSchema,
  }).then((dmmf) => console.log(JSON.stringify(dmmf)))
})
