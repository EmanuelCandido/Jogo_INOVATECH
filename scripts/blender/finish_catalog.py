"""Second modelling pass: functional joinery and identifying details, within kit footprints.

All dimensions are Blender Z-up. Front doors face -Y; benches face -X.
This pass deliberately adds geometry, not textures or a generic material override.
"""
import math
import bpy
from mathutils import Vector

def models(api, originals):
    box,cyl,ico,finish=(api[k] for k in ('box','cyl','ico','finish'))
    api['PALETTE'].update({'woodlight':'D1A46E','wooddark':'92633F','moss':'769166','navy':'246B91','sand':'E9CC95'})
    def beam(name,a,b,r,color='metal',n=8):
        v=Vector(b)-Vector(a);o=cyl(name,(Vector(a)+Vector(b))/2,r,v.length,color,n)
        o.rotation_euler=v.to_track_quat('Z','Y').to_euler();return o
    def mesh(name,v,f,color):
        m=bpy.data.meshes.new(name);m.from_pydata(v,[],f);m.update()
        o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);return finish(o,name,color)
    def ring(name,p,r,t=.012,color='white',axis='Z',segments=16):
        bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=t,major_segments=segments,minor_segments=6,location=p)
        o=finish(bpy.context.object,name,color)
        if axis=='Y':o.rotation_euler.x=math.pi/2
        if axis=='X':o.rotation_euler.y=math.pi/2
        return o
    def label(value,p,size=.12,color='white',angle=0):
        bpy.ops.object.text_add(location=p);o=bpy.context.object;o.data.body=value;o.data.align_x='CENTER';o.data.size=size;o.data.extrude=.0015;o.data.resolution_u=2
        o.rotation_euler=(math.pi/2,0,angle);bpy.ops.object.convert(target='MESH');return finish(bpy.context.object,'lettering '+value,color)
    def ball(name,p,s,color):
        o=ico(name,p,s,color,2)
        for f in o.data.polygons:f.use_smooth=True
        return o
    def bolt(p,r=.014):cyl('recessed fixing',p,r,.012,'metal',8)
    def facade_detail(w,d,h,house=False):
        # Joints, ground-floor lighting and services give scale without spreading onto pavements.
        for x in [-w*.42,w*.42]:
            beam('rainwater pipe',(x,d/2+.025,.24),(x,d/2+.025,h-.1),.023)
            for z in [.38,h*.52,h-.24]:box('pipe bracket',(x,d/2+.03,z),(.11,.04,.034),'metal')
        for x in [-.32,.32]:
            box('entry light bracket',(x,-d/2-.055,1.14),(.10,.08,.14),'metal',.02)
            box('entry opal light',(x,-d/2-.103,1.15),(.065,.015,.085),'signal')
        box('letterbox',(.31,-d/2-.057,.71),(.16,.05,.14),'metal',.02)
        box('letterbox slot',(.31,-d/2-.086,.74),(.115,.012,.014),'dark')
        box('intercom',(-.28,-d/2-.073,.75),(.07,.032,.12),'white')
        for z in [.74,.78]:box('intercom grille',(-.28,-d/2-.092,z),(.04,.008,.012),'dark')
        if not house:
            for side in [-1,1]:
                for z in [.45,.62,.79,.96]:box('corner masonry joint',(side*(w/2+.014),-d/2+.16,z),(.028,.3,.016),'trim')
            for x in [-w*.3,w*.3]:
                box('service panel',(x,d/2+.033,.55),(.25,.045,.4),'roof')
                for z in [.43,.49,.55,.61]:box('service grille',(x,d/2+.061,z),(.18,.008,.015),'white')
    def balcony(x,y,z):
        box('balcony floor',(x,y-.06,z),(.55,.22,.055),'white')
        for dx in [-.25,-.125,0,.125,.25]:beam('balcony baluster',(x+dx,y-.16,z),(x+dx,y-.16,z+.24),.012)
        beam('balcony top rail',(x-.27,y-.16,z+.24),(x+.27,y-.16,z+.24),.016)
        for dx in [-.26,.26]:beam('balcony return',(x+dx,y+.035,z+.24),(x+dx,y-.16,z+.24),.014)
    def town(name):
        floors=5 if name in ['townhouse-coral','townhouse-sage'] else 4
        facade_detail(2.35,2.08,.4+floors*.77)
        for x in [-.752,.752]:balcony(x,-1.10,1.95 if floors==5 else 2.72)
        box('shop name fascia',(0,-1.1,1.06),(.46,.04,.13),'teal')
        label('LOJA',(0,-1.125,1.03),.085)
    def house(name):
        facade_detail(2,1.8,1.7,True)
        for side in [-1,1]:
            for y in [-.7,0,.7]:box('eave bracket',(side*1.04,y,1.71),(.08,.055,.18),'white')
            for y in [-1.3,1.1]:ball('fence post cap',(side*1.24,y,.535),(.047,.057,.026),'white')
        box('porch mat',(0,-1.32,.185),(.38,.19,.012),'wooddark')
        box('house number board',(-.3,-.95,1.2),(.18,.03,.105),'navy');label('24',(-.3,-.969,1.17),.075)
        # Rear gate, with an open central path rather than fencing through it.
        for a,b in [(-1.24,-.34),(.34,1.24)]:
            for z in [.19,.38]:beam('rear fence rail',(a,1.12,z),(b,1.12,z),.021,'white')
            for i in range(5):box('rear picket',(a+(b-a)*i/4,1.12,.27),(.05,.055,.5),'white')
    def vegetation(name):
        if name=='shrub':
            for i in range(4):
                a=i*2.4;beam('shrub woody stem',(0,0,.04),(.25*math.cos(a),.18*math.sin(a),.22),.017,'trunk',6)
            for x in [-.25,0,.25]:cyl('flower heart',(x,-.16,.502),.016,.013,'signal',8)
            return
        if name=='rock':
            # Colour actual rock faces: floating flattened spheres looked like stickers.
            for o in list(bpy.context.scene.objects):
                if o.type!='MESH':continue
                o.data.materials.append(api['mat']('moss'))
                for f in o.data.polygons:
                    if f.normal.z>.45 and f.index%7==0:f.material_index=len(o.data.materials)-1
            ico('weathered stone chip',(-.29,.13,.025),(.11,.075,.07),'stone',1)
            return
        r=.07 if name in ['tree','pine','tree-birch','tree-thicket'] else .10
        for i in range(5):
            a=i*math.tau/5
            beam('root flare',(r*.6*math.cos(a),r*.6*math.sin(a),.24),(r*2.1*math.cos(a),r*2.1*math.sin(a),.018),r*.28,'birch' if name=='tree-birch' else 'trunk',6)
        if name in ['tree-fir','pine']:
            for i in range(5):
                a=i*2.4;beam('visible lower bough',(0,0,.52),(.27*math.cos(a),.27*math.sin(a),.62),.013,'trunk',6)
        elif name not in ['tree','tree-thicket']:
            # Asymmetric tips preserve a compact canopy suited to overlapping groves.
            height=1.58 if name in ['tree','tree-thicket'] else 2.14
            for i in range(3):
                a=i*2.4+.2;ball('young leaf tips',(.38*math.cos(a),.32*math.sin(a),height+i*.08),(.16,.14,.21),'leaflight')
    def vehicle(name):
        car=name.startswith('car-');truck=name=='delivery-truck';train=name=='train-carriage'
        half=.93 if car else 1.9 if truck else 1.88 if train else 1.43
        z=.26 if car else .34
        for end in [-1,1]:
            box('registration plate',(0,end*half,z),(.18,.016,.063),'white')
            for i in range(4):box('plate characters',(-.056+i*.037,end*(half+.01),z),(.017,.006,.026),'navy')
        if car:
            for x in [-.14,.14]:beam('windscreen wiper',(x,-.514,.5),(x+.07,-.425,.66),.009)
            for side in [-1,1]:
                box('door seam',(side*.419,.03,.40),(.008,.009,.17),'metal')
                box('side indicator',(side*.423,-.48,.43),(.012,.08,.025),'signal')
            beam('roof aerial',(.18,.32,.83),(.18,.39,1.0),.008,'metal',6)
        elif truck:
            for x in [-.42,.42]:
                for y in [-.72,1.9]:box('cargo corner guard',(x,y,1.1),(.055,.045,1.25),'metal')
                for z in [.56,1.18,1.57]:box('door hinge',(x,1.995,z),(.10,.045,.045),'metal')
                box('tail lamps',(x,1.99,.39),(.12,.04,.075),'red')
            for side in [-1,1]:
                box('delivery blue panel',(side*.551,.45,1.17),(.012,1.25,.43),'navy')
                for y in [-.08,.15,.38,.61]:box('delivery marking',(side*.56,y,1.17),(.009,.12,.12),'white')
                beam('side underrun bar',(side*.51,-.51,.3),(side*.51,.38,.3),.035)
            box('tail lift',(0,2,.33),(.91,.08,.12),'metal')
        else:
            for x in [-.27,.27]:box('roof safety beacon',(x,-half+.25,1.27),(.07,.095,.045),'signal')
            for side in [-1,1]:
                box('fleet number plaque',(side*.481,.8,.49),(.018,.25,.1),'navy')
                for y in [-.4,-.2,0,.2,.4]:box('rear engine grille',(side*.484,y,.36),(.01,.025,.10),'metal')
            if train:
                for end in [-1,1]:
                    for y in [half*.92,half*.96]:box('gangway rib',(0,end*y,.82),(.7,.035,.58),'dark')
            else:
                for y in [-.81,.405]:box('accessible door sill',(.53,y,.28),(.045,.31,.03),'signal')
    def public_building(name):
        if name=='hospital':
            for x in [-.17,.17]:box('sliding door stile',(x,-1.575,.61),(.025,.024,1.02),'white')
            for z in [.43,.8]:box('door visibility band',(0,-1.577,z),(.66,.015,.035),'teal')
            for x in [-1.95,1.95]:box('emergency wall light',(x,-1.083,2.02),(.25,.09,.09),'white')
            label('URGENCIA',(0,-2.31,1.20),.093)
            box('ambulance bay stripe',(1.7,-1.78,.126),(.08,.28,.01),'red')
        elif name=='school':
            for x in [-.16,.16]:box('double entrance handle',(x,-1.312,.65),(.025,.025,.18),'white')
            for i in range(12):
                a=i*math.tau/12;ball('clock hour index',(.197*math.sin(a),-1.313,2.75+.197*math.cos(a)),(.013,.009,.013),'metal')
            for x in [-1.8,-1.2,1.2,1.8]:
                box('brick soldier course',(x,-1.153,2.70),(.3,.018,.06),'trim')
            box('school notice board',(.67,-1.163,.70),(.4,.035,.36),'wooddark');box('school notices',(.67,-1.185,.71),(.33,.01,.28),'white')
        elif name=='civic':
            for x in [-1.32,-.66,.66,1.32]:
                for z in [.25,2.15]:cyl('column collar',(x,-1.49,z),.086,.035,'trim',12)
            for x in [-.42,.42]:box('hall wall lantern',(x,-1.345,1.12),(.11,.11,.22),'gold',.015)
            box('municipal crest',(0,-1.371,1.7),(.23,.04,.29),'teal',.02);label('EQ',(0,-1.398,1.65),.12,'gold')
            for y in [-.46,.46]:beam('dome rib',(-.42,y,3.78),(0,y*.1,4.37),.013,'white')
        elif name=='factory':
            for x in [-1.15,1.15]:
                for z in [2.95,3.65,4.35]:ring('stack reinforcing band',(x,.8,z),.205,.018,'metal')
                for z in [2.6+i*.22 for i in range(10)]:beam('chimney ladder rung',(x-.09,1.02,z),(x+.09,1.02,z),.012)
            for x in [-1.2,0,1.2]:
                for dx in [-.38,.38]:box('dock rubber buffer',(x+dx,-1.854,.17),(.08,.055,.22),'rubber')
                box('loading lamp',(x,-1.51,1.16),(.2,.08,.065),'signal')
        elif name=='port-warehouse':
            for i,x in enumerate([-2.2,0,2.2]):
                label(str(i+1).zfill(2),(x,-1.755,1.85),.16)
                for dx in [-.63,.63]:box('dock rubber buffer',(x+dx,-2.22,.25),(.13,.06,.25),'rubber')
                box('bay lamp',(x,-1.74,2.11),(.31,.10,.07),'signal')
            for x in [-2.7,2.7]:box('yard drainage grate',(x,-2.32,.10),(.5,.23,.012),'metal')
        elif name=='office-glass':
            for x in [-.15,.15]:box('office door handles',(x,-1.219,.5),(.027,.03,.18),'metal')
            for side in [-1,1]:
                for z in [1.56,3.16,4.76]:box('spandrel reflection',(side*1.266,0,z),(.012,1.08,.12),'navy')
            label('01',(.99,-1.181,.53),.12,'white')
        elif name=='greenhouse':
            for x in [-.25,.25]:box('door lower rail',(x,-1.316,.25),(.45,.035,.03),'white')
            box('botanical name board',(0,-1.32,1.55),(.72,.045,.19),'teal');label('HORTA',(0,-1.346,1.50),.12)
            for x in [-1.65,1.65]:
                for y in [-.8,0,.8]:
                    beam('plant marker',(x,y,.43),(x,y,.59),.01,'wood');box('seed label',(x,y-.014,.58),(.1,.018,.06),'white')
        elif name=='corner-cafe':
            for x in [-1.17,1.17]:ring('cup handle',(x+.045,-1.27,.55),.024,.007,'white',axis='Y')
            box('open sign',(-.25,-1.11,.99),(.24,.025,.105),'teal');label('ABERTO',(-.25,-1.128,.96),.055)
            for y in [-.7,0,.7]:box('rear service vent',(1.443,y,1.3),(.04,.27,.06),'metal')
        elif name=='fuel-station':
            for x in [-1,1]:
                for y in [-1.45,.04]:box('under canopy light',(x,y,1.811),(.34,.14,.025),'white')
                box('payment keypad',(x+.11,-.895,.59),(.11,.015,.12),'metal')
                for z in [.56,.6,.64]:box('keypad buttons',(x+.11,-.906,z),(.07,.008,.016),'white')
            box('shop door handle',(.23,.429,.71),(.03,.024,.17),'metal')
    def equipment(name):
        if name=='bench':
            for y in [-.48,.48]:
                for x in [-.15,.15]:box('anchored bench foot',(x,y,.032),(.12,.15,.034),'metal')
                for x in [-.17,.175]:bolt((x,y,.58))
                for z in [.73,.85,.97]:
                    o=cyl('backrest screw',(.269,y,z),.013,.008,'metal',8);o.rotation_euler.y=math.pi/2
            box('maker badge',(.269,0,.85),(.007,.18,.044),'gold')
        elif name in ['lamp','traffic']:
            box('maintenance hatch',(0,-.035,.25),(.049,.016,.13),'roof')
            for x in [-.045,.045]:bolt((x,0,.127),.008)
            if name=='traffic':
                for x in [0,.52]:
                    for z in [1.85,1.96,2.07]:box('signal sun visor',(x,-.14,z+.041),(.092,.075,.016),'dark')
            else:box('photocell',(.48,0,2.277),(.05,.047,.035),'navy')
        elif name=='fountain':
            for i in range(16):
                a=i*math.tau/16
                beam('basin segment seam',(.76*math.cos(a),.76*math.sin(a),.697),(.87*math.cos(a),.87*math.sin(a),.697),.008,'stone',6)
            ring('bronze drain',(0,0,.60),.13,.015,'gold')
        elif name in ['access-ramp','access-temporary','access-step']:
            if name=='access-step':
                for x in [-.7,.7]:bolt((x,.35,.189))
                box('riser contrast',(0,-.506,.035),(1.76,.014,.065),'stone')
            else:
                for y in [-.63,-.4,-.17,.06,.29]:box('non slip tread',(0,y,(y+.8)*.225+.012),(1.65,.026,.012),'metal' if name=='access-temporary' else 'stone')
                for x in [-.88,.88]:beam('wheel edge guard',(x,-.79,.035),(x,.78,.388),.021,'signal' if name=='access-temporary' else 'teal')
        elif name in ['waste-pile','waste-partial']:
            for i in range(2 if name=='waste-partial' else 4):
                x=(i%3)*.43-.4;y=(i//3)*.43
                beam('bag folded seam',(x-.15,y-.15,.13),(x-.10,y-.15,.38),.008,'dark',6)
                beam('tied bag ends',(x-.05,y,.56),(x+.05,y,.58),.013,'metal',6)
            o=cyl('discarded drink can',(-.17,-.24,.07),.056,.14,'blue',12);o.rotation_euler.y=.9
            ring('can rim',(-.11,-.24,.11),.043,.007,'white')
            box('carton fold',(.48,-.25,.02),(.19,.14,.012),'sand')
        elif name=='waste-bin':
            beam('rear handle',(-.25,.33,.79),(.25,.33,.79),.022,'metal')
            for x in [-.22,.22]:box('lid hinge',(x,.315,.91),(.09,.09,.055),'metal')
            for x in [-.23,.23]:box('moulded bin rib',(x,-.315,.42),(.035,.025,.47),'leafdeep')
            label('RECICLE',(0,-.344,.27),.084)
        elif name=='bridge':
            for x in [-1.73,1.73]:box('deck expansion joint',(x,0,.358),(.027,1.44,.008),'dark')
            for x in [-1.25,1.25]:box('pier bearing',(x,0,.035),(.42,1.45,.085),'dark')
            for side in [-1,1]:
                for x in [-1.8,-1.2,-.6,0,.6,1.2,1.8]:ball('bridge post cap',(x,side*.89,.937),(.035,.035,.035),'white')
        elif name=='playground':
            # Close the sandbox except its deliberate 0.7-wide entrance.
            for x in [-1.71,1.71]:box('sandbox end edging',(x,0,.07),(.08,2.75,.14),'wood')
            for x in [-.4,.4]:ring('swing hanger',(x,0,1.44),.035,.012,'metal',axis='Y')
            box('play tower back panel',(1.48,.8,1.5),(.05,.45,.38),'blue')
            for x in [1.0,1.45]:
                for y in [.56,1.03]:box('tower anchor shoe',(x,y,.13),(.10,.10,.19),'metal')
        elif name=='lighthouse':
            for i in range(16):
                a=i*math.tau/16;beam('plinth stone joint',(.65*math.cos(a),.65*math.sin(a),.207),(.79*math.cos(a),.79*math.sin(a),.207),.008,'roof',6)
            box('door handle',(.1,-.657,.5),(.025,.02,.09),'gold');label('FAROL',(0,-.655,.92),.083,'navy')
        elif name.startswith('container-'):
            for x in [-.49,.49]:
                for y in [-1.275,1.275]:
                    for z in [.065,1.04]:box('corner lifting aperture',(x,y*1.007,z),(.041,.009,.032),'dark')
            for x in [-.25,.25]:
                for z in [.2,.87]:box('locking bar retainer',(x,1.31,z),(.07,.026,.028),'metal')
            label('ECO 0184',(.18,-1.292,.21),.07,'white')
        elif name=='harbor-crane':
            for y in [-.95,.95]:
                for i in range(9):
                    x=-1.8+i*.6;beam('walkway guard upright',(x,y,4.4),(x,y,4.69),.014)
                beam('walkway handrail',(-1.8,y,4.69),(3,y,4.69),.018)
            for y in [-.5,.5]:ring('hoist sheave',(2,y,3.79),.12,.02,'metal',axis='Y')
            for x in [-1.2,1.2]:box('warning stripe',(x,-1.355,.17),(.38,.014,.07),'signal')
        elif name=='cargo-ship':
            for side in [-1,1]:
                ring('lifering',(side*1.02,-3.02,1.4),.12,.035,'red',axis='X')
                for y in [-1.9,.7,2.4]:
                    o=cyl('rubber fender',(side*1.23,y,.17),.15,.09,'rubber',16);o.rotation_euler.y=math.pi/2
            beam('bow flagstaff',(0,4.1,.33),(0,4.1,.94),.023,'white')
            box('ensign',(.12,4.1,.84),(.24,.016,.14),'teal')
        elif name=='turbine':
            cyl('turbine foundation',(0,0,.03),.28,.06,'concrete',16)
            box('tower access door',(0,-.146,.30),(.115,.024,.31),'metal',.02)
            for i in range(8):
                a=i*math.tau/8;bolt((.23*math.cos(a),.23*math.sin(a),.065),.012)
            box('nacelle rear vent',(0,.484,3.49),(.20,.02,.13),'metal')
        elif name=='salvador':
            for x in [-.12,.12]:
                for y in [-.12,-.07]:box('shoe laces',(x,y,.171),(.12,.022,.015),'white')
            box('jacket zipper',(0,-.21,.89),(.016,.018,.35),'metal')
            for z in [.82,.89,.96]:ball('jacket fastener',(.045,-.207,z),(.014,.009,.014),'gold')
            box('backpack pocket',(0,.316,.82),(.23,.046,.22),'woodlight',.025)
    building_names={'hospital','school','civic','factory','greenhouse','office-glass','port-warehouse','corner-cafe','fuel-station'}
    tree_names={'tree','pine','shrub','rock','tree-oak','tree-maple','tree-birch','tree-fir','tree-thicket'}
    def polish(name):
        if name.startswith('townhouse-'):town(name)
        elif name.startswith('house-'):house(name)
        elif name in tree_names:vegetation(name)
        elif name.startswith('car-') or name in ['city-bus','train-carriage','delivery-truck']:vehicle(name)
        elif name in building_names:public_building(name)
        else:equipment(name)
    def wrap(name,fn):
        def build():fn();polish(name)
        return build
    return {name:wrap(name,fn) for name,fn in originals.items()}
