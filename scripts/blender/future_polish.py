"""Model-specific finish pass. Dimensions are local Blender coordinates.

Small fittings are authored separately from the essential architecture, so the
economy export can omit them without breaking entrances, roofs or silhouettes.
"""
import math
import bpy

def wrap(api,builders,kit):
    box,rr,beam,cyl,ball,label=(kit[k] for k in ('box','rr','beam','cyl','ball','label'))
    notes={}
    def note(name,text):notes[name]=text
    def vent(x,y,z,w=.30,h=.20):
        box('recessed service grille',(x,y,z),(w,.028,h),'navy')
        for i in range(4):box('vent aluminium blade',(x,y-.02,z-h*.36+i*h*.24),(w-.035,.034,.018),'metal')
    def lamp(x,y,z):
        rr('wall light backplate',(x,y,z),(.10,.04,.17),'metal',.02)
        box('wall light diffuser',(x,y-.026,z),(.062,.026,.10),'white')
    def entry(y,w=.58,z=.13):
        for x in [-w*.70,w*.70]:lamp(x,y-.05,z+.70)
        box('entry intercom',(w*.67,y-.077,z+.43),(.07,.03,.12),'navy')
        box('intercom status',(w*.67,y-.095,z+.45),(.04,.008,.014),'led')
        box('door visibility band',(0,y-.067,z+.54),(w-.07,.012,.025),'white')
        box('entrance mat',(0,y-.13,z+.006),(w-.05,.22,.012),'metal')
    def roof_fittings(name):
        meta=api['MODEL_ATTACHMENTS'].get(name,{})
        if not meta.get('roofDetail'):return
        x,z,minus_y=meta['roofDetail'];y=-minus_y
        # Reserved planting socket is untouched. Paving beside it leads to the hatch.
        for i in range(3):box('maintenance stepping stone',(x+.24+i*.16,y+.1,z+.009),(.13,.18,.016),'roofdeck')
    def facade_joints(w,d,z,height):
        for side in [-1,1]:
            for y in [-d*.28,0,d*.28]:box('side glazing gasket',(side*(w/2+.012),y,z),(.014,.014,height),'trim')
    def wheel_finish(width,ys,z,r):
        for side in [-1,1]:
            for y in ys:
                for i in range(5):
                    a=i*math.tau/5
                    beam('aero spoke',(side*width,y+math.sin(a)*r*.28,z+math.cos(a)*r*.28),(side*width,y+math.sin(a)*r*.63,z+math.cos(a)*r*.63),.012,'metal',6)
    def charging_details(x=0,y=0,z=0):
        box('charging display glass',(x,y-.157,z+.79),(.16,.012,.12),'glass')
        for i in range(3):box('battery level',(x-.052+i*.052,y-.166,z+.79),(.035,.009,.05),'led')
        box('contactless reader',(x,y-.148,z+.40),(.10,.018,.09),'navy')
        for dx in [-.09,.09]:cyl('charger base fastener',(x+dx,y,z+.088),.012,.015,'metal',8)
        vent(x,y+.135,z+.32,.19,.17)
    def finish_model(name):
        if name.startswith('townhouse-'):
            style={'sage':0,'cream':1,'coral':2,'pink':3}[name.split('-')[1]]
            floors=6 if style==0 else 5
            entry(-1.064);roof_fittings(name)
            for i in range(floors):
                w=1.85 if style==1 and i>=3 else 2.35;ox=-.10 if style==1 and i>=3 else 0;z=.55+i*.77
                for side in [-1,1]:
                    for y in [-.48,.48]:
                        box('window transom',(ox+side*(w-.09)/2,y,z-.18),(.016,.40,.021),'white')
                        box('opening window handle',(ox+side*(w-.09)/2+.006*side,y+.10,z),(.02,.028,.08),'metal')
                if style==3 and i>0:
                    for x in [-.51,.51]:beam('balcony post',(x,-1.045,.31+i*.77),(x,-1.045,.69+i*.77),.012,'white')
                    beam('balcony handrail',(-.52,-1.045,.69+i*.77),(.52,-1.045,.69+i*.77),.016,'white')
            vent(-.58,1.01,.47,.31,.22)
            for y in [-.48,.48]:box('building movement joint',(1.135,y,.13+floors*.385),(.015,.015,floors*.77),'trim')
            if style==0:
                for z in [.90,1.12,1.34]:box('lobby side louvre',(-1.16,.70,z),(.05,.35,.035),'teal')
            elif style==1:
                for side in [-1,1]:beam('terrace rim',(.98*side,-.59,2.74),(.98*side,.86,2.74),.018,'white')
            elif style==2:
                for x in [-.76,.76]:label('ABERTO',(x,-1.028,.58),.078,'white')
            else:
                box('residential lobby plaque',(.52,-1.058,.62),(.16,.026,.24),'pink')
                label('08',(.52,-1.076,.62),.08,'white')
            note(name,'Lajes com bordas suaves, elementos de fachada arredondados, caixilhos, folhas de janela, ferragens, juntas e acabamento próprio dos terraços e do térreo.')
        elif name.startswith('house-'):
            entry(-.929,.48,.14)
            for side in [-1,1]:
                for y in [-.48,.48]:
                    box('residential opening window',(side*1.038,y,.91),(.021,.034,.62),'white')
                box('garden wall cap',(side*1.18,.15,.367),(.115,2.25,.025),'trim')
                for z in [.40,.92,1.45]:box('pipe wall collar',(side*.98,.70,z),(.065,.065,.027),'metal')
            box('letter box',(.70,-.956,.51),(.19,.09,.14),'white')
            box('mail slot',(.70,-1.006,.54),(.13,.009,.014),'navy')
            if name in ['house-cream','house-solar']:
                for side in [-1,1]:
                    beam('continuous eaves gutter',(side*1.105,-.73,1.824),(side*1.105,.73,1.824),.027,'white')
                if name=='house-solar':
                    box('home battery cabinet',(-1.13,.40,.71),(.18,.50,.91),'white')
                    box('battery controller',(-1.228,.40,.94),(.018,.24,.17),'navy')
            elif name=='house-terrace':
                box('upper terrace door',(.211,.34,2.26),(.02,.43,.67),'glassdark')
                box('terrace door jamb',(.23,.12,2.26),(.025,.025,.69),'white')
                for y in [-.51,.04,.59]:box('upper floor window transom',(-.96,y,2.24),(.024,.40,.025),'white')
            else:
                for y in [-.48,0,.48]:box('side shade blade',(-1.07,y,1.32),(.15,.035,.08),'coral')
            note(name,'Bordas suaves na construção, cobertura solar com cantos arredondados ou jardim, módulos encaixados, porta com ferragens, interfone, caixa de correio, caixilhos e arremates de muro.')
        elif name=='hospital':
            entry(-1.971,.76,.14)
            for side in [-1,1]:
                for z in [.80,1.68]:
                    for y in [-.60,0,.60]:box('medical window transom',(side*2.01,y,z),(.025,.52,.022),'white')
                for i in range(3):box('ventilated medical cladding',(side*.42,-1.959,1.37+i*.09),(.24,.024,.018),'trim')
            for i in range(8):
                a=i*math.tau/8;cyl('helipad perimeter beacon',(-.60+math.cos(a)*.97,.15+math.sin(a)*.97,3.115),.022,.035,'signal',8)
            vent(.70,1.66,.53,.42,.24)
            label('HOSPITAL',(0,-1.977,1.75),.13,'navy')
            note(name,'Fachadas médicas com travessas, painéis ventilados, entrada identificada, ferragens e balizamento do heliponto.')
        elif name=='school':
            entry(-1.18,.8,.12)
            for x in [-1.50,-.75,.75,1.50]:
                for z in [1.20,2.13]:box('classroom sunshade',(x,-1.22,z),(.53,.13,.045),'white')
            box('school notice frame',(-.68,-1.194,.53),(.29,.03,.32),'white')
            box('school notices',(-.68,-1.217,.53),(.23,.018,.26),'navy')
            for x in [-.72,-.63]:box('school notice paper',(x,-1.23,.55),(.065,.008,.14),'signal')
            for side in [-1,1]:
                for y in [-.54,.25,.72]:box('school side casing',(side*2.20,y,1.58),(.03,.035,.68),'white')
            note(name,'Brises por sala, esquadrias laterais, mural, luminárias e entrada escolar detalhada.')
        elif name=='civic':
            entry(-1.28,.56,.19)
            for side in [-1,1]:
                for y in [-.50,0,.50]:box('civic side mullion',(side*1.684,y,1.23),(.025,.035,2.07),'white')
                for z in [.77,1.69]:box('civic side transom',(side*1.69,0,z),(.026,1.48,.034),'white')
            for x in [-.95,0,.95]:box('civic rear mullion',(x,1.253,1.23),(.035,.025,2.07),'white')
            clock=cyl('civic clock surround',(0,-.834,2.95),.22,.03,'white',24);clock.rotation_euler.x=math.pi/2
            clock=cyl('clock face',(0,-.855,2.95),.19,.017,'navy',24);clock.rotation_euler.x=math.pi/2
            beam('clock hour hand',(0,-.87,2.95),(-.08,-.87,3.01),.009,'white');beam('clock minute hand',(0,-.87,2.95),(0,-.87,3.09),.008,'white')
            for x in [-1.35,-.7,.7,1.35]:
                for z in [.34,2.28]:cyl('column collar',(x,-1.45,z),.084,.055,'trim',16)
            note(name,'Laterais com esquadrias e travessas, relógio na cúpula, colunas arrematadas e ferragens do pórtico.')
        elif name=='office-glass':
            entry(-1.17,.78,.12);roof_fittings(name)
            for side in [-1,1]:
                for y in [-.68,-.22,.22,.68]:box('curtain wall secondary mullion',(side*1.249,y,2.9),(.018,.016,5.36),'trim')
                for i in range(7):box('curtain wall spandrel',(side*1.251,0,.41+i*.77),(.018,1.45,.065),'glassdark')
            vent(-.66,1.133,.50,.34,.24)
            note(name,'Fachada cortina com subdivisões finas, painéis entre lajes, ventilação e recepção acabada.')
        elif name in ['factory','port-warehouse']:
            warehouse=name=='port-warehouse';w,d=(5.9,3.5) if warehouse else (4.3,3.15);h=1.85 if warehouse else 2.14
            for i,x in enumerate([-w*.32,0,w*.32]):
                for dx in [-.48,.48]:
                    cyl('dock protective bollard',(x+dx,-d/2-.23,.31),.035,.40,'signal',10)
                    cyl('bollard dark band',(x+dx,-d/2-.23,.36),.038,.09,'navy',10)
                lamp(x,-d/2-.11,1.50);label(str(i+1).zfill(2),(x,-d/2-.121,.86),.13,'white')
                box('dock door bumper',(x,-d/2-.15,.21),(.60,.055,.08),'rubber')
            for side in [-1,1]:
                for y in [-.65,.25,.95]:
                    box('industrial window sill',(side*(w/2+.025),y,1.12),(.075,.56,.05),'white')
                    box('industrial window mullion',(side*(w/2+.025),y,1.35),(.026,.025,.40),'white')
                for y in [-d*.35,0,d*.35]:box('industrial panel joint',(side*(w/2+.012),y,.80),(.015,.018,1.22),'trim')
                beam('rainwater downpipe',(side*(w/2-.20),d/2+.024,.16),(side*(w/2-.20),d/2+.024,h+.13),.028,'metal')
            for x in [-w*.30,0,w*.30]:vent(x,d/2+.025,.86,.45,.48)
            if not warehouse:
                for x in [-1.15,1.15]:
                    for z in [2.79,3.43,4.07,4.70]:cyl('exhaust expansion collar',(x,.8,z),.197,.035,'metal',20)
                # A maintenance ladder is behind one stack, clear of solar arrays.
                for x in [1.05,1.25]:beam('stack ladder upright',(x,1.04,2.45),(x,1.04,4.73),.015,'metal')
                for i in range(12):beam('stack ladder rung',(1.05,1.04,2.5+i*.19),(1.25,1.04,2.5+i*.19),.01,'white',6)
            else:
                for x in [-2.45,-1.6,-.8,0,.8,1.6,2.45]:box('warehouse roof seam',(x,0,h+.208),(.018,d-.18,.022),'trim')
            note(name,'Docas numeradas, defensas, balizadores, iluminação, esquadrias, juntas, drenagem e manutenção industrial.')
        elif name=='corner-cafe':
            entry(-.94,.65,.13)
            for x in [-1.02,1.02]:
                for j in range(6):box('awning scalloped edge',(x-.36+j*.145,-1.48,1.34),(.135,.035,.07),'white' if j%2 else 'red')
                for dx in [-.36,.36]:
                    for dz in [-.10,.10]:beam('chair back upright',(x+dx,-1.53+dz,.37),(x+dx,-1.53+dz,.63),.012,'white')
                    rr('chair backrest',(x+dx,-1.53,.59),(.04,.24,.15),'teal',.016)
                cyl('cafe saucer',(x,-1.53,.535),.055,.012,'white',14)
                cyl('coffee cup',(x,-1.53,.566),.03,.045,'white',14)
                cyl('coffee surface',(x,-1.53,.590),.024,.003,'wood',14)
            box('menu board',(.60,-.927,.65),(.26,.03,.36),'navy')
            for z in [.55,.62,.69,.76]:box('menu chalk line',(.60,-.947,z),(.18,.009,.012),'white')
            note(name,'Toldos com borda e suporte, cadeiras com encosto, louça nas mesas, cardápio e ferragens.')
        elif name in ['ev-charger','fuel-station']:
            if name=='ev-charger':charging_details()
            else:
                for x in [-1.25,0,1.25]:
                    charging_details(x,.12,.08)
                    box('canopy recessed luminaire',(x,-.45,2.308),(.36,.10,.025),'led')
                    label('EV',(x,-1.93,.101),.25,'white',True)
                    box('wheel stop',(x,-.45,.14),(.60,.10,.10),'metal')
                for x in [-1.9,1.9]:rr('column footing',(x,0,.10),(.29,.4,.04),'trim',.06)
                box('station energy screen',(2.25,.839,.76),(.22,.018,.36),'navy')
                label('100%',(2.25,.826,.81),.065,'led')
            note(name,'Tela, leitura de carga, leitor, fixações, ventilação e sinalização funcional da recarga.')
        elif name.startswith('car-'):
            style={'blue':0,'white':1,'coral':2,'gold':3}[name[4:]];length=[1.76,1.92,1.8,1.65][style]
            paint='paint_'+name[4:]
            def front_glass(x,z):
                levels=[(.48,.71,length*.70,.02,.22),(.60,.69,length*.64,.04,.22),(.79,.58,length*.43,.09,.20),(.83,.55,length*.39,.09,.20)]
                a,b=next((a,b) for a,b in zip(levels,levels[1:]) if a[0]<=z<=b[0]);t=(z-a[0])/(b[0]-a[0])
                w,d,cy,r=[a[i]+(b[i]-a[i])*t for i in range(1,5)]
                edge=max(0,abs(x)-(w/2-r))
                return (x,cy-d/2+r-math.sqrt(max(0,r*r-edge*edge))-.006,z)
            wheel_finish(.478,[-length*.31,length*.30],.21,.20)
            for side in [-1,1]:
                # A continuous belt line, framed glass and doors read at street scale.
                beam('window sill brightwork',(side*.35,-length*.22,.518),(side*.35,length*.25,.518),.009,'alloy')
                for y in [-.28,.28]:
                    beam('door lower panel seam',(side*.418,y,.27),(side*.418,y,.43),.004,'navy',6)
                    beam('door upper panel seam',(side*.418,y,.43),(side*.375,y,.497),.004,'navy',6)
                beam('rocker panel',(side*.408,-length*.16,.245),(side*.408,length*.15,.245),.018,'navy')
                box('EV charge door',(side*.42,.49,.40),(.012,.115,.085),paint)
                box('charge hatch latch',(side*.43,.50,.405),(.005,.040,.008),'alloy')
                box('mirror glass',(side*.465,-.292,.66),(.075,.014,.031),'glass')
                for y in [-length*.31,length*.30]:
                    # Recessed hub, rim lip and five discreet lug nuts.
                    for r,depth,c in [(.135,.018,'navy'),(.119,.022,'alloy'),(.035,.03,paint)]:
                        o=cyl('layered alloy wheel',(side*.476,y,.21),r,depth,c,24);o.rotation_euler.y=math.pi/2
                    for i in range(5):
                        a=i*math.tau/5
                        o=cyl('wheel lug',(side*.494,y+math.sin(a)*.048,.21+math.cos(a)*.048),.008,.006,'navy',6);o.rotation_euler.y=math.pi/2
                        beam('alloy wheel ventilation slot',(side*.49,y+math.sin(a)*.074,.21+math.cos(a)*.074),(side*.49,y+math.sin(a+.18)*.109,.21+math.cos(a+.18)*.109),.011,'navy',6)
                    for i in range(18):
                        a=i*math.tau/18
                        beam('tire shoulder sipe',(side*.447,y+math.sin(a)*.194,.21+math.cos(a)*.194),(side*.458,y+math.sin(a+.06)*.194,.21+math.cos(a+.06)*.194),.003,'metal',4)
            for end in [-1,1]:
                box('registration plate',(0,end*(length/2+.023),.295),(.19,.012,.062),'white')
                for x in [-.14,0,.14]:box('parking sensor',(x,end*(length/2+.021),.37),(.014,.008,.014),'navy')
                if end>0:
                    for x in [-.12,0,.12]:box('bumper diffuser rib',(x,end*(length/2-.026),.21),(.014,.045,.030),'navy')
                for x in [-.27,.27]:
                    y=end*(length/2-.018)
                    rr('lamp optical enclosure',(x,y,.414),(.12,.04,.065),'navy',.022)
                    for dx in [-.032,.032]:box('segmented LED optic',(x+dx,y+end*.023,.415),(.028,.013,.032),'white' if end<0 else 'red')
            for x in [-.13,.13]:beam('windscreen wiper',front_glass(x,.55),front_glass(x+.065,.61),.008,'navy',6)
            for side in [-1,1]:
                beam('hood pressed crease',(side*.19,-length*.41,.477),(side*.24,-length*.29,.515),.006,paint,6)
                points=[front_glass(side*(.23-(z-.52)*.15),z) for z in [.52,.60,.69,.78,.80]]
                for a,b in zip(points,points[1:]):beam('windscreen side frame',a,b,.010,paint)
            rr('panoramic roof inset',(0,.09,.868),(.38,length*.25,.012),'autoglass',.12)
            box('high rear stop light',(0,length*.22+.09,.822),(.20,.02,.014),'red')
            if style in [1,2]:
                for side in [-1,1]:beam('roof rail',(side*.245,-.10,.883),(side*.245,.29,.883),.013,'alloy')
            else:rr('rear aero spoiler',(0,length*.23+.07,.811),(.50,.075,.025),paint,.03)
            note(name,'Pintura acetinada, caixas de roda recortadas, para-lamas, pneus sulcados, aros e parafusos, portas e caixilhos contínuos, teto panorâmico, faróis segmentados e difusores.')
        elif name in ['city-bus','delivery-truck','train-carriage','train-cab']:
            if name=='city-bus':
                wheel_finish(.53,[-.97,.97],.22,.21)
                for side in [-1,1]:
                    box('bus mirror arm',(side*.53,-1.17,1.07),(.16,.035,.035),'metal')
                    rr('bus mirror shell',(side*.55,-1.17,1.0),(.07,.10,.18),'white',.03)
                    box('bus lower trim',(side*.48,0,.29),(.025,2.65,.045),'metal')
                for x in [-.25,.25]:beam('bus windshield wiper',(x,-1.565,.87),(x+.1,-1.566,1.01),.009,'navy',6)
                box('bus rear destination',(0,1.554,1.1),(.5,.025,.13),'navy')
                for x in [-.32,.32]:box('bus rear lights',(x,1.568,.64),(.075,.025,.19),'red')
                for y in [.07,.32,.57,.82]:box('battery cooling grille',(0,y,1.478),(.43,.07,.015),'metal')
                box('accessible bus badge',(.508,-.9,.51),(.018,.19,.14),'blue')
            elif name=='delivery-truck':
                wheel_finish(.575,[-.96,.93],.24,.23)
                for side in [-1,1]:
                    box('truck mirror arm',(side*.55,-.95,1.0),(.16,.035,.035),'metal')
                    box('truck mirror',(side*.62,-.95,1.0),(.08,.12,.15),'white')
                    for z in [.40,1.58]:box('cargo edge extrusion',(side*.547,.55,z),(.03,1.75,.045),'metal')
                    for y in [-.17,.20,.6,1.0]:box('cargo fixing rivet',(side*.568,y,.41),(.012,.022,.022),'white')
                for x in [-.38,.38]:box('truck tail lamp',(x,1.371,.29),(.10,.02,.05),'red')
                box('truck rear door seam',(0,1.475,1.0),(.022,.015,1.2),'metal')
            else:
                wheel_finish(.475,[-.90,.90],.20,.15)
                for side in [-1,1]:
                    for y in [-.90,0,.9]:
                        box('train lower door seam',(side*.513,y,.48),(.012,.018,.27),'metal')
                        box('train door button',(side*.517,y+.07,.88),(.012,.026,.026),'signal')
                    box('train chassis skirt',(side*.486,0,.29),(.028,2.10,.07),'metal')
                if name=='train-cab':
                    for x in [-.12,.12]:beam('cab windshield wiper',(x,-1.618,.86),(x+.04,-1.486,1.0),.009,'navy',6)
                    box('cab unit number',(0,-1.906,.67),(.17,.017,.055),'navy');label('01',(0,-1.92,.655),.048,'white')
                else:
                    for y in [-1.56,1.56]:
                        for z in [.47,.65,.83,1.01]:box('bellows fold',(0,y,z),(.65,.025,.018),'navy')
            note(name,'Rodas e carroceria acabadas, ferragens, portas, iluminação, retrovisores ou articulações próprios da função.')
        elif name=='bus-shelter':
            for x in [-1.13,1.13]:
                rr('shelter column base',(x,.27,.12),(.18,.20,.08),'trim',.04)
                beam('roof support bracket',(x,.27,1.35),(x,-.20,1.52),.018,'metal')
            for x in [-.6,.2]:box('shelter roof light',(x,-.15,1.522),(.36,.08,.017),'white')
            for x in [-.6,.1]:rr('seat armrest',(x,-.01,.54),(.028,.24,.06),'white',.012)
            box('timetable route diagram',(.87,.248,.67),(.28,.015,.15),'white')
            for i in range(3):box('route map station',(.77+i*.10,.234,.69),(.035,.008,.035),'teal')
            note(name,'Encaixes da cobertura, bases, iluminação embutida, braços do assento e mapa de linha.')
        elif name=='solar-canopy':
            for x in [-.9,.9]:
                rr('canopy base plate',(x,0,.025),(.24,.28,.05),'trim',.035)
                for side in [-1,1]:beam('canopy knee brace',(x,0,1.49),(x,side*.47,1.88),.024,'metal')
            for x in [-.5,.5]:box('canopy underside light',(x,0,1.899),(.35,.13,.022),'white')
            note(name,'Chapas de base, contraventamentos, iluminação inferior e painéis com espessura.')
        elif name=='solar-station':
            for y in [-1.32,1.32]:
                for i in range(23):
                    for dy in [-.025,.025]:cyl('platform tactile stud',(-3.2+i*.28,y+dy,4.212),.013,.008,'signal',6)
                for x in [-2.7,0,2.7]:box('station ceiling light',(x,y,5.677),(.54,.12,.024),'white')
                beam('departure display suspension',(.3,y/1.32*1.8,5.32),(.3,y/1.32*1.8,5.68),.015,'white')
            for side in [-1,1]:
                box('lift call panel',(3.13,side*2.237,.93),(.085,.018,.18),'navy')
                box('lift call button',(3.13,side*2.25,.92),(.032,.014,.032),'led')
                box('lift door meeting',(2.6,side*2.263,.66),(.014,.012,1.0),'white')
                # Ground approach and boarding guidance follow actual lift doors.
                for i in range(9):box('lift approach tactile tile',(2.6,side*(1.55+i*.095),.129),(.32,.085,.012),'signal')
                for z in [.18,4.21]:box('lift threshold',(2.6,side*(2.265 if z<1 else 1.145),z),(.72,.07,.025),'alloy')
                for x in [2.09,3.11]:
                    for y in [side*1.30,side*1.75]:beam('lift side mullion',(x,y,.20),(x,y,5.45),.018,'white')
                for z in [1.35,2.65,4.22]:
                    for x in [2.08,3.12]:box('lift side transom',(x,side*1.7,z),(.03,1,.035),'white')
                for x in [-3.43,-2,-1,0,1,2,3.43]:
                    beam('platform balustrade post',(x,side*2.17,4.19),(x,side*2.17,5.1),.020,'alloy')
                for x in [-2.6,2.6]:
                    rr('pier base shoe',(x,side*1.8,.20),(.43,.44,.16),'trim',.06)
                    beam('pier structural capital',(x,side*1.8,3.5),(x-.40,side*1.8,3.94),.06,'white')
                    beam('pier structural capital',(x,side*1.8,3.5),(x+.40,side*1.8,3.94),.06,'white')
                box('platform perimeter fascia',(0,side*2.31,4.04),(6.55,.055,.095),'teal')
                for x in [-1.82,-1.35,-.90]:
                    rr('platform seat arm',(x,side*1.8,4.69),(.04,.34,.10),'alloy',.016)
                for i in range(3):box('platform bench back',(-1.35,side*1.955,4.7+i*.07),(1.3,.038,.045),'wood')
                for x in [-2.3,0,2.3]:
                    box('ceiling structural rib',(x,0,5.59),(.08,4.15,.17),'trim')
                box('roof edge gutter',(0,side*2.29,5.82),(6.50,.07,.07),'alloy')
                beam('rainwater downpipe',(-2.8,side*1.98,.25),(-2.8,side*1.98,5.72),.025,'alloy')
                board=box('platform number board',(-2.65,side*1.75,5.26),(.34,.07,.30),'teal')
                label('01' if side<0 else '02',(-2.65,side*1.75-.041,5.20),.15,'white')
                # Slim ticket reader on the ground, off the route to the lifts.
                rr('ticket terminal',(.55,side*.82,.74),(.26,.30,1.20),'white',.07)
                box('ticket touch display',(.55,side*.82-.155,1.0),(.18,.015,.22),'navy')
                box('ticket reader',(.55,side*.82-.163,.78),(.12,.016,.07),'teal')
                label('BILHETES',(-2.14,side*1.265,1.92),.12,'navy')
                if side>0:bpy.context.object.rotation_euler.z=math.pi
                box('station information panel',(-1.378,side*.46,1.17),(.025,.62,.44),'navy')
                for j in range(4):box('line diagram stop',(-1.36,side*.46-.21+j*.14,1.18),(.012,.07,.035),'led')
                for x in [-3.13]:
                    rr('station ground planter',(x,side*2.0,.31),(.45,.48,.38),'white',.07)
                    for dx in [-.10,.10]:ball('station planter shrub',(x+dx,side*2.0,.58),(.16,.19,.18),'leaf',2)
            for i in range(8):box('station plaza paving joint',(-.9+i*.48,0,.125),(.012,3.1,.004),'trim')
            for x in [-2.3,0,2.3]:
                for i in range(5):beam('station solar cell row',(x-.88,-1.15+i*.52,6.012+i*.023),(x+.88,-1.15+i*.52,6.012+i*.023),.005,'glass',4)
            note(name,'Bilheteria, terminais, espera nos dois níveis, plataformas com guarda-corpos contínuos, orientação tátil, elevadores arrematados, estrutura aparente, calhas, drenagem, células solares e sinalização de embarque.')
        elif name=='air-treatment':
            for x in [-.82,0,.82]:
                cyl('filter exhaust rim',(x,0,1.137),.22,.044,'metal',20)
                cyl('filter fan well',(x,0,1.162),.19,.012,'navy',20)
                for i in range(5):
                    a=i*math.tau/5
                    beam('fan blade',(x,0,1.174),(x+math.cos(a)*.155,math.sin(a)*.155,1.174),.027,'trim',6)
                for dx in [-.26,.26]:
                    for z in [.24,.92]:box('service cover fastener',(x+dx,-.349,z),(.016,.008,.016),'metal')
            beam('filter service conduit',(-.82,.25,.22),(.82,.25,.22),.026,'metal')
            note(name,'Ventiladores, grelhas, painéis de manutenção, fixadores e conexão entre módulos.')
        elif name in ['tree-palm','tree-blossom','tree-rooftop']:
            if name=='tree-palm':
                for i in range(16):cyl('palm trunk growth ring',(.025*(i*.125/.43),0,.10+i*.125),.079-i*.0018,.024,'wood',10)
                for i in range(9):
                    a=i*math.tau/9
                    for j in range(5):
                        t=j/5;u=(j+1)/5
                        def center(v):return (.125+v*1.05*math.cos(a),v*1.05*math.sin(a),2.23+math.sin(v*math.pi)*.4-v*.15)
                        beam('palm frond midrib',center(t),center(u),.010,'leaflight',6)
            else:
                h=.8 if name=='tree-rooftop' else 1.4
                for i in range(5):
                    a=i*2.4;x=math.cos(a)*.36;y=math.sin(a)*.36;z=h+.25+math.sin(i)*.10
                    for j in range(3):
                        ang=a+j*2.1
                        ball('crown surface cluster',(x+math.cos(ang)*.24,y+math.sin(ang)*.24,z+.18),(.16,.15,.14),'leaf' if name=='tree-rooftop' else ('petal' if j%2 else 'bloomshade'),1)
            note(name,'Silhueta orgânica com nervuras e anéis na palmeira; volumes e tons menores integrados às copas.')
        else:raise ValueError('Unreviewed futuristic model: '+name)

    def decorate(name,fn):
        def build():
            fn()
            if not api.get('LOW_DETAIL'):finish_model(name)
        return build
    api['FUTURE_POLISH_NOTES']=notes
    return {name:decorate(name,fn) for name,fn in builders.items()}
