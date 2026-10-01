# Poses da chegada do Impactus

Cinco desenhos feitos pelo Emanuel no ChatGPT (ImageGen) em 01/10/2026 para a abertura: `voo`, `virada`, `descida`, `pouso` e `levantando`. Seguem o quadrado de 1254 px e o recorte transparente das poses do diálogo, com o robô virado para a esquerda; o jogo espelha quando ele muda de lado.

`node scripts/export-arrival-poses.mjs` remove os poucos pontos soltos do recorte e gera `public/assets/portraits/robot/arrival/*.webp` (768 px).

O enquadramento de cada desenho fica em `src/ui/cinematic/arrivalPoses.ts`: a escala iguala a largura do capacete à da Comemoração (cerca de 518 px no quadrado de 1254) e o ponto de apoio é o raio do peito (desenhos no ar) ou o ponto entre os pés no chão (desenhos que tocam o chão). Para um desenho novo, meça esses pontos numa grade e confira sobrepondo-o ao desenho anterior e ao seguinte.

## Prompt base

```
Use case: new pose of an existing game character. Asset type: transparent game character sprite.
Reference image is the existing Impactus robot: keep EXACTLY the same character design, proportions, materials and rendering style: glossy white and purple armor, black visor face with glowing cyan eyes, purple lightning bolt on the forehead and on the chest, round purple headphones, black joints, purple boots, the same velvet purple cape.
Square 1254x1254 canvas, transparent alpha background, full body including boots and the whole cape, nothing cropped. Same character scale as the reference (head about the same width). No floor, no shadow, no motion lines, no glow effects, no text, no extra accessories. The character faces and travels toward the LEFT side of the image.
Pose:
```

Poses: voo (superhero flight, fist forward, cape streaming back), virada (banking turn looking back over the shoulder), descida (feet-first descent, arms up, cape blown upward), pouso (superhero landing, knee and fist on the ground), levantando (rising from the crouch, big smile). A referência anexada foi `assets-source/ui/wardrobe/impactus-clean.png`.
