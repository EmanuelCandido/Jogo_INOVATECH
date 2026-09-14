"""Mixed industrial refuse for the dump, authored via Blender MCP."""
import math
import random
import bpy

def models(api):
    box,ico=api['box'],api['ico']
    api['FUTURE_LOD_MODELS'].add('industrial-waste')
    def pile():
        rng=random.Random(812)
        low=api.get('LOW_DETAIL',False)
        # Broken aggregate supports the boards, tiles and discarded fittings.
        for i in range(24 if low else 40):
            a=i*2.399963;r=.48*math.sqrt(rng.random())
            x,y=math.cos(a)*r,math.sin(a)*r
            z=.055+(.43-r)*.38
            o=ico('broken concrete',(x,y,z),(.10+rng.random()*.07,.07+rng.random()*.08,.05+rng.random()*.06),'rubble',1)
            o.rotation_euler=(rng.random(),rng.random(),a)
        for i in range(7):
            a=i*1.17;x=math.cos(a)*.30;y=math.sin(a)*.25
            o=box('chipped brick',(x,y,.13),(.24,.13,.10),'rust',.012)
            o.rotation_euler=(.15,-.12,a)
        for i in range(5):
            a=i*.74
            o=box('splintered pallet plank',(-.25+i*.10,.07,.24+i*.021),(.095,.75-i*.045,.035),'wood',.005)
            o.rotation_euler=(.06*i,-.10,a)
        for i in range(3):
            o=box('bent sheet panel',(.27-i*.16,-.18,.23+i*.046),(.26,.32,.018),'metal')
            o.rotation_euler=(.3-i*.12,.17,i*.58)
        bpy.ops.mesh.primitive_torus_add(major_radius=.135,minor_radius=.047,major_segments=12 if low else 24,minor_segments=6 if low else 8,location=(-.27,-.28,.16),rotation=(.36,.24,.3))
        api['finish'](bpy.context.object,'discarded tyre','rubber')
        for p in bpy.context.object.data.polygons:p.use_smooth=True
        for i in range(4):
            o=box('creased packaging',(.31-i*.15,.30,.10+i*.026),(.20,.16,.045),'cream',.009)
            o.rotation_euler=(.2,.1,i*.65)
    return {'industrial-waste':pile}
