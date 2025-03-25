

/*

 Sieb des Eratosthenes

 

 1) Uint8Array dicht besetzt

 2) JS-Array dicht besetzt

 3) Object (sparse)

 4) Map

 5) Set

 */


const n = 1 << 24;


console.time("Uint8Array");

a = new Uint8Array(n);

for (let i = 3; i < n; i += 2)

  a[i] = 1;

for (let i = 3; i < n; i += 2)

  if (a[i])

    for (let j = 3 * i; j < n; j += 2 * i)

      a[j] = 0;

console.timeEnd("Uint8Array");


console.time("Array");

a = Array.from({ length: n }, dummy => 1);

for (let i = 3; i < n; i += 2)

  if (a[i])

    for (let j = 3 * i; j < n; j += 2 * i)

      a[j] = 0;

console.timeEnd("Array");


console.time("Object");

a = {};

for (let i = 3; i < n; i += 2)

  a[i] = true;

for (let i = 3; i < n; i += 2)

  if (a[i])

    for (let j = 3 * i; j < n; j += 2 * i)

      delete a[j];

console.timeEnd("Object");


console.time("Map");

a = new Map;

for (let i = 3; i < n; i += 2)

  a.set(i, true);

for (let i = 3; i < n; i += 2)

  if (a.has(i))

    for (let j = 3 * i; j < n; j += 2 * i)

      a.delete(j);

console.timeEnd("Map");


console.time("Set");

a = new Set;

for (let i = 3; i < n; i += 2)

  a.add(i);

for (let i = 3; i < n; i += 2)

  if (a.has(i))

    for (let j = 3 * i; j < n; j += 2 * i)

      a.delete(j);

console.timeEnd("Set");
