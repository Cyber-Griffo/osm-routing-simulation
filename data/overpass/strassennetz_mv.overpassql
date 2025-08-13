[out:json];
// Define area for Mecklenburg-Vorpommern
area["ISO3166-2" ~ "DE-MV"] -> .MV;

// Select all motorway and motorway links within the area
way(area.MV)[highway=motorway_link] -> .motorway_links;
way(area.MV)[highway=trunk_link] -> .trunk_links;
way(area.MV)[highway=primary_link] -> .primary_links;
way(area.MV)[highway=secondary_link] -> .secondary_links;
way(area.MV)[highway=tertiary_link] -> .tertiary_links;


way(area.MV)[highway=motorway] -> .motorways;
way(area.MV)[highway=trunk] -> .trunk;
way(area.MV)[highway=primary] -> .primary;
way(area.MV)[highway=secondary] -> .secondary;
way(area.MV)[highway=tertiary] -> .tertiary;
way(area.MV)[highway=residential] -> .residential;

// Combine all data
(.motorways; .trunk; .primary; .secondary; .tertiary; .residential; .motorway_links; .trunk_links; .primary_links; .secondary_links; .tertiary_links;);

(._;>;);
out body;