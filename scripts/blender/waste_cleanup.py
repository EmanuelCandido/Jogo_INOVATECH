"""Readable, original miniature waste and collection assets, authored through Blender MCP."""
import math
import random
import bpy
from mathutils import Vector


def models(api):
    api['PALETTE'].update({
        'refuse':'34494C', 'refuse_light':'516666', 'carton':'B68A57',
        'carton_edge':'D8B580', 'paper_waste':'EEE6D3', 'pet':'73B6AC',
        'recycle':'28886E', 'recycle_dark':'1F5D52', 'aluminium':'B9C5C3',
        'can_red':'B65B48', 'collection_white':'E5EBDA',
    })
    api.setdefault('MATERIAL_ROUGHNESS', {}).update({'refuse':.52,'pet':.29,'aluminium':.35})
    api.setdefault('MATERIAL_METALLIC', {}).update({'aluminium':.55})
    api['FUTURE_LOD_MODELS'].update({'waste-pile','waste-partial','waste-bin','industrial-waste','cleanup-truck'})
    box, ico, finish = api['box'], api['ico'], api['finish']

    def mesh(name, vertices, faces, color, smooth=False):
        data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
        obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);finish(obj,name,color)
        for face in data.polygons:face.use_smooth=smooth
        return obj

    def lathe(name, profile, pos, color, wobble=0, seed=0):
        sides=12 if api.get('LOW_DETAIL') else 24
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

    def beam(name,a,b,r,color):
        d=Vector(b)-Vector(a)
        obj=api['cyl'](name,(Vector(a)+Vector(b))*.5,r,d.length,color,8 if api.get('LOW_DETAIL') else 12)
        obj.rotation_euler=d.to_track_quat('Z','Y').to_euler()
        return obj

    def bag(x,y,size,seed):
        profile=[(.13,0),(.24,.035),(.29,.16),(.27,.30),(.19,.40),(.057,.47),(.046,.52),(.092,.57),(.02,.60)]
        obj=lathe('creased tied refuse sack',[(r*size,z*size) for r,z in profile],(x,y,.02),'refuse' if seed%2 else 'refuse_light',.065,seed)
        # Uneven shoulders and a pinched neck read as flexible bags, not stones.
        for v in obj.data.vertices:
            v.co.x+=.055*size*math.sin((v.co.z/size)*4+seed)
        beam('sack knot',(x-.06*size,y,.535*size),(x+.072*size,y+.025,.535*size),.018*size,'recycle_dark')
        for i in range(3):
            a=-math.pi*.8+i*.52
            beam('pinched sack fold',(x+math.cos(a)*.23*size,y+math.sin(a)*.20*size,.23*size),(x+math.cos(a)*.09*size,y+math.sin(a)*.075*size,.44*size),.006*size,'refuse_light')

    def carton(x,y,z=.025):
        box('open carton bottom',(x,y,z+.025),(.36,.31,.035),'carton')
        for dx in [-.18,.18]:box('carton side',(x+dx,y,z+.14),(.025,.31,.25),'carton')
        for dy in [-.15,.15]:box('carton end',(x,y+dy,z+.14),(.36,.025,.25),'carton_edge')
        for side in [-1,1]:
            flap=box('bent open flap',(x+side*.21,y,z+.265),(.18,.30,.014),'carton_edge');flap.rotation_euler.y=side*.55
        box('carton shipping label',(x,y-.166,z+.14),(.15,.006,.10),'paper_waste')
        for i in range(3):box('label ink',(x-.043+i*.026,y-.170,z+.14),(.009,.006,.065),'refuse')

    def bottle(x,y,z,angle):
        obj=lathe('discarded bottle',[(.038,0),(.057,.02),(.057,.15),(.045,.20),(.023,.23),(.023,.28)],(0,0,0),'pet')
        obj.location=(x,y,z);obj.rotation_euler=(1.22,.3,angle)
        cap=api['cyl']('bottle cap',(0,0,.29),.028,.035,'recycle_dark',12);cap.parent=obj
        band=api['cyl']('bottle paper band',(0,0,.11),.059,.065,'paper_waste',12);band.parent=obj
        bpy.context.view_layer.update()
        for child in list(obj.children):
            matrix=child.matrix_world.copy();child.parent=None;child.matrix_world=matrix

    def can(x,y,z,angle):
        obj=lathe('crumpled drink can',[(.066,0),(.069,.018),(.061,.05),(.059,.11),(.068,.15),(.066,.165)],(0,0,0),'can_red',.06,2)
        obj.location=(x,y,z);obj.rotation_euler=(.3,1.03,angle)
        for h in [.006,.163]:
            lid=api['cyl']('aluminium can end',(0,0,h),.065,.014,'aluminium',12);lid.parent=obj
        stripe=api['cyl']('can stripe',(0,0,.083),.065,.035,'paper_waste',12);stripe.parent=obj
        bpy.context.view_layer.update()
        for child in list(obj.children):
            matrix=child.matrix_world.copy();child.parent=None;child.matrix_world=matrix

    def paper(x,y,seed):
        rng=random.Random(seed)
        points=[(x,y,.075)]+[(x+math.cos(i*math.tau/7)*.15,y+math.sin(i*math.tau/7)*.12,.015+rng.random()*.026) for i in range(7)]
        obj=mesh('creased paper',points,[(0,i+1,(i+1)%7+1) for i in range(7)],'paper_waste')
        solid=obj.modifiers.new('paper thickness','SOLIDIFY');solid.thickness=.004
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=solid.name)

    def pile(partial=False):
        for x,y,size,seed in ([(-.28,.1,.80,1),(.10,.12,.67,2)] if partial else [(-.35,.14,1,1),(.10,.30,1.12,2),(.40,.02,.8,3),(-.15,-.16,.78,4)]):bag(x,y,size,seed)
        if not partial:carton(.34,-.40);bottle(-.49,-.28,.09,.5)
        can(-.10,-.40,.10,1.2)
        paper(-.45,-.43,41)
        if not partial:paper(.40,.52,7);bottle(.56,.40,.10,-.8)

    def industrial():
        rng=random.Random(613)
        for i in range(17 if api.get('LOW_DETAIL') else 26):
            a=i*2.399;r=math.sqrt(rng.random())*.5
            obj=ico('fractured concrete',(math.cos(a)*r,math.sin(a)*r,.09+(.5-r)*.2),(.12+rng.random()*.07,.08+rng.random()*.06,.07+rng.random()*.05),'rubble',1)
            obj.rotation_euler=(rng.random(),rng.random(),a)
        for i in range(6):
            a=i*1.2
            obj=box('broken hollow brick',(.36*math.cos(a),.32*math.sin(a),.17),(.22,.115,.09),'rust',.011);obj.rotation_euler.z=a
        for i in range(4):
            obj=box('discarded pallet slat',(-.19+i*.105,.05,.25+i*.032),(.085,.83-i*.08,.028),'carton',.003);obj.rotation_euler=(.08*i,-.15,.6+i*.09)
        # Folded sheet has an actual bend and thickness instead of a flat slab.
        obj=mesh('bent metal sheet',[(-.3,-.32,.17),(.06,-.32,.17),(.06,-.02,.24),(-.3,-.02,.28),(-.3,.09,.37),(.06,.09,.30)],[(0,1,2,3),(3,2,5,4)],'aluminium')
        mod=obj.modifiers.new('metal thickness','SOLIDIFY');mod.thickness=.012;bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.ops.mesh.primitive_torus_add(major_radius=.145,minor_radius=.047,major_segments=16 if api.get('LOW_DETAIL') else 24,minor_segments=6 if api.get('LOW_DETAIL') else 10,location=(.32,-.25,.16),rotation=(.3,-.2,.3))
        obj=finish(bpy.context.object,'discarded tyre','rubber')
        for f in obj.data.polygons:f.use_smooth=True
        bag(-.40,.33,.55,5);paper(.33,.35,24)
        # This pile repeats across the whole lot: retain the six-material
        # budget instead of adding a draw call for each tiny bag fitting.
        replacements={'eco.refuse_light':'refuse','eco.recycle_dark':'refuse','eco.paper_waste':'rubble'}
        for obj in bpy.context.scene.objects:
            if obj.type!='MESH':continue
            for slot in obj.material_slots:
                if slot.material and slot.material.name in replacements:slot.material=api['mat'](replacements[slot.material.name])

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

    return {'waste-pile':pile,'waste-partial':lambda:pile(True),'waste-bin':bin,'industrial-waste':industrial,'cleanup-truck':truck}
