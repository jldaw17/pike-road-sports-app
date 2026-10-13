import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  getStoryCropGeometry,
  getStoryCropPresentation,
  hasStoryImageCrop,
} from './storyImageCrop.ts';

const completeCrop = {
  cropX: 0.2,
  cropY: 0.1,
  cropWidth: 0.5,
  cropHeight: 0.5,
};

function assertApproximately(actual, expected, tolerance = 0.0001) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`
  );
}

function assertRectApproximately(actual, expected, tolerance = 0.0001) {
  assertApproximately(actual.x, expected.x, tolerance);
  assertApproximately(actual.y, expected.y, tolerance);
  assertApproximately(actual.width, expected.width, tolerance);
  assertApproximately(actual.height, expected.height, tolerance);
}

test('maps the exact Prattville canary crop into the Premium destination', () => {
  const geometry = getStoryCropGeometry({
    sourceWidth: 1600,
    sourceHeight: 2400,
    destinationWidth: 361,
    destinationHeight: 232,
    cropX: 0,
    cropY: 0.04408568082648873,
    cropWidth: 1,
    cropHeight: 0.375,
  });

  assert.ok(geometry);
  assertRectApproximately(geometry.visibleSourceRect, {
    x: 99.7844827586207,
    y: 105.80563398357295,
    width: 1400.4310344827586,
    height: 900,
  });
});

test('preserves the exact crop when destination and crop aspects match', () => {
  const geometry = getStoryCropGeometry({
    sourceWidth: 1000,
    sourceHeight: 1000,
    destinationWidth: 400,
    destinationHeight: 200,
    cropX: 0.2,
    cropY: 0.1,
    cropWidth: 0.6,
    cropHeight: 0.3,
  });

  assert.ok(geometry);
  assertRectApproximately(geometry.visibleSourceRect, {
    x: 200,
    y: 100,
    width: 600,
    height: 300,
  });
});

test('a narrower destination preserves crop height and trims its sides', () => {
  const geometry = getStoryCropGeometry({
    sourceWidth: 1000,
    sourceHeight: 1000,
    destinationWidth: 300,
    destinationHeight: 200,
    cropX: 0.2,
    cropY: 0.1,
    cropWidth: 0.6,
    cropHeight: 0.3,
  });

  assert.ok(geometry);
  assertRectApproximately(geometry.visibleSourceRect, {
    x: 275,
    y: 100,
    width: 450,
    height: 300,
  });
});

test('a wider destination preserves crop width and trims its top and bottom', () => {
  const geometry = getStoryCropGeometry({
    sourceWidth: 1000,
    sourceHeight: 1000,
    destinationWidth: 500,
    destinationHeight: 200,
    cropX: 0.2,
    cropY: 0.1,
    cropWidth: 0.6,
    cropHeight: 0.3,
  });

  assert.ok(geometry);
  assertRectApproximately(geometry.visibleSourceRect, {
    x: 200,
    y: 130,
    width: 600,
    height: 240,
  });
});

test('off-center and edge crops keep their crop center and remain in bounds', () => {
  const offCenter = getStoryCropGeometry({
    sourceWidth: 1000,
    sourceHeight: 1000,
    destinationWidth: 300,
    destinationHeight: 200,
    cropX: 0.1,
    cropY: 0.4,
    cropWidth: 0.4,
    cropHeight: 0.2,
  });
  const edge = getStoryCropGeometry({
    sourceWidth: 1000,
    sourceHeight: 1000,
    destinationWidth: 300,
    destinationHeight: 200,
    cropX: 0,
    cropY: 0,
    cropWidth: 0.4,
    cropHeight: 0.2,
  });

  assert.ok(offCenter);
  assertRectApproximately(offCenter.visibleSourceRect, {
    x: 150,
    y: 400,
    width: 300,
    height: 200,
  });
  assert.ok(edge);
  assert.ok(edge.visibleSourceRect.x >= 0);
  assert.ok(edge.visibleSourceRect.y >= 0);
  assert.ok(edge.visibleSourceRect.x + edge.visibleSourceRect.width <= 400.0001);
  assert.ok(edge.visibleSourceRect.y + edge.visibleSourceRect.height <= 200.0001);
});

test('null, incomplete, and invalid crops preserve the centered-cover fallback', () => {
  assert.equal(getStoryCropPresentation(null), null);
  assert.equal(
    getStoryCropPresentation({ cropX: 0.2, cropY: 0.1, cropHeight: 0.5 }),
    null
  );
  assert.equal(getStoryCropPresentation({ ...completeCrop, cropX: -0.1 }), null);
  assert.equal(getStoryCropPresentation({ ...completeCrop, cropX: 0.8 }), null);
  assert.equal(getStoryCropPresentation({ ...completeCrop, cropWidth: 0 }), null);
  assert.equal(
    getStoryCropGeometry({
      sourceWidth: 0,
      sourceHeight: 1000,
      destinationWidth: 300,
      destinationHeight: 200,
      ...completeCrop,
    }),
    null
  );
  assert.equal(hasStoryImageCrop(completeCrop), true);
});

test('story cards opt into crop presentation without changing unrelated images', () => {
  const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
  const remoteImageBlocks = [...appSource.matchAll(/<RemoteImage[\s\S]*?\/>/g)].map(
    (match) => match[0]
  );
  const storyImageBlocks = remoteImageBlocks.filter((block) => block.includes('mode="story"'));
  const storyDetailImages = storyImageBlocks.filter((block) =>
    block.includes('uri={resolvedStoryImage}')
  );
  const storyCardBlocks = storyImageBlocks.filter(
    (block) => !block.includes('uri={resolvedStoryImage}')
  );

  assert.equal(storyDetailImages.length, 2);
  assert.ok(storyCardBlocks.length > 0);
  assert.ok(storyCardBlocks.every((block) => block.includes('cropPresentation=')));
  assert.ok(
    remoteImageBlocks
      .filter((block) => !block.includes('mode="story"'))
      .every((block) => !block.includes('cropPresentation='))
  );
  assert.doesNotMatch(appSource, /contentPosition=\{cropPresentation/);
  assert.doesNotMatch(appSource, /scale: cropPresentation\.scale/);
});
