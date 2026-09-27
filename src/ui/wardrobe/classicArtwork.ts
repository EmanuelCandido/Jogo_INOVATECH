/** Worn headwear traced on the original character's 768px registration frame.
 * The masks follow the INNER brim, not an empty product photo's bounding box.
 * Original face, ears and body always come from the unchanged pose sprite.
 */
export const classicHats: Record<string, {
  cut: string;
  holes?: string;
  occlusion?: string;
  contact?: string;
  registration: string;
  frame: string;
}> = {
  'hat-explorer': {
    cut: 'M0 0H768V284H546L528 259Q545 232 530 208L505 196C424 179 338 163 255 136Q249 147 241 151Q227 154 221 167L205 177H0Z',
    occlusion: 'M185 0H565V135L498 181Q374 150 246 122L185 120Z',
    contact: 'M257 137C343 164 425 179 507 196',
    registration: 'translate(-3 -7)',
    frame: '185 0 410 263',
  },
  'hat-artist': {
    cut: 'M0 0H768V254H535L527 236Q526 208 508 197Q495 187 482 200C404 158 311 132 263 143Q244 147 236 163H0Z',
    occlusion: 'M185 0H565V155L495 188C407 146 321 128 265 130L185 130Z',
    contact: 'M267 144Q371 140 481 198',
    registration: 'translate(0 -12)',
    frame: '224 21 340 226',
  },
  'hat-bucket': {
    cut: 'M0 0H768V264H537L524 250Q539 231 525 210L506 200C425 178 348 150 294 137Q270 128 260 132L246 146Q233 150 230 165L218 178H0Z',
    occlusion: 'M185 0H565V145L513 188C426 164 346 135 261 120L185 120Z',
    contact: 'M263 133C342 136 423 180 507 199',
    registration: 'translate(-1 -6)',
    frame: '197 23 369 241',
  },
  'hat-cap': {
    cut: 'M0 0H768V205H516L506 189Q497 170 481 177L472 185L434 160Q398 182 371 176Q349 172 324 157Q288 133 268 126Q252 128 244 144L240 156Q221 169 204 162H0Z',
    occlusion: 'M185 0H565V141L506 171L459 171L409 157L338 146L260 112L185 110Z',
    contact: 'M268 127Q297 137 326 158Q367 187 432 161',
    registration: 'translate(-1 -8)',
    frame: '198 11 337 193',
  },
  'hat-inventor': {
    cut: 'M0 0H768V238H535L524 230Q530 208 513 192Q496 180 482 187Q454 171 420 168C358 171 318 153 277 128Q257 130 240 160H0Z',
    occlusion: 'M185 0H565V141L525 178L462 162L365 154L277 112L185 114Z',
    contact: 'M279 130Q344 169 420 169Q461 172 484 187',
    registration: 'translate(-1 -8)',
    frame: '226 9 326 229',
  },
  'hat-crown': {
    cut: 'M0 0H768V204H526L514 182Q499 174 486 185C401 139 311 115 265 126Q242 132 236 153H0Z',
    holes: 'M322 77Q352 44 396 48Q369 77 336 82Z M429 59Q474 64 491 100Q455 97 429 59Z',
    contact: 'M263 127C340 115 428 153 485 185',
    registration: 'translate(-5 -15)',
    frame: '225 0 334 205',
  },
};

/** Collar centres are measured on the complete cloth sources (1792 × 896).
 * The vertical drape reaches the character's thighs. Neck registration is
 * independent of the changing margins in each exported image.
 */
export const classicCapes: Record<string, {neck: readonly [number, number]; scale: number}> = {
  'cape-star': {neck: [729, 103], scale: .345},
  'cape-comet': {neck: [699, 83], scale: .345},
  'cape-galaxy': {neck: [701, 126], scale: .345},
  'cape-neon': {neck: [716, 107], scale: .345},
  'cape-moon': {neck: [705, 130], scale: .345},
  'cape-legend': {neck: [710, 129], scale: .345},
};
