#!/usr/bin/env node

/**
 * Pirate Social Node Setup
 *
 * Configures your Pirate Social node site. Run with:
 *   npm run setup
 *
 * Interactively asks for your info, then updates all config files.
 */

import { createInterface } from 'readline';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

const HUB_URL = 'https://piratesocial-hub.fly.dev';

// Try to auto-detect the GitHub username from git remote
function detectGitHubUser() {
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    // Match github.com/USERNAME/... from https or ssh URLs
    const match = remote.match(/github\.com[/:]([^/]+)\//);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

async function main() {
  console.log('\n🏴‍☠️  Pirate Social Node Setup\n');
  console.log('This wizard configures your site. You can always change settings later\n');
  console.log('via the CMS at /admin or by editing src/content/settings.json.\n');

  const detectedUser = detectGitHubUser();

  // Gather info
  const githubUser = (await ask(`GitHub username${detectedUser ? ` [${detectedUser}]` : ''}: `)).trim() || detectedUser;
  if (!githubUser) {
    console.error('❌ GitHub username is required.');
    process.exit(1);
  }

  const author = (await ask('Your display name [Pirate]: ')).trim() || 'Pirate';
  const bio = (await ask('Short bio [I take photos of things.]: ')).trim() || 'I take photos of things.';
  const location = (await ask('Location (optional): ')).trim() || '';
  const camera = (await ask('Camera (optional): ')).trim() || '';
  const siteTitle = (await ask(`Site title [${author}'s Photos]: `)).trim() || `${author}'s Photos`;

  const siteUrl = `https://${githubUser}.github.io`;
  const repoName = `${githubUser}/${githubUser}.github.io`;

  console.log(`\n📝 Configuring for ${siteUrl}...\n`);

  // 1. Update settings.json
  const settingsPath = resolve('src/content/settings.json');
  const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
  settings.github = githubUser;
  settings.author = author;
  settings.bio = bio;
  settings.location = location;
  settings.camera = camera;
  settings.title = siteTitle;
  settings.description = `A photography site on the Pirate Social network`;
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  console.log('  ✅ src/content/settings.json');

  // 2. Update astro.config.mjs
  const astroConfigPath = resolve('astro.config.mjs');
  let astroConfig = readFileSync(astroConfigPath, 'utf-8');
  astroConfig = astroConfig.replace(
    /site:\s*process\.env\.SITE_URL\s*\|\|\s*'[^']*'/,
    `site: process.env.SITE_URL || '${siteUrl}'`
  );
  // Also handle the old hardcoded format
  astroConfig = astroConfig.replace(
    /site:\s*'https?:\/\/[^']*'/,
    `site: process.env.SITE_URL || '${siteUrl}'`
  );
  writeFileSync(astroConfigPath, astroConfig);
  console.log('  ✅ astro.config.mjs');

  // 3. Update config.ts (siteUrl)
  const configPath = resolve('src/lib/config.ts');
  let config = readFileSync(configPath, 'utf-8');
  config = config.replace(
    /siteUrl:\s*`https:\/\/\$\{settings\.github\}\.github\.io`[^,]*/,
    `siteUrl: \`https://\${settings.github}.github.io\``
  );
  // Also handle old hardcoded format
  config = config.replace(
    /siteUrl:\s*'https?:\/\/[^']*'/,
    `siteUrl: \`https://\${settings.github}.github.io\``
  );
  writeFileSync(configPath, config);
  console.log('  ✅ src/lib/config.ts');

  // 4. Update Decap CMS config.yml
  const cmsConfigPath = resolve('public/admin/config.yml');
  let cmsConfig = readFileSync(cmsConfigPath, 'utf-8');
  cmsConfig = cmsConfig.replace(/repo:\s*.+/, `repo: ${repoName}`);
  cmsConfig = cmsConfig.replace(/site_url:\s*.+/, `site_url: ${siteUrl}`);
  cmsConfig = cmsConfig.replace(/display_url:\s*.+/, `display_url: ${siteUrl}`);
  writeFileSync(cmsConfigPath, cmsConfig);
  console.log('  ✅ public/admin/config.yml');

  console.log(`
🏴‍☠️  Setup complete!

Next steps:
  1. Enable GitHub Pages in your repo settings:
     Settings → Pages → Source: "GitHub Actions"

  2. Push your changes:
     git add -A && git commit -m "Configure my pirate node" && git push

  3. Visit ${siteUrl} once deployed, and click "Sign In"
     to join the network.

  4. Manage your posts at ${siteUrl}/admin

Happy sailing! 🏴‍☠️
`);

  rl.close();
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
