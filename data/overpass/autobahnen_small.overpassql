[out:json]
[bbox:48.641344,8.933660,48.651906,8.949927];
// Define area for Baden-Württemberg
area["ISO3166-2" ~ "DE-BW"] -> .SA;

// Select all motorway and motorway links within the area
way(area.SA)[highway=motorway_link] -> .motorway_links;

// way(around.motorway_links:200)[highway][highway!=track][highway!=residential][highway!=service][highway!=path] -> .surrounding;
way(around.motorway_links:200)[highway~"^(primary|primary_link|secondary|secondary_link|tertiary|trunk|trunk_link)$"] -> .surrounding;

way(area.SA)[highway=motorway] -> .motorways;

// Combine all data
(.motorways; .motorway_links; .surrounding;);

(._;>;);
out body;