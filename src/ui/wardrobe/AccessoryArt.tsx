import { useId } from 'react';
import type { Accessory } from '../../game/wardrobe';

// All garments use the same local coordinates in the catalogue and on the
// character. Their gradients, seams and silhouette remain sharp at any size.
export function Garment({ item, uid }: { item: Accessory; uid: string }) {
  const gradient = `url(#${uid}-cloth)`;
  const shade = `url(#${uid}-shade)`;
  const trim = item.trim;
  return <>
    <defs>
      <linearGradient id={`${uid}-cloth`} x1="0" y1="0" x2="1" y2=".65">
        <stop stopColor={item.color} /><stop offset=".28" stopColor={item.light} /><stop offset=".56" stopColor={item.color} /><stop offset=".78" stopColor={item.light} /><stop offset="1" stopColor={item.color} />
      </linearGradient>
      <linearGradient id={`${uid}-shade`} x2="0" y2="1"><stop stopColor="#fff" stopOpacity=".4"/><stop offset=".4" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#171023" stopOpacity=".48"/></linearGradient>
    </defs>
    {item.slot === 'cape' && <g>
      <path d="M64 31Q89 13 116 31L150 137Q126 125 108 146Q87 130 69 148Q49 128 27 139Z" fill={gradient} stroke={item.color} strokeWidth="3"/>
      <path d="M64 31Q89 13 116 31L150 137Q126 125 108 146Q87 130 69 148Q49 128 27 139Z" fill={shade}/>
      <path d="M34 134Q52 126 69 143Q89 125 108 141Q124 125 144 134M67 35Q87 44 113 34" fill="none" stroke={trim} strokeWidth={item.style===5?5:2}/>
      <path d="m73 46-14 74m45-74 14 77M89 51v78" fill="none" stroke="#fff" strokeOpacity=".2" strokeWidth="3"/>
      <ellipse cx="90" cy="32" rx="25" ry="8" fill={item.color}/><path d="M70 35Q90 53 111 34" fill="none" stroke={trim} strokeWidth="3"/>
      <Motif style={item.style} color={trim} x={90} y={83} size={21}/>
      {item.style===2 && <><Motif style={0} color={trim} x={60} y={105} size={7}/><Motif style={0} color={trim} x={115} y={113} size={9}/></>}
    </g>}
    {item.slot === 'jacket' && <g>
      <path d="M43 32 69 22Q90 38 111 22L138 32 160 77 134 88 125 65 133 148Q90 159 47 148L55 65 46 88 20 77Z" fill={gradient} stroke={item.color} strokeWidth="3" strokeLinejoin="round"/>
      <path d="M43 32 69 22Q90 38 111 22L138 32 160 77 134 88 125 65 133 148Q90 159 47 148L55 65 46 88 20 77Z" fill={shade}/>
      <path d="M71 24 62 43 82 62 90 34 99 62 119 43 109 24M50 137Q90 147 130 137M23 70 48 81M135 81 157 70" fill="none" stroke={trim} strokeWidth="5" strokeLinejoin="round"/>
      <path d="M90 40v103" stroke="#252235" strokeOpacity=".8" strokeWidth="5"/><path d="M91 42v99" stroke={trim} strokeWidth="2"/>
      <rect x="91" y="75" width="5" height="12" rx="2" fill={trim}/>
      <path d="M57 102v21q12 8 23 0v-21zm45 0v21q12 8 23 0v-21z" fill={item.color} stroke={trim} strokeWidth="1.5"/>
      <path d="M58 103h20m26 0h19" stroke={trim} strokeWidth="4"/>
      <Motif style={item.style} color={trim} x={115} y={76} size={11}/>
      {item.style===2 && <path d="M54 86h30m12 0h31" stroke={trim} strokeWidth="7" opacity=".8"/>}
    </g>}
    {item.slot === 'hat' && <g strokeLinejoin="round">
      {item.style===0 && <><ellipse cx="90" cy="124" rx="78" ry="19" fill={item.color}/><path d="M47 117 54 64Q64 44 89 59Q115 44 127 65L136 117Q95 139 47 117" fill={gradient} stroke={item.color} strokeWidth="3"/><path d="M51 99Q91 117 132 99L135 114Q88 133 48 114Z" fill={trim}/><rect x="86" y="108" width="15" height="12" rx="2" fill={item.color} stroke="#ffebaa" strokeWidth="2"/><path d="M21 121Q84 143 157 123" fill="none" stroke={item.light} strokeWidth="3"/></>}
      {item.style===1 && <><path d="M25 105C15 52 120 28 151 79Q164 109 130 124L45 127Z" fill={gradient} stroke={item.color} strokeWidth="3"/><path d="m99 49 5-17" stroke={item.color} strokeWidth="9" strokeLinecap="round"/><path d="M42 117Q90 132 133 113L132 128Q89 140 43 129Z" fill={item.color}/><path d="M42 89Q60 58 94 57" fill="none" stroke={item.light} strokeWidth="4" strokeLinecap="round"/></>}
      {item.style===2 && <><path d="M49 60Q90 39 131 60L145 111 162 132Q124 153 90 139Q48 154 19 133L36 110Z" fill={gradient} stroke={item.color} strokeWidth="3"/><ellipse cx="90" cy="59" rx="41" ry="11" fill={item.light}/><path d="M37 108Q89 131 144 108" fill="none" stroke={trim} strokeWidth="8"/><path d="M32 131Q60 119 85 132T147 130" fill="none" stroke={trim} strokeWidth="2"/></>}
      {item.style===3 && <><path d="M38 116Q30 43 100 43Q156 50 145 119Z" fill={gradient} stroke={item.color} strokeWidth="3"/><path d="M73 53Q115 81 107 115M102 47v67" fill="none" stroke={trim} strokeWidth="2"/><path d="M64 112Q107 101 145 116Q190 131 141 139Q94 138 64 122Z" fill={item.color} stroke={item.light} strokeWidth="3"/><circle cx="99" cy="45" r="6" fill={item.color}/><Motif style={3} color={trim} x={65} y={88} size={16}/></>}
      {item.style===4 && <><ellipse cx="90" cy="134" rx="75" ry="16" fill={item.color}/><path d="m50 125-9-88q48-18 98 0l-9 88q-41 17-80 0" fill={gradient} stroke={item.color} strokeWidth="4"/><ellipse cx="90" cy="36" rx="49" ry="10" fill={item.light}/><path d="M49 109Q90 123 131 109" stroke={trim} strokeWidth="18"/><path d="m85 112 11 1" stroke={trim} strokeWidth="8"/>{[72,111].map(x=><g key={x}><circle cx={x} cy="110" r="17" fill={trim}/><circle cx={x} cy="110" r="11" fill="#78d6ef" stroke="#57472d" strokeWidth="3"/><path d={`m${x-5} 108 7-5`} stroke="white" strokeWidth="3" strokeLinecap="round"/></g>)}</>}
      {item.style===5 && <><path d="M38 123 23 56 58 81 88 30 122 80 157 54 141 123Q93 149 38 123Z" fill={gradient} stroke={item.color} strokeWidth="3"/><path d="M36 116Q90 138 143 116L140 133Q87 154 39 133Z" fill={item.color} stroke={item.light} strokeWidth="3"/>{[[25,54],[88,31],[155,54]].map(([x,y])=><circle key={x} cx={x} cy={y} r="7" fill={item.light} stroke={item.color} strokeWidth="2"/>)}<path d="m88 76 12 17-12 17-12-17Z" fill={trim} stroke="#fff0a3" strokeWidth="3"/><circle cx="52" cy="104" r="5" fill="#8befff"/><circle cx="125" cy="104" r="5" fill="#8befff"/></>}
    </g>}
  </>;
}

export function Motif({ style, color, x, y, size }: { style: number; color: string; x: number; y: number; size: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size/20})`} fill={color}>
    {style===0 || style===2 || style===5 ? <path d="m0-20 6 13 15 2-11 10 3 15L0 12l-14 8 3-15-11-10 15-2Z"/> : style===1 ? <><path d="m-19 19 9-26 7 13 15 5Z"/><circle cx="7" cy="-8" r="12"/></> : style===3 ? <path d="M4-22-15 4h15l-5 21L18-3H4Z"/> : <path d="M11-19C-19-26-29 14-4 22Q11 26 20 11C-3 18-10-7 11-19Z"/>}
  </g>;
}
export function AccessoryArt({ item }: { item: Accessory }) {
  const uid = useId().replaceAll(':','');
  return <svg viewBox="0 0 180 170" width="180" height="170" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><Garment item={item} uid={uid}/></svg>;
}
