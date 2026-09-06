"""Reference-inspired coastal city landmarks; original geometry, Blender Z-up."""
import math
import bpy
from mathutils import Vector

def models(api):
    box,cyl,ico,finish=(api[k] for k in ('box','cyl','ico','finish'))
    def beam(name,a,b,r,color):
        v=Vector(b)-Vector(a);o=cyl(name,(Vector(a)+Vector(b))/2,r,v.length,color,8);o.rotation_euler=v.to_track_quat('Z','Y').to_euler();return o
    def mesh(name,verts,faces,color):
        m=bpy.data.meshes.new(name);m.from_pydata(verts,[],faces);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);return finish(o,name,color)
    def label(value,p,size=.2,color='white',angle=0):
        bpy.ops.object.text_add(location=p);o=bpy.context.object;o.data.body=value;o.data.align_x='CENTER';o.data.size=size;o.data.extrude=.002;o.data.resolution_u=2
        o.rotation_euler=(math.pi/2,0,angle);bpy.ops.object.convert(target='MESH');return finish(bpy.context.object,'sign '+value,color)
    def ring(name,p,r,color,axis='Z'):
        bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=r*.15,major_segments=16,minor_segments=6,location=p)
        o=finish(bpy.context.object,name,color)
        if axis=='Y':o.rotation_euler.x=math.pi/2
    def window(x,y,z,w=.4,h=.55,side=-1):
        box('white frame',(x,y,z),(w+.07,.06,h+.07),'white')
        box('blue glazing',(x,y+side*.04,z),(w,.025,h),'glassdark')
        box('reflection',(x-w*.2,y+side*.06,z),(w*.42,.008,h*.88),'glass')
        box('mullion',(x,y+side*.068,z),(.022,.016,h),'white')
    def roof(w,d,h):
        box('inset roof',(0,0,h),(w,d,.12),'roofdeck',.025)
        for x in [-w/2,w/2]:box('roof parapet',(x,0,h+.1),(.12,d+.12,.3),'white')
        for y in [-d/2,d/2]:box('roof parapet',(0,y,h+.1),(w+.12,.12,.3),'white')
        for x in [-.6,.6]:
            box('air handling',(x,.3,h+.2),(.4,.5,.3),'white',.025)
            for i in range(4):box('grille',(x-.12+i*.08,.3,h+.356),(.025,.4,.01),'metal')
    def office():
        box('paved lot',(0,0,.06),(2.9,2.75,.12),'concrete',.04)
        box('tower glazing',(0,0,2.8),(2.45,2.25,5.5),'glass',.05)
        for x in [-1.23,-.62,0,.62,1.23]:
            for y in [-1.145,1.145]:box('vertical white fins',(x,y,2.8),(.065,.07,5.5),'white')
        for y in [-1.125,-.55,0,.55,1.125]:
            for x in [-1.24,1.24]:box('side fins',(x,y,2.8),(.07,.06,5.5),'white')
        for z in [.35,1.15,1.95,2.75,3.55,4.35,5.15]:
            for y in [-1.15,1.15]:box('floor band',(0,y,z),(2.5,.065,.075),'white')
            for x in [-1.25,1.25]:box('floor band',(x,0,z),(.065,2.3,.075),'white')
        roof(2.55,2.35,5.55);box('entrance canopy',(0,-1.35,.95),(1,.65,.08),'white',.015)
        window(0,-1.16,.48,.76,.78)
        label('CENTRO',(0,-1.69,.95),.12,'metal')
        for side in [-1,1]:
            for row in range(6):
                for col in range(4):
                    box('reflected glass panel',(-.91+col*.61,side*1.135,.73+row*.8),(.18,.018,.65),'glassdark' if (row+col)%3==0 else 'glass')
            box('entrance planter',(side*.97,-1.21,.17),(.42,.34,.26),'white',.035)
            ico('entrance shrub',(side*.97,-1.21,.36),(.23,.21,.24),'leaf',2)
    def container(color='red'):
        box('freight container',(0,0,.55),(1.05,2.5,1.1),color,.035)
        for x in [-.54,.54]:
            for i in range(13):box('corrugated wall',(x,-1.15+i*.19,.55),(.02,.045,.99),color)
        for x in [-.25,.25]:
            box('door',(x,1.26,.55),(.47,.025,1.0),color)
            beam('locking bar',(x,1.285,.08),(x,1.285,1.0),.014,'white')
            box('door handle',(x,1.31,.41),(.16,.028,.03),'white')
        for y in [-1.27,1.27]:
            for x in [-.49,.49]:
                box('corner casting',(x,y,.55),(.085,.04,1.1),'metal')
            for z in [.055,1.05]:box('end frame',(0,y,z),(1.07,.045,.07),'metal')
        for i in range(12):box('roof corrugation',(0,-1.1+i*.19,1.111),(.97,.035,.019),color)
        box('freight identification',(-.26,-1.281,.77),(.32,.012,.13),'white')
        label('EQ',(-.26,-1.292,.731),.105,'metal')
        for x in [-.19,.19]:box('end corrugation',(x,-1.266,.45),(.028,.025,.47),color)
    def crane():
        for x in [-1.2,1.2]:
            for y in [-1,1]:
                box('gantry feet',(x,y,.12),(.6,.7,.24),'metal',.06)
                beam('gantry column',(x,y,.2),(x*.68,y,3.8),.085,'signal')
            beam('cross girder',(x*.68,-1,3.8),(x*.68,1,3.8),.1,'signal')
        for y in [-1,1]:
            beam('boom',(-2,y,3.8),(3.5,y,3.8),.07,'signal')
            beam('upper chord',(-2,y,4.4),(3.5,y,4.4),.07,'signal')
            for i in range(8):
                x=-2+i*.68;beam('triangular truss',(x,y,3.8),(x+.34,y,4.4),.04,'signal');beam('triangular truss',(x+.34,y,4.4),(x+.68,y,3.8),.04,'signal')
        box('operator cabin',(.8,-1.2,3.45),(.7,.6,.55),'signal',.04);window(.8,-1.52,3.45,.5,.3)
        for y in [-.5,.5]:beam('hoist cable',(2,y,3.8),(2,y,1.5),.012,'metal')
        box('container spreader',(2,0,1.45),(.8,1.7,.15),'signal')
        box('hoist trolley',(2,0,3.97),(.8,1.75,.28),'metal',.025)
        box('motor housing',(-1.15,0,4.09),(1,1.55,.5),'signal',.045)
        for z in [i*.22+.4 for i in range(15)]:beam('access ladder rung',(-.93,-1.1,z),(-.61,-1.1,z),.016,'white')
        for x in [-.93,-.61]:beam('access ladder',(x,-1.1,.3),(x,-1.1,3.75),.02,'white')
        for x in [-1.2,1.2]:
            beam('gantry diagonal',(x,-1,.35),(x*.68,1,3.7),.046,'signal')
        for y in [-1,1]:
            for x in [-1.2,1.2]:
                for dy in [-.2,.2]:
                    o=cyl('gantry wheels',(x,y+dy,.14),.15,.55,'rubber',12);o.rotation_euler.y=math.pi/2
    def cargo():
        verts=[(-1.2,-3.7,.3),(1.2,-3.7,.3),(-1.2,3.2,.3),(1.2,3.2,.3),(0,4.5,.3),(-1.05,-3.5,-.05),(1.05,-3.5,-.05),(-1.05,3,-.05),(1.05,3,-.05),(0,4.2,-.05)]
        mesh('navy hull',verts,[(0,1,3,4,2),(0,5,6,1),(1,6,8,3),(3,8,9,4),(4,9,7,2),(2,7,5,0),(5,7,9,8,6)],'dark')
        box('deck',(0,-.2,.34),(2.3,6.8,.12),'white',.03)
        for y in [-1.5,0,1.5]:
            for x in [-.73,0,.73]:
                for z in [.65,1.23]:box('cargo boxes',(x,y,z),(.67,1.38,.54),['red','signal','blue'][int((x+1)*4+y+3)%3],.02)
        box('bridge housing',(0,-2.9,1.12),(1.8,1.25,1.4),'white',.05)
        box('wheelhouse',(0,-2.9,1.92),(2,1.4,.4),'white',.035)
        for x in [-.72,-.36,0,.36,.72]:window(x,-3.615,1.94,.26,.22)
        box('radar roof',(0,-2.9,2.17),(2.15,1.5,.09),'white')
        beam('mast',(0,-2.8,2.18),(0,-2.8,3),.035,'metal');beam('antenna',(-.4,-2.8,2.7),(.4,-2.8,2.7),.024,'white')
        for x in [-1.12,1.12]:
            for y in [-3.5,-2,0,2,3.2]:beam('ship railing',(x,y,.4),(x,y,.72),.016,'white')
            beam('ship railing',(x,-3.5,.72),(x,3.2,.72),.018,'white')
            for y in [-3.15,-2.7]:
                box('bridge side glazing',(x*.82,y,1.92),(.03,.34,.23),'glassdark')
            for y in [-3.1,-2.5]:
                o=cyl('porthole',(x*.82,y,1.05),.085,.025,'glassdark',12);o.rotation_euler.y=math.pi/2
            box('lifeboat',(x*.97,-2.4,.85),(.23,.7,.22),'orange',.07)
        for y in [-1.5,0,1.5]:
            for i in range(7):
                box('container ribs',(-1.072,y-.58+i*.19,.95),(.025,.035,1.03),'metal')
                box('container ribs',(1.072,y-.58+i*.19,.95),(.025,.035,1.03),'metal')
        cyl('bow winch',(0,3.4,.52),.17,.25,'metal',12)
        for x in [-.6,.6]:beam('bow mooring bollard',(x,3.1,.4),(x,3.1,.62),.06,'metal')
        box('funnel',(.5,-2.55,2.43),(.35,.4,.47),'red',.02)
        box('funnel cap',(.5,-2.55,2.68),(.39,.44,.05),'dark')
        label('ECO PORTO',(0,-3.72,.68),.18,'metal')
    def lighthouse():
        cyl('stone plinth',(0,0,.1),.8,.2,'stone',24)
        bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=.62,radius2=.36,depth=3.2,location=(0,0,1.8));finish(bpy.context.object,'white tapered tower','white')
        cyl('red band',(0,0,2.8),.4,.28,'red',24)
        cyl('balcony',(0,0,3.43),.62,.14,'white',24)
        cyl('lantern glass',(0,0,3.78),.38,.6,'glassdark',16)
        for i in range(8):
            a=i*math.tau/8;x,y=.4*math.cos(a),.4*math.sin(a);beam('lantern frame',(x,y,3.5),(x,y,4.07),.025,'white')
        bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=.57,radius2=0,depth=.45,location=(0,0,4.22));finish(bpy.context.object,'red lantern cap','red')
        window(0,-.595,.68,.22,.5);window(0,-.51,1.7,.18,.27)
        box('lighthouse door',(0,-.628,.49),(.29,.045,.6),'teal',.025)
        box('entry step',(0,-.69,.16),(.46,.3,.13),'white',.025)
        cyl('lantern lens',(0,0,3.78),.17,.39,'signal',16)
        for z in [3.63,3.75,3.87]:cyl('fresnel rings',(0,0,z),.19,.025,'white',16)
        beam('finial',(0,0,4.43),(0,0,4.65),.022,'metal')
        for i in range(16):
            a=i*math.tau/16;b=(i+1)*math.tau/16
            beam('balcony post',(.59*math.cos(a),.59*math.sin(a),3.48),(.59*math.cos(a),.59*math.sin(a),3.8),.015,'metal')
            beam('balcony rail',(.59*math.cos(a),.59*math.sin(a),3.8),(.59*math.cos(b),.59*math.sin(b),3.8),.018,'white')
    def vehicle(train=False):
        length=3.6 if train else 2.7;color='blue' if train else 'red'
        box('chassis',(0,0,.2),(.85,length,.2),'dark',.05)
        box('passenger body',(0,0,.68),(.92,length,1.0),'white',.10)
        box('lower stripe',(0,0,.39),(.95,length+.02,.18),color,.03)
        box('roof',(0,0,1.2),(.92,length-.08,.12),'roof',.045)
        for x in [-.47,.47]:
            for i in range(6):
                y=-length/2+.3+i*(length-.5)/6
                box('side windows',(x,y,.88),(.025,.28 if train else .23,.36),'glassdark')
                box('window reflection',(x*1.03,y-.07,.89),(.012,.035,.31),'glass')
            for y in ([-length*.29,length*.29] if train else [-length*.3,length*.15]):
                box('passenger door',(x*1.02,y,.67),(.028,.35,.89),color)
                box('door glass',(x*1.06,y,.81),(.025,.28,.43),'glassdark')
                box('door seam',(x*1.1,y,.66),(.018,.017,.82),'white')
                box('door step',(x*1.05,y,.24),(.07,.39,.035),'metal')
        window(0,-length/2-.01,.87,.73,.4)
        for x in [-.46,.46]:
            for y in [-length*.31,length*.31]:
                o=cyl('wheel',(x,y,.22),.19,.12,'rubber',12);o.rotation_euler.y=math.pi/2
                o=cyl('wheel hub',(x*1.14,y,.22),.105,.018,'white',12);o.rotation_euler.y=math.pi/2
        for x in [-.3,.3]:box('headlamp',(x,-length/2-.03,.43),(.15,.03,.09),'signal')
        for y in [-length/2-.055,length/2+.055]:
            box('bumper',(0,y,.25),(.78,.04,.08),'metal',.015)
            box('route display',(0,y,.99),(.56,.028,.13),'dark')
        for x in [-.29,.29]:box('rear lamps',(x,length/2+.018,.43),(.12,.027,.13),'red')
        label('LINHA 01' if train else 'CENTRO',(0,-length/2-.079,.965),.075,'signal')
        for x in [-.17,.17]:beam('windscreen wiper',(x,-length/2-.09,.66),(x+.09,-length/2-.09,.87),.01,'metal')
        for y in [-.55,.55]:
            box('roof air conditioning',(0,y,1.31),(.58,.47,.16),'white',.035)
            for i in range(4):box('roof vent grille',(-.17+i*.11,y,1.398),(.035,.34,.012),'metal')
        if train:
            for y in [-length/2-.13,length/2+.13]:box('coupler',(0,y,.25),(.2,.3,.1),'metal')
            for y in [-length*.31,length*.31]:box('bogie',(0,y,.16),(.79,.55,.13),'metal',.02)
        else:
            for x in [-.56,.56]:
                beam('mirror arm',(x*.84,-length*.37,.91),(x,-length*.41,.92),.018,'metal')
                box('mirror',(x,-length*.42,.88),(.08,.14,.18),'dark',.02)
    def station():
        box('forecourt',(0,0,.035),(5.5,4.3,.07),'concrete',.04)
        box('shop',(0,1.25,.75),(3.1,1.45,1.45),'white',.03)
        for x in [-1,0,1]:window(x,.5,.75,.74,.9)
        for x in [-1.7,1.7]:beam('canopy pillar',(x,-.7,.05),(x,-.7,1.85),.075,'white')
        box('red canopy',(0,-.7,1.94),(4.8,2.3,.22),'red',.04)
        box('yellow fascia',(0,-.7,1.91),(4.86,2.35,.065),'signal')
        box('grey canopy roof',(0,-.7,2.058),(4.52,2.04,.028),'roofdeck')
        for x in [-1,1]:
            box('pump island',(x,-.7,.13),(.85,1.0,.2),'white',.08)
            box('fuel pump',(x,-.7,.64),(.37,.35,.85),'red',.04);window(x,-.89,.83,.26,.23)
            beam('fuel hose',(x+.24,-.7,.9),(x+.34,-.7,.3),.025,'dark')
            beam('hose return',(x+.34,-.7,.3),(x+.41,-.7,.67),.022,'dark')
            box('nozzle',(x+.41,-.7,.69),(.07,.08,.17),'metal',.018)
            label('95',(x,-.939,.80),.11,'white')
            for dy in [-.41,.41]:cyl('pump bollard',(x+.38,-.7+dy,.3),.04,.39,'signal',10)
        box('price pylon',(2.45,1.1,.96),(.31,.27,1.85),'red',.03)
        for z,value in [(1.54,'ECO'),(1.13,'5.49'),(.79,'3.69')]:
            box('price screen',(2.45,.952,z),(.28,.024,.23),'dark')
            label(value,(2.45,.933,z-.043),.10,'white')
        label('ECO POSTO',(0,-1.89,1.91),.16,'white')
        for x in [-1,1]:box('forecourt lane',(x,-1.99,.076),(.05,.4,.012),'white')
        box('shop fascia',(0,.49,1.37),(2.95,.08,.22),'teal')
        label('CONVENIENCIA',(0,.439,1.31),.17,'white')
    def cafe():
        box('cafe lot',(0,0,.05),(3.4,2.9,.1),'concrete',.035)
        box('shop walls',(0,0,.85),(2.8,2.1,1.6),'cream',.035);roof(2.9,2.2,1.67)
        for x in [-.85,0,.85]:window(x,-1.06,.72,.67,1.05)
        for x in [-.85,0,.85]:window(x,1.15,.72,.67,1.05,1)
        for side in [-1,1]:
            for y in [-.6,.2,.75]:
                box('side window trim',(side*1.43,y,.77),(.055,.52,.93),'white')
                box('side glazing',(side*1.47,y,.77),(.025,.44,.84),'glassdark')
            box('side canopy',(side*1.56,0,1.4),(.32,2.1,.07),'red')
        for i in range(12):
            x=-1.42+i*.26
            o=box('striped awning',(x,-1.32,1.4),(.26,.63,.06),'red' if i%2 else 'white');o.rotation_euler.x=-.2
        box('sign board',(0,-1.18,1.79),(1.5,.05,.26),'teal')
        label('CAFE',(0,-1.217,1.72),.21,'white')
        box('door handle',(.17,-1.145,.58),(.025,.025,.16),'white')
        for x in [-1.17,1.17]:
            cyl('terrace table',(x,-1.27,.49),.17,.035,'wood',16)
            beam('table leg',(x,-1.27,.12),(x,-1.27,.49),.025,'metal')
            cyl('cup',(x,-1.27,.545),.035,.065,'white',12)
        box('menu board',(.56,-1.4,.4),(.28,.045,.47),'metal',.015)
        for z in [.32,.4,.47]:box('menu lettering',(.56,-1.428,z),(.19,.01,.015),'white')
    def playground():
        box('sand play area',(0,0,.03),(3.5,2.8,.06),'soil',.08)
        for x in [-.9,.9]:
            for y in [-.55,.55]:beam('swing A frame',(x,y,0),(x,0,1.45),.055,'signal')
        beam('swing beam',(-1,0,1.45),(1,0,1.45),.06,'red')
        for x in [-.4,.4]:
            for dx in [-.15,.15]:beam('swing chain',(x+dx,0,1.4),(x+dx,.1,.4),.012,'metal')
            box('swing seat',(x,.1,.38),(.4,.24,.06),'blue',.02)
        for x in [1.0,1.45]:
            for y in [.56,1.03]:beam('play tower post',(x,y,.08),(x,y,1.82),.045,'wood')
        box('tower platform',(1.22,.8,1.24),(.61,.61,.09),'red',.02)
        mesh('playhouse roof',[(.85,.4,1.83),(1.6,.4,1.83),(.85,1.2,1.83),(1.6,1.2,1.83),(1.225,.4,2.12),(1.225,1.2,2.12)],[(0,2,5,4),(1,4,5,3)],'signal')
        beam('slide chute',(-.32,.8,.17),(1.04,.8,1.24),.05,'blue')
        o=box('slide bed',(.36,.8,.705),(1.73,.44,.055),'blue');o.rotation_euler.y=-.666
        for y in [.54,1.06]:beam('slide edge',(-.35,y,.23),(1.04,y,1.32),.04,'signal')
        for y in [.59,1.01]:beam('ladder stile',(1.65,y,.08),(1.44,y,1.32),.025,'metal')
        for z in [.25,.45,.65,.85,1.05]:beam('ladder step',(1.65-z*.17,.59,z),(1.65-z*.17,1.01,z),.025,'white')
        for y in [.56,1.03]:
            beam('tower handrail',(1.0,y,1.65),(1.45,y,1.65),.025,'red')
            for x in [1.06,1.2,1.37]:beam('guard rail',(x,y,1.3),(x,y,1.65),.018,'red')
        for y in [-1.38,1.38]:box('sandbox edge',(0,y,.07),(3.5,.08,.14),'wood',.015)
    return {'office-glass':office,'container-red':container,'container-blue':lambda:container('blue'),'harbor-crane':crane,'cargo-ship':cargo,'lighthouse':lighthouse,'train-carriage':lambda:vehicle(True),'city-bus':vehicle,'fuel-station':station,'corner-cafe':cafe,'playground':playground}
