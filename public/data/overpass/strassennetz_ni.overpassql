[out:json];
// Define area for Niedersachsen
area["ISO3166-2" ~ "DE-NI"] -> .NI;

// Select all motorway and motorway links within the area
way(area.NI)[highway=motorway_link] -> .motorway_links;
way(area.NI)[highway=trunk_link] -> .trunk_links;
way(area.NI)[highway=primary_link] -> .primary_links;
way(area.NI)[highway=secondary_link] -> .secondary_links;
way(area.NI)[highway=tertiary_link] -> .tertiary_links;


way(area.NI)[highway=motorway] -> .motorways;
way(area.NI)[highway=trunk] -> .trunk;
way(area.NI)[highway=primary] -> .primary;
way(area.NI)[highway=secondary] -> .secondary;
way(area.NI)[highway=tertiary] -> .tertiary;
way(area.NI)[highway=residential] -> .residential;

// Combine all data
(.motorways; .trunk; .primary; .secondary; .tertiary; .residential; .motorway_links; .trunk_links; .primary_links; .secondary_links; .tertiary_links;);

(._;>;);
out body;