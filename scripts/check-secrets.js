'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const dotenv = require('dotenv');

const sensitiveVariables = ['SECRET', 'DB_PASSWORD', 'SEED_ADMIN_PASSWORD', 'SEED_USER_PASSWORD'];

function checkRepository(root) {
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
    .split('\0').filter(Boolean);
  const findings = [];
  for (const filename of tracked) {
    const basename = path.posix.basename(filename);
    const environmentFile = basename === '.env' || basename.startsWith('.env.');
    const example = basename === '.env.example' || /^\.env\..+\.example$/.test(basename);
    if (environmentFile && !example) {
      findings.push({ path: filename, reason: 'local environment file is tracked' });
    } else if (example) {
      const values = dotenv.parse(fs.readFileSync(path.join(root, filename)));
      for (const name of sensitiveVariables) {
        if (Object.hasOwn(values, name) && values[name] !== '') {
          findings.push({ path: filename, reason: name + ' must be empty in templates' });
        }
      }
    }
    if (filename === 'config/config.json') {
      findings.push({ path: filename, reason: 'legacy credential configuration must not be tracked' });
    }
  }
  return findings;
}

if (require.main === module) {
  try {
    const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
    const findings = checkRepository(root);
    for (const finding of findings) {
      console.error(JSON.stringify(finding));
    }
    if (findings.length) {
      console.error('Security check failed; no credential values are printed.');
      process.exitCode = 1;
    } else {
      console.log('Tracked environment files and credential templates: OK');
    }
  } catch {
    console.error('Security check could not inspect the Git index.');
    process.exitCode = 1;
  }
}

module.exports = { checkRepository };
