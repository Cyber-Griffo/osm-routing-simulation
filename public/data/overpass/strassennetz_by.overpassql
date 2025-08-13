[out:json];
// Define area for Bayern
area["ISO3166-2" ~ "DE-BY"] -> .BY;

// Select all motorway and motorway links within the area
way(area.BY)[highway=motorway_link] -> .motorway_links;
way(area.BY)[highway=trunk_link] -> .trunk_links;
way(area.BY)[highway=primary_link] -> .primary_links;
way(area.BY)[highway=secondary_link] -> .secondary_links;
way(area.BY)[highway=tertiary_link] -> .tertiary_links;


way(area.BY)[highway=motorway] -> .motorways;
way(area.BY)[highway=trunk] -> .trunk;
way(area.BY)[highway=primary] -> .primary;
way(area.BY)[highway=secondary] -> .secondary;
way(area.BY)[highway=tertiary] -> .tertiary;
way(area.BY)[highway=residential] -> .residential;

// Combine all data
(.motorways; .trunk; .primary; .secondary; .tertiary; .residential; .motorway_links; .trunk_links; .primary_links; .secondary_links; .tertiary_links;);

(._;>;);
out body;