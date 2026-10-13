import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');

function extractFunctionSource(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing ${name} in App.tsx`);

  const bodyStart = appSource.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    if (appSource[index] === '{') {
      depth += 1;
    } else if (appSource[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return appSource.slice(start, index + 1);
      }
    }
  }

  throw new Error(`Unable to read ${name} from App.tsx`);
}

const helperNames = [
  'decodeHtml',
  'normalizeUrl',
  'parsePositiveIframeDimension',
  'extractIframeDimensionsFromStoryEmbedHtml',
  'extractIframeSrcFromStoryEmbedHtml',
  'looksLikeFacebookPostPath',
  'extractFacebookPostUrl',
  'isValidFacebookPluginUrl',
  'isFacebookPluginUrlForPath',
  'isValidFacebookPostPluginUrl',
  'isValidFacebookVideoPluginUrl',
  'shouldAllowStoryInlineFacebookVideoNavigation',
  'extractYouTubeVideoId',
  'extractVimeoVideoId',
];

const helpers = vm.runInNewContext(
  `${helperNames.map(extractFunctionSource).join('\n')}\n({ ${helperNames.join(', ')} })`,
  { URL }
);

function parseFacebookIframe(html) {
  const embedUrl = helpers.extractIframeSrcFromStoryEmbedHtml(html);
  const originalUrl = helpers.extractFacebookPostUrl(embedUrl);
  const dimensions = helpers.extractIframeDimensionsFromStoryEmbedHtml(html);

  if (!originalUrl || !helpers.isValidFacebookPluginUrl(embedUrl)) {
    return null;
  }

  return {
    provider: 'facebook',
    embedUrl,
    originalUrl,
    originalWidth: dimensions.width,
    originalHeight: dimensions.height,
  };
}

const facebookPostSrc =
  'https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2FSYLFB%2Fposts%2F1234567890&show_text=true&width=500';
const facebookPostIframe = `<iframe src="${facebookPostSrc}" width="500" height="501"></iframe>`;
const facebookVideoSrc =
  'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1102481158835523%2F&width=500&show_text=true';
const facebookVideoIframe = `<div data-story-embed="true" data-embed-provider="facebook" data-embed-kind="social" data-embed-size="medium" data-embed-align="center" data-embed-url="https://www.facebook.com/reel/1102481158835523/" class="story-embed story-embed-social-frame story-embed-size-medium story-embed-align-center"><div class="story-embed-frame story-embed-frame-social"><iframe src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1102481158835523%2F&amp;width=500&amp;show_text=true" title="Facebook embed" loading="lazy" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen="true" referrerpolicy="strict-origin-when-cross-origin"></iframe></div></div>`;

test('keeps the existing Facebook post plugin contract unchanged', () => {
  assert.deepEqual(parseFacebookIframe(facebookPostIframe), {
    provider: 'facebook',
    embedUrl: facebookPostSrc,
    originalUrl: 'https://www.facebook.com/SYLFB/posts/1234567890',
    originalWidth: 500,
    originalHeight: 501,
  });
  assert.equal(helpers.isValidFacebookPostPluginUrl(facebookPostSrc), true);
  assert.equal(helpers.isValidFacebookVideoPluginUrl(facebookPostSrc), false);
});

test('parses the live dimensionless Facebook video plugin for direct inline rendering', () => {
  assert.deepEqual(parseFacebookIframe(facebookVideoIframe), {
    provider: 'facebook',
    embedUrl: facebookVideoSrc,
    originalUrl: 'https://www.facebook.com/reel/1102481158835523/',
    originalWidth: undefined,
    originalHeight: undefined,
  });
  assert.equal(helpers.isValidFacebookPostPluginUrl(facebookVideoSrc), false);
  assert.equal(helpers.isValidFacebookVideoPluginUrl(facebookVideoSrc), true);
});

test('keeps Facebook video support narrowly restricted', () => {
  const safeHref = encodeURIComponent('https://www.facebook.com/reel/1102481158835523/');
  assert.equal(
    helpers.isValidFacebookPluginUrl(`https://example.com/plugins/video.php?href=${safeHref}`),
    false
  );
  assert.equal(
    helpers.isValidFacebookPluginUrl(
      `https://www.facebook.com/plugins/page.php?href=${safeHref}`
    ),
    false
  );
  assert.equal(
    helpers.isValidFacebookPluginUrl(
      'https://www.facebook.com/plugins/video.php?href=not-a-url'
    ),
    false
  );
  assert.equal(
    helpers.isValidFacebookPluginUrl(
      'https://www.facebook.com/plugins/video.php?href=javascript%3Aalert%281%29'
    ),
    false
  );
  assert.equal(
    helpers.isValidFacebookPluginUrl(
      `http://www.facebook.com/plugins/video.php?href=${safeHref}`
    ),
    false
  );
});

test('allows only the intended direct video plugin as a top-level navigation', () => {
  assert.equal(
    helpers.shouldAllowStoryInlineFacebookVideoNavigation(
      facebookVideoSrc,
      facebookVideoSrc,
      true
    ),
    true
  );
  assert.equal(
    helpers.shouldAllowStoryInlineFacebookVideoNavigation(
      'https://www.facebook.com/reel/1102481158835523/',
      facebookVideoSrc,
      undefined
    ),
    false
  );
  assert.equal(
    helpers.shouldAllowStoryInlineFacebookVideoNavigation(
      'https://www.facebook.com/reel/1102481158835523/',
      facebookVideoSrc,
      true
    ),
    false
  );
  assert.equal(
    helpers.shouldAllowStoryInlineFacebookVideoNavigation(
      'https://www.facebook.com/reel/1102481158835523/',
      facebookVideoSrc,
      false
    ),
    true
  );
  assert.equal(
    helpers.shouldAllowStoryInlineFacebookVideoNavigation(
      facebookVideoSrc,
      facebookVideoSrc,
      undefined
    ),
    true
  );
});

test('keeps existing YouTube and Vimeo recognition unchanged', () => {
  assert.equal(
    helpers.extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
  assert.equal(helpers.extractVimeoVideoId('https://vimeo.com/76979871'), '76979871');
});

test('leaves the existing Facebook WebView and scaling contract untouched', () => {
  const rendererStart = appSource.indexOf('function StoryInlineEmbed(');
  const rendererEnd = appSource.indexOf('\nfunction renderStoryBodyContent(', rendererStart);
  const renderer = appSource.slice(rendererStart, rendererEnd);
  assert.match(renderer, /Math\.min\(1, facebookContainerWidth \/ originalWidth!\)/);
  assert.match(renderer, /originalHeight! \* facebookScale/);
  assert.match(renderer, /buildStoryInlineFacebookHtml\(/);
  assert.match(renderer, /baseUrl: STORY_INLINE_FACEBOOK_BASE_URL/);
  assert.match(renderer, /originWhitelist=\{\['\*'\]\}/);
  assert.match(renderer, /allowsInlineMediaPlayback/);
  assert.match(renderer, /mediaPlaybackRequiresUserAction=\{false\}/);
  assert.match(renderer, /allowsFullscreenVideo/);
  assert.match(
    renderer,
    /facebookContainerWidth \* STORY_INLINE_FACEBOOK_VIDEO_HEIGHT_RATIO/
  );
  assert.match(renderer, /source=\{\{ uri: embedUrl \}\}/);
  assert.match(renderer, /const canRenderFacebookVideoInline =[\s\S]*facebookVideoPluginUrlValid/);
  assert.match(appSource, /const STORY_INLINE_FACEBOOK_VIDEO_HEIGHT_RATIO = 0\.72;/);
});
