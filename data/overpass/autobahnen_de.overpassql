[out:json]
[bbox:48.641344,8.933660,48.851906,9.149927];
// Define area for Baden-Württemberg
area["ISO3166-2" ~ "DE-BW"] -> .SA;

// Select all motorway and motorway links within the area
way(area.SA)[highway=motorway_link] -> .motorway_links;

// way(around.motorway_links:200)[highway][highway!=track][highway!=residential][highway!=service][highway!=path] -> .surrounding;
way(around.motorway_links:200)[highway~"^(primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|trunk|trunk_link)$"] -> .surrounding;

way(area.SA)[highway=motorway] -> .motorways;
way(area.SA)[highway=trunk] -> .trunk;
way(area.SA)[highway=primary] -> .primary;
way(area.SA)[highway=secondary] -> .secondary;
way(area.SA)[highway=tertiary] -> .tertiary;
way(area.SA)[highway=residential] -> .residential;

// Combine all data
(.motorways; .motorway_links; .surrounding; .trunk; .primary; .secondary; .tertiary; .residential;);

(._;>;);
out body;