"""Port warehouses and parked service vehicles, original miniature geometry."""
import bpy
import math
from mathutils import Vector

def models(api):
    box,cyl,finish=(api[k] for k in ('box','cyl','finish'))
    def warehouse():
        box('paved loading yard',(0,0,.045),(7.2,5,.09),'concrete',.035)
        box('warehouse walls',(0,.1,1.3),(6.5,3.4,2.5),'white',.05)
        # A shallow gabled sheet-metal roof with seams and raised skylights.
        for side in [-1,1]:
            o=box('roof slope',(side*1.67,.1,2.65),(3.48,3.7,.12),'roof',.025);o.rotation_euler.y=side*.12
            for y in [-1.55,-1.1,-.65,-.2,.25,.7,1.15,1.6]:
                o=box('roof standing seam',(side*1.67,y,2.73),(3.48,.025,.025),'metal');o.rotation_euler.y=side*.12
            for y in [-.65,.6]:box('roof light',(side*1.6,y,2.87),(.8,.7,.1),'glassdark',.02)
        for x in [-2.2,0,2.2]:
            box('dock frame',(x,-1.65,.87),(1.45,.13,1.75),'roof')
            box('roller shutter',(x,-1.725,.87),(1.25,.03,1.52),'metal')
            for i in range(10):box('shutter rib',(x,-1.75,.2+i*.14),(1.22,.018,.028),'roof')
            box('loading platform',(x,-1.9,.19),(1.55,.6,.38),'roof',.025)
            for dx in [-.86,.86]:cyl('dock bollard',(x+dx,-1.94,.28),.065,.56,'signal',10)
            box('dock number board',(x,-1.73,1.91),(.34,.025,.22),'blue')
        for side in [-1,1]:
            for y in [-.9,.1,1.1]:
                box('side frame',(side*3.27,y,1.8),(.035,.7,.52),'trim')
                box('side glazing',(side*3.292,y,1.8),(.025,.6,.42),'glassdark')
            box('rain gutter',(side*3.36,.1,2.45),(.055,3.65,.06),'metal')
            box('downpipe',(side*3.27,1.65,1.2),(.065,.065,2.4),'metal')
        for x in [-2.8,2.8]:
            box('service door',(x,1.82,.6),(.7,.04,1.2),'teal')
            box('door handle',(x+.22,1.86,.57),(.025,.03,.18),'white')
    def truck():
        box('truck chassis',(0,0,.27),(.96,3.9,.18),'metal',.03)
        box('cargo box',(0,.6,1.06),(1.07,2.7,1.45),'white',.025)
        box('cab',(0,-1.33,.77),(1.04,1.05,1.17),'white',.08)
        box('windshield',(0,-1.87,1.02),(.85,.025,.46),'glassdark')
        for side in [-1,1]:
            box('cab side window',(side*.53,-1.33,1.02),(.023,.63,.44),'glassdark')
            box('mirror',(side*.64,-1.68,1.02),(.12,.13,.2),'metal')
            for y in [-1.36,.75,1.48]:
                o=cyl('truck tire',(side*.49,y,.3),.29,.15,'rubber',16);o.rotation_euler.y=math.pi/2
                o=cyl('wheel hub',(side*.576,y,.3),.14,.02,'roof',12);o.rotation_euler.y=math.pi/2
            for z in [.5,1.64]:box('box edge',(side*.55,.6,z),(.035,2.7,.035),'metal')
        for x in [-.35,.35]:box('headlight',(x,-1.88,.57),(.21,.025,.13),'signal')
        box('grille',(0,-1.89,.52),(.4,.025,.15),'metal')
        box('rear door',(0,1.968,1.03),(.94,.03,1.28),'trim')
        for x in [-.21,.21]:box('door lock',(x,1.99,1),(.025,.03,1.08),'metal')
    return {'port-warehouse':warehouse,'delivery-truck':truck}
