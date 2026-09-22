import { useId } from 'react';
import type { Accessory } from '../../game/wardrobe';
import type { CharacterPose } from '../../game/types';
import { publicAsset } from '../../assets/publicAsset';

// Landmarks in the original 768px sprites. Torso, sleeves and foreground hands
// follow each pose independently; product-photo sleeves cannot follow the arms.
export const wearablePoses: Record<CharacterPose, {
  chest: [number, number, number, number, number];
  head: [number, number, number];
  front: string;
  torso: string;
  sleeves: string;
  cuffs: string;
}> = {
  character_intro: {
    chest: [219, 218, 283, 234, 0], head: [369, 0, 0],
    front: 'M172 408L226 395L254 440L238 502L249 538L222 566L165 556Z M450 407L526 414L541 558L457 577L427 521Z',
    torso: 'M288 303Q338 326 402 300Q413 308 417 335L428 359L419 396Q417 410 403 428L367 443Q324 450 288 438Q271 416 263 381L264 351Z',
    sleeves: 'M279 295Q252 286 235 302Q217 319 224 349L230 358L218 381Q233 397 261 392L272 365L283 333Z M416 298Q443 286 468 306Q486 320 488 345L480 355L490 382Q472 399 449 403L433 383L415 352Z',
    cuffs: 'M221 379Q237 392 261 389 M447 399Q470 394 488 380',
  },
  character_thinking: {
    chest: [221, 226, 280, 232, 2], head: [369, 0, 0],
    front: 'M211 257L283 250L307 306L293 353L254 364L244 399L215 426L163 414L160 364L186 326Z M473 359L531 364L558 313L621 312L665 359L679 410L636 454L537 465L485 441L453 406Z',
    torso: 'M284 306Q336 322 397 300L413 321L423 369L410 404L398 430Q351 442 290 435Q269 411 261 379L264 341Z',
    sleeves: 'M260 278Q231 273 212 299L201 326L227 349L268 340L282 309Z M414 296Q446 285 473 308L482 341L476 350L487 371Q476 389 453 397L431 378L416 352Z',
    cuffs: 'M450 391Q471 385 484 369',
  },
  character_alert: {
    chest: [243, 216, 281, 233, 5], head: [391, -10, 4],
    front: 'M68 178L217 175L253 244L247 301L272 337L258 371L215 395L150 384L97 348L57 279Z M488 400L548 388L586 433L587 510L550 532L501 518L484 478Z',
    torso: 'M313 292Q364 321 436 301L453 330L460 370L449 414L427 436Q389 444 349 438L311 416L290 367L296 321Z',
    sleeves: 'M253 272Q281 262 303 281L314 303L302 341L279 367Q259 370 242 351L234 321Z M451 296Q487 294 505 326L512 350L505 360L520 384Q502 399 479 405L457 378L448 347Z',
    cuffs: 'M249 346Q262 362 281 362 M477 399Q500 395 517 382',
  },
  character_success: {
    chest: [231, 211, 285, 236, 7], head: [391, -3, 3],
    front: 'M92 111L226 110L232 216L252 264L249 308L221 327L170 319L96 284Z M536 270L605 275L624 324L611 414L570 448L521 431L494 402L507 360Z',
    torso: 'M304 283Q352 310 425 299L442 330L449 371L432 411L414 432Q361 438 303 421L280 383L278 334Z',
    sleeves: 'M251 254Q281 246 305 270L313 291L301 323L279 340Q252 337 233 319L234 290Z M435 302Q469 300 498 331L504 353L494 365L509 386Q497 403 480 411L456 392L442 365Z',
    cuffs: 'M238 311Q253 328 278 332 M478 406Q494 399 505 384',
  },
  character_failure: {
    chest: [217, 203, 286, 237, 7], head: [372, -12, 3],
    front: 'M115 172L246 132L258 207L227 244L217 294L197 336L148 332L113 304Z M477 377L560 365L601 327L673 340L730 385L740 443L687 481L622 481L565 467L511 474L468 437Z',
    torso: 'M283 287Q337 313 414 297L430 332L438 376L418 414L399 436Q349 443 287 432L268 411L256 373L260 331Z',
    sleeves: 'M220 258Q251 246 284 263L298 286L282 318L256 341L226 335L199 321L202 282Z M432 297Q468 292 493 325L504 346L496 358L507 383Q488 399 464 412L444 388L429 356Z',
    cuffs: 'M206 317Q227 335 251 333 M461 406Q484 393 503 381',
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

// The product photos include the INSIDE of empty garments. On the avatar the
// helmet/arms occupy those openings and occlude their rear edges.
const hatFrontEdges: Partial<Record<string, string>> = {
  'hat-bucket': 'M12 293Q47 237 120 181L162 57Q172 23 222 12C311 -4 430 8 496 51Q519 64 521 103L553 243Q607 303 634 382C516 354 392 339 271 302C144 263 48 253 12 293Z',
  'hat-artist': 'M0 0H640V388H501C442 342 340 316 215 300C122 286 72 294 64 313H0Z',
  'hat-cap': 'M0 0H640V406L607 401C591 403 572 410 550 417L513 424C469 481 447 483 407 469L154 400L133 390L82 425C29 463 0 455 0 414Z',
};

export function JacketTint({ item, id, armor = false }: { item: Accessory; id: string; armor?: boolean }) {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
  const table = (i: number) => `0 ${channel(item.color, i) * .22} ${channel(item.color, i) * .62} ${channel(item.color, i)} ${channel(item.light, i)}`;
  return <filter id={id} colorInterpolationFilters="sRGB">
    {armor
      ? <feColorMatrix type="matrix" values=".1 .05 .85 0 0 .1 .05 .85 0 0 .1 .05 .85 0 0 0 0 0 1 0"/>
      : <feColorMatrix type="saturate" values="0"/>}
    <feComponentTransfer>
      <feFuncR type="table" tableValues={table(0)}/>
      <feFuncG type="table" tableValues={table(1)}/>
      <feFuncB type="table" tableValues={table(2)}/>
    </feComponentTransfer>
  </filter>;
}

export function JacketLayer({ item, pose, source, uid }: { item: Accessory; pose: CharacterPose; source: string; uid: string }) {
  const { chest: [x, y, width, height, angle], head: [headX, headY], front, torso, sleeves, cuffs } = wearablePoses[pose];
  const fitted = { href: wearableSource('jacket-base'), x, y, width, height, preserveAspectRatio: 'xMidYMid meet', transform: `rotate(${angle} ${x + width / 2} ${y + height / 2})` };
  return <g data-slot="jacket" className="wearable-reveal" key={item.id}>
    <defs>
      <JacketTint item={item} id={`${uid}-jacket-dye`}/>
      <JacketTint item={item} id={`${uid}-sleeve-dye`} armor/>
      <clipPath id={`${uid}-jacket-torso`}><path d={torso}/></clipPath>
      <clipPath id={`${uid}-jacket-sleeves`}><path d={sleeves}/></clipPath>
      <clipPath id={`${uid}-jacket-front`}>
        <ellipse cx={headX} cy={151 + headY} rx="191" ry="154"/>
        <path d={front}/>
      </clipPath>
      <clipPath id={`${uid}-jacket-footprint`}><path d={torso}/><path d={sleeves}/></clipPath>
    </defs>
    <g clipPath={`url(#${uid}-jacket-torso)`}>
      <image data-part="torso" {...fitted} filter={`url(#${uid}-jacket-dye)`}/>
    </g>
    <image href={source} width="768" height="768" filter={`url(#${uid}-sleeve-dye)`} clipPath={`url(#${uid}-jacket-sleeves)`}/>
    <path d={cuffs} fill="none" stroke={item.trim} strokeWidth="3" strokeLinecap="round" opacity=".65" clipPath={`url(#${uid}-jacket-sleeves)`}/>
    <g clipPath={`url(#${uid}-jacket-footprint)`}>
      <image href={source} width="768" height="768" preserveAspectRatio="xMidYMid meet" clipPath={`url(#${uid}-jacket-front)`}/>
    </g>
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
  const front = hatFrontEdges[item.id];
  return <g data-slot="hat" className="wearable-reveal" key={item.id}>
    <defs>
      <filter id={`${uid}-hat-contact`} x="-.1" y="-.1" width="1.2" height="1.3"><feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#22162d" floodOpacity=".28"/></filter>
      {front && <clipPath id={`${uid}-hat-front`}><path d={front} transform={`translate(${p.x} ${p.y}) scale(${p.width / 640})`}/></clipPath>}
    </defs>
    <g transform={`rotate(${p.angle} ${p.center} ${p.bottom})`} filter={`url(#${uid}-hat-contact)`}>
      <image href={wearableSource(item.id)} x={p.x} y={p.y} width={p.width} height={p.height} preserveAspectRatio="xMidYMid meet" clipPath={front ? `url(#${uid}-hat-front)` : undefined}/>
    </g>
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
