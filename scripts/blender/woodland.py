"""Compact woodland kit: overlapping crowns, simple smooth toy-like silhouettes."""
import math
import bpy
from mathutils import Vector

def models(api):
    cyl,ico,finish=(api[k] for k in ('cyl','ico','finish'))
    api['PALETTE'].update({'birch':'E9E4C8','oakleaf':'25845C','mapleleaf':'55AA60','firleaf':'228875'})
    def branch(a,b,r=.06,color='trunk'):
        v=Vector(b)-Vector(a);o=cyl('branch',(Vector(a)+Vector(b))/2,r,v.length,color,8)
        o.rotation_euler=v.to_track_quat('Z','Y').to_euler()
    def crown(p,s,color):
        o=ico('rounded crown',p,s,color,2)
        for f in o.data.polygons:f.use_smooth=True
    def broadleaf(light=False):
        branch((0,0,0),(.03,0,1.7),.1)
        for i in range(4):
            a=i*math.tau/4+.35;x,y=math.cos(a)*.56,math.sin(a)*.53
            branch((0,0,.85),(x,y,1.64),.046)
            crown((x,y,1.8+(i%2)*.18),(.62,.61,.89) if light else (.74,.70,.77),'mapleleaf' if light else 'oakleaf')
        crown((.03,.08,2.68 if light else 2.4),(.66,.65,1.02) if light else (.83,.78,.89),'leaflight' if light else 'leaf')
        for i in range(3):
            a=i*math.tau/3;branch((0,0,.17),(.23*math.cos(a),.23*math.sin(a),.035),.035)
    def birch():
        for x,y,h in [(-.16,0,2.1),(.22,.08,2.55)]:
            branch((x,y,0),(x+.06,y,h),.06,'birch')
            for z in [.3,.6,1,1.3]:
                o=cyl('birch bark',(x+.03,y,z),.062,.027,'trunk',8)
            branch((x,y,1),(x-.3,y+.1,1.9),.025,'birch')
            crown((x-.27,y+.07,1.91),(.59,.57,.65),'mapleleaf')
            crown((x+.12,y,2.54),(.63,.62,.87),'leaflight')
    def fir():
        branch((0,0,0),(0,0,2.9),.09)
        for r,z,h in [(1,.99,1.0),(.83,1.59,1.12),(.6,2.14,1.1),(.34,2.69,.9)]:
            bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=r,radius2=.05,depth=h,location=(0,0,z))
            o=finish(bpy.context.object,'layered fir crown','firleaf')
            for p in o.data.polygons:p.use_smooth=True
    def thicket():
        for i,(x,y,h) in enumerate([(-.4,-.13,1.1),(.38,.17,1.5),(0,.46,.86)]):
            branch((x,y,0),(x,y,h),.045)
            crown((x,y,h),(.59,.56,.72),'mapleleaf' if i%2 else 'leaf')
            crown((x+.13,y,h+.4),(.41,.42,.53),'leaflight' if i%2 else 'leaf')
    return {'tree-oak':broadleaf,'tree-maple':lambda:broadleaf(True),'tree-birch':birch,'tree-fir':fir,'tree-thicket':thicket}
