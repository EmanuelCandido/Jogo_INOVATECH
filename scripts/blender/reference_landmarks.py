"""Landmarks for the river-city reference. Metres, Blender Z-up, fronts -Y.

Architecture is rebuilt for the low profile with the same complete silhouette.
The established palette, rounded profiles and vertex AO keep the new kit cohesive.
"""
import math
import bpy
from mathutils import Vector

def models(api):
    h=api['ARCHITECTURE']
    rr,beam,cyl,ball,label,solar,planter,mesh,roof,glass=(h[k] for k in ('rr','beam','cyl','ball','label','solar','planter','mesh','roof','glass'))
    box=api['box']
    api['PALETTE'].update({'industrial':'9BACA9','masonry':'BEB6A1','rubble':'8B918A','rust':'AD7353','waterfall':'A4E5E9'})
    def dome(x,y,z,r,color='glass'):
        n=20 if api.get('LOW_DETAIL') else 40
        verts=[(x+r*math.cos(a*2*math.pi/n)*math.sin(b*math.pi/16),y+r*math.sin(a*2*math.pi/n)*math.sin(b*math.pi/16),z+r*.55*math.cos(b*math.pi/16)) for b in range(9) for a in range(n)]
        faces=[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(8) for i in range(n)]
        o=mesh('curved skylight',verts,faces,color)
        for p in o.data.polygons:p.use_smooth=True
        for a in range(8):
            t=a*math.pi/4
            for j in range(8):
                p=j*math.pi/16;q=(j+1)*math.pi/16
                beam('skylight rib',(x+r*math.cos(t)*math.sin(p),y+r*math.sin(t)*math.sin(p),z+r*.55*math.cos(p)),(x+r*math.cos(t)*math.sin(q),y+r*math.sin(t)*math.sin(q),z+r*.55*math.cos(q)),.025,'white')
    def circle_floor(r,z,height):
        cyl('curved blue facade',(0,0,z+height/2),r,height,'glass',48)
        cyl('rounded floor edge',(0,0,z),r+.1,.13,'white',48)
        for i in range(20):
            a=i*math.pi/10
            beam('facade mullion',(r*math.cos(a),r*math.sin(a),z),(r*math.cos(a),r*math.sin(a),z+height),.026,'white')
    def observatory():
        cyl('landscaped podium',(0,0,.12),1.8,.24,'white',48)
        circle_floor(.76,.25,7.0)
        for z in [.4,2.6,4.8,7.1]:cyl('tower collar',(0,0,z),.88,.14,'cream',32)
        for z,r in [(7.4,1.65),(8.4,1.50),(9.2,1.12)]:
            circle_floor(r,z,.70);cyl('terrace canopy',(0,0,z+.73),r+.13,.16,'white',48)
        cyl('green viewing terrace',(0,0,9.33),1.18,.1,'roofgrass',40)
        dome(0,0,9.45,.75)
        beam('communications mast',(0,0,9.8),(0,0,11.15),.028,'metal')
        ball('beacon',(0,0,11.17),(.07,.07,.08),'gold')
        for a in range(10):
            t=a*math.pi/5;beam('observation balcony',(1.64*math.cos(t),1.64*math.sin(t),8.45),(1.64*math.cos(t),1.64*math.sin(t),8.78),.025,'metal')
        label('OBSERVATÓRIO',(0,-.785,1.08),.13)
        rr('entrance',(0,-.82,.64),(.65,.2,.9),'glassdark',.08)
        for x in [-1.1,1.1]:planter(x,-.7,.24,.6,.45)
    def eco_dome():
        cyl('circular public forecourt',(0,0,.12),3.4,.24,'roofdeck',48)
        for z,r in [(.25,2.7),(1.55,2.45),(2.85,2.2)]:circle_floor(r,z,1.24)
        cyl('roof white rim',(0,0,4.15),2.38,.18,'white',48)
        cyl('living roof',(0,0,4.25),2.27,.09,'roofgrass',48)
        dome(0,.15,4.32,1.4)
        for a in range(5):
            t=a*math.pi/3+.2;solar(math.cos(t)*1.76,math.sin(t)*1.6,4.42,.8,.55)
        rr('entry canopy',(0,-2.66,1.2),(1.7,.75,.16),'cream',.22)
        rr('automatic glass doors',(0,-2.71,.7),(1.28,.08,.96),'glassdark',.14)
        label('CENTRO DO FUTURO',(0,-2.75,1.45),.19)
        for x in [-1.7,1.7]:planter(x,-2.1,.24,.9,.5)
    def arch_roof(x,y,z,w,d,color='white'):
        n=16;verts=[]
        for yy in [y-d/2,y+d/2]:
            for i in range(n+1):
                a=i*math.pi/n;verts.append((x+w/2*math.cos(a),yy,z+w*.42*math.sin(a)))
        mesh('barrel-vaulted roof',verts,[(i,i+1,n+2+i,n+1+i) for i in range(n)],color)
        for yy in [y-d/2,y,y+d/2]:
            for i in range(n):
                a=i*math.pi/n;b=(i+1)*math.pi/n
                beam('arched structural rib',(x+w/2*math.cos(a),yy,z+w*.42*math.sin(a)),(x+w/2*math.cos(b),yy,z+w*.42*math.sin(b)),.065,'white')
    def station():
        rr('station forecourt',(0,0,.12),(8.8,5.3,.24),'roofdeck',.5)
        rr('station masonry',(0,0,1.48),(7.6,3.8,2.6),'white',.2)
        for x in [-2.9,-2,-1,0,1,2,2.9]:
            rr('recessed glazing',(x,-1.94,1.6),(.68,.09,1.48),'glassdark',.1)
            for side in [-1,1]:box('window stone reveal',(x+side*.37,-2,1.6),(.065,.14,1.57),'trim')
        rr('platform cornice',(0,0,2.85),(8.0,4.0,.2),'cream',.2)
        rr('central clock facade',(0,-.5,3.42),(2.6,3,1.15),'white',.15)
        arch_roof(0,-.5,3.96,2.6,3,'solar')
        # Clock is vertical on the visible front facade.
        c=cyl('clock surround',(0,-2.07,3.92),.64,.12,'metal',40);c.rotation_euler.x=math.pi/2
        c=cyl('clock face',(0,-2.15,3.92),.56,.03,'white',40);c.rotation_euler.x=math.pi/2
        beam('hour hand',(0,-2.18,3.92),(-.21,-2.18,4.12),.035,'navy')
        beam('minute hand',(0,-2.18,3.92),(0,-2.18,4.36),.026,'navy')
        for i in range(12):
            a=i*math.pi/6;ball('clock hour',(math.sin(a)*.48,-2.18,3.92+math.cos(a)*.48),(.025,.02,.025),'navy',1)
        for x in [-3,-1.7,1.7,3]:cyl('entry column',(x,-2.38,1.38),.13,2.4,'white',20)
        rr('portico roof',(0,-2.27,2.62),(7.8,1.05,.22),'white',.18)
        label('ESTAÇÃO CENTRAL',(0,-2.81,2.57),.25)
        for x in [-2.7,2.7]:solar(x,.1,3.03,1.8,1.4)
        for x in [-3.5,3.5]:planter(x,-2.2,.24,.55,.65)
    def station_canopy():
        # Long axis X; open ends let the actual train continue through the canopy.
        rr('raised platform',(0,0,.12),(14,3.2,.24),'roofdeck',.2)
        n=16;verts=[]
        for x in [-7,7]:
            for i in range(n+1):
                a=i*math.pi/n;verts.append((x,1.7*math.cos(a),1.3+1.3*math.sin(a)))
        mesh('blue station vault',verts,[(i,i+1,n+2+i,n+1+i) for i in range(n)],'glass')
        for x in [-7,-5,-3,-1,1,3,5,7]:
            for i in range(n):
                a=i*math.pi/n;b=(i+1)*math.pi/n
                beam('station canopy arch',(x,1.7*math.cos(a),1.3+1.3*math.sin(a)),(x,1.7*math.cos(b),1.3+1.3*math.sin(b)),.036,'white')
            for y in [-1.7,1.7]:beam('station canopy column',(x,y,.24),(x,y,1.3),.07,'white')
        for y in [-1.4,1.4]:box('platform safety strip',(0,y,.251),(13.6,.12,.02),'gold')
    def dam():
        rr('dam footing',(0,0,.1),(15,3.8,.8),'stone',.25)
        rr('dam concrete breast',(0,0,3.45),(14,1.6,6.9),'trim',.25)
        for x in [-6.6,-4.4,-2.2,0,2.2,4.4,6.6]:
            rr('spillway buttress',(x,-.85,3.55),(.34,1.8,7.1),'white',.12)
        box('reservoir walkway',(0,0,7.08),(15,2.6,.22),'roofdeck',.05)
        for x in range(-7,8):
            beam('dam railing',(x,-1.17,7.2),(x,-1.17,7.85),.035,'metal')
        for z in [7.4,7.8]:beam('continuous dam handrail',(-7,-1.17,z),(7,-1.17,z),.035,'metal')
        for x in [-5.5,-3.3,-1.1,1.1,3.3,5.5]:
            rr('spillway dark opening',(x,-.815,6.2),(1.78,.05,1.3),'glassdark',.1)
        rr('dam control house',(-6,0,8.1),(1.9,1.8,1.7),'white',.16)
        box('control room windows',(-6,-.93,8.24),(1.5,.03,.68),'glass')
        solar(-6,0,9.04,1.6,1.2)
    def arch_bridge():
        n=28;length=12;width=2.6
        def z(x):return .16+1.2*max(0,1-(x/6)**2)
        verts=[]
        for i in range(n+1):
            x=-6+12*i/n
            verts.extend([(x,-width/2,z(x)),(x,width/2,z(x)),(x,-width/2,z(x)-.25),(x,width/2,z(x)-.25)])
        faces=[]
        for i in range(n):
            j=i*4;faces.extend([(j,j+4,j+5,j+1),(j+2,j+6,j+4,j),(j+1,j+5,j+7,j+3),(j+2,j+3,j+7,j+6)])
        mesh('arched pale bridge deck',verts,faces,'roofdeck')
        for side in [-1,1]:
            for i in range(25):
                x=-6+i*.5;beam('bridge baluster',(x,side*1.27,z(x)),(x,side*1.27,z(x)+.75),.032,'white')
            for i in range(n):
                x=-6+12*i/n;q=-6+12*(i+1)/n
                for h in [.35,.77]:beam('curved bridge railing',(x,side*1.27,z(x)+h),(q,side*1.27,z(q)+h),.045,'metal')
        for x in [-5.1,5.1]:
            for y in [-.95,.95]:rr('bridge abutment',(x,y,-.45),(.6,.55,1.3),'stone',.08)
    def recycling():
        rr('recycling forecourt',(0,0,.13),(7.6,6.2,.26),'roofdeck',.45)
        rr('curved recycling hall',(0,.4,1.85),(6.8,4.4,3.4),'white',.6)
        for x in [-2.5,2.5]:
            rr('collection entrance',(x,-1.85,1.48),(1.4,.15,2.0),'glassdark',.18)
            for z in [.9,1.2,1.5,1.8,2.1]:box('door panel seam',(x,-1.95,z),(1.24,.05,.025),'metal')
        rr('recycling identity facade',(0,-1.98,2.6),(2.25,.3,2.6),'roofgrass',.24)
        label('♻',(0,-2.15,2.55),1.3,'white')
        label('RECICLAGEM',(0,-2.16,1.95),.20,'white')
        roof('recycling-centre',6.7,4.3,3.6)
        for i,c in enumerate(['red','glassdark','gold','leaf']):
            x=-1.65+i*1.1
            rr('colour sorted bin',(x,-2.65,.68),(.84,.65,1.0),c,.12)
            rr('bin lid',(x,-2.65,1.22),(.88,.69,.14),'white',.12)
            box('bin mouth',(x,-2.76,1.30),(.53,.31,.025),'navy')
            label('↻',(x,-2.99,.63),.37,'white')
        # Collection bays, durable cladding and a sheltered public entrance.
        # The details remain inside the existing plot envelope.
        rr('continuous rounded eave',(0,.4,3.51),(6.97,4.55,.19),'white',.42)
        rr('collection canopy',(0,-2.35,1.74),(4.7,1.25,.13),'white',.22)
        for x in [-2.18,2.18]:
            beam('canopy column',(x,-2.87,.27),(x,-2.87,1.70),.037,'metal')
            beam('canopy diagonal',(x,-2.84,1.45),(x,-2.0,1.70),.025,'metal')
        for i,text in enumerate(['PAPEL','PLASTICO','METAL','VIDRO']):
            x=-1.65+i*1.1
            label(text,(x,-2.993,.40),.105,'white')
            for xx in [-.30,.30]:
                cyl('bin rubber foot',(x+xx,-2.65,.18),.09,.11,'dark',12)
            rr('sorting label inset',(x,-2.985,.86),(.45,.02,.13),'white',.015)
        for x in [-2.5,2.5]:
            rr('bay frame',(x,-1.94,2.52),(1.53,.14,.10),'metal',.035)
            rr('bay threshold',(x,-2.01,.37),(1.50,.39,.10),'stone',.04)
            label('RECEBIMENTO',(x,-2.025,2.68),.12,'metal')
            for xx in [-.78,.78]:
                cyl('protective bollard',(x+xx,-2.04,.55),.045,.56,'gold',12)
        for side in [-1,1]:
            for yy in [-.85,-.4,.05,.5,.95,1.4,1.85]:
                box('vertical ceramic joint',(side*3.405,yy,1.78),(.022,.014,2.55),'stone')
            beam('rainwater pipe',(side*3.10,2.48,.35),(side*3.10,2.48,3.45),.045,'metal')
            rr('wall wash light',(side*3.44,.4,2.95),(.09,.36,.12),'white',.035)
        rr('rear service door',(0,2.63,1.30),(1.05,.09,2.02),'metal',.08)
        for z in [.58,.92,1.26,1.60,1.94]:box('rear door ventilation',(0,2.69,z),(.78,.025,.026),'dark')
        rr('rear loading threshold',(0,2.80,.25),(1.8,.55,.15),'stone',.06)
        for x in [-1.1,1.1]:
            rr('roof ventilation curb',(x,1.1,3.91),(.82,.64,.20),'white',.08)
            for i in range(6):box('roof louvre',(x-.31+i*.12,1.1,4.02),(.045,.52,.035),'metal')
    def excavator():
        for y in [-.77,.77]:
            rr('continuous rubber track',(0,y,.37),(2.7,.48,.56),'dark',.24)
            for x in [-.9,-.45,0,.45,.9]:
                c=cyl('track wheel',(x,y*1.25,.37),.22,.05,'metal',16);c.rotation_euler.x=math.pi/2
            for i in range(13):box('track tread',(-1.22+i*.2,y,.66),(.10,.50,.05),'rubble')
        cyl('turntable',(0,0,.76),.72,.2,'metal',24)
        rr('yellow excavator body',(-.35,0,1.08),(2.0,1.45,.62),'gold',.23)
        rr('cab safety frame',(-.25,-.32,1.91),(1.13,.8,1.2),'gold',.15)
        rr('cab glazing',(-.25,-.34,1.95),(.94,.84,.96),'autoglass',.13)
        rr('cab roof',(-.25,-.32,2.58),(1.23,.96,.13),'gold',.14)
        for i in range(5):box('engine ventilation',(-1.05,-.76,.98+i*.06),(.24,.025,.025),'dark')
        for a,b,r in [((.6,.25,1.15),(1.8,.25,3.1),.15),((1.8,.25,3.1),(3.15,.25,1.0),.12)]:beam('articulated boom',a,b,r,'gold',8)
        beam('hydraulic ram',(.55,.25,1.42),(1.54,.25,2.86),.048,'alloy')
        beam('dipper hydraulic',(1.8,.25,2.97),(2.83,.25,1.17),.037,'alloy')
        for x,z in [(1.8,3.1),(3.15,1.0)]:
            c=cyl('boom pivot',(x,.25,z),.18,.4,'metal',16);c.rotation_euler.x=math.pi/2
        rr('excavator bucket',(3.17,.25,.66),(.78,.98,.65),'rust',.10)
        for y in [-.1,.25,.6]:box('bucket tooth',(3.51,y,.35),(.28,.10,.13),'metal',.03)
    def pylon():
        for x in [-1.3,1.3]:
            for y in [-1.3,1.3]:
                rr('pylon footing',(x,y,.14),(.7,.7,.28),'stone',.1)
                beam('tapered steel leg',(x,y,.28),(x*.18,y*.18,8.8),.065,'metal')
        for z in [1,2.5,4,5.5,7,8.5]:
            w=1.3*(1-z/10)
            for s in [-1,1]:
                beam('lattice diagonal',(-w,s*w,z),(w*.78,s*w*.78,z+1.1),.034,'white')
                beam('lattice cross brace',(w,s*w,z),(-w*.78,s*w*.78,z+1.1),.034,'white')
                beam('side lattice',(s*w,-w,z),(s*w*.78,w*.78,z+1.1),.034,'white')
        for z,w in [(5.4,2.9),(7.15,2.5),(8.65,1.9)]:
            beam('power crossarm',(-w,0,z),(w,0,z),.065,'metal')
            for x in [-w,w]:
                beam('crossarm tension',(0,0,z+.65),(x,0,z),.035,'white')
                for i in range(5):cyl('ceramic insulator',(x,0,z-.1-i*.08),.10,.04,'sage',12)
    def ruined():
        rr('weathered urban plot',(0,0,.08),(4.8,4.1,.16),'rubble',.16)
        rr('old building shell',(0,0,2.2),(3.6,3.1,4.3),'masonry',.07)
        for x in [-1.1,0,1.1]:
            for z in [1.1,2.5,3.7]:
                box('empty broken window',(x,-1.565,z),(.63,.025,.78),'dark')
                for side in [-1,1]:box('damaged window frame',(x+side*.35,-1.6,z),(.07,.08,.85),'rust')
                if x!=0:beam('boarded window',(x-.27,-1.66,z-.24),(x+.3,-1.66,z+.18),.035,'wood',6)
        rr('cracked upper ledge',(0,0,4.35),(3.9,3.4,.18),'stone',.08)
        for i in range(9):
            x=-1.6+i*.4;box('uneven parapet',(x,1.6,4.59+math.sin(i*2)*.1),(.37,.14,.48),'masonry',.035)
        rr('community wall',(1.8,-.5,.98),(.23,3.0,1.8),'white',.025)
        # Front billboard belongs to this plot, never floats over another model.
        rr('public question wall',(0,-1.9,1.3),(3.5,.15,2.4),'white',.06)
        label('CIDADE',(0,-1.99,1.86),.48,'dark');label('PARA TODOS?',(0,-1.99,1.27),.39,'dark')
        for i in range(15):
            a=i*2.4;r=1.9+(i%3)*.13
            box('scattered masonry',(math.cos(a)*r,math.sin(a)*1.75,.2),(.25,.27,.21),'masonry',.03)
    def industry():
        api['MODEL_ATTACHMENTS'].setdefault('industrial-works',{'front':[0,0,1]}).update({'entry':[2.48,0,3.1],'loading':[0,0,3.1]})
        rr('industrial service slab',(0,0,.12),(7.4,6.2,.24),'roofdeck',.16)
        rr('main factory hall',(0,0,1.8),(6.6,5.1,3.3),'industrial',.17)
        for x in [-2.5,-1.5,-.5,.5,1.5,2.5]:
            for z in [1.9,2.8]:
                box('recessed factory windows',(x,-2.57,z),(.62,.03,.51),'glassdark')
                box('window lower sill',(x,-2.62,z-.28),(.73,.15,.065),'white')
        rr('factory roof cornice',(0,0,3.51),(6.95,5.4,.2),'metal',.12)
        for x in [-2,1.2]:
            cyl('chimney base',(x,.8,3.94),.66,.8,'stone',24)
            cyl('tall exhaust stack',(x,.8,6.22),.43,4.1,'white',32)
            for z in [7.1,7.55]:cyl('red aviation marking',(x,.8,z),.437,.27,'red',32)
            cyl('open dark chimney mouth',(x,.8,8.29),.39,.025,'dark',32)
            cyl('chimney rolled rim',(x,.8,8.3),.47,.08,'metal',32)
        for x in [-1.5,0,1.5]:
            rr('factory louvre',(x,-1.3,3.84),(.83,.86,.49),'metal',.07)
            for i in range(5):box('vent grille',(x-.28+i*.14,-1.3,4.09),(.055,.63,.015),'dark')
        rr('loading roller door',(0,-2.62,.86),(1.55,.10,1.4),'metal',.08)
        for z in [.3,.52,.74,.96,1.18,1.4]:box('roller door rib',(0,-2.69,z),(1.45,.04,.025),'white')
        # A separate staff entrance keeps pedestrians away from reversing trucks.
        rr('staff door surround',(2.48,-2.65,.95),(.94,.16,1.63),'white',.045)
        rr('staff door',(2.48,-2.75,.92),(.76,.035,1.45),'glassdark',.035)
        box('staff door handle',(2.72,-2.78,.87),(.035,.04,.26),'metal')
        rr('staff weather cover',(2.48,-2.77,1.85),(1.25,.62,.10),'white',.065)
        label('EQUIPE',(2.48,-2.80,1.68),.095,'dark')
        for x in [-.87,.87]:
            rr('loading bumper',(x,-2.73,.54),(.15,.18,.53),'dark',.04)
            box('loading yellow edge',(x,-2.84,.56),(.07,.025,.44),'gold')
        rr('loading hood',(0,-2.76,1.68),(2.14,.7,.14),'metal',.06)
        for y in [-1,0,1]:
            beam('external service pipe',(3.45,y,.3),(3.45,y,2.6),.12,'metal')
            beam('pipe elbow',(3.45,y,2.6),(2.8,y,2.6),.12,'metal')
        label('INDÚSTRIA',(0,-2.70,3.22),.24,'dark')
    def pitched_roof(x,y,z,w,d):
        verts=[(x-w/2,y-d/2,z),(x+w/2,y-d/2,z),(x+w/2,y,z+.70),(x-w/2,y,z+.70),(x-w/2,y+d/2,z),(x+w/2,y+d/2,z)]
        o=mesh('terracotta roof slopes',verts,[(0,1,2,3),(3,2,5,4)],'coral')
        mod=o.modifiers.new('solid rolled eaves','SOLIDIFY');mod.thickness=.085;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
        mesh('painted gable infill',[(x-w/2+.1,y-d/2+.12,z-.12),(x-w/2+.1,y+d/2-.12,z-.12),(x-w/2+.1,y,z+.59),(x+w/2-.1,y-d/2+.12,z-.12),(x+w/2-.1,y+d/2-.12,z-.12),(x+w/2-.1,y,z+.59)],[(0,2,1),(3,4,5)],'cream')
        beam('rounded ridge cap',(x-w/2-.04,y,z+.70),(x+w/2+.04,y,z+.70),.068,'rust')
        for side in [-1,1]:
            for i in range(1,5):
                yy=side*d/2*i/5;zz=z+.70*(1-i/5)
                beam('subtle tile courses',(x-w/2,yy+y,zz+.008),(x+w/2,yy+y,zz+.008),.009,'rust',6)
            beam('rounded rain gutter',(x-w/2,y+side*d/2,z-.025),(x+w/2,y+side*d/2,z-.025),.035,'white')
        from mathutils import Matrix
        before=set(bpy.context.scene.objects);solar(x,y-d*.16,z+.53,w*.58,d*.28)
        pivot=Vector((x,y-d*.16,z+.53));rotation=Matrix.Translation(pivot)@Matrix.Rotation(math.atan(1.4/d)-.12,4,'X')@Matrix.Translation(-pivot)
        for o in set(bpy.context.scene.objects)-before:o.matrix_world=rotation@o.matrix_world
    def cottage():
        rr('garden house foundation',(0,0,.10),(3.4,3.45,.20),'roofdeck',.22)
        rr('warm plaster house',(0,0,1.08),(2.95,2.6,1.95),'cream',.16)
        pitched_roof(0,0,2.1,3.35,3.0)
        for x in [-.95,.95]:
            rr('deep blue window reveal',(x,-1.315,1.16),(.67,.06,.85),'glassdark',.06)
            box('window cross mullion',(x,-1.36,1.16),(.035,.04,.85),'white')
            box('window horizontal mullion',(x,-1.36,1.16),(.67,.04,.036),'white')
            rr('stone window sill',(x,-1.43,.71),(.78,.25,.09),'white',.04)
            planter(x,-1.47,.22,.67,.28)
        rr('entry recessed door',(0,-1.33,.63),(.48,.08,1.08),'teal',.055)
        beam('door pull',(.15,-1.395,.50),(.15,-1.395,.77),.017,'alloy')
        rr('small porch canopy',(0,-1.53,1.81),(.94,.69,.11),'white',.14)
        for x in [-1.47,1.47]:
            for yy in [-.5,.55]:
                rr('side glazing',(x,yy,1.16),(.04,.63,.85),'glass',.012)
                box('side window centre',(x*1.01,yy,1.16),(.03,.035,.85),'white')
        rr('porch step',(0,-1.58,.16),(.98,.37,.13),'white',.08)
        for x in [-1.25,1.25]:beam('downspout',(x,1.39,.24),(x,1.39,2.03),.028,'white')
    def school():
        rr('school forecourt',(0,0,.1),(8.5,5.0,.2),'roofdeck',.22)
        rr('school classroom wings',(0,.3,1.8),(7.6,3.6,3.3),'cream',.15)
        pitched_roof(0,.3,3.51,8.0,4.0)
        for x in [-3,-2,-1,0,1,2,3]:
            for z in [1.12,2.48]:
                rr('classroom recessed window',(x,-1.52,z),(.60,.08,.80),'glass',.06)
                box('classroom white mullion',(x,-1.58,z),(.038,.04,.8),'white')
                box('classroom stone sill',(x,-1.65,z-.44),(.74,.25,.085),'white')
        rr('school entrance doors',(0,-1.63,.83),(1.3,.07,1.42),'glassdark',.08)
        for x in [-.76,.76]:cyl('porch column',(x,-2.11,.92),.072,1.7,'white',16)
        rr('school entrance shade',(0,-1.94,1.84),(2.0,1.0,.16),'white',.12)
        rr('school identity plaque',(0,-1.65,3.14),(2.8,.10,.59),'white',.09)
        label('ESCOLA',(0,-1.72,2.96),.43,'navy')
        for x in [-3.8,3.8]:planter(x,-1.7,.2,.62,.48)
    def fishmarket():
        rr('quay warehouse footing',(0,0,.1),(4.8,3.9,.2),'roofdeck',.3)
        rr('fish market rounded shell',(0,0,1.35),(4.2,3.3,2.5),'white',.48)
        rr('blue fish sign',(0,-1.72,1.6),(2.0,.15,1.4),'teal',.16)
        ball('fish symbol',(0,-1.82,1.74),(.58,.055,.27),'white')
        mesh('fish tail',[(-.49,-1.87,1.74),(-.86,-1.87,2.05),(-.86,-1.87,1.44)],[(0,1,2)],'white')
        ball('fish eye',(.32,-1.89,1.82),(.045,.015,.045),'navy',1)
        label('PEIXARIA',(0,-1.83,1.15),.22,'white')
        for x in [-1.55,1.55]:rr('market door',(x,-1.68,.95),(.67,.06,1.6),'glassdark',.08)
        roof('fish-market',4.25,3.4,2.65)
        for i,c in enumerate(['gold','coral','glassdark']):
            rr('fish shipping crate',(-1.5+i*.58,-2.02,.30),(.49,.51,.41),c,.04)
            for j in range(3):box('crate board seam',(-1.5+i*.58,-2.282,.17+j*.12),(.47,.025,.025),'wood')
    result={'eco-observatory':observatory,'eco-dome':eco_dome,'central-station':station,'station-canopy':station_canopy,'river-dam':dam,'arched-bridge':arch_bridge,'recycling-centre':recycling,'excavator':excavator,'grid-pylon':pylon,'ruined-building':ruined,'industrial-works':industry,'solar-cottage':cottage,'solar-school':school,'fish-market':fishmarket}
    def solar_rack():
        for x in [-1.05,1.05]:
            for y in [-.65,.65]:
                rr('solar rack concrete foot',(x,y,.08),(.42,.35,.16),'stone',.06)
                beam('panel mounting leg',(x,y,.16),(x,y,.90+y*.33),.055,'metal')
        for x in [-.69,.69]:solar(x,0,1.02,1.28,1.8)
        beam('rack cross support',(-1.05,.6,.25),(1.05,.6,1.04),.035,'metal')
        rr('inverter enclosure',(0,.7,.44),(.40,.25,.52),'white',.06)
        label('ENERGIA',(0,.55,.36),.09)
    result['solar-rack']=solar_rack
    def polished(name,fn):
        def build():
            fn()
            # All exposed elevations need real windows, reveals and service
            # fittings, not only a decorated front for one camera angle.
            sizes={'central-station':(7.6,3.8,2.6),'recycling-centre':(6.8,4.4,3.4),'industrial-works':(6.6,5.1,3.3),'solar-school':(7.6,3.6,3.3),'fish-market':(4.2,3.3,2.5),'ruined-building':(3.6,3.1,4.3)}
            if name in sizes:
                w,d,height=sizes[name];cy=.4 if name=='recycling-centre' else .3 if name=='solar-school' else 0
                for side in [-1,1]:
                    for yy in [-d*.27,0,d*.27]:
                        for z in ([1.0,2.4,3.65] if name=='ruined-building' else [1.22,2.5] if height>3 else [1.4]):
                            box('side window recess',(side*(w/2+.015),yy+cy,z),(.035,.55,.65),'dark' if name=='ruined-building' else 'glassdark')
                            box('side window sill',(side*(w/2+.09),yy+cy,z-.35),(.18,.67,.08),'stone' if name=='ruined-building' else 'white')
                            box('side window mullion',(side*(w/2+.045),yy+cy,z),(.035,.035,.65),'white')
                for x in [-w*.29,w*.29]:
                    box('rear glazed opening',(x,cy+d/2+.022,1.6),(.9,.04,.85),'glassdark')
                    rr('rear ventilation unit',(x,cy+d/2+.2,.62),(.55,.36,.48),'metal',.05)
                if name=='ruined-building':
                    for i in range(7):
                        x=-1.3+i*.38
                        beam('broken roof reinforcement',(x,.4,4.45),(x+.13,.75,4.84),.018,'rust',6)
                    for i in range(12):
                        x=-1.5+(i%4)*.85;y=-.5+(i//4)*.55
                        box('roof rubble',(x,y,4.53),(.25,.35,.20),'masonry',.03)
                    for side in [-1,1]:
                        for z in [1.7,3.1]:
                            for j in range(4):beam('plaster fissure',(side*1.81,-.9+j*.23,z-j*.19),(side*1.81,-.7+j*.23,z-.25-j*.19),.013,'rust',6)
                if name=='fish-market':
                    rr('fishmarket shade',(0,-1.97,2.36),(3.4,.8,.11),'white',.10)
                    for x in [-1.5,1.5]:beam('awning bracket',(x,-1.64,2.12),(x,-2.25,2.31),.024,'metal')
            if name=='central-station':
                for x in [-3.4,3.4]:
                    rr('station timetable case',(x,-2.1,1.6),(.42,.08,.7),'navy',.04)
                    for z in [1.45,1.57,1.69]:box('timetable lettering',(x,-2.15,z),(.30,.016,.026),'white')
            if name=='excavator':
                for x in [-.72,.22]:beam('cab pillar',(x,-.78,1.48),(x,-.78,2.41),.028,'gold')
                beam('cab windshield wiper',(.19,-.79,1.53),(-.23,-.79,2.1),.015,'dark',6)
                for x in [-.62,.1]:box('cab worklight',(x,-.8,2.56),(.17,.09,.08),'white',.025)
        return build
    result={name:polished(name,fn) for name,fn in result.items()}
    api['FUTURE_LOD_MODELS'].update(result)
    return result
