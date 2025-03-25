const { geo } = require("../lib/geo.js");

const origin = [0, 0]
// U = Umfang der Erde
const U = geo.nav.r * 2 * Math.PI
// a = Array mit Distanzen in km (0.01 km = 10 m)
const a = [0, .01, .02, .05, .1, .2, .5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]
// d = Distanz in km
let d = 200
// c = Koordinaten in Grad mit Abstand d von origin = [0, 0] -> c = [0.0017966305682390429, 0]
let c = [360 * d / U, 0]

// r = Array mit Soll-Distanzen und Distanzen in km, berechnet mit dist_haversin, dist_haversin2, dist_haversin3, dist_haversin4
r = []

a.forEach(d => {
  // c = Koordinaten in Grad mit Abstand d von origin = [0, 0]
  c = [360 * d / U, 0]
  const dist_haversin = geo.nav.dist_haversin(c, origin)
  const dist_haversin2 = geo.nav.dist_haversin2(c, origin)
  const dist_haversin3 = geo.nav.dist_haversin3(c, origin)
  const dist_haversin4 = geo.nav.dist_haversin4(c, origin)

  r.push({ range: d, dist_haversin, dist_haversin2, dist_haversin3, dist_haversin4 })
})

console.table(r)
