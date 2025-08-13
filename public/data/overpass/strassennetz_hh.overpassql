[out:json];
// Define area for Hamburg
area["ISO3166-2" ~ "DE-HH"] -> .HH;

// Select all motorway and motorway links within the area
way(area.HH)[highway=motorway_link] -> .motorway_links;
way(area.HH)[highway=trunk_link] -> .trunk_links;
way(area.HH)[highway=primary_link] -> .primary_links;
way(area.HH)[highway=secondary_link] -> .secondary_links;
way(area.HH)[highway=tertiary_link] -> .tertiary_links;


way(area.HH)[highway=motorway] -> .motorways;
way(area.HH)[highway=trunk] -> .trunk;
way(area.HH)[highway=primary] -> .primary;
way(area.HH)[highway=secondary] -> .secondary;
way(area.HH)[highway=tertiary] -> .tertiary;
way(area.HH)[highway=residential] -> .residential;

// Combine all data
(.motorways; .trunk; .primary; .secondary; .tertiary; .residential; .motorway_links; .trunk_links; .primary_links; .secondary_links; .tertiary_links;);

(._;>;);
out body;