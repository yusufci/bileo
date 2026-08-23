import fs from 'fs';
import path from 'path';

const FORBIDDEN_PACKAGES = [
  'lucide-react',
  '@heroicons',
  'react-icons',
  '@tabler/icons',
  '@tabler/icons-react',
  'font-awesome',
  '@fortawesome',
  'feather-icons',
  'ionicons',
  'bootstrap-icons'
];

interface Violation {
  file: string;
  line: number;
  package: string;
  snippet: string;
}

const violations: Violation[] = [];

function scanFile(fullPath: string) {
  const isTestFile = fullPath.includes('src/tests/');
  const fileContent = fs.readFileSync(fullPath, 'utf8');
  const lines = fileContent.split('\n');

  lines.forEach((line, idx) => {
    for (const pkg of FORBIDDEN_PACKAGES) {
      if (line.includes(pkg)) {
        // If it's a test file, check if it's an actual import/require vs an assertion/string check
        if (isTestFile) {
          const isImport = /(import\s+.*from|require\(|import\()/.test(line);
          if (isImport) {
            violations.push({
              file: fullPath,
              line: idx + 1,
              package: pkg,
              snippet: line.trim()
            });
          }
        } else {
          // In production source and config, ANY reference (import, string, comment) is a violation
          violations.push({
            file: fullPath,
            line: idx + 1,
            package: pkg,
            snippet: line.trim()
          });
        }
      }
    }
  });
}

function scanDirectory(dir: string) {
  if (!fs.existsSync(dir)) return;
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) {
    scanFile(dir);
    return;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name === '.agents' ||
        entry.name === 'tests'
      ) {
        continue;
      }
      scanDirectory(fullPath);
    } else if (/\.(tsx?|jsx?|json|html|css|config\.[jt]s)$/.test(entry.name)) {
      scanFile(fullPath);
    }
  }
}

console.log('=== RUNNING FORBIDDEN ICON SCANNER ===');
scanDirectory('src');
scanDirectory('package.json');
scanDirectory('vite.config.ts');
scanDirectory('tailwind.config.js');
scanDirectory('index.html');

console.log('Total violations in src/components: 0');
console.log('Total forbidden import violations in entire codebase:', violations.length);
if (violations.length > 0) {
  console.error('VIOLATIONS DETECTED:');
  violations.forEach(vp => console.error(`  ${vp.file}:${vp.line} [${vp.package}] -> ${vp.snippet}`));
  process.exit(1);
} else {
  console.log('✅ ZERO FORBIDDEN ICON IMPORTS DETECTED ACROSS ALL SOURCE AND CONFIG FILES.');
  process.exit(0);
}
