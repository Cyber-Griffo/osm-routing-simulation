[out:json];
// Define area for Berlin
area["ISO3166-2" ~ "DE-BE"] -> .BE;

// Select all motorway and motorway links within the area
way(area.BE)[highway=motorway_link] -> .motorway_links;
way(area.BE)[highway=trunk_link] -> .trunk_links;
way(area.BE)[highway=primary_link] -> .primary_links;
way(area.BE)[highway=secondary_link] -> .secondary_links;
way(area.BE)[highway=tertiary_link] -> .tertiary_links;


way(area.BE)[highway=motorway] -> .motorways;
way(area.BE)[highway=trunk] -> .trunk;
way(area.BE)[highway=primary] -> .primary;
way(area.BE)[highway=secondary] -> .secondary;
way(area.BE)[highway=tertiary] -> .tertiary;
way(area.BE)[highway=residential] -> .residential;

// Combine all data
(.motorways; .trunk; .primary; .secondary; .tertiary; .residential; .motorway_links; .trunk_links; .primary_links; .secondary_links; .tertiary_links;);

(._;>;);
out body;