// @ts-nocheck
const PRIME32_1 = 2654435761;
const PRIME32_2 = 2246822519;
const PRIME32_3 = 3266489917;
const PRIME32_4 = 668265263;
const PRIME32_5 = 374761393;

function toUtf8(text: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0, n = text.length; i < n; ++i) {
    const c = text.charCodeAt(i);
    if (c < 0x80) {
      bytes.push(c);
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c < 0xd800 || c >= 0xe000) {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else {
      const cp = 0x10000 + (((c & 0x3ff) << 10) | (text.charCodeAt(++i) & 0x3ff));
      bytes.push(
        0xf0 | ((cp >> 18) & 0x7),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    }
  }
  return new Uint8Array(bytes);
}

export default function xxHash32(buffer: Uint8Array | string, seed = 0): number {
  buffer = typeof buffer === "string" ? toUtf8(buffer) : buffer;
  const b = buffer;

  let acc = (seed + PRIME32_5) & 0xffffffff;
  let offset = 0;

  if (b.length >= 16) {
    const accN = [
      (seed + PRIME32_1 + PRIME32_2) & 0xffffffff,
      (seed + PRIME32_2) & 0xffffffff,
      (seed + 0) & 0xffffffff,
      (seed - PRIME32_1) & 0xffffffff,
    ];

    const b = buffer;
    const limit = b.length - 16;
    let lane = 0;
    for (offset = 0; (offset & 0xfffffff0) <= limit; offset += 4) {
      const i = offset;
      const laneN0 = b[i + 0] + (b[i + 1] << 8);
      const laneN1 = b[i + 2] + (b[i + 3] << 8);
      const laneNP = laneN0 * PRIME32_2 + ((laneN1 * PRIME32_2) << 16);
      let acc = (accN[lane] + laneNP) & 0xffffffff;
      acc = (acc << 13) | (acc >>> 19);
      const acc0 = acc & 0xffff;
      const acc1 = acc >>> 16;
      accN[lane] = (acc0 * PRIME32_1 + ((acc1 * PRIME32_1) << 16)) & 0xffffffff;
      lane = (lane + 1) & 0x3;
    }

    acc =
      (((accN[0] << 1) | (accN[0] >>> 31)) +
        ((accN[1] << 7) | (accN[1] >>> 25)) +
        ((accN[2] << 12) | (accN[2] >>> 20)) +
        ((accN[3] << 18) | (accN[3] >>> 14))) &
      0xffffffff;
  }

  acc = (acc + buffer.length) & 0xffffffff;

  const limit = buffer.length - 4;
  for (; offset <= limit; offset += 4) {
    const i = offset;
    const laneN0 = b[i + 0] + (b[i + 1] << 8);
    const laneN1 = b[i + 2] + (b[i + 3] << 8);
    const laneP = laneN0 * PRIME32_3 + ((laneN1 * PRIME32_3) << 16);
    acc = (acc + laneP) & 0xffffffff;
    acc = (acc << 17) | (acc >>> 15);
    acc =
      ((acc & 0xffff) * PRIME32_4 + (((acc >>> 16) * PRIME32_4) << 16)) & 0xffffffff;
  }

  for (; offset < b.length; ++offset) {
    const lane = b[offset];
    acc += lane * PRIME32_5;
    acc = (acc << 11) | (acc >>> 21);
    acc =
      ((acc & 0xffff) * PRIME32_1 + (((acc >>> 16) * PRIME32_1) << 16)) & 0xffffffff;
  }

  acc ^= acc >>> 15;
  acc =
    (((acc & 0xffff) * PRIME32_2) & 0xffffffff) + (((acc >>> 16) * PRIME32_2) << 16);
  acc ^= acc >>> 13;
  acc =
    (((acc & 0xffff) * PRIME32_3) & 0xffffffff) + (((acc >>> 16) * PRIME32_3) << 16);
  acc ^= acc >>> 16;

  return acc < 0 ? acc + 4294967296 : acc;
}
