import { useId } from 'react';
import { characters } from '../../content/characters';
import type { CharacterPose } from '../../game/types';
import { accessoryById, type Outfit } from '../../game/wardrobe';
import { Motif } from './AccessoryArt';
import { HatLayer, JacketLayer } from './WearableLayers';
function channel(hex: string, index: number) { return parseInt(hex.slice(1+index*2,3+index*2),16)/255; }
// Foreground silhouettes keep the cape dye behind hands, armor and legs.
// The alpha of the source image supplies the outer cloth contour.
const foreground: Record<CharacterPose,string> = {
  character_intro: 'M278 286L440 282L466 320L446 397L430 436L437 469L405 502L279 490L260 437L256 371Z M258 288Q230 287 219 318L223 353L225 362L216 385Q187 406 185 438L176 467L171 486L170 516Q171 541 195 554L220 550L237 527L238 509L226 489L231 476Q257 461 264 431L271 414L264 392L265 379L271 348L278 315Z M442 288Q484 287 490 333L484 355L494 386Q520 406 525 461L522 493L521 526Q515 554 490 568L463 558L445 549L435 528L432 508L443 481L440 453L435 421L443 395L425 375L404 345L403 312Z M266 446Q292 482 326 487L330 522L324 547Q332 564 335 580L346 615L355 661L356 698Q321 725 291 725L173 725L163 702L172 663L191 640L225 625L231 595L232 569L239 538L252 510L253 478Z M379 450L413 444Q433 460 438 503L446 537L456 556L466 584L479 616L494 651L511 681L518 732L494 750L382 751L368 728L368 683L353 643L353 607L360 586L369 559L358 535L349 512L347 491Z',
  character_thinking: 'M273 300L405 298L432 380L404 435L414 461L389 489L294 501L266 473L269 429L257 387Z M266 462Q300 488 341 487L329 525L355 602L370 691L304 732L150 742L166 639L218 580L234 527Z M381 461L426 449Q449 478 460 548L482 595L524 657L565 739L361 746L371 642L368 596L356 542L338 488Z M236 277L285 250L310 280L303 337L264 365L249 401L215 429L168 414L160 383L176 340L202 300Z M419 285Q479 285 492 340L491 352L520 368L550 351L570 319L613 321L617 348L657 360L674 384L650 427L613 454L544 460L505 455Q461 451 448 405L422 373L400 335Z',
  character_alert: 'M300 292L446 293L465 368L451 434L447 479L407 515L343 510L300 457L277 389Z M230 266L303 264L328 301L301 351L265 380L225 396L160 386L123 347L64 317L62 200L158 168L243 202Z M448 289L478 289L516 326L539 373L556 398L587 431L587 500L561 532L514 528L474 504L465 451L480 415L442 382Z M308 459L349 509L329 541L290 582L286 645L279 679L235 742L133 758L126 699L162 618L206 571L248 517L264 484Z M426 465L473 488L500 536L520 592L530 635L584 675L598 746L380 751L375 670L390 627L384 580L378 536Z',
  character_success: 'M292 273L439 287L475 378L427 437L451 475L398 510L314 495L273 439L269 379Z M199 120L243 216L294 249L332 277L308 335L279 353L243 331L175 331L99 282L89 165Z M436 290L508 327L517 371L538 326L555 279L603 279L634 324L623 368L611 428L568 458L506 448L475 417L447 384Z M274 445L345 489L345 530L315 565L313 600L285 650L282 698L239 744L120 752L115 699L160 613L212 552L230 518Z M407 462L466 476L492 530L510 583L528 637L577 685L585 741L372 742L370 671L388 622L378 567L361 518Z',
  character_failure: 'M281 290L421 294L452 387L419 429L426 469L385 503L283 493L259 443L254 386Z M237 113L265 172L245 240L292 257L307 292L280 333L231 353L190 341L137 335L121 303L119 247L151 195L170 150Z M426 290L494 317L511 367L551 371L590 336L660 323L719 382L729 423L690 474L635 486L554 471L511 478L459 447L441 398Z M260 466L331 494L330 541L357 579L355 645L375 717L329 754L150 755L145 698L190 639L218 590L222 546Z M392 462L441 477L482 546L513 616L561 677L571 765L360 768L369 655L352 573L338 521Z',
};
export function CharacterAvatar({ outfit, pose = 'character_intro', src, onError, label = 'Robô companheiro da jornada' }: { outfit: Outfit; pose?: CharacterPose; src?: string; onError?: () => void; label?: string }) {
  const uid=useId().replaceAll(':','');
  const source=src ?? characters.companion.poses[pose];
  const cape=accessoryById[outfit.cape], jacket=outfit.jacket?accessoryById[outfit.jacket]:null, hat=outfit.hat?accessoryById[outfit.hat]:null;
  return <div className="character-avatar" data-cape={outfit.cape} data-jacket={outfit.jacket??'none'} data-hat={outfit.hat??'none'}>
    <img className="character-base" src={source} alt={label} width="768" height="768" onError={onError} decoding="sync"/>
    <svg className="character-garments" viewBox="0 0 768 768" width="768" height="768" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <mask id={`${uid}-cape`} maskUnits="userSpaceOnUse" x="0" y="0" width="768" height="768" style={{maskType:'luminance'}}><path d="M0 282H768V648H0Z" fill="white"/><ellipse cx="384" cy="155" rx="205" ry="150" fill="black"/><path d={foreground[pose]} fill="black" stroke="black" strokeWidth="3" strokeLinejoin="round"/></mask>
        <filter id={`${uid}-dye`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer><feFuncR type="gamma" amplitude="1" exponent=".65" offset="0"/><feFuncG type="gamma" amplitude="1" exponent=".65" offset="0"/><feFuncB type="gamma" amplitude="1" exponent=".65" offset="0"/></feComponentTransfer>
          <feComponentTransfer result="dyed">
            <feFuncR type="table" tableValues={`0 ${channel(cape.color,0)} ${channel(cape.light,0)} 1`}/>
            <feFuncG type="table" tableValues={`0 ${channel(cape.color,1)} ${channel(cape.light,1)} 1`}/>
            <feFuncB type="table" tableValues={`0 ${channel(cape.color,2)} ${channel(cape.light,2)} 1`}/>
          </feComponentTransfer>
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 -6 6 0 -.7" result="clothAlpha"/>
          <feComposite in="dyed" in2="clothAlpha" operator="in"/>
        </filter>
      </defs>
      {cape.style!==0 && <g className="wearable-reveal" key={cape.id} mask={`url(#${uid}-cape)`}>
        <image href={source} width="768" height="768" preserveAspectRatio="xMidYMid meet" filter={`url(#${uid}-dye)`}/>
        <g opacity=".7"><Motif style={cape.style} color={cape.trim} x={580} y={509} size={22}/>{cape.style===2&&<><Motif style={0} color={cape.trim} x={622} y={530} size={9}/><Motif style={0} color={cape.trim} x={543} y={540} size={7}/></>}</g>
      </g>}
      {jacket && <JacketLayer key={jacket.id} item={jacket} pose={pose} source={source} uid={uid}/>}
      {hat && <HatLayer key={hat.id} item={hat} pose={pose} uid={uid}/>}
    </svg>
  </div>;
}
