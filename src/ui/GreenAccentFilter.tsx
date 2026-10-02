/** Recolor purple after composing the original poses and clothes.
 * Channel differences isolate purple from white, gold and the blue face lights;
 * complementary masks preserve the original silhouette and transparency. */
export function GreenAccentFilter() {
  return <svg width="0" height="0" className="color-filters" aria-hidden="true" focusable="false">
    <defs>
      <filter id="eco-green-accent" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 16 -16 0 0 -.24" result="red-over-green"/>
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -8 -8 16 0 -.24" result="blue-over-warm"/>
        <feComposite in="red-over-green" in2="blue-over-warm" operator="in" result="purple-mask"/>
        <feColorMatrix in="SourceGraphic" type="matrix" values={
          `0 .74 .26 0 0
           0 .47 .53 0 0
           .16 .60 .24 0 0
           0 0 0 1 0`
        } result="green-pixels"/>
        <feComposite in="green-pixels" in2="purple-mask" operator="in" result="green-accent"/>
        <feComposite in="SourceGraphic" in2="purple-mask" operator="out" result="original-colors"/>
        <feComposite in="original-colors" in2="green-accent" operator="arithmetic" k2="1" k3="1"/>
      </filter>
    </defs>
  </svg>;
}
