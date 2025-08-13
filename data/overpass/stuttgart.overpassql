[out:json]
[bbox:48.6700,9.0400,48.8800,9.3200];
area["ISO3166-2"="DE-BW"]->.BW;

// 1. Alle Wege in Stuttgart (ohne Flächen)
way(area.BW)[highway][area!="yes"];

// Ausgabe mit vollständiger Geometrie
(._;>;);
out body;