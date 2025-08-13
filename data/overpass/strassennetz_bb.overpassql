[out:json];
// Define area for Brandenburg
area["ISO3166-2" ~ "DE-BB"] -> .BB;

// Select all motorway and motorway links within the area
way(area.BB)[highway=motorway_link] -> .motorway_links;
way(area.BB)[highway=trunk_link] -> .trunk_links;
way(area.BB)[highway=primary_link] -> .primary_links;
way(area.BB)[highway=secondary_link] -> .secondary_links;
way(area.BB)[highway=tertiary_link] -> .tertiary_links;


way(area.BB)[highway=motorway] -> .motorways;
way(area.BB)[highway=trunk] -> .trunk;
way(area.BB)[highway=primary] -> .primary;
way(area.BB)[highway=secondary] -> .secondary;
way(area.BB)[highway=tertiary] -> .tertiary;
way(area.BB)[highway=residential] -> .residential;

// Combine all data
(.motorways; .trunk; .primary; .secondary; .tertiary; .residential; .motorway_links; .trunk_links; .primary_links; .secondary_links; .tertiary_links;);

(._;>;);
out body;