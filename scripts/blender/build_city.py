"""Original modular EcoQuest assets. Run with Blender --background --python this_file."""
import bpy, math, os, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets-source' / 'raw'
OUT.mkdir(parents=True, exist_ok=True)
PALETTE = {
 'cream':'EEDBB2','sage':'82B59E','coral':'D98A65','white':'F7EFDB','roof':'567B77',
 'glass':'79BECE','glassdark':'356C83','solar':'315D82','gold':'E8B85C','wood':'A97950',
 'leaf':'72A150','leaflight':'A5BF62','trunk':'8A6A48','road':'657B80','metal':'3E6568',
 'red':'D96755','skin':'B88059','hair':'392E27','pants':'345C64','orange':'D6874D',
 'stone':'ADB6A7','dark':'495C5B','flower':'E8AE9F'
}
def mat(key):
 name='eco.'+key
 m=bpy.data.materials.get(name)
 if m:return m
 m=bpy.data.materials.new(name);h=PALETTE[key]
 srgb=[int(h[i:i+2],16)/255 for i in (0,2,4)]
 c=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in srgb]
 m.diffuse_color=(*c,1);m.use_nodes=True
 # Blender 5.2 may create an empty node tree; do not depend on default node names
 # (which also vary with the installed UI language).
 nodes=m.node_tree.nodes
 bs=next((n for n in nodes if n.type=='BSDF_PRINCIPLED'),None) or nodes.new('ShaderNodeBsdfPrincipled')
 output=next((n for n in nodes if n.type=='OUTPUT_MATERIAL'),None) or nodes.new('ShaderNodeOutputMaterial')
 m.node_tree.links.new(bs.outputs['BSDF'],output.inputs['Surface'])
 bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Roughness'].default_value=.78
 return m
def finish(o,name,color):
 o.name=name;o.data.materials.append(mat(color));return o
def box(name,loc,size,color,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 # Tiny trim, stripes and glazing stay planar: bevels there add thousands of
 # invisible triangles. Keep rounded silhouettes on the actual model masses.
 if bevel and min(size) > .08:
  mod=o.modifiers.new('soft edges','BEVEL');mod.width=bevel;mod.segments=2
  bpy.ops.object.modifier_apply(modifier=mod.name)
  for p in o.data.polygons:p.use_smooth=True
  mod=o.modifiers.new('face weighted normals','WEIGHTED_NORMAL');mod.keep_sharp=True;mod.weight=50
  bpy.ops.object.modifier_apply(modifier=mod.name)
 return finish(o,name,color)
def cyl(name,loc,r,depth,color,vertices=12):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc);return finish(bpy.context.object,name,color)
def ico(name,loc,scale,color,sub=1):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc);o=bpy.context.object;o.scale=scale;return finish(o,name,color)
def reset():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def export(name):
 # Join by material: few draw calls per model, still reusable/instantiable by mesh.
 for color in PALETTE:
  meshes=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials and o.data.materials[0].name=='eco.'+color]
  if len(meshes)<2:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in meshes:o.select_set(True)
  bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join()
  bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
 from bake_occlusion import bake
 bpy.context.view_layer.update()
 bake([o for o in bpy.context.scene.objects if o.type=='MESH'])
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets-source'/f'{name}.blend'))
 bpy.ops.export_scene.gltf(filepath=str(OUT/f'{name}.glb'),export_format='GLB',export_yup=True,export_animations=False,export_vertex_color='NAME',export_vertex_color_name='miniatureAO')
sys.path.insert(0,str(Path(__file__).parent))
from miniature_style import models as reference_models
asset_models=reference_models(globals())
from coastal_expansion import models as coastal_models
new_models=coastal_models(globals())
from woodland import models as woodland_models
new_models.update(woodland_models(globals()))
from port_details import models as port_models
new_models.update(port_models(globals()))
asset_models.update(new_models)
from finish_catalog import models as finished_models
asset_models=finished_models(globals(),asset_models)
from public_spaces import models as public_models
asset_models.update(public_models(globals()))
from situation_kit import models as situation_models
asset_models.update(situation_models(globals()))
if '--expansion-only' in sys.argv:
 asset_models=new_models
if '--only' in sys.argv:
 selected=sys.argv[sys.argv.index('--only')+1].split(',')
 asset_models={k:v for k,v in asset_models.items() if k in selected}
for name,fn in asset_models.items():
 reset();fn();export(name)
print('ECOQUEST: modular assets exported to',OUT)
