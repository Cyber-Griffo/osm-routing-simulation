[out:json];

(area["ISO3166-1"="DE"];)->.germany;
(
  node["highway"="motorway"](area.germany);
  way["highway"="motorway"](area.germany);
  relation["highway"="motorway"](area.germany);
  
  node["highway"="motorway_link"](area.germany);
  way["highway"="motorway_link"](area.germany);
  relation["highway"="motorway_link"](area.germany);
);
(._;>;);
out body;


