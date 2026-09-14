"""Rounded cargo vessel, with a continuous sheer line and working deck fittings."""
import math
import bpy
from mathutils import Vector

def build(api,container,label,beam):
    box,cyl,finish=api['box'],api['cyl'],api['finish']
    low=api.get('LOW_DETAIL',False)
    def mesh(name,verts,faces,color,smooth=False):
        data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
        obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);finish(obj,name,color)
        for face in data.polygons:face.use_smooth=smooth
        return obj
    def bez(a,b,c,d,t):return tuple((1-t)**3*a[k]+3*(1-t)**2*t*b[k]+3*(1-t)*t*t*c[k]+t**3*d[k] for k in range(2))
    spans=[((0,-3.8),(1.12,-3.8),(1.2,-3.65),(1.2,-3.15)),((1.2,-3.15),(1.2,-1.8),(1.2,.5),(1.2,1.7)),((1.2,1.7),(1.2,3.05),(.25,4.43),(0,4.5))]
    side=[bez(*span,i/(8 if low else 18)) for span in spans for i in range(8 if low else 18)]+[(0,4.5)]
    outline=side+[(-x,y) for x,y in side[-2:0:-1]];n=len(outline)
    def shell(name,levels,color):
        verts=[(x*scale,y*scale,z) for z,scale in levels for x,y in outline]
        faces=[]
        for j in range(len(levels)-1):
            for i in range(n):faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
        return mesh(name,verts,faces,color,True)
    shell('curved lower hull',[(-.25,.76),(-.12,.88),(.04,.94)],'red')
    shell('continuous navy hull',[(.04,.94),(.18,.985),(.40,1)],'navy')
    shell('white sheer stripe',[(.27,.994),(.305,.997)],'white')
    shell('rounded gunwale',[(.398,1),(.43,.985)],'white')
    mesh('sealed working deck',[(x*.985,y*.985,.417) for x,y in outline],[tuple(range(n))],'roofdeck')
    mesh('keel closure',[(x*.76,y*.76,-.25) for x,y in outline],[tuple(reversed(range(n)))],'red')
    # Build a reusable corrugated container, merging its material groups first.
    before=set(bpy.context.scene.objects);container('blue')
    parts=set(bpy.context.scene.objects)-before;templates=[]
    groups=[[o for o in parts if o.type=='MESH' and o.data.materials[0]==material] for material in {o.data.materials[0] for o in parts if o.type=='MESH'}]
    for group in groups:
        bpy.ops.object.select_all(action='DESELECT')
        for o in group:o.select_set(True)
        bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join()
        bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
        templates.append(group[0])
    for row,y in enumerate([-1.55,-.43,.69,1.81]):
        for col,x in enumerate([-.67,0,.67]):
            for tier in range(2):
                color=['blue','red','signal','teal'][(row+col+tier)%4]
                for template in templates:
                    o=template.copy();o.data=template.data.copy();bpy.context.collection.objects.link(o)
                    if o.data.materials[0].name=='eco.blue':o.data.materials[0]=api['mat'](color)
                    o.location=Vector((x,y,.44+tier*.559));o.scale=(.59,.40,.49)
    for o in templates:bpy.data.objects.remove(o,do_unlink=True)
    box('aft accommodation',(0,-2.91,1.02),(1.72,1.30,1.20),'white',.12)
    box('bridge teal belt',(0,-2.91,1.46),(1.82,1.40,.12),'teal',.055)
    box('rounded wheelhouse',(0,-2.89,1.76),(1.96,1.48,.47),'white',.13)
    box('bridge visor',(0,-2.89,2.02),(2.12,1.61,.105),'white',.045)
    for s in [-1,1]:
        for x in [-.71,-.355,0,.355,.71]:box('bridge front glazing',(x,-2.89+s*.751,1.8),(.28,.026,.25),'glassdark',.012)
        for y in [-3.30,-2.93,-2.56]:box('bridge side glazing',(s*.984,y,1.8),(.028,.27,.25),'glassdark',.012)
        for y in [-3.15,-2.75]:
            o=cyl('brass porthole rim',(s*.866,y,1.02),.087,.025,'metal',20);o.rotation_euler.y=math.pi/2
            o=cyl('porthole glass',(s*.884,y,1.02),.063,.028,'glassdark',20);o.rotation_euler.y=math.pi/2
        box('bridge access door',(s*.868,-2.93,.72),(.024,.29,.46),'teal',.008)
        box('door handle',(s*.89,-2.84,.74),(.027,.035,.11),'white')
        box('covered rescue boat',(s*1.02,-2.45,.91),(.26,.75,.24),'orange',.09)
        beam('boat davit',(s*.93,-2.16,.52),(s*1.10,-2.16,1.10),.024,'metal')
    # Rails follow the curved perimeter, including bow and rounded stern.
    count=len(outline)
    for i,(x,y) in enumerate(outline):
        xx,yy=outline[(i+1)%count]
        for h in ([.71] if low else [.58,.73]):beam('continuous deck rail',(x*.97,y*.97,h),(xx*.97,yy*.97,h),.012,'white')
        if i%(4 if low else 5)==0:beam('rail stanchion',(x*.97,y*.97,.43),(x*.97,y*.97,.74),.014,'white')
    for y in [3.15,3.55]:
        cyl('mooring winch base',(0,y,.47),.19,.08,'metal',20)
        o=cyl('winch drum',(0,y,.59),.105,.31,'navy',20);o.rotation_euler.y=math.pi/2
        for x in [-.2,.2]:cyl('winch end',(x,y,.59),.12,.035,'metal',20).rotation_euler.y=math.pi/2
    for s in [-1,1]:
        for y in [-3.45,2.55]:
            for dy in [-.09,.09]:cyl('double mooring bollard',(s*.74,y+dy,.52),.039,.2,'metal',16)
            box('bollard plate',(s*.74,y,.435),(.22,.38,.03),'metal',.01)
        for z in [.10,.15,.20]:
            beam('bow draft marks',(s*.77,3.15,z),(s*.88,3.0,z),.008,'white')
    box('funnel',(.40,-2.82,2.28),(.38,.45,.47),'teal',.09)
    box('funnel crown',(.40,-2.82,2.52),(.40,.47,.07),'navy',.025)
    for y in [-2.95,-2.8,-2.65]:box('exhaust louver',(.4,y,2.563),(.28,.036,.014),'metal')
    beam('radar mast',(-.40,-3.04,2.07),(-.40,-3.04,2.83),.026,'metal')
    beam('radar scanner',(-.76,-3.04,2.63),(-.04,-3.04,2.63),.024,'white')
    for s in [-1,1]:box('navigation light',(s*.97,-2.64,2.09),(.08,.1,.07),'red' if s<0 else 'leaf')
    label('ECO PORTO',(0,-3.583,.91),.12,'navy')
    # Explicit dimensions let map placements use the real new hull envelope.
    api.setdefault('MODEL_ATTACHMENTS',{})['cargo-ship']={'front':[0,0,-1]}
    api.setdefault('FUTURE_POLISH_NOTES',{})['cargo-ship']='Casco curvo com proa e popa arredondadas, convés fechado, guarda-corpos contínuos, 24 contêineres corrugados, cabine, guinchos, radar e equipamentos de segurança.'
