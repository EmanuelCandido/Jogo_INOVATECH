"""Recognisable situation props, replacing unlabelled cubes, discs and solid pipes."""
import math
import bpy
from mathutils import Vector

def models(api):
    box,cyl,ico,finish=(api[k] for k in ('box','cyl','ico','finish'))
    def beam(name,a,b,r,color='metal',n=8):
        v=Vector(b)-Vector(a);o=cyl(name,(Vector(a)+Vector(b))/2,r,v.length,color,n);o.rotation_euler=v.to_track_quat('Z','Y').to_euler();return o
    def ring(name,p,r,t=.012,color='white',axis='Z'):
        bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=t,major_segments=24,minor_segments=6,location=p);o=finish(bpy.context.object,name,color)
        if axis=='Y':o.rotation_euler.x=math.pi/2
    def label(value,p,size=.1,color='white'):
        bpy.ops.object.text_add(location=p);o=bpy.context.object;o.data.body=value;o.data.align_x='CENTER';o.data.size=size;o.data.extrude=.001;o.data.resolution_u=2
        o.rotation_euler.x=math.pi/2;bpy.ops.object.convert(target='MESH');finish(bpy.context.object,'sign '+value,color)
    def stump():
        cyl('stump bark',(0,0,.2),.26,.4,'trunk',14);cyl('sawn timber',(0,0,.405),.232,.015,'sand',20)
        for r in [.07,.14,.205]:ring('growth ring',(0,0,.417),r,.006,'wooddark')
        for i in range(9):
            a=i*math.tau/9;beam('bark furrow',(.26*math.cos(a),.26*math.sin(a),.06),(.26*math.cos(a+.04),.26*math.sin(a+.04),.37),.009,'wooddark',6)
        for i in range(4):
            a=i*math.tau/4;beam('cut tree root',(.15*math.cos(a),.15*math.sin(a),.17),(.37*math.cos(a),.37*math.sin(a),.018),.039,'trunk')
    def outfall():
        # Hollow tube, including annular end faces and a dark recessed interior.
        verts=[];n=24
        for y,r in [(-.75,.33),(.65,.33),(-.75,.247),(.65,.247)]:
            verts.extend((r*math.cos(i*math.tau/n),y,.13+r*math.sin(i*math.tau/n)) for i in range(n))
        faces=[]
        for i in range(n):
            j=(i+1)%n;faces.extend([(i,j,n+j,n+i),(2*n+j,2*n+i,3*n+i,3*n+j),(i,2*n+i,2*n+j,j),(n+j,3*n+j,3*n+i,n+i)])
        m=bpy.data.meshes.new('hollow drainage tube');m.from_pydata(verts,[],faces);m.update();o=bpy.data.objects.new('hollow drainage tube',m);bpy.context.collection.objects.link(o);finish(o,'concrete outfall','stone')
        o=cyl('recessed pipe shadow',(0,.46,.13),.245,.01,'dark',24);o.rotation_euler.x=math.pi/2
        for y in [-.71,.25]:ring('pipe socket collar',(0,y,.13),.335,.032,'concrete',axis='Y')
        for x in [-.49,.49]:box('outfall wing wall',(x,-.42,-.03),(.21,.73,.64),'concrete',.035)
        box('outfall apron',(0,-.80,-.26),(1.15,.45,.10),'concrete',.025)
        for x in [-.16,0,.16]:beam('coarse debris screen',(x,-.79,-.055),(x,-.79,.315),.009,'metal',6)
    def information():
        box('sign foundation',(0,0,.035),(.25,.2,.07),'concrete')
        beam('sign post',(0,0,.06),(0,0,1.26),.032)
        box('framed information board',(0,-.01,1.06),(.63,.065,.48),'white',.025)
        box('blue sign face',(0,-.05,1.06),(.565,.02,.415),'navy',.025)
        label('i',(0,-.067,1.07),.28)
        for z,w in [(.94,.36),(.875,.27)]:box('information line',(0,-.064,z),(w,.008,.018),'white')
        for x in [-.255,.255]:
            for z in [.88,1.24]:
                o=cyl('sign fixing',(x,-.067,z),.01,.008,'metal',8);o.rotation_euler.x=math.pi/2
    def thermometer():
        box('temperature monitor base',(0,0,.035),(.45,.33,.07),'concrete',.03)
        beam('thermometer pedestal',(0,0,.05),(0,0,.52),.043)
        box('weather monitor housing',(0,0,.88),(.42,.13,.91),'white',.05)
        box('thermometer recess',(-.06,-.077,.92),(.14,.016,.69),'navy',.02)
        o=cyl('red thermometer bulb',(-.06,-.092,.66),.073,.02,'red',16);o.rotation_euler.x=math.pi/2
        box('mercury column',(-.06,-.095,.94),(.032,.015,.51),'red')
        for i in range(7):box('temperature tick',(.083,-.082,.73+i*.075),(.09 if i%2==0 else .06,.017,.014),'metal')
        label('38 C',(0,-.089,1.23),.09,'red')
    def assistance():
        box('assistance plinth',(0,0,.04),(.62,.53,.08),'concrete',.03)
        box('emergency kiosk',(0,0,.72),(.45,.36,1.32),'teal',.045)
        box('kiosk fascia',(0,-.19,.88),(.35,.026,.76),'white',.02)
        box('video screen',(0,-.211,1.03),(.27,.016,.21),'navy')
        for z in [.77,.82,.87]:box('speaker slot',(0,-.211,z),(.24,.018,.018),'metal')
        o=cyl('help button',(0,-.216,.64),.065,.018,'red',20);o.rotation_euler.x=math.pi/2
        label('SOS',(0,-.198,1.23),.13)
        box('solar rain cap',(0,0,1.42),(.59,.53,.065),'navy',.02)
        for x in [-.15,0,.15]:box('solar cell seam',(x,0,1.458),(.012,.44,.008),'glass')
        for x in [-.14,.14]:box('night reflector',(x,-.189,.34),(.055,.018,.19),'signal')
    def shelter():
        box('wildlife shelter pad',(0,0,.015),(2.20,2.60,.03),'sand',.08)
        for side in [-1,1]:
            for i in range(8):box('enclosure picket',(side*1.06,-1.23+i*.35,.32),(.055,.075,.6),'wood')
            for z in [.20,.45]:beam('enclosure rail',(side*1.06,-1.23,z),(side*1.06,1.23,z),.025,'woodlight')
        for i in range(9):box('back fence picket',(-1.06+i*.265,1.23,.32),(.065,.055,.6),'wood')
        for z in [.2,.45]:beam('back enclosure rail',(-1.06,1.23,z),(1.06,1.23,z),.025,'woodlight')
        for x in [-.43,.43]:box('access gate jamb',(x,-1.23,.35),(.08,.08,.68),'wooddark')
        for a,b in [(-1.06,-.43),(.43,1.06)]:
            for z in [.2,.45]:beam('gate flank',(a,-1.23,z),(b,-1.23,z),.025,'woodlight')
        for x in [-.48,.48]:box('shelter wall',(x,.52,.4),(.075,.70,.75),'woodlight')
        box('shelter rear wall',(0,.85,.4),(.96,.065,.75),'woodlight')
        for side in [-1,1]:
            o=box('pitched shelter roof',(side*.27,.5,.88),(.62,.91,.075),'teal',.015);o.rotation_euler.y=side*.36
        box('shelter bedding',(0,.51,.09),(.80,.56,.10),'wood')
        cyl('water bowl',(.65,-.55,.10),.16,.14,'metal',16);cyl('drinking water',(.65,-.55,.176),.13,.008,'water',16)
        box('animal care sign',(-.73,-1.265,.47),(.46,.03,.2),'teal');label('ABRIGO',(-.73,-1.286,.43),.09)
    return {'tree-stump':stump,'river-outfall':outfall,'information-sign':information,'thermometer':thermometer,'assistance-kiosk':assistance,'wildlife-shelter':shelter}
