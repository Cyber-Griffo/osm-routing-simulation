[out:json];

area["ISO3166-2" ~ "DE-SN"] -> .SN;

// Select all motorway and motorway links within the area
way(area.SN)[highway=motorway_link] -> .motorway_links;

way(around.motorway_links:200)[highway~"^(primary|primary_link|secondary|secondary_link|tertiary|trunk|trunk_link)$"] -> .surrounding;

way(area.SN)[highway=motorway] -> .motorways;

// Combine all data
(.motorways; .motorway_links; .surrounding;);

(._;>;);
out body;

