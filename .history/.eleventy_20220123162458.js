const fs = require('fs/promises');
const path = require('path');

const INPUT_DIR = 'src';
const OUTPUT_DIR = '_site';

// This will change both Eleventy's pathPrefix, and the one output by the
// vite-related shortcodes below. Double-check if you change this, as this is only a demo :)
const PATH_PREFIX = '/';

// Filters
const w3DateFilter = require('./src/filters/w3-date-filter.js');
const dateFilter = require('./src/filters/date-filter.js');

module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter('w3DateFilter', w3DateFilter);
  eleventyConfig.addFilter('dateFilter', dateFilter);

  const pluginSEO = require('eleventy-plugin-seo');
  eleventyConfig.addPlugin(pluginSEO, {
    title: 'Louis Chenais, co-founder of Specify',
    description: 'UI developer interested in making people\'s life easier to build and consume digital applications.',
    url: 'https://lucho.cool',
    author: 'Louis Chenais',
    twitter: 'chuckn0risk',
    image: 'foo.jpg',
    options: {
      titleStyle: 'minimalistic',
      titleDivider: '|'
    }
  });

  let markdownIt = require('markdown-it');
  let markdownItOptions = {
    html: true
  };
  let mila = require('markdown-it-link-attributes');
  let milaOptions = {
    attrs: {
      target: '_blank',
      rel: 'noreferrer'
    },
    pattern: /^https?:\/\//,
    attrs: {
      class: 'external-link',
    },
  };
  // Disable whitespace-as-code-indicator, which breaks a lot of markup
  let markdownLib = markdownIt(markdownItOptions).disable('code').use(mila, milaOptions);
  eleventyConfig.setLibrary('md', markdownLib);

  const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  
  // Read Vite's manifest.json, and add script tags for the entry files
  // You could decide to do more things here, such as adding preload/prefetch tags
  // for dynamic segments
  // NOTE: There is some hard-coding going on here, with regard to the assetDir
  // and location of manifest.json
  // you could probably read vite.config.js and get that information directly
  // @see https://vitejs.dev/guide/backend-integration.html
  eleventyConfig.addNunjucksAsyncShortcode('viteScriptTag', viteScriptTag);
  eleventyConfig.addNunjucksAsyncShortcode(
    'viteLegacyScriptTag',
    viteLegacyScriptTag
  );
  eleventyConfig.addNunjucksAsyncShortcode(
    'viteLinkStylesheetTags',
    viteLinkStylesheetTags
  );

  eleventyConfig.addShortcode('year', () => `${new Date().getFullYear()}`);

  eleventyConfig.addCollection('writing', collection => {``
    return collection
      .getFilteredByGlob(`./${INPUT_DIR}/writing/*.md`)
      .sort((a, b) => (Number(a.data.displayOrder) > Number(b.data.displayOrder) ? 1 : -1));
  });

  async function viteScriptTag(entryFilename) {
    const entryChunk = await getChunkInformationFor(entryFilename);
    return `<script type='module' src='${PATH_PREFIX}${entryChunk.file}'></script>`;
  }

  async function viteLinkStylesheetTags(entryFilename) {
    const entryChunk = await getChunkInformationFor(entryFilename);
    if (!entryChunk.css || entryChunk.css.length === 0) {
      console.warn(`No css found for ${entryFilename} entry. Is that correct?`);
      return '';
    }
    /* There can be multiple CSS files per entry, so assume many by default */
    return entryChunk.css
      .map((cssFile) => `<link rel='stylesheet' href='${PATH_PREFIX}${cssFile}'></link>`)
      .join('\n');
  }

  async function viteLegacyScriptTag(entryFilename) {
    const entryChunk = await getChunkInformationFor(entryFilename);
    return `<script nomodule src='${PATH_PREFIX}${entryChunk.file}'></script>`;
  }

  async function getChunkInformationFor(entryFilename) {
    // We want an entryFilename, because in practice you might have multiple entrypoints
    // This is similar to how you specify an entry in development more
    if (!entryFilename) {
      throw new Error(
        'You must specify an entryFilename, so that vite-script can find the correct file.'
      );
    }

    // TODO: Consider caching this call, to avoid going to the filesystem every time
    const manifest = await fs.readFile(
      path.resolve(process.cwd(), '_site', 'manifest.json')
    );
    const parsed = JSON.parse(manifest);

    let entryChunk = parsed[entryFilename];

    if (!entryChunk) {
      const possibleEntries = Object.values(parsed)
        .filter((chunk) => chunk.isEntry === true)
        .map((chunk) => `'${chunk.src}'`)
        .join(`, `);
      throw new Error(
        `No entry for ${entryFilename} found in _site/manifest.json. Valid entries in manifest: ${possibleEntries}`
      );
    }

    return entryChunk;
  }

  eleventyConfig.addPassthroughCopy('./src/client/assets/img');

  return {
    templateFormats: ['md', 'njk', 'html'],
    pathPrefix: PATH_PREFIX,
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    passthroughFileCopy: true,
    dir: {
      input: INPUT_DIR,
      output: OUTPUT_DIR,
      // NOTE: These two paths are relative to dir.input
      // @see https://github.com/11ty/eleventy/issues/232
      includes: '_includes',
      data: '_data',
    },
  };
};
