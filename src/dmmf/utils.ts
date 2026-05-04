import execa from 'execa'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Check if DMMF has the required schema property with outputTypes.
 * For Prisma 7+ with prisma-client generator, we use getDMMF from @prisma/internals.
 */
const isCompleteDmmf = (dmmf: any): boolean => {
  return (
    dmmf?.schema?.outputObjectTypes?.prisma?.length > 0 || dmmf?.schema?.outputObjectTypes?.model?.length > 0
  )
}

/**
 * Find the schema.prisma file in common locations.
 * Resolution order:
 * 1. Explicit `explicitPath` argument (e.g. from plugin options)
 * 2. `PRISMA_SCHEMA_PATH` environment variable
 * 3. `./prisma/schema.prisma` and `./schema.prisma` relative to `process.cwd()`
 */
const findSchemaPath = (explicitPath?: string): string | null => {
  if (explicitPath) {
    const resolved = path.isAbsolute(explicitPath)
      ? explicitPath
      : path.resolve(process.cwd(), explicitPath)
    if (fs.existsSync(resolved)) {
      return resolved
    }
  }

  if (process.env.PRISMA_SCHEMA_PATH && fs.existsSync(process.env.PRISMA_SCHEMA_PATH)) {
    return process.env.PRISMA_SCHEMA_PATH
  }

  const possiblePaths = [
    path.join(process.cwd(), 'prisma', 'schema.prisma'),
    path.join(process.cwd(), 'schema.prisma'),
  ]

  for (const schemaPath of possiblePaths) {
    if (fs.existsSync(schemaPath)) {
      return schemaPath
    }
  }

  return null
}

/**
 * Get the DMMF from @prisma/internals.
 * For Prisma 7+ with prisma-client generator, this is the only way to get the full DMMF.
 */
export const getPrismaClientDmmf = (_packagePath: string, prismaSchemaPath?: string) => {
  let dmmf: any = undefined
  let debugInfo: string[] = []

  // Resolve schema path eagerly so we can both pass it to the child process and
  // include it in any error message.
  const resolvedSchemaPath = findSchemaPath(prismaSchemaPath)

  try {
    const { stdout } = execa.sync('node', [__dirname + '/generate.js'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        // Forward the resolved schema path so generate.js doesn't have to re-discover it.
        ...(resolvedSchemaPath ? { PRISMA_SCHEMA_PATH: resolvedSchemaPath } : {}),
      },
    })
    const generatedDmmf = JSON.parse(stdout)

    debugInfo.push(`getDMMF result keys: ${Object.keys(generatedDmmf).join(', ')}`)
    if (generatedDmmf?.schema) {
      debugInfo.push(`schema keys: ${Object.keys(generatedDmmf.schema).join(', ')}`)
    }

    if (isCompleteDmmf(generatedDmmf)) {
      dmmf = generatedDmmf
    } else {
      debugInfo.push('DMMF is incomplete - missing schema.outputObjectTypes')
    }
  } catch (e: any) {
    debugInfo.push(`Error with getDMMF: ${e.message}`)
  }

  if (!dmmf) {
    throw new Error(`\
Could not load DMMF with schema information.

This plugin requires Prisma 7+ with the 'prisma-client' generator.

Please ensure:
1. You have run \`prisma generate\`
2. Your schema.prisma file exists at: ${resolvedSchemaPath || 'prisma/schema.prisma'}
3. @prisma/internals is installed
4. Your generator uses 'prisma-client' (not 'prisma-client-js')

Debug info:
${debugInfo.join('\n')}`)
  }

  return dmmf
}
