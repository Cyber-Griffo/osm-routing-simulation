[out:json];
area["ISO3166-2" ~ "DE-BW"] -> .BW;

// 1. Alle Wege in Baden-Württemberg (White-List)
way(area.BW)[highway=motorway_link] -> .motorway_links;
way(area.BW)[highway=trunk_link] -> .trunk_links;
way(area.BW)[highway=primary_link] -> .primary_links;
way(area.BW)[highway=secondary_link] -> .secondary_links;
way(area.BW)[highway=tertiary_link] -> .tertiary_links;
way(area.BW)[highway=motorway] -> .motorways;
way(area.BW)[highway=trunk] -> .trunk;
way(area.BW)[highway=primary] -> .primary;
way(area.BW)[highway=secondary] -> .secondary;
way(area.BW)[highway=tertiary] -> .tertiary;
way(area.BW)[highway=residential] -> .residential;

// 2. Zusammenfügen der Daten
(.motorways; .trunk; .primary; .secondary; .tertiary; .residential; .motorway_links; .trunk_links; .primary_links; .secondary_links; .tertiary_links;);

// Ausgabe mit vollständiger Geometrie
(._;>;);
out body;