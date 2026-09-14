"""Solar city architecture. Blender Z-up, fronts -Y (Three +Z).

All assemblies own their essential rooftop equipment. Runtime decorations use
the exported attachment manifest instead of guessing a roof from floor counts.
"""
import math
import bpy
from mathutils import Vector

def models(api,previous):
    box,raw_cyl,ico,finish=(api[k] for k in ('box','cyl','ico','finish'))
    def cyl(name,p,r,depth,color,n=12):
        o=raw_cyl(name,p,r,depth,color,max(n,24) if r>.10 and not api.get('LOW_DETAIL') else n)
        for f in o.data.polygons:
            if abs(f.normal.z)<.5:f.use_smooth=True
        return o
    api['PALETTE'].update({'white':'F4F6EE','trim':'DCE8E4','cream':'F1C45B','coral':'F08761',
        'pink':'F5B49E','sage':'6DC6BD','glass':'55B6DB','glassdark':'278EBF','solar':'245D90',
        'teal':'6DC6BD','metal':'6F929A','roofgrass':'7EB45B','roofdeck':'D1DDD5','leaf':'31A56B','leaflight':'82C65C',
        'flower':'F49FCA','petal':'F8C4DF','bloomshade':'D781B1','signal':'F1CF75','navy':'225878','led':'77DDE5'})
    api['PALETTE'].update({'paint_blue':'268BCD','paint_white':'F0EFE4','paint_coral':'E75C47','paint_gold':'E3B640','autoglass':'244D68','alloy':'BDCCD2'})
    api['MATERIAL_ROUGHNESS']={'glass':.30,'glassdark':.34,'solar':.4,'metal':.46,'white':.64,'led':.38,'autoglass':.22,'alloy':.3,**{'paint_'+c:.30 for c in ['blue','white','coral','gold']}}
    api['MATERIAL_METALLIC']={'alloy':.55,**{'paint_'+c:.16 for c in ['blue','white','coral','gold']}}
    metadata=api.setdefault('MODEL_ATTACHMENTS',{})
    def mesh(name,verts,faces,color):
        m=bpy.data.meshes.new(name);m.from_pydata(verts,[],faces);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);return finish(o,name,color)
    def beam(name,a,b,r,color='metal',n=8):
        v=Vector(b)-Vector(a);o=cyl(name,(Vector(a)+Vector(b))/2,r,v.length,color,n);o.rotation_euler=v.to_track_quat('Z','Y').to_euler();return o
    def rr(name,p,size,color='white',r=.2):
        """Rounded rectangle extrusion: curved corners without subdividing slabs."""
        w,d,h=size;r=min(r,w*.49,d*.49);points=[];normals=[]
        segments=4 if api.get('LOW_DETAIL') else 10
        for x,y,start in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]:
            for j in range(segments+1):
                a=math.radians(start+j*90/segments);points.append((x+r*math.cos(a),y+r*math.sin(a)));normals.append((math.cos(a),math.sin(a),0))
        n=len(points);verts=[(p[0]+x,p[1]+y,p[2]+z) for z in [-h/2,h/2] for x,y in points]
        faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        o=mesh(name,verts,faces,color)
        for f in o.data.polygons[2:]:f.use_smooth=True
        # Analytic corner normals keep broad walls planar. Averaging each large
        # wall with its tiny corner polygon makes the wall look swollen.
        split=[]
        for f in o.data.polygons:
            for li in f.loop_indices:split.append((0,0,-1 if f.index==0 else 1) if f.index<2 else normals[o.data.loops[li].vertex_index%n])
        o.data.normals_split_custom_set(split)
        if name in {'house footing','house shell','roof cornice','floor rim','balcony slab','soft roof white perimeter','paved building footprint','porch shade','setback upper cornice','coloured facade fin','asymmetric facade','garden low wall'}:
            # A small rolled edge catches light vertically as well as in plan.
            # Only architectural shells use it; fittings retain the light budget.
            bpy.context.view_layer.objects.active=o
            mod=o.modifiers.new('soft architectural edge','BEVEL');mod.width=min(.024,h*.23,w*.18,d*.18)
            mod.segments=2 if api.get('LOW_DETAIL') else 3;mod.limit_method='ANGLE';mod.angle_limit=.52;mod.harden_normals=True
            bpy.ops.object.modifier_apply(modifier=mod.name)
        return o
    def loft(name,levels,color):
        # Rounded vehicle profiles taper in both axes instead of stacking boxes.
        verts=[];segments=4 if api.get('LOW_DETAIL') else 8
        for z,w,d,cy,r in levels:
            for x,y,start in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]:
                for j in range(segments+1):
                    a=math.radians(start+j*90/segments);verts.append((x+r*math.cos(a),cy+y+r*math.sin(a),z))
        n=4*(segments+1);rows=len(levels)
        faces=[tuple(reversed(range(n))),tuple(range((rows-1)*n,rows*n))]
        faces += [(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(rows-1) for i in range(n)]
        o=mesh(name,verts,faces,color)
        for f in o.data.polygons[2:]:f.use_smooth=True
        return o
    def ball(name,p,s,color='leaf',sub=2):
        o=ico(name,p,s,color,sub)
        for f in o.data.polygons:f.use_smooth=True
        return o
    def label(value,p,size=.14,color='navy',flat=False):
        bpy.ops.object.text_add(location=p);o=bpy.context.object;o.data.body=value;o.data.align_x='CENTER';o.data.size=size;o.data.extrude=.001;o.data.resolution_u=2
        if not flat:o.rotation_euler.x=math.pi/2
        bpy.ops.object.convert(target='MESH');finish(bpy.context.object,'identity '+value,color)
    def solar(x,y,z,w=1.0,d=.65):
        # The inclination is authored in the vertices, including supporting feet.
        frame=mesh('solar white frame',[(x-w/2,y-d/2,z),(x+w/2,y-d/2,z),(x+w/2,y+d/2,z+.12),(x-w/2,y+d/2,z+.12)],[(0,1,2,3)],'white')
        mod=frame.modifiers.new('panel frame thickness','SOLIDIFY');mod.thickness=.025
        bpy.context.view_layer.objects.active=frame;bpy.ops.object.modifier_apply(modifier=mod.name)
        mesh('photovoltaic cells',[(x-w/2+.025,y-d/2+.025,z+.008),(x+w/2-.025,y-d/2+.025,z+.008),(x+w/2-.025,y+d/2-.025,z+.128),(x-w/2+.025,y+d/2-.025,z+.128)],[(0,1,2,3)],'solar')
        for dx in [-w/2+.04,0,w/2-.04]:beam('solar cell division',(x+dx,y-d/2+.03,z+.013),(x+dx,y+d/2-.03,z+.128),.007,'glass',6)
        for f in [.33,.66]:beam('solar transverse seam',(x-w/2+.025,y-d/2+d*f,z+.012+.12*f),(x+w/2-.025,y-d/2+d*f,z+.012+.12*f),.006,'glass',6)
        for dx in [-w*.32,w*.32]:box('panel foot',(x+dx,y+d*.25,z-.03),(.035,.06,.24),'metal')
    def planter(x,y,z,w=.7,d=.30):
        rr('integrated planter',(x,y,z+.10),(w,d,.2),'white',.10)
        rr('planter foliage',(x,y,z+.235),(w-.08,d-.065,.18),'leaf',.08)
        for dx in [-.25,.25]:ball('shrub tip',(x+dx*w,y,z+.32),(.12,.1,.11),'leaflight',1)
    def roof(name,w,d,z,accent='teal',x=0,y=0):
        rr('soft roof white perimeter' if name.startswith(('townhouse-','house-')) else 'roof white perimeter',(x,y,z+.055),(w,d,.11),'white',.26)
        rr('green roof',(x,y,z+.115),(w-.18,d-.18,.07),'roofgrass',.22)
        rr('roof access',(x+w*.27,y+d*.20,z+.30),(.38,.42,.42),accent,.1)
        box('roof access hatch',(x+w*.27,y+d*.20-.216,z+.28),(.21,.018,.25),'metal')
        rr('roof access cap',(x+w*.27,y+d*.20,z+.525),(.42,.46,.035),'white',.10)
        if w>3.5:
            solar_y=y-d*.20 if name=='factory' else y+d*.10
            for offset in [-.32,-.04]:solar(x+w*offset,solar_y,z+.27,min(w*.24,1.4),min(d*.45,1.3))
        else:solar(x-w*.12,y+d*.10,z+.27,min(w*.5,1.2),min(d*.45,.83))
        planter(x+w*.24,y-d*.29,z+.15,w*.28,.3)
        # Optional small roof furniture is placed at this unoccupied local socket.
        metadata[name]={'front':[0,0,1],'roof':[x,z+.15,-y],
            'roofDetail':[x-w*.32,z+.15,-(y-d*.31)],'entry':[0,.13,d/2],
            'essentialRoof':True}
    def glass(w,d,z,h,x=0,y=0):
        rr('continuous blue glazing',(x,y,z),(w,d,h),'glass',.27)
        for side in [-1,1]:
            for dx in [-.30,0,.30]:box('glass vertical mullion',(x+w*dx,y+side*d/2,z),(.028,.028,h),'white')
            for dy in [-.26,0,.26]:box('glass side mullion',(x+side*w/2,y+d*dy,z),(.028,.028,h),'white')
    def entrance(y,z=.13,w=.58,title=None):
        box('recessed entrance',(0,y,z+.43),(w,.036,.86),'glassdark')
        for x in [-w/2,w/2]:box('door jamb',(x,y-.027,z+.43),(.036,.035,.89),'white')
        box('door meeting',(0,y-.029,z+.43),(.022,.032,.83),'white')
        for x in [-w*.16,w*.16]:box('door handle',(x,y-.051,z+.40),(.015,.021,.15),'metal')
        rr('entry canopy',(0,y-.16,z+.91),(w+.28,.34,.08),'white',.12)
        if title:
            box('entry sign fascia',(0,y-.333,z+.91),(w+.19,.025,.17),'white')
            label(title,(0,y-.350,z+.885),.075)
    def tower(name,accent='teal',style=0):
        w,d=2.35,2.08;floors=6 if style==0 else 5
        rr('paved building footprint',(0,0,.06),(2.72,2.54,.12),'concrete',.1)
        for i in range(floors):
            zw=.13+i*.77;inset=.25 if style==1 and i>=3 else .0
            fw=w-inset*2;ox=-inset*.4
            rr('floor rim',(ox,0,zw+.05),(fw,d,.10),'white',.29)
            glass(fw-.09,d-.09,zw+.42,.64,ox)
            if style==3:
                rr('balcony slab',(ox,0,zw+.15),(fw+.14,d+.12,.08),'white',.31)
                for side in [-1,1]:planter(side*.84,-.93,zw+.18,.42,.22)
            else:
                for x in [-fw*.37,fw*.37]:rr('coloured facade fin',(x+ox,-d/2-.015,zw+.42),(.23 if style==1 else .11,.095,.67),accent,.045)
            if style==2:rr('asymmetric facade',(fw*.30,0,zw+.42),(.20,d+.025,.67),accent,.095)
        h=.13+floors*.77
        roof(name,w-(.5 if style==1 else 0),d,h,accent,x=-.1 if style==1 else 0)
        if style==1:
            for x in [-1.03,1.03]:planter(x,.15,.13+3*.77,.22,1.48)
        entrance(-1.064,title='LOJA' if style==2 else None)
        if style==2:
            for x in [-.78,.78]:
                for j in range(4):box('shop awning',(x-.26+j*.17,-1.17,1.01),(.17,.25,.045),'white' if j%2 else 'coral')
        for x in [-.94,.94]:planter(x,-1.12,.12,.43,.26)
    def house(name,style=0):
        accent=['cream','coral','teal','white'][style]
        rr('residential garden',(0,0,.035),(2.70,3.08,.07),'lawn',.14)
        rr('house footing',(0,0,.105),(2.20,1.94,.14),'white',.16)
        rr('house shell',(0,0,.92),(2.03,1.80,1.60),accent,.30)
        glass(2.045,1.815,.89,.65)
        for x in [-.90,.90]:rr('corner pier',(x,0,.92),(.16,1.82,1.60),accent,.065)
        rr('roof cornice',(0,0,1.76),(2.20,2.00,.13),'white',.30)
        if style in [0,3]:
            # A closed hipped roof turns continuously around both ends. The solar
            # modules sit on the slopes instead of making a triangular solid.
            loft('rounded hipped roof',[(1.805,2.25,2.05,0,.28),(1.86,2.27,2.07,0,.29),(2.22,.18,1.32,0,.085),(2.255,.12,1.26,0,.059)],'white')
            def roof_z(x):return 1.86+(1.135-abs(x))*.36/(1.135-.09)
            for side in [-1,1]:
                for row in [-1,1]:
                    ya,yb=(-.60,-.025) if row<0 else (.025,.60)
                    corners=[(side*x,y,roof_z(x)+.019) for x,y in [(.19,ya),(1.035,ya),(1.035,yb),(.19,yb)]]
                    mesh('inset solar roof module',corners,[(0,1,2,3) if side>0 else (3,2,1,0)],'solar')
                    for a,b in zip(corners,corners[1:]+corners[:1]):beam('solar module frame',a,b,.011,'metal',8)
                    for x in [.40,.61,.82]:beam('solar roof cell division',(side*x,ya,roof_z(x)+.023),(side*x,yb,roof_z(x)+.023),.0045,'glass',6)
                    beam('solar roof cell division',(side*.19,(ya+yb)/2,roof_z(.19)+.023),(side*1.035,(ya+yb)/2,roof_z(1.035)+.023),.0045,'glass',6)
            rr('rounded ridge cap',(0,0,2.255),(.15,1.29,.055),'white',.073)
        elif style==1:roof(name,2.12,1.93,1.82,accent)
        else:
            rr('residential roof garden',(0,0,1.85),(2.10,1.9,.08),'roofgrass',.2)
            glass(1.14,1.57,2.26,.69,x=-.37,y=.04)
            rr('setback upper cornice',(-.37,.04,2.66),(1.23,1.66,.13),'white',.22)
            solar(-.37,.04,2.78,.9,1.1)
            planter(.82,.15,1.90,.29,1.42)
            for y in [-.70,.70]:beam('roof terrace guard',(.97,y,1.90),(.97,y,2.25),.018,'white')
            beam('roof terrace handrail',(.97,-.70,2.25),(.97,.70,2.25),.018,'white')
        entrance(-.929,.14,.48)
        rr('porch shade',(0,-1.16,1.27),(.9,.68,.08),'white',.18)
        box('front walk',(0,-1.25,.075),(.65,.6,.04),'concrete')
        for x in [-1.18,1.18]:
            rr('garden low wall',(x,.15,.20),(.10,2.25,.32),'white',.045)
            planter(x,-1.12,.06,.32,.46)
        label('24',(.56,-.956,1.30),.13)
        for side in [-1,1]:
            box('house downpipe',(side*.98,.70,.89),(.035,.038,1.53),'white')
            box('house sill',(side*1.04,0,.55),(.08,1.48,.055),'white')
        metadata[name]={'front':[0,0,1],'entry':[0,.14,.929],'essentialRoof':True}
    def hospital():
        rr('hospital foundation',(0,0,.06),(4.9,4.55,.12),'concrete',.18)
        for i in range(3):
            z=.16+i*.88;ww=4.10 if i<2 else 3.15
            rr('curving medical floor',(0,0,z),(ww,3.4,.13),'white',.65)
            glass(ww-.1,3.3,z+.43,.74)
        rr('medical green roof border',(0,0,2.895),(4.10,3.42,.11),'white',.4)
        rr('medical garden roof',(0,0,2.96),(3.94,3.26,.04),'roofgrass',.35)
        rr('helipad platform',(-.6,.15,3.04),(2.10,2.1,.12),'white',.65)
        cyl('helipad blue disc',(-.6,.15,3.11),.90,.02,'glassdark',40);label('H',(-.6,-.13,3.125),.80,'white',True)
        solar(1.30,.2,3.12,.85,1.9)
        for x in [-1.1,1.1]:planter(x,-1.43,2.98,.9,.26)
        metadata['hospital']={'front':[0,0,1],'entry':[0,.14,1.971],'roof':[0,2.98,0],'essentialRoof':True}
        rr('hospital entry tower',(0,-1.75,1.66),(1.23,.40,3.20),'white',.14)
        for z in [2.35]:
            box('red medical cross',(0,-1.966,z),(.18,.025,.65),'red');box('red medical cross',(0,-1.968,z),(.65,.028,.18),'red')
        entrance(-1.971,.14,.76,'URGENCIA')
        for x in [-1.45,1.45]:planter(x,-1.82,.12,.85,.35)
    def school():
        rr('school plaza',(0,0,.06),(4.8,2.9,.12),'concrete',.16)
        rr('school warm shell',(0,0,1.37),(4.35,2.30,2.5),'cream',.28)
        for z in [.63,1.56]:
            glass(4.38,2.32,z+.25,.60)
            rr('school band',(0,0,z+.60),(4.43,2.36,.12),'white',.28)
        roof('school',4.5,2.40,2.68,'cream')
        entrance(-1.18,.12,.8,'ESCOLA')
        for x in [-1.90,1.90]:box('school corner fin',(x,-1.19,1.4),(.15,.1,2.55),'cream')
        for x in [-1.25,1.25]:planter(x,-1.30,.13,1.0,.28)
    def civic():
        rr('civic podium',(0,0,.1),(3.8,3.,.2),'concrete',.18)
        rr('civic glass hall',(0,0,1.23),(3.36,2.50,2.10),'glass',.5)
        rr('hall cornice',(0,0,2.38),(3.6,2.8,.18),'white',.48)
        for x in [-1.35,-.70,.70,1.35]:
            cyl('civic column',(x,-1.45,1.3),.065,2.18,'white',16)
            cyl('column base',(x,-1.45,.24),.12,.12,'white',16)
        rr('portico canopy',(0,-1.40,2.43),(3.35,.64,.13),'white',.16)
        cyl('round glass cupola',(0,0,2.94),.82,.89,'glass',32)
        for z in [2.50,3.37]:cyl('cupola ring',(0,0,z),.88,.10,'white',32)
        # Spherical cap cut at the equator; no buried lower hemisphere.
        verts=[];n=32
        for j in range(9):
            a=j*math.pi/16;r=.88*math.cos(a)
            for i in range(n):verts.append((r*math.cos(i*math.tau/n),r*math.sin(i*math.tau/n),3.42+.68*math.sin(a)))
        dome=mesh('glass dome',verts,[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(8) for i in range(n)],'glass')
        for f in dome.data.polygons:f.use_smooth=True
        for i in range(8):
            a=i*math.tau/8
            for j in range(8):
                u=j*math.pi/16;v=(j+1)*math.pi/16
                beam('dome meridian',(.89*math.cos(u)*math.cos(a),.89*math.cos(u)*math.sin(a),3.42+.69*math.sin(u)),(.89*math.cos(v)*math.cos(a),.89*math.cos(v)*math.sin(a),3.42+.69*math.sin(v)),.014,'white')
        entrance(-1.28,.19,.56)
        box('civic fascia board',(0,-1.741,2.43),(2.16,.03,.22),'white')
        label('PREFEITURA',(0,-1.761,2.39),.125)
        for x in [-1.22,1.22]:planter(x,.4,2.49,.43,1.1)
        metadata['civic']={'front':[0,0,1],'entry':[0,.19,1.28],'essentialRoof':True}
    def office():
        rr('tower foundation',(0,0,.06),(2.9,2.75,.12),'concrete',.16)
        glass(2.48,2.25,2.91,5.53)
        for i in range(8):rr('office floor band',(0,0,.17+i*.77),(2.55,2.32,.09),'white',.50)
        for x in [-1.02,1.02]:box('office tall fin',(x,-1.12,2.92),(.08,.08,5.55),'white')
        roof('office-glass',2.6,2.37,5.67)
        entrance(-1.17,.12,.78,'CENTRO')
        box('environment badge',(.61,-1.155,3.75),(.6,.045,.94),'teal')
        leaf=ball('leaf emblem',(.61,-1.20,3.84),(.18,.028,.3),'white');leaf.rotation_euler.y=-.4
        beam('leaf vein',(.50,-1.23,3.62),(.70,-1.23,4.04),.012,'teal')
    def industry(warehouse=False):
        name='port-warehouse' if warehouse else 'factory';w,d=(6.5,4.5) if warehouse else (4.9,4.15)
        rr('industrial paved footing',(0,0,.055),(w,d,.11),'concrete',.14)
        ww,dd=w-.6,d-1.0;h=1.85 if warehouse else 2.14
        rr('clean industrial shell',(0,0,h/2+.11),(ww,dd,h),'white',.3)
        roof(name,ww+.06,dd+.06,h+.15)
        for x in [-ww*.32,0,ww*.32]:
            rr('loading bay surround',(x,-dd/2-.03,.65),(.88,.12,1.10),'teal',.1)
            box('recessed roller door',(x,-dd/2-.10,.63),(.69,.025,.90),'metal')
            for z in [.3,.5,.7,.9]:box('roller rib',(x,-dd/2-.12,z),(.67,.02,.017),'trim')
            box('loading threshold',(x,-dd/2-.24,.12),(.85,.47,.24),'roofdeck')
            label('DOCA',(x,-dd/2-.105,1.30),.12)
        for side in [-1,1]:
            for y in [-.65,.25,.95]:box('factory side glass',(side*(ww/2+.01),y,1.35),(.025,.50,.40),'glassdark')
        if not warehouse:
            for x in [-1.15,1.15]:
                for i in range(7):cyl('factory exhaust',(x,.8,2.75+i*.32),.18,.32,'red' if i in [4,6] else 'white',16)
                cyl('stack mouth',(x,.8,4.86),.135,.02,'dark',16)
        label('LOGISTICA',(0,-dd/2-.025,h-.20),.19)
    def cafe():
        rr('cafe footing',(0,0,.065),(3.85,4.1,.13),'concrete',.22)
        rr('cafe shell',(0,.30,.85),(2.9,2.4,1.52),'coral',.32)
        glass(2.94,2.43,.78,.82,0,.3);roof('corner-cafe',3.05,2.55,1.69,'coral',y=.3)
        entrance(-.94,.13,.65,'CAFE')
        for x in [-1.02,1.02]:
            for j in range(6):box('striped café shade',(x-.36+j*.145,-1.2,1.38),(.145,.55,.035),'white' if j%2 else 'red')
            cyl('terrace table',(x,-1.53,.50),.24,.05,'white',20);beam('table leg',(x,-1.53,.13),(x,-1.53,.48),.035)
            for dx in [-.36,.36]:rr('cafe seat',(x+dx,-1.53,.35),(.22,.25,.07),'teal',.06);beam('seat leg',(x+dx,-1.53,.13),(x+dx,-1.53,.34),.025)
    def charger(x=0,y=0,z=0):
        rr('charger base',(x,y,z+.04),(.48,.40,.08),'concrete',.08)
        rr('charging pedestal',(x,y,z+.53),(.32,.25,.98),'white',.10)
        box('charging face',(x,y-.132,z+.69),(.22,.024,.34),'navy')
        box('charge status',(x,y-.15,z+.89),(.18,.015,.023),'led')
        label('E',(x,y-.149,z+.64),.20,'white')
        points=[(x+.18,y,z+.76),(x+.34,y,z+.52),(x+.28,y,z+.24),(x+.19,y,z+.39)]
        for a,b in zip(points,points[1:]):beam('charging cable',a,b,.014,'rubber')
        box('charging plug',(x+.18,y,z+.43),(.06,.06,.15),'navy')
    def canopy():
        for x in [-.9,.9]:rr('solar shade column',(x,0,.95),(.10,.15,1.9),'white',.04)
        rr('solar shelter roof',(0,0,1.97),(2.25,1.40,.13),'white',.25);solar(0,0,2.10,1.8,1.0)
    def fuel():
        rr('charging forecourt',(0,0,.04),(5.4,4.8,.08),'concrete',.24)
        for x in [-1.9,1.9]:rr('charging roof column',(x,0,1.2),(.12,.25,2.4),'white',.06)
        rr('charging canopy',(0,0,2.42),(4.8,2.5,.20),'white',.4)
        rr('canopy green inset',(0,0,2.55),(4.45,2.15,.06),'roofgrass',.34)
        for x in [-1.25,0,1.25]:solar(x,0,2.69,1.10,1.6);charger(x,.12,.08)
        for x in [-1.25,0,1.25]:
            for dx in [-.43,.43]:box('charging bay line',(x+dx,-1.32,.09),(.022,1.6,.015),'white')
        label('RECARGA SOLAR',(0,-1.265,2.42),.22)
        rr('energy totem',(2.25,1.05,.86),(.32,.4,1.65),'teal',.09);label('E',(2.25,.84,1.10),.27,'white')
        metadata['fuel-station']={'front':[0,0,1],'entry':[0,.08,2.4],'essentialRoof':True}
    def wheels(width,ys,z=.21,r=.20):
        for side in [-1,1]:
            for y in ys:
                o=cyl('electric tire',(side*width,y,z),r,.105,'rubber',16);o.rotation_euler.y=math.pi/2
                o=cyl('aero wheel cover',(side*(width+.057),y,z),r*.71,.012,'white',16);o.rotation_euler.y=math.pi/2
                o=cyl('wheel centre',(side*(width+.067),y,z),r*.2,.014,'teal',10);o.rotation_euler.y=math.pi/2
    def car(color='blue',style=0):
        length=[1.76,1.92,1.80,1.65][style]
        paint='paint_'+color
        body=loft('sculpted electric body',[(.17,.70,length-.15,0,.20),(.25,.83,length,0,.24),(.43,.83,length,0,.24),(.51,.73,length-.17,0,.25)],paint)
        # Actual wheel wells, also in the economical model, replace buried tires.
        for y in [-length*.31,length*.30]:
            cutter=raw_cyl('wheel clearance cutter',(0,y,.21),.224,1.1,'rubber',24);cutter.rotation_euler.y=math.pi/2
            bpy.context.view_layer.objects.active=body
            mod=body.modifiers.new('open wheel well','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
            bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
        rr('battery underbody',(0,0,.19),(.59,length*.43,.10),'navy',.06)
        loft('sloping panoramic cabin',[(.48,.71,length*.70,.02,.22),(.60,.69,length*.64,.04,.22),(.79,.58,length*.43,.09,.20),(.83,.55,length*.39,.09,.20)],'autoglass')
        rr('EV roof',(0,.09,.842),(.56,length*.40,.045),paint,.20)
        wheels(.405,[-length*.31,length*.30])
        for side in [-1,1]:
            box('flush door handle',(side*.402,.13,.478),(.014,.11,.017),'alloy')
            beam('mirror stalk',(side*.338,-.33,.62),(side*.465,-.35,.65),.018,paint)
            rr('side mirror',(side*.465,-.35,.66),(.105,.10,.05),paint,.035)
            beam('window centre pillar',(side*.346,.10,.53),(side*.285,.10,.81),.021,paint)
            for y in [-length*.31,length*.30]:
                for i in range(12):
                    a=i*math.pi/12;b=(i+1)*math.pi/12
                    beam('wheel arch moulding',(side*.416,y+math.cos(a)*.234,.21+math.sin(a)*.234),(side*.416,y+math.cos(b)*.234,.21+math.sin(b)*.234),.015,'navy',6)
        for end in [-1,1]:
            points=[]
            for i in range(13):
                x=-.305+i*.61/12;edge=max(0,abs(x)-(.83/2-.24))
                points.append((x,end*(length/2-.24+math.sqrt(.24**2-edge**2)+.007),.412))
            for a,b in zip(points,points[1:]):beam('conforming LED ribbon',a,b,.017,'white' if end<0 else 'red',6)
        box('EV intake',(0,-length/2-.013,.26),(.4,.015,.025),'navy')
        label('EQ',(0,-length/2-.028,.32),.085,'white')
    def bus():
        rr('low floor electric bus',(0,0,.54),(.95,3.15,.88),'white',.27)
        rr('bus panorama windows',(0,0,1.00),(.92,3.10,.55),'glassdark',.25)
        rr('bus roof',(0,0,1.30),(.95,3.14,.12),'white',.24)
        rr('battery enclosure',(0,.42,1.41),(.62,1.4,.12),'teal',.16)
        wheels(.455,[-.97,.97],.22,.21)
        for side in [-1,1]:
            box('electric livery',(side*.481,0,.62),(.018,2.68,.15),'teal')
            for y in [-.98,-.35,.3,.95]:box('window divider',(side*.468,y,1.01),(.026,.035,.53),'white')
        for y in [-.90,.65]:
            box('accessible bus door',(.487,y,.77),(.021,.38,.98),'glassdark')
            box('bus door seam',(.502,y,.77),(.013,.02,.93),'white')
        box('route display',(0,-1.564,1.10),(.64,.021,.14),'navy');label('ECO 01',(0,-1.58,1.065),.105,'led')
        box('bus running light',(0,-1.58,.53),(.72,.022,.035),'white')
    def train(cab=False):
        if cab:
            loft('streamlined driver shell',[(.23,.78,3.05,-.08,.30),(.38,1.02,3.48,-.16,.39),(.64,1.02,3.48,-.16,.39),(.88,.92,3.13,-.035,.35),(1.15,.84,2.84,.07,.33),(1.34,.82,2.75,.10,.32)],'white')
            loft('sloped cab panorama',[(.78,.94,3.19,-.04,.36),(.88,.925,3.13,-.035,.35),(1.15,.85,2.86,.07,.33),(1.24,.83,2.79,.09,.32)],'glassdark')
            rr('driver roof',(0,.10,1.335),(.85,2.79,.11),'white',.33)
        else:
            rr('train lower shell',(0,0,.49),(1.02,3.0,.55),'white',.4)
            rr('train panorama',(0,0,.98),(.96,2.92,.60),'glassdark',.38)
            rr('train aerodynamic roof',(0,0,1.31),(1.0,2.98,.16),'white',.4)
        for side in [-1,1]:
            box('train blue ribbon',(side*.511,0,.70),(.018,2.5,.13),'blue')
            for y in [-.9,0,.9]:
                if cab:beam('sloped train window frame',(side*.473,y,.79),(side*.417,y,1.21),.016,'white')
                else:box('train door frame',(side*.49,y,1.0),(.028,.045,.55),'white')
        if cab:
            box('cab running light',(0,-1.906,.55),(.23,.014,.032),'led')
        else:
            for y in [-1.50,1.50]:rr('articulated bellows',(0,y,.81),(.72,.12,.92),'metal',.18)
        wheels(.40,[-.90,.90],.20,.15)
    def truck():
        rr('truck chassis',(0,0,.25),(1.06,2.7,.21),'navy',.13)
        rr('electric truck cabin',(0,-.81,.79),(1.03,1.04,1.01),'white',.25)
        rr('truck glass',(0,-.84,1.06),(1.045,.92,.38),'glassdark',.23)
        rr('cargo box',(0,.55,1.0),(1.08,1.83,1.46),'white',.16)
        wheels(.50,[-.96,.93],.24,.23)
        for side in [-1,1]:box('logistics band',(side*.549,.5,1.0),(.018,1.35,.25),'teal')
        for x in [-.25,.25]:beam('cargo rear lock',(x,1.48,.39),(x,1.48,1.61),.013,'metal')
        box('truck LED bar',(0,-1.344,.63),(.76,.02,.04),'led')
    def shelter():
        rr('bus stop foundation',(0,0,.04),(2.65,.85,.08),'concrete',.14)
        for x in [-1.13,1.13]:rr('shelter column',(x,.27,.78),(.08,.10,1.5),'white',.035)
        box('rear shelter glazing',(0,.31,.84),(2.26,.026,1.2),'glass')
        for z in [.60,1.12]:box('glazing visibility stripe',(0,.29,z),(2.3,.016,.035),'white')
        rr('curved solar shelter roof',(0,0,1.59),(2.65,.95,.12),'white',.25)
        solar(-.3,0,1.73,1.65,.65)
        rr('shelter bench',(-.25,.1,.45),(1.55,.30,.08),'wood',.08)
        for x in [-.82,.3]:box('bench support',(x,.1,.25),(.04,.18,.39),'white')
        box('live timetable',(.87,.275,.91),(.37,.04,.66),'navy')
        label('01',(.87,.245,1.02),.17,'led');label('03 MIN',(.87,.244,.84),.072,'white')
        label('ONIBUS',(0,-.484,1.58),.12)
    def palm():
        for i in range(5):beam('palm stem',(.025*i,0,i*.43),(.025*(i+1),0,(i+1)*.43),.075-i*.006,'trunk',10)
        for i in range(9):
            a=i*math.tau/9;verts=[]
            for j in range(6):
                t=j/5;r=t*1.05;z=2.22+math.sin(t*math.pi)*.4-t*.15;wid=math.sin(t*math.pi)*(.17 if api.get('LOW_DETAIL') else .052)
                for side in [-1,1]:verts.append((.125+r*math.cos(a)+side*wid*math.sin(a),r*math.sin(a)-side*wid*math.cos(a),z))
            o=mesh('arched palm frond',verts,[(j*2,j*2+1,j*2+3,j*2+2) for j in range(5)],'leaf' if i%2 else 'leaflight')
            mod=o.modifiers.new('leaf thickness','SOLIDIFY');mod.thickness=.015;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    def blossom(compact=False):
        h=.8 if compact else 1.4
        beam('tree trunk',(0,0,0),(0,0,h),.07,'trunk')
        for i in range(5):
            a=i*2.4;x=math.cos(a)*.36;y=math.sin(a)*.36;beam('flowering branch',(0,0,h*.55),(x,y,h+.12),.027,'trunk')
            ball('compact garden crown' if compact else 'pink blossom crown',(x,y,h+.25+math.sin(i)*.10),(.43,.39,.41),'leaflight' if compact else 'flower')
    def station():
        # Local X is the rail direction, deck level 4.18 in Three Y.
        rr('station ground plaza',(0,0,.06),(7.0,5.0,.12),'concrete',.2)
        for x in [-2.6,2.6]:
            for y in [-1.8,1.8]:rr('station pier',(x,y,2.04),(.28,.30,4.0),'white',.09)
        rr('station platform',(0,0,4.08),(7,4.65,.20),'white',.22)
        # The rail passes along Y=0. Side platforms remain clear.
        for y in [-1.32,1.32]:
            box('platform tactile strip',(0,y,4.195),(6.8,.12,.025),'signal')
            for x in [-2.7,0,2.7]:rr('station roof column',(x,y*1.5,4.96),(.10,.1,1.55),'white',.04)
        rr('station roof',(0,0,5.78),(7.2,4.8,.18),'white',.55)
        for x in [-2.3,0,2.3]:solar(x,0,5.99,1.9,2.8)
        for y in [-2.17,2.17]:
            for i in range(7):box('station glass barrier',(-3+i,y,4.64),(.98,.035,.88),'glass')
            beam('continuous platform handrail',(-3.46,y,5.10),(3.46,y,5.10),.026,'white')
            for x in [-3.44,3.44]:beam('platform end safety rail',(x,y,4.76),(x,y*.46,4.76),.027,'white')
        # A small service hall activates the sheltered ground floor while the
        # east circulation remains open to both existing accessible lifts.
        rr('ground service pavilion',(-2.14,0,1.05),(1.48,2.34,1.86),'white',.22)
        rr('service pavilion glazing',(-2.14,0,1.34),(1.50,2.36,.73),'glassdark',.22)
        rr('service hall roof',(-2.14,0,2.02),(1.67,2.50,.14),'white',.22)
        for side in [-1,1]:
            box('service hall door',(-2.14,side*1.18,.72),(.54,.025,1.13),'navy')
            rr('ground waiting seat',(-.52,side*.75,.56),(1.10,.34,.10),'wood',.055)
            for x in [-.9,-.14]:box('waiting seat leg',(x,side*.75,.35),(.065,.23,.43),'metal')
            for i in range(3):box('waiting backrest',(-.52,side*.91,.68+i*.075),(1.1,.045,.054),'wood')
        # Lift at each platform; door at ground and platform level, facing outward.
        for side in [-1,1]:
            rr('accessible lift tower',(2.6,side*1.70,2.83),(1.05,1.04,5.42),'glass',.16)
            box('ground lift door',(2.6,side*2.235,.66),(.70,.035,1.06),'navy')
            # Upper doors face onto the side platform; the outer barrier is safe.
            box('platform lift door',(2.6,side*1.17,4.75),(.70,.035,1.06),'navy')
        box('station fascia board',(0,-2.421,5.74),(3.05,.035,.28),'white')
        label('ESTACAO SOLAR',(0,-2.445,5.685),.17)
        for y in [-1.80,1.80]:
            rr('platform bench',(-1.35,y,4.57),(1.3,.3,.09),'wood',.06)
            for x in [-1.8,-.9]:box('platform seat support',(x,y,4.37),(.07,.18,.34),'white')
            box('platform departure display',(.3,y,5.20),(.76,.065,.26),'navy')
            label('CENTRO  02',(.3,y-.04,5.15),.09,'led')
        for side in [-1,1]:
            for x in [2.15,3.05]:box('lift vertical frame',(x,side*2.23,2.80),(.04,.055,5.3),'white')
            for z in [1.25,2.25,3.25,4.15,5.4]:box('lift glazing band',(2.6,side*2.23,z),(.96,.035,.035),'white')
            label('ELEVADOR',(2.6,side*2.26,1.29),.09,'white')
    def filter_module():
        rr('air treatment base',(0,0,.04),(2.6,.8,.08),'concrete',.13)
        for x in [-.82,0,.82]:
            rr('air filter enclosure',(x,0,.58),(.71,.65,1.06),'white',.13)
            for z in [.35,.49,.63,.77]:box('filter intake',(x,-.336,z),(.49,.02,.05),'teal')
        label('AR LIMPO',(0,-.342,1.0),.13)

    replacements={
        'townhouse-sage':lambda:tower('townhouse-sage','teal',0),
        'townhouse-cream':lambda:tower('townhouse-cream','cream',1),
        'townhouse-coral':lambda:tower('townhouse-coral','coral',2),
        'townhouse-pink':lambda:tower('townhouse-pink','pink',3),
        'house-cream':lambda:house('house-cream',0),'house-coral':lambda:house('house-coral',1),
        'house-terrace':lambda:house('house-terrace',2),'house-solar':lambda:house('house-solar',3),
        'hospital':hospital,'school':school,'civic':civic,'office-glass':office,
        'factory':industry,'port-warehouse':lambda:industry(True),'corner-cafe':cafe,'fuel-station':fuel,
        'car-blue':lambda:car('blue',0),'car-white':lambda:car('white',1),
        'car-coral':lambda:car('coral',2),'car-gold':lambda:car('gold',3),
        'city-bus':bus,'delivery-truck':truck,'train-carriage':train,'train-cab':lambda:train(True),
        'bus-shelter':shelter,'tree-palm':palm,'tree-blossom':blossom,'tree-rooftop':lambda:blossom(True),
        'ev-charger':charger,'solar-canopy':canopy,'solar-station':station,'air-treatment':filter_module,
    }
    # Keep the finished functional assemblies, adding modern fittings in their
    # existing envelopes. Deliberately natural props keep their natural geometry.
    def modernize(name,fn):
        def build():
            fn()
            if name=='pergola':
                for x in [-1.05,1.05]:solar(x,0,2.43,1.7,1.4)
            elif name in ['court','football-field']:
                y=1.23 if name=='court' else 2.8;x=.8
                box('sports scoreboard',(x,y,1.25 if name=='court' else 1.55),(.58,.07,.30),'navy')
                label('00 : 00',(x,y-.042,1.21 if name=='court' else 1.51),.11,'led')
            elif name=='bench':
                for o in list(bpy.context.scene.objects):
                    if o.type=='MESH' and any(s in o.name for s in ['leg','support','armrest']):o.data.materials.clear();o.data.materials.append(api['mat']('white'))
            elif name=='fountain':
                for a in [0,math.pi/2,math.pi,math.pi*1.5]:
                    for i in range(9):
                        u=i*math.pi/9;v=(i+1)*math.pi/9
                        beam('sculptural fountain arch',(.30*math.cos(u)*math.cos(a),.30*math.cos(u)*math.sin(a),1.1+.7*math.sin(u)),(.30*math.cos(v)*math.cos(a),.30*math.cos(v)*math.sin(a),1.1+.7*math.sin(v)),.021,'white')
            elif name in ['lamp','traffic']:
                solar(0,.10,2.34,.40,.30)
            elif name=='greenhouse':
                solar(0,0,2.36,1.65,1.0)
            elif name=='waste-bin':
                box('collection status',(0,-.35,.83),(.25,.02,.027),'led')
            elif name=='wildlife-shelter':
                solar(0,.50,1.02,.72,.63)
            elif name=='harbor-crane':
                solar(-1.1,0,4.42,.85,1.25)
            elif name=='cargo-ship':
                # Its existing navigation equipment stays in place.
                pass
        return build
    result={name:modernize(name,fn) for name,fn in previous.items()}
    from future_polish import wrap
    result.update(wrap(api,replacements,{'box':box,'rr':rr,'beam':beam,'cyl':cyl,'ball':ball,'label':label}))
    api['FUTURE_LOD_MODELS']=set(replacements)|{'cargo-ship','greenhouse','court','football-field','tree','pine','tree-oak','tree-maple','tree-birch','tree-fir','tree-thicket','shrub','pier'}
    api['ARCHITECTURE']={'rr':rr,'beam':beam,'cyl':cyl,'ball':ball,'label':label,'solar':solar,'planter':planter,'mesh':mesh,'roof':roof,'glass':glass}
    return result
