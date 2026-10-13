import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const sourceFile = ts.createSourceFile(
  'App.tsx',
  appSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

function getNamedStatement(name) {
  const statement = sourceFile.statements.find((candidate) => {
    if (
      (ts.isFunctionDeclaration(candidate) || ts.isTypeAliasDeclaration(candidate)) &&
      candidate.name?.text === name
    ) {
      return true;
    }

    return (
      ts.isVariableStatement(candidate) &&
      candidate.declarationList.declarations.some(
        (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === name
      )
    );
  });

  assert.ok(statement, `Missing ${name} in App.tsx`);
  return statement.getText(sourceFile);
}

const declarationNames = [
  'StoryBodySegment',
  'StoryGameInformationAction',
  'StoryImageSize',
  'StoryImageAlign',
  'StoryImageLayout',
  'StoryBodyBlock',
  'STORY_BODY_EMBED_BLOCK_PATTERN',
  'STORY_BODY_IFRAME_PATTERN',
  'STORY_BODY_FACEBOOK_POST_BLOCK_PATTERN',
  'STORY_BODY_CONTENT_NODE_PATTERN',
  'STORY_BODY_RAW_EMBED_ARTIFACT_PATTERN',
  'decodeHtml',
  'stripHtml',
  'withStoryInlineEmbedQueryParams',
  'parsePositiveIframeDimension',
  'extractIframeDimensionsFromStoryEmbedHtml',
  'extractYouTubeVideoId',
  'extractVimeoVideoId',
  'extractIframeSrcFromStoryEmbedHtml',
  'looksLikeFacebookPostPath',
  'extractFacebookPostUrl',
  'extractFacebookPostUrlFromEmbedHtml',
  'normalizeStoryEmbedUrl',
  'extractStoryEmbedFromHtml',
  'extractStoryHtmlAttribute',
  'getStoryImageUrl',
  'extractStoryImageFromHtml',
  'htmlToStoryDisplayText',
  'hasStoryHtmlClassToken',
  'parseStoryBodySegments',
  'buildStoryParagraphBlocks',
  'parseStoryBodyBlocks',
  'normalizeUrl',
  'hasResolvedUrl',
];

const runtimeSource = `
const STORY_INLINE_EMBED_CLIENT_REFERRER = 'https://athleticos.ai';
${declarationNames.map(getNamedStatement).join('\n')}
globalThis.__storyHelpers = {
  hasStoryHtmlClassToken,
  parseStoryBodySegments,
  parseStoryBodyBlocks,
};
`;
const transpiledRuntime = ts.transpileModule(runtimeSource, {
  compilerOptions: {
    module: ts.ModuleKind.None,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const context = vm.createContext({ URL });
vm.runInContext(transpiledRuntime, context);
const helpers = context.__storyHelpers;

function parseBlocks(html) {
  return JSON.parse(JSON.stringify(helpers.parseStoryBodyBlocks(html)));
}

const watchUrl = 'https://www.youtube.com/@sylacaugaaggieathletics';
const listenUrl = 'https://www.radioalabama.net/wsgn/';
const ticketsUrl = 'https://gofan.co/app/school/AL2311';
const markedAnchor = (label, href, className = 'story-game-info-link') =>
  `<a target="_blank" class="${className}" href="${href}">${label}</a>`;

test('converts three marked PreviewOS links into one ordered action block', () => {
  const blocks = parseBlocks(
    `<p>Before</p><p><strong>Game Information</strong></p><p>${markedAnchor(
      'Watch Live',
      watchUrl
    )}${markedAnchor('Listen Live', listenUrl)}${markedAnchor(
      'Buy Tickets',
      ticketsUrl
    )}</p><p>After</p>`
  );

  assert.deepEqual(blocks, [
    { type: 'paragraph', segments: [{ text: 'Before' }] },
    { type: 'paragraph', segments: [{ text: 'Game Information' }] },
    {
      type: 'gameInformationActions',
      actions: [
        { label: 'Watch Live', href: watchUrl },
        { label: 'Listen Live', href: listenUrl },
        { label: 'Buy Tickets', href: ticketsUrl },
      ],
    },
    { type: 'paragraph', segments: [{ text: 'After' }] },
  ]);
});

test('supports one marked action link', () => {
  assert.deepEqual(parseBlocks(`<p>${markedAnchor('Buy Tickets', ticketsUrl)}</p>`), [
    {
      type: 'gameInformationActions',
      actions: [{ label: 'Buy Tickets', href: ticketsUrl }],
    },
  ]);
});

test('mixed ordinary text preserves the existing paragraph fallback', () => {
  const blocks = parseBlocks(`<p>Stream: ${markedAnchor('Watch Live', watchUrl)}</p>`);

  assert.equal(blocks[0].type, 'paragraph');
  assert.equal(blocks[0].segments[0].text, 'Stream: ');
  assert.equal(blocks[0].segments[1].text, 'Watch Live');
  assert.equal(blocks[0].segments[1].href, watchUrl);
});

test('mixed marked and unmarked anchors preserve the paragraph fallback', () => {
  const blocks = parseBlocks(
    `<p>${markedAnchor('Watch Live', watchUrl)}<a href="${ticketsUrl}">Tickets</a></p>`
  );

  assert.equal(blocks[0].type, 'paragraph');
  assert.deepEqual(
    blocks[0].segments.map(({ text, href }) => ({ text, href })),
    [
      { text: 'Watch Live', href: watchUrl },
      { text: 'Tickets', href: ticketsUrl },
    ]
  );
});

test('ordinary hyperlinks retain their existing paragraph representation', () => {
  assert.deepEqual(parseBlocks(`<p>Visit <a href="${ticketsUrl}">our ticket page</a>.</p>`), [
    {
      type: 'paragraph',
      segments: [
        { text: 'Visit ' },
        { text: 'our ticket page', href: ticketsUrl },
        { text: '.' },
      ],
    },
  ]);
});

test('unsafe marked URLs do not create an action block', () => {
  const blocks = parseBlocks(
    '<p><a class="story-game-info-link" href="javascript:alert(1)">Watch Live</a></p>'
  );

  assert.equal(blocks[0].type, 'paragraph');
  assert.equal(blocks[0].segments[0].href, undefined);
});

test('semantic class matching requires an exact class token', () => {
  assert.equal(
    helpers.hasStoryHtmlClassToken(
      '<a class="other story-game-info-link another" href="https://example.com">',
      'story-game-info-link'
    ),
    true
  );
  assert.equal(
    helpers.hasStoryHtmlClassToken(
      '<a class="story-game-info-link-extra" href="https://example.com">',
      'story-game-info-link'
    ),
    false
  );
  assert.equal(
    parseBlocks(
      `<p>${markedAnchor(
        'Watch Live',
        watchUrl,
        'story-game-info-link-extra'
      )}</p>`
    )[0].type,
    'paragraph'
  );
});

test('Facebook post and video fixtures retain the existing embed blocks', () => {
  const postHref = encodeURIComponent('https://www.facebook.com/SYLFB/posts/1234567890');
  const videoHref = encodeURIComponent('https://www.facebook.com/reel/1102481158835523/');
  const post = parseBlocks(
    `<iframe src="https://www.facebook.com/plugins/post.php?href=${postHref}&amp;width=500" width="500" height="501"></iframe>`
  );
  const video = parseBlocks(
    `<iframe src="https://www.facebook.com/plugins/video.php?href=${videoHref}&amp;width=560" width="560" height="429"></iframe>`
  );

  assert.equal(post[0].type, 'embed');
  assert.equal(post[0].provider, 'facebook');
  assert.equal(post[0].originalWidth, 500);
  assert.equal(post[0].originalHeight, 501);
  assert.equal(video[0].type, 'embed');
  assert.equal(video[0].provider, 'facebook');
  assert.equal(video[0].originalWidth, 560);
  assert.equal(video[0].originalHeight, 429);
});

test('YouTube and Vimeo fixtures retain the existing embed blocks', () => {
  const youtube = parseBlocks(
    '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>'
  );
  const vimeo = parseBlocks('<iframe src="https://player.vimeo.com/video/76979871"></iframe>');

  assert.equal(youtube[0].type, 'embed');
  assert.equal(youtube[0].provider, 'youtube');
  assert.match(youtube[0].embedUrl, /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  assert.equal(vimeo[0].type, 'embed');
  assert.equal(vimeo[0].provider, 'vimeo');
  assert.equal(vimeo[0].embedUrl, 'https://player.vimeo.com/video/76979871');
});

test('StoryImage fixtures retain the existing image block', () => {
  assert.deepEqual(
    parseBlocks(
      '<figure data-story-image="true" data-image-size="small" data-image-align="right" data-image-layout="wrap-right" data-image-credit="AthleticOS"><img src="https://example.com/photo.jpg" alt="Team photo"></figure>'
    ),
    [
      {
        type: 'image',
        src: 'https://example.com/photo.jpg',
        alt: 'Team photo',
        size: 'small',
        align: 'right',
        layout: 'wrap-right',
        credit: 'AthleticOS',
      },
    ]
  );
});

test('action rows preserve the existing external-link opening behavior', () => {
  const rendererStart = appSource.indexOf('function renderStoryBodyContent(');
  const rendererEnd = appSource.indexOf('\nfunction getTagValue(', rendererStart);
  const renderer = appSource.slice(rendererStart, rendererEnd);

  assert.match(renderer, /block\.type === 'gameInformationActions'/);
  assert.match(renderer, /Linking\.openURL\(action\.href\)/);
  assert.match(renderer, /Unable to open story body link/);
});
