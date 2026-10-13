export type StoryImageCropInput = {
  cropX?: number | null;
  cropY?: number | null;
  cropWidth?: number | null;
  cropHeight?: number | null;
};

export type StoryImageCropPresentation = {
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
};

export type StoryImageCropGeometry = {
  renderedWidth: number;
  renderedHeight: number;
  left: number;
  top: number;
  visibleSourceRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type StoryImageCropGeometryInput = StoryImageCropPresentation & {
  sourceWidth: number;
  sourceHeight: number;
  destinationWidth: number;
  destinationHeight: number;
};

function isPositiveFiniteNumber(value: number) {
  return Number.isFinite(value) && value > 0;
}

export function hasStoryImageCrop(item?: StoryImageCropInput | null) {
  return Boolean(
    item &&
      typeof item.cropX === 'number' &&
      typeof item.cropY === 'number' &&
      typeof item.cropWidth === 'number' &&
      typeof item.cropHeight === 'number' &&
      Number.isFinite(item.cropX) &&
      Number.isFinite(item.cropY) &&
      Number.isFinite(item.cropWidth) &&
      Number.isFinite(item.cropHeight) &&
      item.cropX >= 0 &&
      item.cropX <= 1 &&
      item.cropY >= 0 &&
      item.cropY <= 1 &&
      item.cropWidth > 0 &&
      item.cropWidth <= 1 &&
      item.cropHeight > 0 &&
      item.cropHeight <= 1 &&
      item.cropX + item.cropWidth <= 1.000001 &&
      item.cropY + item.cropHeight <= 1.000001
  );
}

export function getStoryCropPresentation(
  item?: StoryImageCropInput | null
): StoryImageCropPresentation | null {
  if (!hasStoryImageCrop(item)) {
    return null;
  }

  return {
    cropX: item!.cropX!,
    cropY: item!.cropY!,
    cropWidth: item!.cropWidth!,
    cropHeight: item!.cropHeight!,
  };
}

export function getStoryCropGeometry({
  sourceWidth,
  sourceHeight,
  destinationWidth,
  destinationHeight,
  cropX,
  cropY,
  cropWidth,
  cropHeight,
}: StoryImageCropGeometryInput): StoryImageCropGeometry | null {
  if (
    !isPositiveFiniteNumber(sourceWidth) ||
    !isPositiveFiniteNumber(sourceHeight) ||
    !isPositiveFiniteNumber(destinationWidth) ||
    !isPositiveFiniteNumber(destinationHeight) ||
    !hasStoryImageCrop({ cropX, cropY, cropWidth, cropHeight })
  ) {
    return null;
  }

  const cropSourceX = cropX * sourceWidth;
  const cropSourceY = cropY * sourceHeight;
  const cropSourceWidth = cropWidth * sourceWidth;
  const cropSourceHeight = cropHeight * sourceHeight;
  const scale = Math.max(
    destinationWidth / cropSourceWidth,
    destinationHeight / cropSourceHeight
  );
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  const cropCenterX = cropSourceX + cropSourceWidth / 2;
  const cropCenterY = cropSourceY + cropSourceHeight / 2;
  const left = destinationWidth / 2 - cropCenterX * scale;
  const top = destinationHeight / 2 - cropCenterY * scale;

  return {
    renderedWidth,
    renderedHeight,
    left,
    top,
    visibleSourceRect: {
      x: -left / scale,
      y: -top / scale,
      width: destinationWidth / scale,
      height: destinationHeight / scale,
    },
  };
}
