[out:json][maxsize:2000000000];
/* Definiere die Region Baden-Württemberg anhand des ISO3166-2 Codes */
area["ISO3166-2"="DE-BW"]->.BW;

/* Wähle alle Wege innerhalb Baden-Württembergs */
way(area.BW)[highway][area!="yes"];

/* Gib die Ergebnisse mit allen zugehörigen Knoten aus */
(._;>;);
out body;
