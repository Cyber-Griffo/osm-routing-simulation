[out:json];
// Define area for Saarland
area["ISO3166-2" ~ "DE-SL"] -> .SL;

// Select all motorway and motorway links within the area
way(area.SL)[highway=motorway_link] -> .motorway_links;
way(area.SL)[highway=trunk_link] -> .trunk_links;
way(area.SL)[highway=primary_link] -> .primary_links;
way(area.SL)[highway=secondary_link] -> .secondary_links;
way(area.SL)[highway=tertiary_link] -> .tertiary_links;


way(area.SL)[highway=motorway] -> .motorways;
way(area.SL)[highway=trunk] -> .trunk;
way(area.SL)[highway=primary] -> .primary;
way(area.SL)[highway=secondary] -> .secondary;
way(area.SL)[highway=tertiary] -> .tertiary;
way(area.SL)[highway=residential] -> .residential;

// Combine all data
(.motorways; .trunk; .primary; .secondary; .tertiary; .residential; .motorway_links; .trunk_links; .primary_links; .secondary_links; .tertiary_links;);

(._;>;);
out body;