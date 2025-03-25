[out:json];
// Define area for Nordrhein-Westfalen
area["ISO3166-2" ~ "DE-NW"] -> .NW;

// Select all motorway and motorway links within the area
way(area.NW)[highway=motorway_link] -> .motorway_links;
way(area.NW)[highway=trunk_link] -> .trunk_links;
way(area.NW)[highway=primary_link] -> .primary_links;
way(area.NW)[highway=secondary_link] -> .secondary_links;
way(area.NW)[highway=tertiary_link] -> .tertiary_links;


way(area.NW)[highway=motorway] -> .motorways;
way(area.NW)[highway=trunk] -> .trunk;
way(area.NW)[highway=primary] -> .primary;
way(area.NW)[highway=secondary] -> .secondary;
way(area.NW)[highway=tertiary] -> .tertiary;
way(area.NW)[highway=residential] -> .residential;

// Combine all data
(.motorways; .trunk; .primary; .secondary; .tertiary; .residential; .motorway_links; .trunk_links; .primary_links; .secondary_links; .tertiary_links;);

(._;>;);
out body;