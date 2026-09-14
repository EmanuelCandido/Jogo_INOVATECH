"""Station access kit: full-size stairs and a short platform canopy bay.

Stair landings are exactly at Z=0 and Z=5.56. The two flights share a
turning landing; their rails and contrasting nosings remain in both LODs.
"""
import math

def models(api):
    h=api['ARCHITECTURE'];rr,beam,mesh=(h[k] for k in ('rr','beam','mesh'))
    box=api['box']
    def stairs():
        rise=5.56/32;tread=.30
        rr('ground arrival',(-.85,-3.6,-.05),(1.60,1.2,.10),'roofdeck',.03)
        rr('upper arrival',(.85,-3.6,5.51),(1.60,1.2,.10),'roofdeck',.03)
        rr('turning landing',(0,2.55,2.73),(3.3,1.5,.10),'roofdeck',.04)
        for flight in range(2):
            x=-.85 if flight==0 else .85
            for i in range(16):
                y=-3+(i+.5)*tread if flight==0 else 1.8-(i+.5)*tread
                z=(i+1+flight*16)*rise
                rr('non-slip stair tread',(x,y,z-.05),(1.5,tread+.012,.10),'stone',.016)
                box('contrasting stair nosing',(x,y+(-1 if flight==0 else 1)*.13,z+.007),(1.40,.04,.014),'gold')
                if i%4==0:
                    for side in [-1,1]:beam('stair baluster',(x+side*.75,y,z),(x+side*.75,y,z+.85),.025,'metal')
            start=(-3,0) if flight==0 else (1.8,2.78)
            end=(1.8,2.78) if flight==0 else (-3,5.56)
            for side in [-1,1]:
                beam('continuous handrail',(x+side*.75,start[0],start[1]+.95),(x+side*.75,end[0],end[1]+.95),.032,'metal')
                beam('structural stair stringer',(x+side*.65,start[0],start[1]-.10),(x+side*.65,end[0],end[1]-.10),.085,'roofdeck')
        for x in [-1.62,1.62]:
            beam('landing column',(x,3.12,0),(x,3.12,3.68),.055,'metal')
            beam('landing edge rail',(x,1.82,3.68),(x,3.25,3.68),.032,'metal')
        beam('turning landing rail',(-1.62,3.25,3.68),(1.62,3.25,3.68),.032,'metal')
        for x in [.08,1.62]:
            beam('upper landing column',(x,-4.1,0),(x,-4.1,6.5),.055,'metal')
            beam('upper landing rail',(x,-4.18,6.5),(x,-3.05,6.5),.032,'metal')
        api['MODEL_ATTACHMENTS'].setdefault('station-stairs',{}).update({'front':[0,0,1],'entry':[-.85,0,4.2],'platform':[.85,5.56,4.2]})
    def canopy():
        # One 3 m bay. The back posts leave the whole passenger strip open.
        for x in [-1.43,1.43]:
            rr('canopy footing',(x,-.72,.045),(.19,.19,.09),'roofdeck',.02)
            beam('canopy back column',(x,-.72,.09),(x,-.72,2.34),.045,'white')
        n=6 if api.get('LOW_DETAIL') else 12
        profile=[(-.88+i*1.76/n,2.36+.24*math.sin(i*math.pi/n)) for i in range(n+1)]
        vertices=[(x,y,z) for x in [-1.52,1.52] for y,z in profile]
        mesh('curved platform glass',vertices,[(i,i+1,n+2+i,n+1+i) for i in range(n)],'glass')
        for x in [-1.43,1.43]:
            for i in range(n):
                a,b=profile[i:i+2];beam('canopy rib',(x,*a),(x,*b),.028,'white')
        for y,z in [profile[0],profile[-1]]:beam('roof edge gutter',(-1.52,y,z),(1.52,y,z),.035,'white')
    def guardrail():
        # One metre module along Y. Ends meet adjacent modules exactly;
        # openings are determined by the assembled passenger floor boundary.
        for y in [-.5,.5]:
            beam('guardrail post',(0,y,0),(0,y,.95),.026,'metal')
        for z in [.48,.95]:
            beam('continuous passenger rail',(0,-.5,z),(0,.5,z),.028,'metal')
        for y in [-.25,0,.25]:
            beam('guardrail infill',(0,y,.08),(0,y,.90),.016,'metal')
    api['FUTURE_LOD_MODELS'].update({'station-stairs','station-platform-canopy'})
    return {'station-stairs':stairs,'station-platform-canopy':canopy,'station-guardrail':guardrail}
