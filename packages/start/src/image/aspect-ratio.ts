function gcd(a: number, b: number): number {
  if (b === 0) {
    return a;
  }
  return gcd(b, a % b);
}

export interface AspectRatio {
  width: number;
  height: number;
}

const HORIZONTAL_ASPECT_RATIO = [
  { width: 4, height: 4 }, // Square
  { width: 4, height: 3 }, // Standard Fullscreen
  { width: 16, height: 10 }, // Standard LCD
  { width: 16, height: 9 }, // HD
  // { width: 37, height: 20 }, // Widescreen
  { width: 6, height: 3 }, // Univisium
  { width: 21, height: 9 }, // Anamorphic 2.35:1
  // { width: 64, height: 27 }, // Anamorphic 2.39:1 or 2.37:1
  { width: 19, height: 16 }, // Movietone
  { width: 5, height: 4 }, // 17' LCD CRT
  // { width: 48, height: 35 }, // 16mm and 35mm
  { width: 11, height: 8 }, // 35mm full sound
  // { width: 143, height: 100 }, // IMAX
  { width: 6, height: 4 }, // 35mm photo
  { width: 14, height: 9 }, // commercials
  { width: 5, height: 3 }, // Paramount
  { width: 7, height: 4 }, // early 35mm
  { width: 11, height: 5 }, // 70mm
  { width: 12, height: 5 }, // Bluray
  { width: 8, height: 3 }, // Super 16
  { width: 18, height: 5 }, // IMAX
  { width: 12, height: 3 }, // Polyvision
];

const VERTICAL_ASPECT_RATIO = HORIZONTAL_ASPECT_RATIO.map(item => ({
  width: item.height,
  height: item.width,
}));

const ASPECT_RATIO = [...HORIZONTAL_ASPECT_RATIO, ...VERTICAL_ASPECT_RATIO];

export function getAspectRatio({ width, height }: AspectRatio): AspectRatio {
  const denom = gcd(width, height);

  return {
    width: width / denom,
    height: height / denom,
  };
}

export function getNearestAspectRatio(ratio: AspectRatio): AspectRatio {
  let nearest = Number.MAX_VALUE;
  let id = 0;

  const originalRatio = ratio.width / ratio.height;

  for (let i = 0; i < ASPECT_RATIO.length; i += 1) {
    const target = ASPECT_RATIO[i]!;

    const tRatio = target.width / target.height;
    const squared = tRatio - originalRatio;
    const distance = Math.sqrt(squared * squared);

    if (i === 0) {
      nearest = distance;
    } else if (distance < nearest) {
      id = i;
      nearest = distance;
    }
  }

  return ASPECT_RATIO[id]!;
}

export function getScaledComponentRatio(ratio: AspectRatio): AspectRatio {
  const xScale = 9 / ratio.width;
  const yScale = 9 / ratio.height;
  const scale = Math.min(xScale, yScale);
  return {
    width: scale * ratio.width,
    height: scale * ratio.height,
  };
}
