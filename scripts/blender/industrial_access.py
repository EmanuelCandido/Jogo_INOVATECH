"""Truck gate. Front is -Y in Blender; the open lane remains 4.8 m wide."""
def models(api):
    h=api['ARCHITECTURE']
    rr,beam,label,solar=(h[k] for k in ('rr','beam','label','solar'))
    box=api['box']
    def gate():
        rr('guard booth base',(3.5,0,.10),(1.85,2.2,.2),'stone',.10)
        rr('guard booth',(3.5,0,.95),(1.55,1.8,1.7),'white',.10)
        rr('guard glazing',(3.5,-.92,1.2),(1.25,.04,.65),'glassdark',.03)
        rr('side glazing',(2.71,0,1.2),(.04,1.25,.65),'glassdark',.03)
        rr('service roof',(3.5,0,1.9),(2.0,2.35,.17),'white',.10)
        solar(3.5,0,2.05,1.5,1.7)
        for x in [-2.52,2.52]:
            rr('barrier foundation',(x,0,.08),(.55,.65,.16),'stone',.07)
            rr('barrier housing',(x,0,.57),(.35,.36,.9),'gold',.065)
            box('access reader',(x,-.20,.78),(.2,.045,.24),'dark')
            box('green signal',(x,-.23,.84),(.05,.025,.045),'leaflight')
        # Raised arms are outside the truck clearance envelope.
        for x,side in [(-2.52,1),(2.52,-1)]:
            beam('raised barrier arm',(x,0,1.06),(x+side*.36,0,3.1),.045,'white')
            for i in range(4):
                z=1.25+i*.43
                box('barrier reflective stripe',(x+side*(z-1.06)*.176,-.047,z),(.09,.02,.15),'red')
        for x in [-2.65,2.65]:
            beam('gate sign upright',(x,.55,.1),(x,.55,3.6),.06,'metal')
        rr('gate clearance sign',(0,.55,3.56),(5.6,.18,.48),'white',.10)
        label('CARGA E DESCARGA',(0,.43,3.54),.22,'dark')
        label('CAMINHOES',(3.5,-.95,.55),.12,'dark')
    api['FUTURE_LOD_MODELS'].add('industrial-gate')
    return {'industrial-gate':gate}
