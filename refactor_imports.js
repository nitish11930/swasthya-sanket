const fs = require('fs');
const path = require('path');

const files = [
  'src/features/transfers/actions.ts',
  'src/lib/auth.ts',
  'src/lib/authorization.ts',
  'src/lib/permissions.ts',
  'src/app/(app)/exceptions/ExceptionsClient.tsx',
  'src/app/(app)/ledger/LedgerClient.tsx',
  'tests/security/authorization.test.ts',
  'tests/unit/transfers.test.ts',
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // For src/lib/auth.ts
    if (file === 'src/lib/auth.ts') {
      content = content.replace(
        'import { PrismaClient, Role } from "@prisma/client";',
        'import { PrismaClient } from "@prisma/client";\nimport { Role } from "@/domain/enums";'
      );
    } 
    // For tests
    else if (file.startsWith('tests')) {
      content = content.replace(
        "import { Role } from '@prisma/client';",
        "import { Role } from '../../src/domain/enums';"
      );
    } 
    // For general src files
    else {
      content = content.replace(
        'import { Role } from "@prisma/client";',
        'import { Role } from "@/domain/enums";'
      );
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});

// Update seed.ts
const seedPath = path.join(__dirname, 'prisma/seed.ts');
if (fs.existsSync(seedPath)) {
  let seedContent = fs.readFileSync(seedPath, 'utf8');
  seedContent = seedContent.replace(
    "import { PrismaClient, LocationType, Role, TransferStatus, AlertSeverity } from '@prisma/client';",
    "import { PrismaClient } from '@prisma/client';\nimport { LocationType, Role, TransferStatus, AlertSeverity } from '../src/domain/enums';"
  );
  fs.writeFileSync(seedPath, seedContent);
  console.log('Updated prisma/seed.ts');
}
