"""Small sculpted crown irregularities and pinnate palm leaves.

Fine grain is shaded in object space by the game; these meshes supply the
silhouette and tangible folds that a surface shader cannot change.
"""
import math
import bpy
from mathutils import Vector

def wrap(api,builders):
    names={'tree','pine','tree-oak','tree-maple','tree-birch','tree-fir','tree-thicket','shrub','tree-blossom','tree-rooftop','tree-palm'}
    leaf_materials={'eco.leaf','eco.leaflight','eco.oakleaf','eco.mapleleaf','eco.firleaf','eco.flower','eco.petal','eco.bloomshade'}
    def leaf(name,a,b,width,color):
        a,b=Vector(a),Vector(b);axis=b-a
        side=axis.cross(Vector((0,0,1))).normalized()*width
        mid=a+axis*.48;ridge=mid+Vector((0,0,.014))
        mesh=bpy.data.meshes.new(name)
        mesh.from_pydata([a,mid+side,b,mid-side,ridge],[],[(0,1,4),(1,2,4),(2,3,4),(3,0,4),(1,0,3,2)])
        mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);api['finish'](o,name,color)
    def polish(name):
        for o in list(bpy.context.scene.objects):
            if o.type!='MESH' or not any(m.name in leaf_materials for m in o.data.materials):continue
            if 'frond' in o.name or 'midrib' in o.name:continue
            # Preserve trunk/branch placement and keep high/low envelopes close.
            if len(o.data.vertices)<30:continue
            for v in o.data.vertices:
                p=v.co
                ripple=math.sin(p.x*21+p.y*11)*math.cos(p.z*17-p.y*9)
                v.co*=1+.022*ripple
            o.data.update()
        if name=='tree-palm':
            for i in range(9):
                a=i*math.tau/9;radial=Vector((math.cos(a),math.sin(a),0));across=Vector((-math.sin(a),math.cos(a),0))
                for j in range(1,8):
                    t=.11+j*.095;point=Vector((.125,0,2.23))+radial*(t*1.05)+Vector((0,0,math.sin(t*math.pi)*.4-t*.15))
                    for side in [-1,1]:
                        tip=point+across*(side*math.sin(t*math.pi)*.22)+radial*.105+Vector((0,0,-.05))
                        leaf('folded palm leaflet',point,tip,.024,'leaflight' if (i+j)%3 else 'leaf')
    def decorate(name,fn):
        def build():
            fn()
            if not api.get('LOW_DETAIL'):polish(name)
        return build
    return {name:decorate(name,fn) if name in names else fn for name,fn in builders.items()}
