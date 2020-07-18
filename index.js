require('dotenv').config();
const Mustache = require('mustache');
const fetch = require('node-fetch');
const fs = require('fs');

const MUSTACHE_MAIN_DIR = './main.mustache';

async function generateReadMe() {
  await fs.readFile(MUSTACHE_MAIN_DIR, (err, data) => {
    if (err) throw err;
    const output = Mustache.render(data.toString());
    fs.writeFileSync('README.md', output);
  });
}

async function action() {
  /**
   * Generate README
   */
  await generateReadMe();
}

action();
