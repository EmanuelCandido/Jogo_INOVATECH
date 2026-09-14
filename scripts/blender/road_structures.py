"""Instanced road structures; X is across the road, Y is longitudinal.

Deck top is Z=0. Pier shaft is a unit height, with separately sized footing
and cap. Repetition follows physical metres in the map, not curve indices.
"""
def models(api):
    rr=api['ARCHITECTURE']['rr'];box=api['box']
    def deck():
        rr('structural concrete deck',(0,0,-.14),(1,1,.28),'stone',.025)
        for x in [-.27,.27]:
            rr('longitudinal edge girder',(x,0,-.32),(.12,1,.18),'roofdeck',.016)
    def shaft():
        rr('tapered concrete pier',(0,0,.5),(.72,.94,1),'stone',.06)
        for x in [-.375,.375]:box('recessed pier seam',(x,0,.5),(.018,.045,.88),'roofdeck')
    def footing():
        rr('foundation plinth',(0,0,.12),(1.75,1.9,.24),'roofdeck',.065)
        rr('foundation neck',(0,0,.31),(1.12,1.3,.22),'stone',.05)
    def cap():
        rr('pier headstock',(0,0,-.10),(1,1.20,.20),'stone',.04)
        for x in [-.28,.28]:box('elastomeric bearing',(x,0,.025),(.16,.72,.05),'dark',.015)
    def retaining():
        rr('retaining wall',(0,0,.5),(.25,1,1),'stone',.025)
        box('vertical construction joint',(.131,0,.5),(.009,.015,.96),'roofdeck')
        rr('retaining coping',(0,0,1.025),(.34,1,.05),'white',.012)
    models={'road-deck-module':deck,'road-pier-shaft':shaft,'road-pier-footing':footing,'road-pier-cap':cap,'road-retaining-wall':retaining}
    return models
