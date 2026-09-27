import type {ReactNode} from 'react';

/** Line icons for the map balloons, drawn like the HUD icons so every
 * situation reads the same on any device (emoji fonts vary between systems). */
const glyphs:Record<string,ReactNode>={
 pollution_01:<><path d="M4 7h16M9.5 7V4.5h5V7M6 7l1.2 12.5a1.5 1.5 0 0 0 1.5 1.5h6.6a1.5 1.5 0 0 0 1.5-1.5L18 7"/><path d="M10 11v6M14 11v6"/></>,
 pollution_02:<><rect x="4" y="3.5" width="16" height="13.5" rx="3"/><path d="M4 10h16M7.5 17v3M16.5 17v3M7.5 13.5h1M15.5 13.5h1"/></>,
 security_01:<><circle cx="6.5" cy="10" r="1.7"/><circle cx="10" cy="6" r="1.7"/><circle cx="14.5" cy="6" r="1.7"/><circle cx="18" cy="10" r="1.7"/><path d="M8.5 17.5c0-3 1.8-5.5 3.8-5.5s3.7 2.5 3.7 5.5c0 1.8-1.7 2.8-3.7 2.3-2 .5-3.8-.5-3.8-2.3Z"/></>,
 security_02:<><path d="M12 3 5 6v5.5c0 4.5 3 7.8 7 9.5 4-1.7 7-5 7-9.5V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/></>,
 nature_01:<><path d="M12 8.5V19"/><path d="M12 11.5C10.5 6.5 4 4 4 8.5c0 3 3.5 4.5 8 3ZM12 11.5c1.5-5 8-7.5 8-3 0 3-3.5 4.5-8 3Z"/><path d="M12 13c-2.5.8-5.5 3-4.5 5.5.9 2 3.8.2 4.5-2.8ZM12 13c2.5.8 5.5 3 4.5 5.5-.9 2-3.8.2-4.5-2.8Z"/><path d="m10 4.5 2 3 2-3"/></>,
 nature_02:<><path d="M9.5 14.2V5.5a2.5 2.5 0 0 1 5 0v8.7a4.2 4.2 0 1 1-5 0Z"/><path d="M12 9.5v7"/><path d="M17.5 6h2.5M17.5 9.5h2"/></>,
 health_01:<><path d="M12 3s6 6.3 6 11a6 6 0 0 1-12 0c0-4.7 6-11 6-11Z"/><path d="M8.8 15.2c1.1 1 2.1 1 3.2 0s2.1-1 3.2 0"/></>,
 health_02:<><path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 10a4.25 4.25 0 0 0 0 8.5Z"/><path d="M9 4.5c1-.8 2-.8 3 0s2 .8 3 0"/></>,
 accessibility_02:<><path d="M12 21s-7-5.8-7-11a7 7 0 0 1 14 0c0 5.2-7 11-7 11Z"/><path d="M12 6.5v6.5M8.75 9.75h6.5"/></>,
 accessibility_01:<><circle cx="10.5" cy="4.5" r="1.7"/><path d="M10.5 8v5.5h4.5l2.2 5.5"/><path d="M10.5 10.8h4.2"/><path d="M7.6 11.2a5 5 0 1 0 7.1 6.3"/></>,
};

export function ProblemGlyph({id,fallback}:{id:string;fallback:string}){
 const glyph=glyphs[id];
 if(!glyph)return <span className="marker-glyph is-text">{fallback}</span>;
 return <svg className="marker-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{glyph}</svg>;
}
