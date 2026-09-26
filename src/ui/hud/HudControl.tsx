import type { ComponentProps, ReactNode } from 'react';

export type HudIconName = 'back' | 'forward' | 'close' | 'settings' | 'check' | 'lock' | 'sparkles' | 'pin' | 'energy' | 'chat' | 'sound' | 'muted';

const paths: Record<HudIconName, ReactNode> = {
  back: <path d="m10 5-7 7 7 7M3 12h18"/>,
  forward: <path d="m14 5 7 7-7 7M21 12H3"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  settings: <><path d="M4 6h3m5 0h8M4 12h9m5 0h2M4 18h3m5 0h8"/><circle cx="9.5" cy="6" r="2.5"/><circle cx="15.5" cy="12" r="2.5"/><circle cx="9.5" cy="18" r="2.5"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
  sparkles: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/><path d="M4 3v3M2.5 4.5h3M20 18v3m-1.5-1.5h3"/></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  energy: <path d="m13 2-9 12h7l-1 8 10-13h-8Z"/>,
  chat: <path d="M21 11.5a9 9 0 0 1-9 9 10 10 0 0 1-4-.9L3 21l1.4-5A9 9 0 1 1 21 11.5Z"/>,
  sound: <><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></>,
  muted: <><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4Z"/><path d="m16 9.5 5 5m0-5-5 5"/></>,
};

export function HudIcon({ name, className='' }: { name: HudIconName; className?: string }) {
  return <svg className={`hud-icon ${className}`} viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

type HudControlProps = ComponentProps<'button'> & { icon: HudIconName; label: string; tone?: 'violet' | 'quiet' };

/** The button owns its shape, hit area and interaction states; SVG is only the glyph. */
export function HudControl({ icon, label, tone='violet', className='', ...props }: HudControlProps) {
  return <button type="button" className={`hud-control hud-control-${tone} ${className}`} aria-label={label} title={label} {...props}><HudIcon name={icon}/></button>;
}
