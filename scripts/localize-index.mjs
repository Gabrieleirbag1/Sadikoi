// Builds index.fr.html (French link previews) from the built index.html.
// Link preview crawlers (Discord, WhatsApp...) don't run the app: they read the <meta> tags of the HTML.
// .htaccess serves index.fr.html for ?lang=fr links and French browsers.
//
// Usage: node scripts/localize-index.mjs [build folder]   (default: dist/Sadikoi/browser)
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'dist/Sadikoi/browser';

/** English text in src/index.html → French. Every English text must be found, or the build fails. */
const FRENCH = [
  ['<html lang="en"', '<html lang="fr"'], // the build adds attributes after lang
  [
    'A game for groups of friends: every day a new question, everyone votes for a friend, and the winner gets an item… until someone takes it from them.',
    'Le jeu entre amis : chaque jour une nouvelle question, chacun vote pour un ami, et le gagnant remporte un objet… jusqu’à ce qu’on le lui prenne.',
  ],
  ['Sadikoi – the daily question game for friends', 'Sadikoi – le jeu de la question du jour entre amis'],
  ['<meta property="og:locale" content="en_US">', '<meta property="og:locale" content="fr_FR">'],
  ['<meta property="og:locale:alternate" content="fr_FR">', '<meta property="og:locale:alternate" content="en_US">'],
  ['Sadikoi logo: a speech bubble with an S', 'Logo de Sadikoi : une bulle de dialogue avec un S'],
  ['Loading...', 'Chargement...'],
];

const source = join(dir, 'index.html');
let html = readFileSync(source, 'utf8');
const missing = FRENCH.filter(([en]) => !html.includes(en)).map(([en]) => en);
if (missing.length) {
  console.error(`localize-index: not found in ${source} (update scripts/localize-index.mjs):\n- ${missing.join('\n- ')}`);
  process.exit(1);
}
for (const [en, fr] of FRENCH) html = html.split(en).join(fr);
writeFileSync(join(dir, 'index.fr.html'), html);
console.log(`localize-index: wrote ${join(dir, 'index.fr.html')}`);
