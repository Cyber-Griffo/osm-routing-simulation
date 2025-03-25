[out:json]
[bbox:48,8,49,10];

area[name="Wilhelma"]->.searchArea;

// 1. Alle Wege in der Wilhelma (ohne Brücken und Tunnel)
way(area.searchArea)[highway][tunnel!=yes][bridge!=yes];

// Ausgabe mit vollständiger Geometrie
(._;>;);
out body;
