"""Modular accessible station connection, executed through Blender MCP.

The one-metre shaft stretches vertically; landing modules retain their scale.
Blender Z is exported as application Y. Front is Blender -Y.
"""
def lift_shaft():
    box('glazed shaft', (0,0,.5), (1.28,1.28,1), 'glassdark', .025)
    for x in [-.67,.67]:
        for y in [-.67,.67]:
            box('structural mullion',(x,y,.5),(.075,.075,1),'white',.018)
    for x in [-.45,.45]:
        box('vertical guide',(x,.55,.5),(.035,.06,1),'metal')

def lift_landing():
    box('landing slab',(0,0,.04),(1.7,1.85,.08),'white',.035)
    box('enclosure',(0,0,.78),(1.30,1.30,1.48),'glass',.025)
    for x in [-.67,.67]:
        for y in [-.67,.67]:
            box('rounded frame',(x,y,.8),(.08,.08,1.6),'white',.02)
    for y in [-.675,.675]:
        for x in [-.22,.22]:
            box('sliding glass door',(x,y,.72),(.425,.035,1.26),'glassdark',.01)
            box('door handle',(x*.24,y*1.04,.72),(.025,.04,.33),'metal')
        box('door lintel',(0,y,1.42),(1.02,.10,.12),'white',.015)
        box('level display',(0,y*1.05,1.43),(.23,.018,.075),'dark')
        box('level indicator',(0,y*1.07,1.43),(.035,.018,.05),'leaflight')
        box('call button',(.57,y*1.04,.70),(.08,.04,.15),'metal',.01)
        box('illuminated button',(.57,y*1.08,.71),(.035,.02,.04),'gold')
        for x in [-.4,-.2,0,.2,.4]:
            box('tactile threshold',(x,y*1.18,.095),(.12,.19,.025),'gold')
    box('weather canopy',(0,0,1.62),(1.72,1.92,.15),'white',.06)
    box('solar canopy inset',(0,0,1.71),(1.15,1.30,.035),'solar',.01)
    for x in [-.38,0,.38]:
        box('solar cell seam',(x,0,1.735),(.018,1.26,.008),'glass')
    for y in [-.42,0,.42]:
        box('solar cell seam',(0,y,1.735),(1.1,.018,.008),'glass')
