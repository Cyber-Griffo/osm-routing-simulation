[out:json];
// Define area for Sachsen
area["ISO3166-2" ~ "DE-SN"] -> .SN;

// Select all motorway and motorway links within the area
way(area.SN)[highway=motorway_link] -> .motorway_links;
way(area.SN)[highway=trunk_link] -> .trunk_links;
way(area.SN)[highway=primary_link] -> .primary_links;
way(area.SN)[highway=secondary_link] -> .secondary_links;
way(area.SN)[highway=tertiary_link] -> .tertiary_links;


way(area.SN)[highway=motorway] -> .motorways;
way(area.SN)[highway=trunk] -> .trunk;
way(area.SN)[highway=primary] -> .primary;
way(area.SN)[highway=secondary] -> .secondary;
way(area.SN)[highway=tertiary] -> .tertiary;
way(area.SN)[highway=residential] -> .residential;

// Combine all data
(.motorways; .trunk; .primary; .secondary; .tertiary; .residential; .motorway_links; .trunk_links; .primary_links; .secondary_links; .tertiary_links;);

(._;>;);
out body;