"""Readable, original miniature waste and collection assets, authored through Blender MCP.

The dump reads at map distance through a few large, clearly separate shapes:
tied bags in dark and saturated plastics, cardboard, a crate and bright litter
for household refuse; rubble, bricks, a pallet, drums and tyres for the
construction/industrial piles. Footprints and heights follow the bounds that
src/config/dumpSite.ts and situationVisuals.ts were laid out with.
"""
import math
import random
import bpy
from mathutils import Euler, Matrix, Vector


def models(api):
    api['PALETTE'].update({
        'refuse':'34494C', 'refuse_light':'516666', 'carton':'B68A57',
        'carton_edge':'D8B580', 'paper_waste':'EEE6D3', 'pet':'73B6AC',
        'recycle':'28886E', 'recycle_dark':'1F5D52', 'aluminium':'B9C5C3',
        'can_red':'B65B48', 'collection_white':'E5EBDA',
        'bag_blue':'3F86C4', 'bag_yellow':'EDB743',
    })
    api.setdefault('MATERIAL_ROUGHNESS', {}).update({'refuse':.52,'pet':.29,'aluminium':.35,'bag_blue':.46,'bag_yellow':.5})
    api.setdefault('MATERIAL_METALLIC', {}).update({'aluminium':.55})
    api['FUTURE_LOD_MODELS'].update({'waste-pile','waste-partial','waste-bin','industrial-waste','cleanup-truck'})
    box, ico, finish = api['box'], api['ico'], api['finish']
    low = lambda: api.get('LOW_DETAIL', False)

    def mesh(name, vertices, faces, color, smooth=False):
        data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
        obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);finish(obj,name,color)
        for face in data.polygons:face.use_smooth=smooth
        return obj

    def lathe(name, profile, pos, color, wobble=0, seed=0, sides=None):
        sides=sides or (12 if low() else 24)
        vertices=[];faces=[]
        for j,(radius,z) in enumerate(profile):
            for i in range(sides):
                a=i*math.tau/sides
                r=radius*(1+wobble*(math.sin(a*3+j*.4+seed)+.4*math.sin(a*7-j*.7)))
                vertices.append((pos[0]+r*math.cos(a),pos[1]+r*math.sin(a)*.86,pos[2]+z))
        for j in range(len(profile)-1):
            for i in range(sides):
                a=j*sides+i;b=j*sides+(i+1)%sides
                faces.append((a,b,b+sides,a+sides))
        faces.extend([tuple(reversed(range(sides))),tuple((len(profile)-1)*sides+i for i in range(sides))])
        return mesh(name,vertices,faces,color,True)

    def beam(name,a,b,r,color,sides=None):
        d=Vector(b)-Vector(a)
        obj=api['cyl'](name,(Vector(a)+Vector(b))*.5,r,d.length,color,sides or (8 if low() else 12))
        obj.rotation_euler=d.to_track_quat('Z','Y').to_euler()
        return obj

    def grouped(build, loc=(0,0,0), rot=(0,0,0), scale=1):
        """Author a small prop at the origin, then place all of its parts at once."""
        before={o.name for o in bpy.context.scene.objects}
        build();bpy.context.view_layer.update()
        s=scale if isinstance(scale,(tuple,list)) else (scale,)*3
        m=Matrix.Translation(loc)@Euler(rot).to_matrix().to_4x4()@Matrix.Diagonal((*s,1))
        for obj in bpy.context.scene.objects:
            if obj.name not in before:obj.matrix_world=m@obj.matrix_world

    def gem(name, centre, radii, color, rot=(0,0,0), jitter=0, seed=0):
        """Octahedral chip: a fold, a tie ear or a broken lump for 8 triangles."""
        rng=random.Random(seed)
        unit=[(1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1)]
        verts=[Vector(tuple(c*radii[k]*(1+jitter*rng.uniform(-1,1)) for k,c in enumerate(v))) for v in unit]
        faces=[(0,2,4),(2,1,4),(1,3,4),(3,0,4),(2,0,5),(1,2,5),(3,1,5),(0,3,5)]
        obj=mesh(name,verts,faces,color);obj.location=centre;obj.rotation_euler=rot
        return obj

    def lump(name, centre, scale, color, seed, rot=None):
        """Faceted chunk (concrete, crumpled paper) with a broken, uneven outline."""
        rng=random.Random(seed)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=centre)
        obj=bpy.context.object
        for v in obj.data.vertices:v.co*=1+.22*rng.uniform(-1,1)
        obj.scale=scale;obj.rotation_euler=rot or (rng.random(),rng.random(),rng.random()*math.tau)
        return finish(obj,name,color)

    # ---- household refuse -------------------------------------------------
    def sack(color, tie, seed, size=1.0):
        """Rounded tied bag at the origin: soft belly, gathered neck, two tie ears."""
        profile=[(.11,0),(.25,.04),(.30,.15),(.29,.27),(.21,.37),(.075,.44),(.045,.475),(.085,.53),(.03,.565)]
        obj=lathe('tied refuse sack',[(r*size,z*size) for r,z in profile],(0,0,0),color,.07,seed,9 if low() else 14)
        for v in obj.data.vertices:
            # Lopsided shoulders read as a soft bag rather than a smooth stone.
            v.co.x+=.045*size*math.sin((v.co.z/size)*4.2+seed)
            v.co.y+=.03*size*math.cos((v.co.z/size)*3.1+seed*.7)
        shift=.045*size*math.sin(.475*4.2+seed)
        for side in (-1,1):
            gem('sack tie',(shift+side*.07*size,0,.48*size),(.06*size,.026*size,.022*size),tie,(0,side*.5,.2*side))

    def sack_at(x,y,z,color,tie,seed,size=1.0,tilt=(0,0),yaw=0):
        grouped(lambda:sack(color,tie,seed,size),(x,y,z),(tilt[0],tilt[1],yaw))

    def closed_box(w,d,h):
        box('taped carton',(0,0,h/2),(w,d,h),'carton',.012)
        box('parcel tape',(0,0,h+.002),(w*.22,d+.012,.006),'carton_edge')
        box('carton label',(w*.22,-d/2-.004,h*.55),(w*.32,.006,h*.34),'paper_waste')

    def open_carton():
        box('open carton bottom',(0,0,.025),(.32,.27,.03),'carton')
        for dx in [-.16,.16]:box('carton side',(dx,0,.13),(.022,.27,.21),'carton')
        for dy in [-.13,.13]:box('carton end',(0,dy,.13),(.32,.022,.21),'carton_edge')
        for side in [-1,1]:
            flap=box('bent open flap',(side*.205,0,.235),(.15,.26,.012),'carton_edge');flap.rotation_euler.y=side*.6
        box('carton shipping label',(0,-.142,.13),(.13,.006,.08),'paper_waste')

    def crate():
        """Slatted fruit crate: open sides make it read as wood, not a block."""
        box('crate floor',(0,0,.012),(.30,.21,.02),'wood')
        for z in (.05,.115):
            for side in (-1,1):
                box('crate side slat',(0,side*.10,z),(.30,.016,.045),'wood')
                box('crate end slat',(side*.145,0,z),(.016,.21,.045),'wood')
        for sx in (-1,1):
            for sy in (-1,1):box('crate corner post',(sx*.14,sy*.095,.075),(.025,.025,.15),'wood')

    def bottle(color, cap):
        n=7 if low() else 10
        lathe('discarded bottle',[(.036,0),(.054,.018),(.054,.14),(.043,.19),(.022,.22),(.022,.26)],(0,0,0),color,sides=n)
        api['cyl']('bottle cap',(0,0,.272),.026,.03,cap,n)
        api['cyl']('bottle label',(0,0,.10),.057,.06,'paper_waste',n)

    def can(color):
        n=7 if low() else 10
        lathe('crumpled drink can',[(.05,0),(.052,.014),(.046,.04),(.045,.085),(.051,.115),(.05,.128)],(0,0,0),color,.07,2,n)
        for h in [.004,.126]:api['cyl']('aluminium can end',(0,0,h),.049,.01,'aluminium',n)

    def lying(build, x, y, yaw, radius):
        """Bottles and cans rest on their side with their curved flank on the ground."""
        grouped(build,(x,y,radius),(math.pi/2,0,yaw))

    def paper(x,y,seed,size=1.0):
        rng=random.Random(seed)
        points=[(0,0,.05*size)]+[(math.cos(i*math.tau/6)*.12*size,math.sin(i*math.tau/6)*.10*size,.008+rng.random()*.022*size) for i in range(6)]
        obj=mesh('creased paper',points,[(0,i+1,(i+1)%6+1) for i in range(6)],'paper_waste')
        obj.location=(x,y,0);obj.rotation_euler.z=rng.random()*math.tau
        solid=obj.modifiers.new('paper thickness','SOLIDIFY');solid.thickness=.004
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=solid.name)

    def plank(loc,size,rot,color='wood'):
        obj=box('broken plank',loc,size,color);obj.rotation_euler=rot;return obj

    def household():
        # Bottom ring of bags, then two bags resting on top: an actual heap.
        sack_at(-.30,.20,0,'refuse','bag_yellow',1,.98,(.05,-.08),.3)
        sack_at(.13,.33,0,'bag_blue','refuse',2,.92,(-.06,.04),1.1)
        sack_at(.36,-.02,0,'refuse','bag_yellow',3,.86,(.08,.10),2.0)
        sack_at(-.08,-.18,0,'bag_yellow','refuse',4,.82,(-.10,0),.7)
        sack_at(-.42,-.17,0,'refuse','bag_blue',5,.62,(.12,-.12),2.6)
        sack_at(-.10,.12,.17,'bag_blue','bag_yellow',6,.86,(.22,-.18),.4)
        sack_at(.18,.08,.15,'refuse','bag_yellow',7,.72,(-.20,.24),1.6)
        # Cardboard and a crate break up the bag silhouette at the front.
        grouped(lambda:closed_box(.26,.22,.18),(.36,-.38,0),(0,0,.42))
        grouped(open_carton,(.30,.36,0),(0,0,-.35))
        grouped(crate,(-.36,-.38,0),(0,0,-.18))
        grouped(lambda:bottle('pet','bag_blue'),(-.40,-.40,.03),(.55,0,.6))
        # A board pokes out of the heap so the outline is not a dome.
        plank((-.30,.02,.36),(.055,.62,.022),(.95,.12,.35))
        if not low():plank((.42,.18,.08),(.36,.05,.02),(.0,.25,1.1))
        # Bright litter spread around the base.
        lying(lambda:can('can_red'),.06,-.46,1.9,.05)
        lying(lambda:can('bag_yellow'),.46,.14,2.6,.05)
        if not low():lying(lambda:can('bag_blue'),-.52,.20,.2,.05)
        lying(lambda:bottle('pet','can_red'),.14,-.32,-.9,.054)
        if not low():lying(lambda:bottle('bag_yellow','refuse'),-.32,.48,math.pi/2,.054)
        lump('crumpled paper',(.50,-.18,.04),(.05,.045,.04),'paper_waste',11)
        if not low():lump('crumpled paper',(-.12,-.50,.04),(.045,.05,.04),'paper_waste',12)
        if not low():lump('crumpled paper',(.05,.56,.035),(.04,.045,.035),'paper_waste',13)
        paper(-.25,-.38,41);paper(.52,-.45,7,.8)

    def partial():
        # What is left after the first collection: two bags and loose litter,
        # kept inside the original remainder footprint (x<.31, y>-.55).
        sack_at(-.30,-.02,0,'refuse','bag_yellow',1,.85,(.06,-.05),.5)
        sack_at(.06,-.14,0,'bag_blue','refuse',2,.62,(-.10,.08),1.4)
        flat=box('flattened carton',(-.30,-.38,.012),(.32,.22,.018),'carton');flat.rotation_euler=(.04,-.03,.35)
        box('flattened carton tape',(-.30,-.38,.023),(.06,.22,.004),'carton_edge').rotation_euler=(.04,-.03,.35)
        lying(lambda:can('can_red'),.16,-.42,.3,.05)
        lying(lambda:bottle('pet','bag_blue'),-.50,-.12,1.9,.054)
        if not low():lying(lambda:can('bag_yellow'),.18,.18,2.3,.05)
        lump('crumpled paper',(-.06,.20,.04),(.05,.045,.04),'paper_waste',21)
        paper(-.46,.17,24,.85);paper(.10,-.46,9,.7)

    # ---- construction / industrial refuse --------------------------------
    def mound(name, rx, ry, h, color, seed, rings=3, sectors=12):
        rng=random.Random(seed);verts=[(0,0,h)];faces=[]
        for j in range(1,rings+1):
            t=j/rings
            for i in range(sectors):
                a=i*math.tau/sectors+rng.uniform(-.12,.12)
                r=t*(1+.13*math.sin(a*3+seed)+.07*rng.uniform(-1,1))
                z=-.02 if j==rings else h*(1-t**1.5)*(1+.22*rng.uniform(-1,1))
                verts.append((rx*r*math.cos(a),ry*r*math.sin(a),z))
        for i in range(sectors):faces.append((0,1+i,1+(i+1)%sectors))
        for j in range(rings-1):
            for i in range(sectors):
                a=1+j*sectors;b=a+sectors;k=(i+1)%sectors
                faces.append((a+i,b+i,b+k,a+k))
        return mesh(name,verts,faces,color)

    def pallet():
        for i in range(5):box('pallet deck board',(-.18+i*.09,0,.075),(.07,.40,.018),'wood')
        for y in (-.17,0,.17):box('pallet stringer',(0,y,.045),(.44,.05,.04),'wood')
        for x in (-.18,.18):box('pallet base board',(x,0,.015),(.08,.40,.018),'wood')

    def drum(r, h, sides, color='blue'):
        api['cyl']('steel drum',(0,0,h/2),r,h,color,sides)
        for z in (h*.33,h*.67):api['cyl']('drum rolling hoop',(0,0,z),r*1.04,.018,'aluminium',sides)
        api['cyl']('drum lid',(0,0,h+.004),r*.92,.01,'aluminium',sides)
        api['cyl']('drum bung',(r*.5,0,h+.014),r*.14,.016,'aluminium',6)

    def tyre(x,y,z,rot):
        bpy.ops.mesh.primitive_torus_add(major_radius=.12,minor_radius=.045,major_segments=12 if low() else 18,minor_segments=5 if low() else 7,location=(x,y,z),rotation=rot)
        obj=finish(bpy.context.object,'discarded tyre','rubber')
        for f in obj.data.polygons:f.use_smooth=True

    def corrugated(name, w, d, waves, color):
        verts=[];faces=[];n=waves*2
        for i in range(n+1):
            x=-w/2+w*i/n;z=.014*(1 if i%2 else -1)
            verts+= [(x,-d/2,z),(x,d/2,z)]
        for i in range(n):faces.append((2*i,2*i+2,2*i+3,2*i+1))
        obj=mesh(name,verts,faces,color)
        mod=obj.modifiers.new('sheet thickness','SOLIDIFY');mod.thickness=.008
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
        return obj

    def industrial():
        rng=random.Random(613)
        # Low rubble mound, so the props sit on a heap instead of floating apart.
        mound('rubble mound',.44,.46,.20,'rubble',613,3,10 if low() else 13).location=(-.06,-.02,0)
        chunks=[(-.30,.05,.17,.10),(-.08,-.20,.17,.09),(.12,.12,.15,.09),(-.12,.28,.12,.08),(.20,-.12,.11,.08),(-.40,-.18,.07,.07),(.02,.38,.06,.07),(-.47,.27,.05,.06)]
        for i,(x,y,z,s) in enumerate(chunks[:5] if low() else chunks):
            lump('broken concrete',(x,y,z),(s*1.3,s,s*.8),'rubble',700+i)
        # Slab with rebar: the clearest "construction debris" cue.
        slab=box('cracked concrete slab',(0,0,0),(.34,.24,.05),'rubble')
        grouped(lambda:[beam('bent rebar',(-.10+i*.1,.10,0),(-.13+i*.12,.25,.07+i*.02),.009,'rust',5) for i in range(3)],(0,0,0))
        bpy.context.view_layer.update()
        for obj in [slab]+[o for o in bpy.context.scene.objects if o.name.startswith('bent rebar')]:
            obj.matrix_world=Matrix.Translation((-.10,-.04,.20))@Euler((.30,-.14,.5)).to_matrix().to_4x4()@obj.matrix_world
        # Brick heap on one flank, pallet leaning on another: each yaw of the
        # repeated model shows a different face of the pile.
        bricks=[(.24,.30,.03,.2),(.33,.24,.03,1.7),(.27,.36,.08,.9),(.36,.33,.03,2.6),(.18,.40,.03,1.2),(.30,.29,.12,.4)]
        for i,(x,y,z,a) in enumerate(bricks[:4] if low() else bricks):
            box('loose brick',(x,y,z),(.16,.075,.055),'rust').rotation_euler=(rng.uniform(-.2,.2),rng.uniform(-.2,.2),a)
        grouped(pallet,(-.31,.20,.06),(.0,-.42,.9),.9)
        drum_sides=10 if low() else 14
        grouped(lambda:drum(.105,.30,drum_sides),(.33,-.33,0),(0,0,.3))
        # A second, rusted drum lies on its side: blue stays an accent, not a pattern.
        grouped(lambda:drum(.095,.27,drum_sides,'rust'),(-.28,-.30,.095),(math.pi/2,0,1.2))
        tyre(.06,-.40,.045,(.05,0,0));tyre(.08,-.39,.13,(.18,.08,.4))
        sheet=corrugated('bent roofing sheet',.30,.24,4,'aluminium');sheet.location=(.10,.06,.23);sheet.rotation_euler=(-.22,.30,-.6)
        plank((-.02,.20,.20),(.05,.46,.02),(.18,.0,1.25))
        if not low():plank((.28,.10,.10),(.40,.045,.02),(0,-.15,.45))

    def recycle_symbol(x,y,z,size):
        # Three clean arrow silhouettes, readable at map scale.
        for i in range(3):
            a=i*math.tau/3
            points=[(-.30,-.13),(.10,-.13),(.10,-.26),(.40,0),(.10,.25),(.10,.10),(-.30,.10)]
            verts=[]
            for px,pz in points:
                px,pz=px*size,pz*size+.28*size
                verts.append((x+px*math.cos(a)-pz*math.sin(a),y,z+px*math.sin(a)+pz*math.cos(a)))
            obj=mesh('recycling arrow',verts,[tuple(range(7))],'collection_white')
            mod=obj.modifiers.new('decal depth','SOLIDIFY');mod.thickness=.006;bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)

    def bin():
        obj=box('tapered collection bin',(0,0,.48),(.61,.59,.79),'recycle',.04)
        for v in obj.data.vertices:
            f=.86+.14*(v.co.z+.4)/.8;v.co.x*=f;v.co.y*=f
        box('reinforced rim',(0,0,.87),(.66,.65,.06),'recycle_dark',.019)
        box('sloped hinged lid',(0,-.015,.94),(.70,.69,.09),'recycle',.03)
        box('lid grip',(0,-.33,.99),(.25,.07,.038),'recycle_dark',.011)
        for x in [-.22,.22]:
            box('hinge',(x,.30,.925),(.08,.10,.08),'refuse',.01)
            wheel=api['cyl']('collection wheel',(x,.235,.105),.11,.072,'rubber',16);wheel.rotation_euler.y=math.pi/2
            box('vertical reinforcement',(x,-.298,.43),(.022,.017,.5),'recycle_dark')
        beam('bin rear handle',(-.25,.34,.81),(.25,.34,.81),.022,'refuse')
        recycle_symbol(0,-.307,.52,.28)

    def truck():
        box('collection chassis',(0,0,.38),(1.03,2.50,.15),'refuse',.035)
        box('collection cab',(0,-.84,.80),(1.02,.88,.81),'collection_white',.075)
        box('collection windscreen',(0,-1.29,.94),(.84,.016,.32),'glassdark',.018)
        for side in [-1,1]:
            box('cab side window',(side*.517,-.83,.98),(.012,.50,.29),'glassdark')
            box('door green band',(side*.519,-.84,.67),(.013,.61,.13),'recycle')
            box('door handle',(side*.53,-.62,.78),(.018,.12,.025),'refuse')
            for y in [-.85,.70]:
                wheel=api['cyl']('collection tyre',(side*.54,y,.29),.255,.17,'rubber',16);wheel.rotation_euler.y=math.pi/2
                hub=api['cyl']('collection hub',(side*.631,y,.29),.13,.023,'aluminium',12);hub.rotation_euler.y=math.pi/2
            box('headlight',(side*.32,-1.306,.65),(.21,.026,.10),'paper_waste',.01)
        box('compactor body',(0,.42,1.02),(1.09,1.55,1.10),'recycle',.09)
        box('upper white stripe',(0,.42,1.43),(1.115,1.47,.11),'collection_white')
        box('rear hopper',(0,1.28,.70),(1.04,.30,.47),'recycle_dark',.04)
        box('hopper opening',(0,1.443,.83),(.83,.02,.22),'refuse')
        box('rear lifting bar',(0,1.48,.52),(.88,.09,.08),'aluminium',.015)
        for side in [-1,1]:
            beam('compactor hydraulic ram',(side*.53,1.16,.63),(side*.53,1.04,1.40),.027,'aluminium')
            box('rear warning stripe',(side*.4,1.44,.64),(.13,.015,.30),'gold')
        box('front bumper',(0,-1.34,.44),(1.1,.13,.13),'refuse',.025)
        for x in [-.27,.27]:api['cyl']('amber beacon',(x,-.80,1.25),.075,.095,'gold',12)

    return {'waste-pile':household,'waste-partial':partial,'waste-bin':bin,'industrial-waste':industrial,'cleanup-truck':truck}
