[out:json]
[bbox:48.667360,8.971270,48.962066,9.453613];
// Define area for Baden-Württemberg
area["ISO3166-2" ~ "DE-BW"] -> .SA;

// Select all motorway and motorway links within the area
way(area.SA)[highway=motorway_link] -> .motorway_links;

way(around.motorway_links:50)[highway~"^(primary|primary_link|secondary|secondary_link|tertiary|trunk|trunk_link)$"] -> .surrounding;

way(area.SA)[highway=motorway] -> .motorways;

// Combine all data
(.motorways; .motorway_links; .surrounding;);

(._;>;);
out body;