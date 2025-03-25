[out:json];
// Define area for Thüringen
area["ISO3166-2" ~ "DE-TH"] -> .TH;

// Select all motorway and motorway links within the area
way(area.TH)[highway=motorway_link] -> .motorway_links;
way(area.TH)[highway=trunk_link] -> .trunk_links;
way(area.TH)[highway=primary_link] -> .primary_links;
way(area.TH)[highway=secondary_link] -> .secondary_links;
way(area.TH)[highway=tertiary_link] -> .tertiary_links;


way(area.TH)[highway=motorway] -> .motorways;
way(area.TH)[highway=trunk] -> .trunk;
way(area.TH)[highway=primary] -> .primary;
way(area.TH)[highway=secondary] -> .secondary;
way(area.TH)[highway=tertiary] -> .tertiary;
way(area.TH)[highway=residential] -> .residential;

// Combine all data
(.motorways; .trunk; .primary; .secondary; .tertiary; .residential; .motorway_links; .trunk_links; .primary_links; .secondary_links; .tertiary_links;);

(._;>;);
out body;