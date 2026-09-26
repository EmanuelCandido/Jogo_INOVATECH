import sharp from 'sharp';

// Raster fallbacks share the editable vector, including Safari's home icon.
await Promise.all([
  sharp('public/favicon.svg').resize(32, 32).png().toFile('public/favicon-32.png'),
  sharp('public/favicon.svg').resize(180, 180).png().toFile('public/apple-touch-icon.png'),
]);
