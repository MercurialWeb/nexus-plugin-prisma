// This script ensures all @prisma/* dependencies are on the same version
const packageJson = require('../package.json')

const prismaDeps = [
  ...Object.entries(packageJson.dependencies),
  ...Object.entries(packageJson.devDependencies),
].filter(([depName]) => depName.startsWith('@prisma/') || depName === 'prisma')

// Get all unique versions
const versions = [...new Set(prismaDeps.map(([, ver]) => ver))]

if (versions.length > 1) {
  console.log(
    `Prisma dependencies have mismatched versions:\n\n`,
    prismaDeps.map(([name, ver]) => `${name}@${ver}`).join('\n')
  )
  process.exit(1)
}
