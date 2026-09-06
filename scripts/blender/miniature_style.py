"""Original miniature city kit. Four finished facades, rounded moulded silhouettes.
Blender Z-up; glTF export converts to Y-up. No textures or external geometry.
"""
import bpy
import math
from mathutils import Vector

def models(api):
    box,cyl,ico,finish=(api[k] for k in ('box','cyl','ico','finish'))
    api['PALETTE'].update({
        'cream':'F5C45D','sage':'81BCDA','coral':'E97454','pink':'EDB199',
        'white':'F6F2E8','roof':'677583','roofdeck':'737A7F','glass':'7EC6E4',
        'glassdark':'31596D','trim':'F4E8D7','leaf':'299D61','leaflight':'6ABC59',
        'leafdeep':'168B67','trunk':'846047','metal':'526571','red':'E64B3B',
        'stone':'BCBAB0','dark':'344451','brick':'B95143','blue':'3089C7',
        'lawn':'9FD575','rubber':'26343D','signal':'FFC64B','concrete':'E5DDCA',
        'teal':'59B6A5','water':'22B9F0','soil':'8E795B','waste':'455453',
        'flower':'F697AB','wood':'C48C53',
    })
    def beam(name,a,b,r,color,segments=10):
        v=Vector(b)-Vector(a);o=cyl(name,(Vector(a)+Vector(b))/2,r,v.length,color,segments)
        o.rotation_euler=v.to_track_quat('Z','Y').to_euler();return o
    def label(value,p,size=.2,color='white'):
        bpy.ops.object.text_add(location=p);o=bpy.context.object;o.data.body=value;o.data.align_x='CENTER';o.data.size=size;o.data.extrude=.002;o.data.resolution_u=2
        o.rotation_euler.x=math.pi/2;bpy.ops.object.convert(target='MESH');finish(bpy.context.object,'sign '+value,color)
    def rounded(name,p,s,color):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=12,radius=1,location=p)
        o=bpy.context.object;o.scale=s;finish(o,name,color)
        for f in o.data.polygons:f.use_smooth=True
        return o
    def mesh(name,verts,faces,color):
        m=bpy.data.meshes.new(name);m.from_pydata(verts,[],faces);m.update()
        o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);return finish(o,name,color)
    def lathe(name,profile,color,p=(0,0,0),segments=20):
        verts=[(p[0]+r*math.cos(a*math.tau/segments),p[1]+r*math.sin(a*math.tau/segments),p[2]+z) for r,z in profile for a in range(segments)]
        faces=[(i*segments+j,i*segments+(j+1)%segments,(i+1)*segments+(j+1)%segments,(i+1)*segments+j) for i in range(len(profile)-1) for j in range(segments)]
        o=mesh(name,verts,faces,color)
        for f in o.data.polygons:f.use_smooth=True
        return o
    def transformed(fn,center=(0,0,0),angle=0):
        existing=set(bpy.context.scene.objects);fn();c,s=math.cos(angle),math.sin(angle)
        for o in set(bpy.context.scene.objects)-existing:
            x,y,z=o.location;o.location=(center[0]+c*x-s*y,center[1]+s*x+c*y,center[2]+z);o.rotation_euler.z+=angle
    def window(x,y,z,w=.38,h=.53,cross=False):
        box('recess surround',(x,y,z),(w+.09,.07,h+.09),'trim',.012)
        box('blue glazing',(x,y-.042,z),(w,.02,h),'glassdark')
        box('sky reflection',(x-w*.22,y-.055,z+.016),(w*.38,.008,h*.89),'glass')
        box('mullion',(x,y-.061,z),(.023,.023,h),'white')
        if cross:box('transom',(x,y-.062,z),(w,.023,.024),'white')
        box('stone sill',(x,y-.05,z-h/2-.047),(w+.13,.16,.045),'white',.009)
    def facades(w,d,fn):
        for span,depth,angle in [(w,d,0),(w,d,math.pi),(d,w,math.pi/2),(d,w,-math.pi/2)]:
            transformed(lambda:fn(span,depth),angle=angle)
    def roof(w,d,z,color='white'):
        box('roof slab',(0,0,z),(w+.08,d+.08,.09),'trim',.015)
        box('recessed roof',(0,0,z+.06),(w-.16,d-.16,.045),'roofdeck')
        for x in [-w/2,w/2]:
            box('parapet',(x,0,z+.16),(.105,d,.28),color,.018)
            box('coping',(x,0,z+.305),(.145,d+.1,.035),'trim',.009)
        for y in [-d/2,d/2]:
            box('parapet',(0,y,z+.16),(w,.105,.28),color,.018)
            box('coping',(0,y,z+.305),(w+.1,.145,.035),'trim',.009)
        box('roof access',(w*.22,d*.19,z+.22),(.45,.5,.32),color,.025)
        box('hatch',(w*.22,d*.19,z+.40),(.5,.55,.05),'white',.015)
        box('air conditioning',(-w*.22,d*.2,z+.18),(.43,.44,.22),'white',.025)
        for i in range(5):box('vent grille',(-w*.22-.14+i*.07,d*.2,z+.3),(.025,.33,.009),'metal')
        cyl('vent',(-w*.23,-d*.23,z+.16),.085,.21,'metal',12)
        cyl('vent cover',(-w*.23,-d*.23,z+.28),.12,.04,'white',12)
    def awning(x,y,z,color='red',w=.76):
        for i in range(6):
            sx=x-w/2+(i+.5)*w/6
            o=box('striped canopy',(sx,y-.24,z),(w/6,.52,.045),'white' if i%2 else color,.008);o.rotation_euler.x=-.26
            box('fabric valance',(sx,y-.49,z-.1),(w/6,.04,.14),'white' if i%2 else color,.015)
    def planter(x,y,length=.58):
        box('planter',(x,y,.12),(length,.31,.24),'white',.035)
        box('soil',(x,y,.248),(length-.07,.24,.018),'soil')
        for i in range(3):rounded('plant',(x-length*.27+i*length*.27,y,.32),(.16,.14,.15),'leaflight')
        for i in [-1,1]:rounded('flower',(x+i*length*.2,y-.04,.46),(.045,.045,.042),'flower')
    def townhouse(color,floors,shop=True):
        w,d=2.35,2.08;h=.25+floors*.77
        box('paving',(0,0,.065),(2.72,2.54,.13),'concrete',.035)
        box('stucco',(0,0,h/2+.13),(w,d,h),color,.035)
        box('foundation',(0,0,.24),(w+.035,d+.035,.2),'trim',.015)
        def facade(span,depth):
            for floor in range(floors):
                for x in [-span*.32,0,span*.32]:
                    if floor==0 and x==0:continue
                    window(x,-depth/2-.014,.66+floor*.77,.37,.47)
            box('door frame',(0,-depth/2-.04,.53),(.47,.07,.77),'white',.012)
            box('entry glass',(0,-depth/2-.085,.51),(.36,.025,.69),'glassdark')
            box('door handle',(.12,-depth/2-.107,.5),(.022,.02,.15),'white')
            if shop and span==w:
                for x in [-span*.32,span*.32]:awning(x,-depth/2-.04,1.05,'blue' if color=='cream' else 'red',.68)
            else:box('entry canopy',(0,-depth/2-.115,1.00),(.62,.23,.06),'white',.015)
        facades(w,d,facade);roof(w,d,h+.15,color)
        for x in [-.93,.93]:planter(x,-1.29,.38)
        for z in [1.45,2.22]:box('wall air conditioner',(w/2+.07,.64,z),(.2,.37,.22),'white',.018)
    def pitched(w,d,z,color='roof',rise=.65):
        mesh('gable walls',[(-w/2,-d/2,z),(w/2,-d/2,z),(0,-d/2,z+rise),(-w/2,d/2,z),(w/2,d/2,z),(0,d/2,z+rise)],[(0,1,2),(3,5,4)],'trim')
        for side in [-1,1]:
            length=math.sqrt((w/2+.14)**2+rise**2)
            o=box('pitched roof',(side*(w/4+.07),0,z+rise/2),(length,d+.28,.085),color,.023);o.rotation_euler.y=side*math.atan2(rise,w/2+.14)
        beam('ridge cap',(0,-d/2-.14,z+rise+.05),(0,d/2+.14,z+rise+.05),.045,color)
    def house(color='white',roofcolor='roof'):
        box('garden lot',(0,0,.025),(2.7,3.08,.05),'lawn',.055)
        box('house base',(0,0,.09),(2.1,1.92,.18),'concrete',.03)
        box('house walls',(0,0,.91),(2,1.8,1.7),color,.03);pitched(2,1.8,1.77,roofcolor,.68)
        facades(2,1.8,lambda w,d:[window(x,-d/2-.025,.97,.38,.6,True) for x in [-.61,.61]])
        window(0,-.92,1.92,.24,.3,True)
        box('front door',(0,-.94,.53),(.37,.065,.93),'teal',.015)
        box('porch floor',(0,-1.14,.09),(.85,.6,.18),'concrete',.03)
        box('porch canopy',(0,-1.18,1.5),(1,.63,.07),roofcolor,.025)
        for x in [-.42,.42]:box('porch post',(x,-1.43,.76),(.055,.055,1.42),'white',.01)
        box('chimney',(.6,.35,2.15),(.23,.28,.82),'brick',.02)
        box('chimney cap',(.6,.35,2.57),(.3,.35,.06),'white',.015)
        for x in [-1.24,1.24]:
            for y in [-1.3,-.9,-.5,-.1,.3,.7,1.1]:box('picket',(x,y,.27),(.055,.075,.5),'white',.01)
            for z in [.18,.38]:box('fence rail',(x,-.1,z),(.045,2.8,.045),'white')
        for x in [-.88,.88]:planter(x,-1.2,.47)
        box('front path',(0,-1.4,.035),(.57,.28,.02),'concrete')
        box('door knob',(.13,-.982,.55),(.035,.03,.035),'gold')
        for side in [-1,1]:
            beam('rain gutter',(side*1.14,-1.02,1.83),(side*1.14,1.02,1.83),.025,'white')
            beam('downpipe',(side*1.08,.83,.2),(side*1.08,.83,1.84),.022,'white')
            for y in [-.7,-.35,0,.35,.7]:beam('roof tile course',(0,y,2.5),(side*1.14,y,1.82),.01,roofcolor,6)
    def tree(light=False):
        beam('trunk',(0,0,0),(.025,.01,1.12),.072,'trunk')
        beam('branch',(.02,0,.7),(.24,.03,1.16),.035,'trunk')
        o=lathe('rounded canopy',[(.015,.69),(.3,.75),(.53,.97),(.56,1.23),(.45,1.43),(.43,1.68),(.32,1.91),(.25,2.11),(.1,2.26),(.005,2.29)],'leaflight' if light else 'leaf')
        mod=o.modifiers.new('soft canopy','SUBSURF');mod.levels=1;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    def shrub():
        rounded('hedge',(0,0,.23),(.48,.35,.30),'leaflight')
        rounded('hedge lobe',(.3,.02,.22),(.24,.3,.26),'leaf')
        for x in [-.25,0,.25]:rounded('bloom',(x,-.16,.45),(.055,.055,.055),'flower')
    def car(color='red'):
        box('chassis',(0,0,.20),(.77,1.69,.18),'dark',.055)
        box('body',(0,0,.35),(.83,1.82,.31),color,.085)
        mesh('glazed cabin',[(-.35,-.52,.49),(.35,-.52,.49),(-.35,.64,.49),(.35,.64,.49),(-.28,-.29,.80),(.28,-.29,.80),(-.28,.4,.80),(.28,.4,.80)],[(0,1,5,4),(2,6,7,3),(0,4,6,2),(1,3,7,5),(4,5,7,6)],'glassdark')
        box('roof',(0,.055,.81),(.62,.75,.07),color,.045)
        for side in [-1,1]:
            for y in [-.45,.07,.49]:box('window pillar',(side*.337,y,.62),(.025,.04,.27),color,.008)
            box('handle',(side*.419,.12,.43),(.018,.1,.02),'white')
            box('mirror',(side*.46,-.35,.57),(.14,.12,.07),color,.027)
            for y in [-.57,.57]:
                o=cyl('rubber tire',(side*.40,y,.22),.20,.13,'rubber',20);o.rotation_euler.y=math.pi/2
                o=cyl('alloy hub',(side*.472,y,.22),.102,.02,'white',16);o.rotation_euler.y=math.pi/2
        for y in [-.92,.92]:box('bumper',(0,y,.27),(.72,.04,.055),'white',.014)
        for x in [-.26,.26]:
            box('headlight',(x,-.914,.42),(.19,.02,.1),'white',.02)
            box('tail light',(x,.914,.42),(.18,.02,.10),'red',.015)
        box('grille',(0,-.926,.35),(.25,.02,.06),'dark')
    def lamp(traffic=False):
        cyl('foot',(0,0,.06),.085,.12,'metal',12)
        beam('post',(0,0,0),(0,0,2.08),.032,'metal')
        beam('crooked arm',(0,0,2.08),(.24,0,2.27),.025,'metal')
        beam('arm',(.24,0,2.27),(.52,0,2.27),.025,'metal')
        box('lamp housing',(.5,0,2.23),(.29,.13,.07),'white',.028)
        box('lamp diffuser',(.5,0,2.19),(.21,.085,.008),'signal')
        if traffic:
            for x in [0,.52]:
                box('signal',(x,-.04,1.97),(.14,.13,.4),'signal',.02)
                for z,c in [(1.85,'leaf'),(1.96,'signal'),(2.07,'red')]:
                    o=cyl('lens',(x,-.116,z),.038,.015,c,12);o.rotation_euler.x=math.pi/2
    def hospital():
        box('forecourt',(0,0,.06),(4.7,3.8,.12),'concrete',.05)
        box('main hospital',(0,.25,1.67),(4.1,2.6,3.2),'white',.045)
        def facade(w,d):
            for floor in range(3):
                for x in [-w*.36,-w*.21,-w*.07,w*.07,w*.21,w*.36]:window(x,-d/2-.015,.75+floor*.77,.31,.43)
        transformed(lambda:facades(4.1,2.6,facade),(0,.25,0))
        transformed(lambda:roof(4.1,2.6,3.31,'white'),(0,.25,0))
        box('entrance tower',(0,-1.18,1.91),(1.30,.7,3.65),'white',.035)
        box('vertical glass',(-.47,-1.545,1.45),(.23,.025,2.3),'glass')
        box('medical cross',(0,-1.552,2.82),(.18,.03,.67),'red',.012)
        box('medical cross',(0,-1.552,2.82),(.67,.03,.18),'red',.012)
        box('sliding door',(0,-1.553,.6),(.7,.03,1.05),'glassdark')
        box('entrance canopy',(0,-1.78,1.23),(1.7,1.0,.1),'white',.025)
        for x in [-.72,.72]:beam('canopy support',(x,-2.15,.1),(x,-2.15,1.22),.035,'metal')
        for x in [-1.68,1.68]:planter(x,-1.39,.63)
        label('HOSPITAL',(0,-1.56,2.26),.13,'metal')
        box('emergency signage',(0,-2.287,1.22),(1.25,.028,.08),'red')
        for side in [-1,1]:
            box('side medical cross',(side*2.077,-.35,2.84),(.025,.14,.5),'red')
            box('side medical cross',(side*2.077,-.35,2.84),(.025,.5,.14),'red')
    def school():
        box('school paving',(0,0,.06),(4.8,2.9,.12),'concrete',.035)
        box('brick school',(0,0,1.54),(4.4,2.25,2.96),'brick',.035)
        def facade(w,d):
            for z in [.68,1.5,2.32]:
                for x in [-w*.4,-w*.24,w*.24,w*.4]:window(x,-d/2-.02,z,.36,.51,True)
            box('masonry belt',(0,-d/2-.02,1.07),(w,.045,.045),'trim')
        facades(4.4,2.25,facade);roof(4.4,2.25,3.05,'brick')
        box('entry portico',(0,-1.17,1.6),(.88,.19,3.15),'trim',.018)
        box('school entry',(0,-1.28,.64),(.55,.025,1.13),'glassdark')
        o=cyl('clock face',(0,-1.285,2.75),.24,.035,'white',24);o.rotation_euler.x=math.pi/2
        box('clock hand',(0,-1.31,2.82),(.018,.018,.16),'dark')
        box('clock hand',(.06,-1.31,2.75),(.13,.018,.018),'dark')
        box('entrance cornice',(0,-1.23,3.23),(1.06,.35,.11),'white',.015)
        label('ESCOLA',(0,-1.29,1.29),.155,'metal')
        beam('school flagpole',(1.72,-1.32,.12),(1.72,-1.32,2.94),.019,'white')
        box('school pennant',(1.96,-1.32,2.73),(.48,.02,.3),'teal')
        for x in [-1.77,-.97,.97,1.77]:box('masonry detail',(x,-1.147,.23),(.19,.035,.085),'trim')
    def factory():
        box('industrial apron',(0,0,.055),(4.9,4.15,.11),'concrete',.025)
        box('warehouse',(0,0,1.07),(4.1,2.85,2.1),'stone',.035);pitched(4.1,2.85,2.12,'roof',.36)
        def front():
            for x in [-1.38,-.45,.45,1.38]:window(x,-1.44,1.46,.5,.32)
            for x in [-1.2,0,1.2]:
                box('loading door',(x,-1.448,.49),(.82,.04,.9),'metal')
                for z in [.18,.3,.42,.54,.66,.78]:box('roller shutter',(x,-1.474,z),(.79,.018,.015),'roof')
                box('dock',(x,-1.64,.12),(.95,.4,.24),'roof',.02)
        transformed(front);transformed(front,angle=math.pi)
        for x in [-1.15,1.15]:
            cyl('chimney footing',(x,.8,2.42),.29,.52,'brick',16)
            for i in range(7):cyl('stack',(x,.8,2.75+i*.32),.20,.32,'red' if i in [4,6] else 'white',20)
            cyl('open chimney',(x,.8,4.86),.15,.012,'dark',20)
        for x in [-1,0,1]:box('roof skylight',(x,-.35,2.42),(.48,.62,.10),'glassdark',.018)
        for side in [-1,1]:
            beam('service pipe',(side*2.1,.5,.3),(side*2.1,.5,1.7),.06,'metal')
            for y in [-1.2,1.2]:cyl('safety bollard',(side*2.2,y,.24),.055,.48,'signal',10)
            transformed(lambda:[window(y,-2.069,1.46,.48,.33) for y in [-.91,-.12,.8]],angle=side*math.pi/2)
            box('side air inlet',(side*2.09,-.32,.71),(.07,.69,.61),'metal')
            for z in [.48,.59,.7,.81,.92]:box('louver',(side*2.135,-.32,z),(.025,.65,.025),'white')
        label('LOGISTICA',(0,-1.485,1.91),.24,'metal')
    def civic():
        box('hall podium',(0,0,.1),(3.8,3,.2),'concrete',.04)
        box('civic hall',(0,0,1.25),(3.4,2.6,2.3),'trim',.035)
        facades(3.4,2.6,lambda w,d:[window(x,-d/2-.03,1.35,.4,.85,True) for x in [-w*.32,0,w*.32]])
        box('cornice',(0,0,2.46),(3.62,2.82,.13),'white',.02);pitched(3.5,2.7,2.49,'teal',.4)
        for x in [-1.32,-.66,.66,1.32]:
            cyl('column base',(x,-1.49,.19),.115,.18,'white',16)
            cyl('column',(x,-1.49,1.26),.073,2.05,'white',16)
            box('column capital',(x,-1.49,2.27),(.22,.23,.10),'white',.015)
        box('portico cornice',(0,-1.51,2.41),(3.3,.6,.16),'white',.02)
        box('cupola',(0,0,3.1),(1.15,1.15,1.1),'white',.025)
        facades(1.15,1.15,lambda w,d:window(0,-d/2-.02,3.18,.39,.56))
        lathe('green dome',[(.67,3.6),(.65,3.74),(.56,3.99),(.36,4.22),(.06,4.38),(0,4.4)],'teal',segments=24)
        beam('finial',(0,0,4.38),(0,0,4.67),.025,'gold');rounded('finial tip',(0,0,4.69),(.065,.065,.07),'gold')
        box('hall door',(0,-1.345,.62),(.56,.055,1.01),'teal',.015)
        for x in [-.11,.11]:box('hall handles',(x,-1.382,.6),(.025,.025,.17),'gold')
        label('PREFEITURA',(0,-1.818,2.38),.19,'metal')
    def greenhouse():
        box('greenhouse foundation',(0,0,.14),(3.1,2.8,.28),'concrete',.035)
        box('glasshouse',(0,0,.82),(2.8,2.45,1.4),'glass',.02)
        profile=[(math.cos(i*math.pi/12)*1.4,1.5+math.sin(i*math.pi/12)*.73) for i in range(13)]
        verts=[(x,y,z) for y in [-1.23,1.23] for x,z in profile]
        mesh('barrel glass',verts,[(i,i+1,i+14,i+13) for i in range(12)],'glass')
        for y in [-1.24,-.62,0,.62,1.24]:
            for i in range(12):beam('roof rib',(profile[i][0],y,profile[i][1]),(profile[i+1][0],y,profile[i+1][1]),.021,'white')
            for x in [-1.4,1.4]:beam('glasshouse upright',(x,y,.25),(x,y,1.51),.022,'white')
        for x in [-1.4,-.7,0,.7,1.4]:
            for y in [-1.25,1.25]:beam('end frame',(x,y,.25),(x,y,1.6),.023,'white')
        for z in [.65,1.12,1.5]:
            for x in [-1.42,1.42]:beam('horizontal frame',(x,-1.25,z),(x,1.25,z),.02,'white')
        box('greenhouse door',(0,-1.28,.74),(.63,.035,1.22),'glassdark')
        for x in [-.34,.34]:box('door frame',(x,-1.31,.75),(.045,.04,1.25),'white')
        box('door transom',(0,-1.31,1.39),(.72,.045,.055),'white')
        box('greenhouse handle',(.22,-1.327,.72),(.025,.025,.17),'white')
        for y in [-1.249,1.249]:
            for x in [-.95,-.48,0,.48,.95]:
                height=math.sqrt(max(0,1-(x/1.4)**2))*.73
                beam('arched end mullion',(x,y,1.5),(x,y,1.5+height),.018,'white')
        for side in [-1,1]:
            box('side vent',(side*1.43,.65,.92),(.04,.48,.38),'white')
            for z in [.8,.9,1]:box('vent slat',(side*1.457,.65,z),(.024,.4,.035),'metal')
        for x in [-1.65,1.65]:
            for y in [-.8,0,.8]:transformed(lambda:planter(0,0,.65),(x,y,0),math.pi/2)
    def turbine():
        lathe('tapered turbine',[(.19,0),(.14,.3),(.07,3.4)],'white',segments=16)
        rounded('nacelle',(0,.1,3.5),(.19,.4,.2),'white');rounded('hub',(0,-.31,3.5),(.16,.12,.16),'white')
        for a in [0,math.tau/3,2*math.tau/3]:
            verts=[(-.08,-.34,3.58),(.16,-.34,3.77),(.04,-.34,4.97),(-.035,-.34,4.97)]
            verts=[(x*math.cos(a)+(z-3.5)*math.sin(a),y,3.5-x*math.sin(a)+(z-3.5)*math.cos(a)) for x,y,z in verts]
            o=mesh('tapered blade',verts,[(0,1,2,3)],'white');solid=o.modifiers.new('blade thickness','SOLIDIFY');solid.thickness=.035;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=solid.name)
    def bench():
        for y in [-.48,.48]:
            for x in [-.15,.15]:beam('bench leg',(x,y,.05),(x,y,.51),.035,'metal')
            beam('armrest',(-.24,y,.7),(.24,y,.7),.025,'metal');beam('arm support',(-.2,y,.5),(-.2,y,.7),.025,'metal')
        for x in [-.17,-.055,.06,.175]:box('seat slat',(x,0,.54),(.095,1.35,.065),'wood',.018)
        for z in [.73,.85,.97]:box('back slat',(.23,0,z),(.065,1.35,.095),'wood',.018)
        for y in [-.49,.49]:beam('back support',(.23,y,.49),(.23,y,1.01),.024,'metal')
    def fountain():
        lathe('stone basin',[(0,.38),(.83,.38),(.89,.45),(.89,.65),(.83,.69),(.72,.69),(.72,.49),(0,.49)],'concrete',segments=32)
        cyl('pool',(0,0,.59),.74,.015,'water',32)
        lathe('fountain stem',[(.22,.58),(.15,.72),(.1,1.0),(.21,1.06),(.32,1.08),(.33,1.16),(.28,1.18),(.08,1.13)],'white',segments=24)
        cyl('upper pool',(0,0,1.15),.275,.016,'water',24);beam('water jet',(0,0,1.17),(0,0,1.51),.025,'glass')
        rounded('water tip',(0,0,1.51),(.045,.045,.055),'glass')
        for a in [0,math.pi/2,math.pi,math.pi*1.5]:
            points=[(math.cos(a)*i*.056,math.sin(a)*i*.056,1.43-.035*(i-1)**2) for i in range(7)]
            for p,q in zip(points,points[1:]):beam('water arc',p,q,.014,'glass',8)
    def ramp(temporary=False):
        # High end Blender +Y becomes Three -Z. Keep existing gameplay footprint.
        mesh('ramp',[(-.85,-.8,0),(.85,-.8,0),(-.85,.8,0),(.85,.8,0),(-.85,.8,.36),(.85,.8,.36)],[(0,1,5,4),(0,4,2),(1,3,5),(2,4,5,3),(0,2,3,1)],'wood' if temporary else 'concrete')
        if temporary:
            for i in range(10):
                y=-.72+i*.15;box('wood board seam',(0,y,(y+.8)*.225+.008),(1.68,.018,.009),'soil')
            for x in [-1.12,1.12]:
                box('cone base',(x,-.5,.025),(.28,.28,.05),'dark',.02)
                lathe('safety cone',[(.12,.04),(.09,.19),(.055,.4),(.025,.46)],'orange',(x,-.5,0),12)
                cyl('cone band',(x,-.5,.29),.075,.075,'white',12)
        else:
            for x in [-.95,.95]:
                for y in [-.68,.62]:
                    z=(y+.8)*.225;beam('ramp railing post',(x,y,z),(x,y,z+.53),.023,'metal')
                beam('ramp handrail',(x,-.8,.53),(x,.8,.89),.029,'teal')
            for x in [-.7,-.35,0,.35,.7]:
                for y in [.53,.63]:cyl('tactile stud',(x,y,.225*(y+.8)+.015),.035,.012,'signal',10)
    def step():
        box('raised curb',(0,0,0),(1.8,1,.36),'concrete',.025)
        box('edge stripe',(0,-.43,.19),(1.76,.12,.02),'signal')
        for x in [-.6,0,.6]:box('paving joint',(x,0,.184),(.012,.98,.005),'stone')
    def trash(partial=False):
        for i in range(2 if partial else 6):
            x=(i%3)*.43-.4;y=(i//3)*.43
            rounded('tied rubbish bag',(x,y,.23),(.27,.23,.3),'waste')
            rounded('bag neck',(x,y,.52),(.075,.068,.075),'waste');box('bag tie',(x,y,.5),(.13,.08,.025),'metal',.01)
        if not partial:
            box('cardboard',(.57,-.32,.13),(.32,.28,.25),'wood',.025)
            for x,y in [(-.38,-.36),(.18,-.38)]:box('discarded paper',(x,y,.015),(.19,.16,.013),'white')
    def bin():
        box('bin body',(0,0,.46),(.65,.62,.8),'teal',.055)
        box('hinged lid',(0,0,.9),(.73,.7,.12),'leafdeep',.04)
        box('opening',(0,-.334,.72),(.43,.025,.17),'dark',.035)
        box('recycling label',(0,-.328,.43),(.25,.012,.23),'white',.025)
        for x in [-.26,.26]:
            o=cyl('bin wheel',(x,.2,.08),.09,.06,'rubber',14);o.rotation_euler.y=math.pi/2
        for a in [0,math.tau/3,2*math.tau/3]:box('recycle symbol',(math.sin(a)*.065,-.342,.43+math.cos(a)*.065),(.05,.01,.045),'leafdeep')
    def hero():
        for x in [-.12,.12]:
            beam('trousers',(x,0,.13),(x,0,.61),.09,'pants',14);box('shoe',(x,-.055,.09),(.2,.32,.15),'dark',.05)
        rounded('jacket',(0,0,.87),(.29,.19,.39),'orange');box('t shirt',(0,-.183,.92),(.17,.025,.43),'white',.025)
        cyl('neck',(0,0,1.2),.075,.2,'skin',14);rounded('face',(0,-.01,1.4),(.21,.18,.255),'skin')
        for x in [-.215,.215]:rounded('ear',(x,0,1.4),(.047,.044,.073),'skin')
        for x,y,z,s in [(-.13,0,1.58,.13),(0,-.06,1.64,.14),(.13,0,1.59,.12),(-.06,.1,1.56,.14),(.11,.11,1.52,.12)]:rounded('hair curl',(x,y,z),(s,s,s),'hair')
        for x in [-.075,.075]:rounded('eye',(x,-.183,1.43),(.016,.012,.022),'dark')
        rounded('nose',(0,-.19,1.36),(.038,.04,.045),'skin')
        for side in [-1,1]:
            beam('sleeve',(side*.24,0,1.07),(side*.34,-.015,.73),.077,'orange',14);rounded('hand',(side*.35,-.015,.67),(.067,.073,.1),'skin')
        box('backpack',(0,.22,.87),(.35,.17,.45),'wood',.065)
        for x in [-.19,.19]:beam('bag strap',(x,-.17,.65),(x,-.15,1.12),.024,'wood')
    def rock():
        ico('river rock',(0,0,.19),(.49,.36,.29),'stone',1);ico('small rock',(.35,.1,.09),(.2,.2,.16),'roofdeck',1)
    def bridge():
        box('bridge deck',(0,0,.18),(3.8,1.85,.30),'concrete',.035)
        box('bridge asphalt',(0,0,.342),(3.8,1.43,.022),'roofdeck')
        for x in [-1.25,1.25]:box('bridge pier',(x,0,-.1),(.3,1.5,.55),'stone',.03)
        for side in [-1,1]:
            box('walkway',(0,side*.81,.36),(3.8,.2,.09),'white',.02)
            for x in [-1.8,-1.2,-.6,0,.6,1.2,1.8]:beam('bridge upright',(x,side*.89,.39),(x,side*.89,.91),.022,'metal')
            for z in [.65,.9]:beam('bridge railing',(-1.9,side*.89,z),(1.9,side*.89,z),.025,'white')
        for x in [-1.4,-.5,.4,1.3]:box('bridge centre line',(x,0,.357),(.48,.04,.008),'white')
    def court():
        box('court border',(0,0,.025),(4.3,2.55,.05),'concrete',.035)
        box('blue sport surface',(0,0,.06),(4,2.25,.03),'blue',.02)
        for side in [-1,1]:
            box('painted key',(side*1.45,0,.079),(.78,.82,.009),'red')
            box('sideline',(0,side*1.02,.08),(3.76,.025,.01),'white')
            box('end line',(side*1.88,0,.08),(.025,2.06,.01),'white')
            box('backboard',(side*1.8,0,.76),(.035,.39,.28),'white',.009)
            beam('hoop support',(side*2.02,0,.06),(side*2.02,0,.86),.025,'metal')
            beam('backboard arm',(side*2.02,0,.83),(side*1.8,0,.83),.023,'metal')
            cx=side*1.66
            for i in range(16):
                a=i*math.tau/16;b=(i+1)*math.tau/16
                beam('basket rim',(cx+math.cos(a)*.095,math.sin(a)*.095,.69),(cx+math.cos(b)*.095,math.sin(b)*.095,.69),.009,'red',6)
        box('half court',(0,0,.08),(.025,2.06,.01),'white')
        for i in range(32):
            a=i*math.tau/32;b=(i+1)*math.tau/32
            beam('centre circle',(math.cos(a)*.35,math.sin(a)*.35,.08),(math.cos(b)*.35,math.sin(b)*.35,.08),.012,'white',6)
        for side in [-1,1]:
            for x in [-2,-1,0,1,2]:beam('fence post',(x,side*1.22,.03),(x,side*1.22,1.0),.018,'metal')
            for z in [.25,.5,.75,1]:beam('fence wire',(-2,side*1.22,z),(2,side*1.22,z),.007,'metal',6)
            for i in range(21):beam('fence wire',(-2+i*.2,side*1.22,.06),(-2+i*.2,side*1.22,1),.006,'metal',6)
    return {
        'townhouse-sage':lambda:townhouse('sage',5),'townhouse-coral':lambda:townhouse('coral',5),
        'townhouse-cream':lambda:townhouse('cream',4),'townhouse-pink':lambda:townhouse('pink',4,False),
        'house-cream':lambda:house('white','roof'),'house-coral':lambda:house('cream','red'),
        'tree':tree,'pine':lambda:tree(True),'shrub':shrub,'car-coral':car,'car-gold':lambda:car('gold'),
        'car-blue':lambda:car('blue'),'car-white':lambda:car('white'),'lamp':lamp,'traffic':lambda:lamp(True),
        'hospital':hospital,'school':school,'factory':factory,'civic':civic,'greenhouse':greenhouse,
        'turbine':turbine,'bench':bench,'fountain':fountain,'access-step':step,'access-ramp':ramp,
        'access-temporary':lambda:ramp(True),'waste-pile':trash,'waste-partial':lambda:trash(True),
        'waste-bin':bin,'salvador':hero,'rock':rock,'bridge':bridge,'court':court,
    }
