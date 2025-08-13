[out:json];
// Define area for Hessen
area["ISO3166-2" ~ "DE-HE"] -> .HE;

// Select all motorway and motorway links within the area
way(area.HE)[highway=motorway_link] -> .motorway_links;
way(area.HE)[highway=trunk_link] -> .trunk_links;
way(area.HE)[highway=primary_link] -> .primary_links;
way(area.HE)[highway=secondary_link] -> .secondary_links;
way(area.HE)[highway=tertiary_link] -> .tertiary_links;


way(area.HE)[highway=motorway] -> .motorways;
way(area.HE)[highway=trunk] -> .trunk;
way(area.HE)[highway=primary] -> .primary;
way(area.HE)[highway=secondary] -> .secondary;
way(area.HE)[highway=tertiary] -> .tertiary;
way(area.HE)[highway=residential] -> .residential;

// Combine all data
(.motorways; .trunk; .primary; .secondary; .tertiary; .residential; .motorway_links; .trunk_links; .primary_links; .secondary_links; .tertiary_links;);

(._;>;);
out body;