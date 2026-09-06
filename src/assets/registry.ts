export interface MaterialAsset {
  color: string;
  roughness?: number;
  texture?: string;
}
export type ModelAsset =
  | {
      kind: "procedural";
      model:
        | "building"
        | "tree"
        | "hero"
        | "step"
        | "ramp"
        | "temporary"
        | "trash"
        | "partial"
        | "fountain"
        | "bench"
        | "bin";
      material: string;
    }
  | { kind: "glb"; url: string }
  | { kind: "box"; material: string };
export const assetRegistry: Record<string, ModelAsset> = {
  'prop.stump': {kind:'glb',url:'/assets/models/tree-stump.glb'},
  'prop.outfall': {kind:'glb',url:'/assets/models/river-outfall.glb'},
  'prop.information': {kind:'glb',url:'/assets/models/information-sign.glb'},
  'prop.thermometer': {kind:'glb',url:'/assets/models/thermometer.glb'},
  'prop.assistance': {kind:'glb',url:'/assets/models/assistance-kiosk.glb'},
  'prop.wildlife': {kind:'glb',url:'/assets/models/wildlife-shelter.glb'},
  'prop.pier': {kind:'glb',url:'/assets/models/pier.glb'},
  'prop.pergola': {kind:'glb',url:'/assets/models/pergola.glb'},
  'prop.football': {kind:'glb',url:'/assets/models/football-field.glb'},
  'prop.shelter': {kind:'glb',url:'/assets/models/bus-shelter.glb'},
  'prop.rabbit': {kind:'glb',url:'/assets/models/rabbit.glb'},
  'prop.wheelchair': {kind:'glb',url:'/assets/models/wheelchair-user.glb'},
  'prop.treatment': {kind:'glb',url:'/assets/models/water-treatment.glb'},
  'prop.heatpump': {kind:'glb',url:'/assets/models/heat-pump.glb'},
  'prop.beach': {kind:'glb',url:'/assets/models/beach-set.glb'},
  'prop.sailboat': {kind:'glb',url:'/assets/models/sailboat.glb'},
  "building.warehouse": {kind:"glb",url:"/assets/models/port-warehouse.glb"},
  "prop.truck": {kind:"glb",url:"/assets/models/delivery-truck.glb"},
  "tree.oak": {kind:"glb",url:"/assets/models/tree-oak.glb"},
  "tree.maple": {kind:"glb",url:"/assets/models/tree-maple.glb"},
  "tree.birch": {kind:"glb",url:"/assets/models/tree-birch.glb"},
  "tree.fir": {kind:"glb",url:"/assets/models/tree-fir.glb"},
  "tree.thicket": {kind:"glb",url:"/assets/models/tree-thicket.glb"},
  "ground.playtrack": {kind:"box",material:"track"},
  "ground.field": {kind:"box",material:"field"},
  "ground.pool": {kind:"box",material:"water.clean"},
  "building.office": {kind:"glb",url:"/assets/models/office-glass.glb"},
  "building.fuel": {kind:"glb",url:"/assets/models/fuel-station.glb"},
  "building.cafe": {kind:"glb",url:"/assets/models/corner-cafe.glb"},
  "prop.crane": {kind:"glb",url:"/assets/models/harbor-crane.glb"},
  "prop.container.red": {kind:"glb",url:"/assets/models/container-red.glb"},
  "prop.container.blue": {kind:"glb",url:"/assets/models/container-blue.glb"},
  "prop.ship": {kind:"glb",url:"/assets/models/cargo-ship.glb"},
  "prop.lighthouse": {kind:"glb",url:"/assets/models/lighthouse.glb"},
  "prop.train": {kind:"glb",url:"/assets/models/train-carriage.glb"},
  "prop.bus": {kind:"glb",url:"/assets/models/city-bus.glb"},
  "prop.playground": {kind:"glb",url:"/assets/models/playground.glb"},
  "prop.bridge": {kind:"glb",url:"/assets/models/bridge.glb"},
  "prop.court": {kind:"glb",url:"/assets/models/court.glb"},
  "building.pink": {kind:"glb",url:"/assets/models/townhouse-pink.glb"},
  "building.house.cream": {kind:"glb",url:"/assets/models/house-cream.glb"},
  "building.house.coral": {kind:"glb",url:"/assets/models/house-coral.glb"},
  "prop.car.blue": {kind:"glb",url:"/assets/models/car-blue.glb"},
  "prop.car.white": {kind:"glb",url:"/assets/models/car-white.glb"},
  "prop.traffic": {kind:"glb",url:"/assets/models/traffic.glb"},
  "ground.court": { kind: "box", material: "metal.green" },
  "building.greenhouse": { kind: "glb", url: "/assets/models/greenhouse.glb" },
  "building.civic": { kind: "glb", url: "/assets/models/civic.glb" },
  "prop.rock": { kind: "glb", url: "/assets/models/rock.glb" },
  "prop.shrub": { kind: "glb", url: "/assets/models/shrub.glb" },
  hero: { kind: "glb", url: "/assets/models/salvador.glb" },
  "building.hospital": { kind: "glb", url: "/assets/models/hospital.glb" },
  "building.school": { kind: "glb", url: "/assets/models/school.glb" },
  "building.factory": { kind: "glb", url: "/assets/models/factory.glb" },
  "tree.pine": { kind: "glb", url: "/assets/models/pine.glb" },
  "prop.lamp": { kind: "glb", url: "/assets/models/lamp.glb" },
  "prop.car.coral": { kind: "glb", url: "/assets/models/car-coral.glb" },
  "prop.car.gold": { kind: "glb", url: "/assets/models/car-gold.glb" },
  "prop.turbine": { kind: "glb", url: "/assets/models/turbine.glb" },
  "ground.wood": { kind: "box", material: "wood" },
  "ground.grass": { kind: "box", material: "grass.healthy" },
  "ground.asphalt": { kind: "box", material: "asphalt.default" },
  "ground.sidewalk": { kind: "box", material: "sidewalk.default" },
  "road.crossing": { kind: "box", material: "white" },
  "prop.fountain": {
    kind: "glb", url: "/assets/models/fountain.glb",
  },
  "prop.bench": { kind: "glb", url: "/assets/models/bench.glb" },
  "tree.default": { kind: "glb", url: "/assets/models/tree.glb" },
  "building.terracotta": {
    kind: "glb",
    url: "/assets/models/townhouse-coral.glb",
  },
  "building.cream": {
    kind: "glb",
    url: "/assets/models/townhouse-cream.glb",
  },
  "building.sage": {
    kind: "glb",
    url: "/assets/models/townhouse-sage.glb",
  },
  "access.step": {
    kind: "glb", url: "/assets/models/access-step.glb",
  },
  "access.ramp": {
    kind: "glb", url: "/assets/models/access-ramp.glb",
  },
  "access.temporary": {
    kind: "glb", url: "/assets/models/access-temporary.glb",
  },
  "waste.pile": { kind: "glb", url: "/assets/models/waste-pile.glb" },
  "waste.partial": { kind: "glb", url: "/assets/models/waste-partial.glb" },
  "waste.bin": { kind: "glb", url: "/assets/models/waste-bin.glb" },
};
export const materials: Record<string, MaterialAsset> = {
  track: {color:"#ce6754"},
  field: {color:"#6eb86b"},
  "wall.terracotta": { color: "#ce937a" },
  "wall.default": { color: "#ead7aa" },
  "wall.sage": { color: "#9ab8a5" },
  roof: { color: "#627b76" },
  window: { color: "#496b70" },
  "grass.healthy": { color: "#9bd17c" },
  "grass.dry": { color: "#bcb383" },
  "asphalt.default": { color: "#555866" },
  "asphalt.damaged": { color: "#727e78" },
  "sidewalk.default": { color: "#e5ddca" },
  "sidewalk.accessible": { color: "#c7d0b1" },
  wood: { color: "#bd946b" },
  leaf: { color: "#6f9366" },
  trunk: { color: "#93775e" },
  waste: { color: "#555e52" },
  "metal.green": { color: "#477967" },
  "hero.coat": { color: "#da8854" },
  skin: { color: "#b57b55" },
  hair: { color: "#463c32" },
  pants: { color: "#3b5659" },
  "water.clean": { color: "#22b9f0", roughness: 0.3 },
  "water.polluted": { color: "#87956c" },
  white: { color: "#f7efd9" },
};
export const mediaRegistry = {
  portrait: { label: "Salvador", initials: "S", url: null as string | null },
  sounds: {} as Record<string, string>,
  images: {} as Record<string, string>,
};

export const portraits: Record<string, string> = {
  "portrait.salvador.main": "/assets/portraits/salvador-cutout.png",
};
