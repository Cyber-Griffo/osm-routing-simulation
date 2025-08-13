[out:json];
// Define area for Schleswig-Holstein
area["ISO3166-2" ~ "DE-SH"] -> .SH;

// Select all motorway and motorway links within the area
way(area.SH)[highway=motorway_link] -> .motorway_links;
way(area.SH)[highway=trunk_link] -> .trunk_links;
way(area.SH)[highway=primary_link] -> .primary_links;
way(area.SH)[highway=secondary_link] -> .secondary_links;
way(area.SH)[highway=tertiary_link] -> .tertiary_links;


way(area.SH)[highway=motorway] -> .motorways;
way(area.SH)[highway=trunk] -> .trunk;
way(area.SH)[highway=primary] -> .primary;
way(area.SH)[highway=secondary] -> .secondary;
way(area.SH)[highway=tertiary] -> .tertiary;
way(area.SH)[highway=residential] -> .residential;

// Combine all data
(.motorways; .trunk; .primary; .secondary; .tertiary; .residential; .motorway_links; .trunk_links; .primary_links; .secondary_links; .tertiary_links;);

(._;>;);
out body;