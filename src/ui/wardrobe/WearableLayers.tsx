import { useId } from 'react';
import type { Accessory } from '../../game/wardrobe';
import type { CharacterPose } from '../../game/types';
import { publicAsset } from '../../assets/publicAsset';

// The artwork is fitted to the actual head/chest, independently of the shop
// thumbnails. Foreground hands and the chin are restored above the jacket.
export const wearablePoses: Record<CharacterPose, {
  chest: [number, number, number, number, number];
  head: [number, number, number];
  front: string;
}> = {
  character_intro: {
    chest: [215, 270, 292, 187, 0], head: [369, 0, 0],
    front: 'M172 408L226 395L254 440L238 502L249 538L222 566L165 556Z M450 407L526 414L541 558L457 577L427 521Z',
  },
  character_thinking: {
    chest: [214, 277, 292, 180, 2], head: [369, 0, 0],
    front: 'M211 257L283 250L307 306L293 353L254 364L244 399L215 426L163 414L160 364L186 326Z M473 359L531 364L558 313L621 312L665 359L679 410L636 454L537 465L485 441L453 406Z',
  },
  character_alert: {
    chest: [239, 268, 293, 188, 5], head: [391, -10, 4],
    front: 'M68 178L217 175L253 244L247 301L272 337L258 371L215 395L150 384L97 348L57 279Z M488 400L548 388L586 433L587 510L550 532L501 518L484 478Z',
  },
  character_success: {
    chest: [225, 263, 299, 192, 7], head: [391, -3, 3],
    front: 'M92 111L226 110L232 216L252 264L249 308L221 327L170 319L96 284Z M536 270L605 275L624 324L611 414L570 448L521 431L494 402L507 360Z',
  },
  character_failure: {
    chest: [212, 253, 299, 195, 7], head: [372, -12, 3],
    front: 'M115 172L246 132L258 207L227 244L217 294L197 336L148 332L113 304Z M477 377L560 365L601 327L673 340L730 385L740 443L687 481L622 481L565 467L511 474L468 437Z',
  },
};

// Aspect ratios measured in rendered/dimensions.json by prepare-wearables.mjs.
export const hatShapes: Record<string, { width: number; ratio: number; bottom: number }> = {
  'hat-explorer': { width: 369, ratio: .639004, bottom: 163 },
  'hat-artist': { width: 340, ratio: .606486, bottom: 141 },
  'hat-bucket': { width: 351, ratio: .694167, bottom: 171 },
  'hat-cap': { width: 341, ratio: .751080, bottom: 166 },
  'hat-inventor': { width: 354, ratio: .733570, bottom: 157 },
  'hat-crown': { width: 311, ratio: .515306, bottom: 111 },
};

export const wearableSource = (id: string) => publicAsset(`/assets/accessories/rendered/${id}.webp`);

export function JacketTint({ item, id }: { item: Accessory; id: string }) {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
  const table = (i: number) => `0 ${channel(item.color, i) * .22} ${channel(item.color, i) * .62} ${channel(item.color, i)} ${channel(item.light, i)}`;
  return <filter id={id} colorInterpolationFilters="sRGB">
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer>
      <feFuncR type="table" tableValues={table(0)}/>
      <feFuncG type="table" tableValues={table(1)}/>
      <feFuncB type="table" tableValues={table(2)}/>
    </feComponentTransfer>
  </filter>;
}

export function JacketLayer({ item, pose, source, uid }: { item: Accessory; pose: CharacterPose; source: string; uid: string }) {
  const { chest: [x, y, width, height, angle], head: [headX, headY], front } = wearablePoses[pose];
  const fitted = { href: wearableSource('jacket-base'), x, y, width, height, preserveAspectRatio: 'none', transform: `rotate(${angle} ${x + width / 2} ${y + height / 2})` };
  return <g data-slot="jacket" className="wearable-reveal" key={item.id}>
    <defs>
      <JacketTint item={item} id={`${uid}-jacket-dye`}/>
      <clipPath id={`${uid}-jacket-front`}>
        <ellipse cx={headX} cy={151 + headY} rx="191" ry="154"/>
        <path d={front}/>
      </clipPath>
      <mask id={`${uid}-jacket-footprint`} maskUnits="userSpaceOnUse" x="0" y="0" width="768" height="768" style={{maskType:'alpha'}}><image {...fitted}/></mask>
    </defs>
    <image {...fitted} filter={`url(#${uid}-jacket-dye)`}/>
    <image href={source} width="768" height="768" preserveAspectRatio="xMidYMid meet" clipPath={`url(#${uid}-jacket-front)`} mask={`url(#${uid}-jacket-footprint)`}/>
  </g>;
}

export function hatPlacement(id: string, pose: CharacterPose) {
  const { width, ratio, bottom } = hatShapes[id];
  const [center, dy, angle] = wearablePoses[pose].head;
  const height = width * ratio;
  return { x: center - width / 2, y: bottom + dy - height, width, height, angle, center, bottom: bottom + dy };
}

export function HatLayer({ item, pose, uid }: { item: Accessory; pose: CharacterPose; uid: string }) {
  const p = hatPlacement(item.id, pose);
  return <g data-slot="hat" className="wearable-reveal" key={item.id}>
    <defs><filter id={`${uid}-hat-contact`} x="-.1" y="-.1" width="1.2" height="1.3"><feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#22162d" floodOpacity=".28"/></filter></defs>
    <image href={wearableSource(item.id)} x={p.x} y={p.y} width={p.width} height={p.height} preserveAspectRatio="xMidYMid meet" transform={`rotate(${p.angle} ${p.center} ${p.bottom})`} filter={`url(#${uid}-hat-contact)`}/>
  </g>;
}

export function WearablePreview({ item }: { item: Accessory }) {
  const uid = useId().replaceAll(':', '');
  if (item.slot !== 'jacket') return <img className="accessory-art" src={item.slot === 'hat' ? wearableSource(item.id) : publicAsset(`/assets/accessories/${item.id}.svg`)} alt="" width="180" height="170"/>;
  return <svg className="accessory-art" viewBox="0 0 180 170" width="180" height="170" aria-hidden="true">
    <defs><JacketTint item={item} id={`${uid}-preview`}/></defs>
    <image href={wearableSource('jacket-base')} x="6" y="12" width="168" height="146" preserveAspectRatio="xMidYMid meet" filter={`url(#${uid}-preview)`}/>
  </svg>;
}
