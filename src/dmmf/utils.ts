import execa from 'execa'

/**
 * Check if DMMF has the required schema property with outputTypes.
 * In Prisma 7.x, getDMMF from @prisma/internals no longer includes schema,
 * so we need to get it from the generated Prisma Client instead.
 */
const isCompleteDmmf = (dmmf: any): boolean => {
  return (
    dmmf?.schema?.outputObjectTypes?.prisma?.length > 0 || dmmf?.schema?.outputObjectTypes?.model?.length > 0
  )
}

export const getPrismaClientDmmf = (packagePath: string) => {
  let dmmf: any = undefined
  let debugInfo: string[] = []

  // First try to get DMMF from generated Prisma Client (preferred in Prisma 7.x)
  try {
    const prismaClient = require(packagePath)
    const clientDmmf = prismaClient.dmmf || prismaClient.Prisma.dmmf

    debugInfo.push(`Prisma Client loaded from: ${packagePath}`)
    debugInfo.push(`clientDmmf exists: ${!!clientDmmf}`)
    debugInfo.push(`clientDmmf keys: ${clientDmmf ? Object.keys(clientDmmf).join(', ') : 'N/A'}`)
    debugInfo.push(`clientDmmf.schema exists: ${!!clientDmmf?.schema}`)
    if (clientDmmf?.schema) {
      debugInfo.push(`schema keys: ${Object.keys(clientDmmf.schema).join(', ')}`)
    }

    if (isCompleteDmmf(clientDmmf)) {
      dmmf = clientDmmf
    }
  } catch (e: any) {
    debugInfo.push(`Error loading Prisma Client: ${e.message}`)
  }

  // Fallback to getDMMF from @prisma/internals (for older Prisma versions)
  if (!dmmf) {
    try {
      const { stdout } = execa.sync('node', [__dirname + '/generate.js'], {
        cwd: process.cwd(),
      })
      const generatedDmmf = JSON.parse(stdout)

      debugInfo.push(`getDMMF result keys: ${Object.keys(generatedDmmf).join(', ')}`)

      if (isCompleteDmmf(generatedDmmf)) {
        dmmf = generatedDmmf
      }
    } catch (e: any) {
      debugInfo.push(`Error with getDMMF: ${e.message}`)
    }
  }

  if (!dmmf) {
    throw new Error(`\
You most likely forgot to initialize the Prisma Client. Please run \`prisma generate\` and try to run it again.
If that does not solve your problem, please open an issue.

Debug info:
${debugInfo.join('\n')}`)
  }

  return dmmf
}
