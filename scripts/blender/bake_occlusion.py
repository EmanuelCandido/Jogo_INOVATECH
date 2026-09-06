"""Deterministic short-range ambient occlusion baked to a glTF vertex attribute.
Adds depth at joints without a runtime postprocessing pass or image textures.
"""
import math
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def bake(objects):
    verts=[];faces=[]
    for obj in objects:
        offset=len(verts)
        verts.extend(obj.matrix_world @ v.co for v in obj.data.vertices)
        faces.extend(tuple(offset+i for i in p.vertices) for p in obj.data.polygons)
    bvh=BVHTree.FromPolygons(verts,faces)
    samples=12;radius=.38;cache={}
    rays=[]
    for i in range(samples):
        z=math.sqrt((i+.5)/samples);r=math.sqrt(1-z*z);a=i*2.399963229728653
        rays.append(Vector((r*math.cos(a),r*math.sin(a),z)))
    for obj in objects:
        attr=obj.data.color_attributes.new(name='miniatureAO',type='BYTE_COLOR',domain='CORNER')
        normals=obj.data.corner_normals
        normal_matrix=obj.matrix_world.to_3x3().inverted().transposed()
        colors=[]
        for loop in obj.data.loops:
            p=obj.matrix_world @ obj.data.vertices[loop.vertex_index].co
            n=(normal_matrix @ normals[loop.index].vector).normalized()
            key=tuple(round(v,4) for v in (*p,*n))
            value=cache.get(key)
            if value is None:
                rotation=Vector((0,0,1)).rotation_difference(n)
                origin=p+n*.006;blocked=0
                for ray in rays:
                    hit,_,_,distance=bvh.ray_cast(origin,rotation @ ray,radius)
                    if hit is not None:blocked+=1-distance/radius
                value=1-.46*blocked/samples
                cache[key]=value
            colors.extend((value,value,value,1))
        attr.data.foreach_set('color',colors)
