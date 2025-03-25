[out:json];
// Define area for Rheinland-Pfalz
area["ISO3166-2" ~ "DE-RP"] -> .RP;

// Select all motorway and motorway links within the area
way(area.RP)[highway=motorway_link] -> .motorway_links;
way(area.RP)[highway=trunk_link] -> .trunk_links;
way(area.RP)[highway=primary_link] -> .primary_links;
way(area.RP)[highway=secondary_link] -> .secondary_links;
way(area.RP)[highway=tertiary_link] -> .tertiary_links;


way(area.RP)[highway=motorway] -> .motorways;
way(area.RP)[highway=trunk] -> .trunk;
way(area.RP)[highway=primary] -> .primary;
way(area.RP)[highway=secondary] -> .secondary;
way(area.RP)[highway=tertiary] -> .tertiary;
way(area.RP)[highway=residential] -> .residential;

// Combine all data
(.motorways; .trunk; .primary; .secondary; .tertiary; .residential; .motorway_links; .trunk_links; .primary_links; .secondary_links; .tertiary_links;);

(._;>;);
out body;