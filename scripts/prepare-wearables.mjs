import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const source = 'assets-source/ui/wardrobe/rendered';
const output = 'public/assets/accessories/rendered';
await mkdir(output, { recursive: true });
// Editable silhouette mattes in the ImageGen source coordinates. A few source
// exports contain a baked checkerboard; these precise vector clipping paths
// exclude that backdrop without discarding pale cloth, stitching or highlights.
const contours = {
  'jacket-base': 'M331 273C385 168 500 134 642 132C752 129 819 151 855 203L879 312L940 345C1082 350 1163 423 1184 515L1203 548C1229 583 1192 650 1154 700C1119 749 1064 789 998 786C962 871 923 1006 795 1043C702 1073 568 1085 491 1080L433 1065C347 1056 287 1032 270 966L239 804L228 704C162 687 128 641 104 577L72 522C49 496 67 459 81 437C103 356 190 288 285 274Z',
  'hat-explorer': 'M296 558L300 522C352 454 380 384 405 300C433 204 510 219 651 255L736 286C838 256 935 281 960 344L1012 561L1040 651C1155 651 1230 678 1232 726C1236 812 1091 885 988 931C798 1013 647 1001 484 984C300 961 154 891 75 791C-22 682 42 559 191 557Z',
  'hat-artist': 'M70 632C63 502 149 420 251 375C377 314 494 322 623 349C642 314 677 267 712 277C765 286 744 331 712 382C860 410 956 455 1035 533C1161 643 1211 711 1209 791C1209 870 1114 917 1000 906L961 923C956 990 735 966 552 937C350 905 186 884 187 839L174 788C122 760 72 708 70 632Z',
  'hat-bucket': 'M232 553L326 311C331 264 372 231 471 215C662 199 856 225 975 306C1008 330 1013 361 1021 407L1082 684C1157 761 1189 837 1217 897C1270 982 1130 1039 991 1037C740 1060 426 1005 191 900C51 839 1 774 44 719C99 662 160 603 232 553Z',
  'hat-inventor': 'M316 495L313 253C299 198 374 188 491 191C684 185 923 221 1063 302C1113 331 1092 363 1068 411L1002 623L1012 727C1122 737 1192 761 1194 808C1203 896 1082 956 951 986C725 1049 491 1005 279 899C150 834 54 742 72 652C90 571 164 551 261 580C272 565 287 559 299 556L309 532Z',
};
const manifest = {};
for (const id of ['jacket-base', 'hat-explorer', 'hat-artist', 'hat-bucket', 'hat-cap', 'hat-inventor', 'hat-crown']) {
  const bytes = await readFile(`${source}/${id}.png`);
  const meta = await sharp(bytes).metadata();
  let image = sharp(bytes);
  if (!meta.hasAlpha) {
    const path = contours[id];
    if (!path) throw new Error(`Missing silhouette: ${id}`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${meta.width}" height="${meta.height}"><defs><clipPath id="cut"><path d="${path}"/></clipPath></defs><image xlink:href="data:image/png;base64,${bytes.toString('base64')}" width="${meta.width}" height="${meta.height}" clip-path="url(#cut)"/></svg>`;
    image = sharp(Buffer.from(svg));
  }
  const trimmed = await image.trim({ threshold: 2 }).png().toBuffer({ resolveWithObject: true });
  manifest[id] = { width: trimmed.info.width, height: trimmed.info.height, ratio: trimmed.info.height / trimmed.info.width };
  await sharp(trimmed.data).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 93, alphaQuality: 100 }).toFile(`${output}/${id}.webp`);
}
await writeFile(`${source}/dimensions.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(manifest);
