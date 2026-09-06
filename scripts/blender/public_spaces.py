"""Complete public-space assemblies. Gate openings are deliberate, framed and paved."""
import math
import bpy
from mathutils import Vector

def models(api):
    box,cyl,ico,finish=(api[k] for k in ('box','cyl','ico','finish'))
    def beam(name,a,b,r,color='metal',n=8):
        v=Vector(b)-Vector(a);o=cyl(name,(Vector(a)+Vector(b))/2,r,v.length,color,n);o.rotation_euler=v.to_track_quat('Z','Y').to_euler();return o
    def ball(name,p,s,color):
        o=ico(name,p,s,color,2)
        for f in o.data.polygons:f.use_smooth=True
        return o
    def mesh(name,v,f,color):
        m=bpy.data.meshes.new(name);m.from_pydata(v,[],f);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);return finish(o,name,color)
    def ring(name,p,r,t=.012,color='white',axis='Z',segments=24):
        bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=t,major_segments=segments,minor_segments=6,location=p);o=finish(bpy.context.object,name,color)
        if axis=='Y':o.rotation_euler.x=math.pi/2
        if axis=='X':o.rotation_euler.y=math.pi/2
        return o
    def label(value,p,size=.12,color='white'):
        bpy.ops.object.text_add(location=p);o=bpy.context.object;o.data.body=value;o.data.align_x='CENTER';o.data.size=size;o.data.extrude=.001;o.data.resolution_u=2
        o.rotation_euler.x=math.pi/2;bpy.ops.object.convert(target='MESH');return finish(bpy.context.object,'sign '+value,color)
    def fence(a,b,h=1.2):
        va,vb=Vector((*a,0)),Vector((*b,0));v=vb-va;length=v.length;n=max(1,math.ceil(length/.75))
        for i in range(n+1):
            p=va+v*i/n
            beam('fence post',(p.x,p.y,.05),(p.x,p.y,h+.05),.025)
            ball('fence cap',(p.x,p.y,h+.075),(.035,.035,.025),'white')
            box('post footing',(p.x,p.y,.045),(.10,.10,.09),'concrete')
        for z in [.11,h+.02]:beam('fence perimeter rail',(*a,z),(*b,z),.018)
        for i in range(1,max(2,math.ceil(length/.18))):
            p=va+v*i/math.ceil(length/.18);beam('mesh vertical',(p.x,p.y,.11),(p.x,p.y,h+.02),.006,'metal',6)
        for i in range(1,math.ceil(h/.19)):
            z=.11+(h-.09)*i/math.ceil(h/.19);beam('mesh horizontal',(*a,z),(*b,z),.006,'metal',6)
    def gate(a,b,h=1.2):
        # Empty accessible passage; leaf is folded alongside the fence, not across a walk.
        for x,y in [a,b]:
            box('gate jamb',(x,y,(h+.05)/2),(.07,.07,h+.05),'metal')
            for z in [.23,.83]:box('gate hinge',(x,y,z),(.095,.09,.065),'white')
        box('gate threshold',((a[0]+b[0])/2,(a[1]+b[1])/2,.03),(abs(a[0]-b[0])+.10 if a[0]!=b[0] else .3,abs(a[1]-b[1])+.1 if a[1]!=b[1] else .3,.06),'concrete')
    def court():
        box('continuous court apron',(0,0,.025),(4.3,2.7,.05),'concrete',.025)
        box('sport surface',(0,0,.06),(3.96,2.25,.03),'blue',.02)
        for side in [-1,1]:
            box('painted key',(side*1.44,0,.080),(.76,.8,.01),'red')
            box('touchline',(0,side*1.02,.085),(3.75,.022,.009),'white')
            box('baseline',(side*1.88,0,.085),(.023,2.06,.009),'white')
            ring('free throw circle',(side*1.07,0,.085),.4,.010)
            for i in range(25):
                a=-math.pi/2+i*math.pi/24;b=-math.pi/2+(i+1)*math.pi/24
                beam('three point arc',(side*(1.77-1.15*math.cos(a)),.9*math.sin(a),.085),(side*(1.77-1.15*math.cos(b)),.9*math.sin(b),.085),.011,'white',6)
            box('basket stanchion footing',(side*2.01,0,.12),(.16,.25,.15),'concrete',.02)
            beam('basket stanchion',(side*2.01,0,.13),(side*2.01,0,1.03),.034)
            beam('backboard bracket',(side*2.01,0,.95),(side*1.77,0,.95),.024)
            box('backboard',(side*1.77,0,.93),(.043,.45,.30),'white',.012)
            for y in [-.094,.094]:box('backboard target',(side*1.741,y,.91),(.008,.013,.13),'red')
            for z in [.85,.975]:box('backboard target',(side*1.741,0,z),(.008,.19,.012),'red')
            cx=side*1.64;ring('basket rim',(cx,0,.82),.105,.01,'red',segments=16)
            ring('net lower ring',(cx,0,.65),.064,.006,'white',segments=12)
            for i in range(8):
                a=i*math.tau/8;b=a+.3;beam('basket net',(cx+.10*math.cos(a),.10*math.sin(a),.81),(cx+.065*math.cos(b),.065*math.sin(b),.65),.006,'white',6)
            fence((side*2.1,-1.29),(side*2.1,1.29),1.25)
        fence((-2.1,1.29),(2.1,1.29),1.25)
        fence((-2.1,-1.29),(-.42,-1.29),1.25);fence((.42,-1.29),(2.1,-1.29),1.25)
        gate((-.42,-1.29),(.42,-1.29),1.25)
        box('court number',(1.25,-1.304,1.01),(.55,.03,.24),'navy');label('QUADRA',(1.25,-1.326,.97),.095)
        box('centre line',(0,0,.085),(.022,2.04,.009),'white');ring('centre circle',(0,0,.085),.33,.011)
    def football():
        box('sports apron',(0,0,.025),(7,5.9,.05),'concrete',.03)
        box('track edging',(0,0,.06),(6.86,5.75,.035),'red',.02)
        box('football turf',(0,0,.084),(6.35,5.12,.022),'lawn',.02)
        for i in range(6):box('mown turf band',(-2.62+i*1.05,0,.098),(.52,4.82,.007),'leaflight')
        for side in [-1,1]:
            box('touchline',(0,side*2.34,.11),(5.95,.025,.01),'white')
            box('goal line',(side*2.96,0,.11),(.025,4.68,.01),'white')
            box('penalty front',(side*2.08,0,.11),(.025,2.3,.01),'white')
            for y in [-1.15,1.15]:box('penalty side',(side*2.53,y,.11),(.9,.025,.01),'white')
            for y in [-.65,.65]:
                beam('goal upright',(side*2.97,y,.12),(side*2.97,y,.98),.027,'white')
                beam('goal rear brace',(side*2.97,y,.98),(side*3.28,y,.12),.022,'white')
                beam('goal ground frame',(side*2.97,y,.12),(side*3.28,y,.12),.022,'white')
            beam('goal crossbar',(side*2.97,-.65,.98),(side*2.97,.65,.98),.029,'white')
            for i in range(9):
                y=-.64+i*.16;beam('goal net vertical',(side*2.985,y,.95),(side*3.27,y,.14),.006,'white',6)
            for i in range(6):
                t=i/5;beam('goal net horizontal',(side*(2.985+.285*t),-.65,.95-.81*t),(side*(2.985+.285*t),.65,.95-.81*t),.006,'white',6)
            fence((side*3.44,-2.87),(side*3.44,2.87),1.35)
        fence((-3.44,2.87),(3.44,2.87),1.35)
        fence((-3.44,-2.87),(-.55,-2.87),1.35);fence((.55,-2.87),(3.44,-2.87),1.35)
        gate((-.55,-2.87),(.55,-2.87),1.35)
        box('centre stripe',(0,0,.11),(.025,4.68,.01),'white');ring('centre circle',(0,0,.11),.7,.013)
        cyl('centre spot',(0,0,.11),.055,.008,'white',12)
        for x in [-2.85,2.85]:
            beam('corner flagpole',(x,2.29,.11),(x,2.29,.57),.013,'white');box('corner pennant',(x+.075,2.29,.5),(.15,.015,.12),'signal')
    def pier():
        for y in [-.53,.53]:box('continuous bearer',(0,y,-.115),(10,.19,.12),'wooddark')
        for i in range(34):
            x=-4.87+i*.294;box('planed deck board',(x,0,.066),(.277,1.5,.08),'woodlight' if i%4 else 'wood',.012)
            for y in [-.53,.53]:cyl('deck countersunk bolt',(x,y,.111),.012,.009,'metal',8)
        # Wider landing at the seaward end; clear spine throughout the deck.
        for i in range(7):
            x=3.08+i*.294
            for side in [-1,1]:box('landing extension',(x,side*1.03,.066),(.277,.55,.08),'woodlight',.012)
        for x in [-4.6,-2.3,0,2.3,4.6]:
            box('transverse bearer',(x,0,-.08),(.16,1.61,.18),'wooddark')
            for side in [-1,1]:
                y=side*.66;beam('driven pile',(x,y,-1.9),(x,y,.1),.085,'wooddark',12)
                for z in [-.15,-.73]:ring('pile steel collar',(x,y,z),.087,.011,'metal',segments=12)
                if x<4:
                    beam('under deck diagonal',(x,y,-1.02),(x+.55,side*.53,-.115),.041,'wood')
        for side in [-1,1]:
            y=side*.70
            for x in [-4.6,-3.1,-1.6,-.1,1.4,2.9]:
                box('handrail post',(x,y,.48),(.085,.085,.83),'wood',.018)
                box('post cap',(x,y,.925),(.13,.13,.055),'woodlight',.012)
            for z in [.35,.84]:beam('continuous handrail',(-4.6,y,z),(2.9,y,z),.028,'woodlight')
            for x in [-3.9,-2.4,-.9,.6,2.1]:box('rail baluster',(x,y,.59),(.025,.028,.49),'metal')
            for x in [3.35,4.55]:
                beam('mooring bollard',(x,side*1.12,.1),(x,side*1.12,.34),.06,'metal')
                beam('mooring cleat',(x-.12,side*1.12,.29),(x+.12,side*1.12,.29),.035,'metal')
            box('landing edge curb',(4.08,side*1.34,.14),(2.08,.07,.16),'wood')
        for side in [-1,1]:
            box('end corner post',(4.98,side*1.25,.49),(.085,.085,.84),'wood')
        for z in [.35,.84]:beam('end lookout railing',(4.98,-1.25,z),(4.98,1.25,z),.03,'woodlight')
        # Boarding gap on south side of the landing; stainless rescue ladder.
        for x in [3.45,3.85]:beam('ladder rail',(x,-1.40,-1.25),(x,-1.40,.35),.025,'white')
        for z in [-1.12,-.86,-.6,-.34,-.08]:beam('ladder tread',(3.45,-1.40,z),(3.85,-1.40,z),.025,'white')
        ring('pier lifering',(2.9,-.765,.58),.18,.044,'red',axis='Y')
        for x in [-4.6,-1.6,1.4]:
            for side in [-1,1]:box('recessed path light',(x,side*.661,.29),(.044,.02,.075),'signal')
        box('entry plaque',(-4.55,-.765,.64),(.34,.04,.2),'navy');label('PIER',(-4.55,-.789,.6),.11)
    def pergola():
        box('pergola paving',(0,0,.025),(4.8,3.0,.05),'concrete',.035)
        for x in [-2.05,2.05]:
            for y in [-1.12,1.12]:
                box('post stone footing',(x,y,.10),(.28,.28,.2),'stone',.025)
                box('post steel shoe',(x,y,.27),(.17,.17,.19),'metal')
                box('pergola column',(x,y,1.14),(.14,.14,1.85),'wood')
                for dx in [-.44,.44]:beam('knee brace',(x,y,1.60),(x+dx,y,2.0),.042,'woodlight')
        for y in [-1.12,1.12]:box('double main beam',(0,y,2.06),(4.75,.20,.19),'wooddark')
        for i in range(12):box('rafter',( -2.31+i*.42,0,2.20),(.10,2.87,.14),'woodlight',.014)
        for y in [-.85,0,.85]:box('shade batten',(0,y,2.30),(4.7,.055,.065),'wood')
        for x in [-1.9,1.9]:
            box('vine planter',(x,1.2,.22),(.48,.40,.42),'teal',.025)
            beam('climber stem',(x,1.2,.4),(x,1.12,2.25),.023,'trunk')
            for i in range(7):ball('climbing foliage',(x+math.sin(i*2)*.18,1.12, .57+i*.25),(.18,.15,.19),'leaf')
        # A seat on each side leaves a generous centre route beneath the shade.
        for x in [-1.65,1.65]:
            for y in [-.62,.62]:box('seat leg',(x,y,.26),(.12,.13,.46),'metal')
            for dx in [-.16,0,.16]:box('seat slat',(x+dx,0,.51),(.14,1.56,.065),'woodlight',.012)
    def shelter():
        box('shelter foundation',(0,0,.04),(2.65,.85,.08),'concrete',.025)
        for x in [-1.15,1.15]:box('shelter upright',(x,.27,.77),(.055,.055,1.5),'metal')
        box('teal shelter roof',(0,0,1.53),(2.65,.95,.12),'teal',.035)
        box('rear glazing',(0,.31,.9),(2.3,.026,1.1),'glass')
        for x in [-1.15,0,1.15]:box('glazing mullion',(x,.28,.9),(.035,.035,1.1),'white')
        for z in [.62,1.15]:box('glass visibility stripe',(0,.287,z),(2.3,.012,.032),'white')
        for x in [-.75,.1]:box('shelter seat',(x,.08,.45),(.62,.3,.06),'woodlight',.015)
        for x in [-.95,-.55,-.1,.3]:box('shelter seat leg',(x,.09,.25),(.035,.035,.40),'metal')
        box('timetable panel',(.85,.255,.9),(.36,.04,.62),'navy')
        for z in [.73,.82,.91,1]:box('timetable row',(.85,.226,z),(.27,.01,.025),'white')
        label('ONIBUS',(0,-.49,1.51),.12)
    def rabbit():
        ball('rabbit body',(0,0,.26),(.27,.17,.22),'sand');ball('haunch',(-.12,.04,.23),(.19,.18,.19),'woodlight')
        ball('head',(.2,-.01,.42),(.145,.135,.15),'sand')
        for y in [-.073,.055]:
            ball('upright ear',(.17,y,.64),(.048,.045,.20),'sand');ball('pink inner ear',(.202,y,.65),(.014,.024,.14),'flower')
            ball('rabbit paw',(.14,y*1.7,.07),(.11,.052,.042),'white')
            ball('rabbit eye',(.285,y*1.72,.46),(.021,.013,.023),'dark')
        ball('muzzle',(.325,-.017,.40),(.049,.065,.05),'white');ball('nose',(.365,-.018,.428),(.018,.024,.016),'flower')
        ball('cotton tail',(-.28,.055,.29),(.075,.071,.081),'white')
    def wheelchair():
        for side in [-1,1]:
            x=side*.25;ring('wheel tyre',(x,0,.30),.27,.028,'rubber',axis='X');ring('push rim',(x*1.13,0,.30),.225,.014,'white',axis='X')
            for i in range(8):
                a=i*math.tau/8;beam('wheel spoke',(x,0,.30),(x,.25*math.sin(a),.30+.25*math.cos(a)),.008,'white',6)
            beam('chair frame',(x,.14,.32),(x,-.29,.16),.025,'teal');beam('back frame',(x,.17,.32),(x,.17,.78),.022,'teal')
            beam('push handle',(x,.17,.78),(x,.3,.78),.021,'rubber')
            ring('front caster',(x,-.28,.09),.065,.022,'rubber',axis='X',segments=12)
            beam('armrest',(x,.12,.60),(x,-.18,.60),.025,'rubber')
        box('seat',(0,0,.40),(.43,.38,.065),'navy');box('backrest',(0,.17,.6),(.43,.05,.32),'navy')
        box('footplate',(0,-.39,.13),(.35,.19,.035),'metal')
        ball('seated jacket',(0,0,.65),(.18,.12,.23),'blue');ball('head',(0,-.02,.98),(.115,.108,.14),'skin')
        ball('hair',(0,.004,1.07),(.12,.109,.065),'hair')
        for side in [-1,1]:
            x=side*.1;beam('seated thigh',(x,-.01,.45),(x,-.24,.43),.056,'pants');beam('shin',(x,-.24,.43),(x,-.29,.2),.047,'pants')
            box('shoe',(x,-.34,.18),(.11,.19,.08),'dark',.025)
            beam('sleeve',(side*.16,0,.79),(side*.20,-.14,.64),.042,'blue');ball('hand',(side*.2,-.19,.62),(.046,.055,.04),'skin')
            ball('eye',(side*.04,-.122,1.0),(.012,.007,.015),'dark')
    def treatment():
        box('treatment foundation',(0,0,.045),(2.0,1.3,.09),'concrete')
        for x in [-.53,.26]:
            cyl('filter pressure vessel',(x,.14,.53),.27,.84,'teal',16)
            ball('filter domed lid',(x,.14,.95),(.27,.27,.10),'white')
            for z in [.26,.72]:ring('tank seam',(x,.14,z),.272,.013,'metal')
            beam('filter outlet',(x,.14,.21),(x,-.39,.21),.07,'metal')
            ring('valve wheel',(x,-.36,.36),.08,.012,'red')
        box('control cabinet',(.74,-.10,.55),(.3,.35,.9),'white',.025)
        box('control display',(.74,-.283,.7),(.21,.018,.24),'navy')
        for x in [.69,.8]:ball('status lamp',(x,-.30,.5),(.025,.012,.025),'leaf')
        label('AGUA',(0,-.64,.17),.13,'navy')
    def cooling():
        box('heat pump plinth',(0,0,.04),(.86,.51,.08),'concrete')
        box('heat pump case',(0,0,.39),(.78,.43,.64),'white',.035)
        ring('fan surround',(0,-.224,.40),.225,.022,'metal',axis='Y')
        for i in range(8):
            a=i*math.tau/8;beam('fan grille',(0,-.247,.40),(.21*math.sin(a),-.247,.40+.21*math.cos(a)),.009,'metal',6)
        ball('fan hub',(0,-.252,.40),(.065,.024,.065),'metal')
        for x in [-.3,.3]:
            for z in [.26,.38,.5]:box('side inlet',(x,-.221,z),(.045,.016,.035),'navy')
        for x in [-.24,.24]:beam('refrigerant pipe',(x,.18,.2),(x,.26,.14),.027,'metal')
    def beach():
        cyl('umbrella foot',(0,0,.02),.12,.04,'wood',12);beam('umbrella pole',(0,0,0),(0,0,1.40),.024,'wood')
        for i in range(8):
            a=i*math.tau/8;b=(i+1)*math.tau/8
            mesh('sewn canvas panel',[(0,0,1.42),(.34*math.cos(a),.34*math.sin(a),1.30),(.66*math.cos(a),.66*math.sin(a),1.12),(.66*math.cos(b),.66*math.sin(b),1.12),(.34*math.cos(b),.34*math.sin(b),1.30)],[(0,1,4),(1,2,3,4)],'blue' if i%2 else 'white')
            beam('umbrella rib',(0,0,1.37),(.64*math.cos(a),.64*math.sin(a),1.115),.009,'wood',6)
        ball('umbrella finial',(0,0,1.445),(.035,.035,.045),'white')
        for x in [-.65,.65]:
            for y in [-.43,.3]:beam('lounger leg',(x-.2,y,.02),(x+.2,y,.2),.018,'white')
            for dx in [-.22,.22]:
                beam('lounger frame',(x+dx,-.57,.19),(x+dx,.26,.19),.018,'white')
                beam('reclined backrest',(x+dx,.26,.19),(x+dx,.59,.57),.018,'white')
            box('lounger fabric',(x,-.17,.19),(.41,.77,.03),'sand')
            o=box('lounger back fabric',(x,.43,.38),(.41,.50,.025),'blue');o.rotation_euler.x=.85
            for dx in [-.11,.11]:box('fabric stripe',(x+dx,-.17,.21),(.04,.76,.008),'white')
        cyl('beach side table',(0,-.35,.30),.17,.045,'woodlight',16);beam('table pedestal',(0,-.35,.02),(0,-.35,.28),.022,'white')
    def sailboat():
        outline=[(0,-1.35),(.38,-.7),(.47,.7),(.29,1.07),(-.29,1.07),(-.47,.7),(-.38,-.7)]
        verts=[(x,y,z) for z in [-.1,.21] for x,y in outline]
        mesh('rounded sailing hull',verts,[tuple(range(7,14)),tuple(reversed(range(7)))]+[(i,(i+1)%7,(i+1)%7+7,i+7) for i in range(7)],'white')
        for i,p in enumerate(outline):
            q=outline[(i+1)%7];beam('blue sheer stripe',(*p,.14),(*q,.14),.022,'navy')
        box('recessed cockpit',(0,.42,.219),(.58,.81,.019),'navy')
        for x in [-.28,.28]:box('cockpit bench',(x,.42,.26),(.1,.78,.08),'woodlight')
        box('foredeck hatch',(0,-.62,.23),(.31,.34,.035),'glassdark',.015)
        beam('mast',(0,0,.2),(0,0,2.5),.025,'metal');beam('boom',(0,0,.55),(0,.91,.55),.023,'wood')
        mesh('full mainsail',[(0,0,2.46),(0,.94,.59),(0,0,.59),(.14,.29,1.18)],[(0,1,3),(1,2,3),(2,0,3)],'white')
        mesh('foresail',[(0,-.05,2.14),(0,-1.07,.43),(0,-.07,.57),(-.09,-.38,1.02)],[(0,1,3),(1,2,3),(2,0,3)],'white')
        for a,b in [((0,-1.19,.23),(0,0,2.4)),((-.4,.5,.22),(0,0,2.2)),((.4,.5,.22),(0,0,2.2)),((0,.9,.55),(0,.65,.23))]:beam('rigging',a,b,.007,'metal',6)
        beam('tiller',(0,.83,.27),(0,.50,.41),.02,'wood')
    return {'court':court,'football-field':football,'pier':pier,'pergola':pergola,'bus-shelter':shelter,'rabbit':rabbit,'wheelchair-user':wheelchair,'water-treatment':treatment,'heat-pump':cooling,'beach-set':beach,'sailboat':sailboat}
