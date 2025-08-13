[out:json];
// Define area for Bremen
area["ISO3166-2" ~ "DE-HB"] -> .HB;

// Select all motorway and motorway links within the area
way(area.HB)[highway=motorway_link] -> .motorway_links;
way(area.HB)[highway=trunk_link] -> .trunk_links;
way(area.HB)[highway=primary_link] -> .primary_links;
way(area.HB)[highway=secondary_link] -> .secondary_links;
way(area.HB)[highway=tertiary_link] -> .tertiary_links;


way(area.HB)[highway=motorway] -> .motorways;
way(area.HB)[highway=trunk] -> .trunk;
way(area.HB)[highway=primary] -> .primary;
way(area.HB)[highway=secondary] -> .secondary;
way(area.HB)[highway=tertiary] -> .tertiary;
way(area.HB)[highway=residential] -> .residential;

// Combine all data
(.motorways; .trunk; .primary; .secondary; .tertiary; .residential; .motorway_links; .trunk_links; .primary_links; .secondary_links; .tertiary_links;);

(._;>;);
out body;