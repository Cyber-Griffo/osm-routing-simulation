# OSM-Routing-Simulation

![OSM-Routing-Simulation](/public/osm-routing.png)

## Description

The present project focuses on the implementation, optimization, and visualization of routing algorithms using OpenStreetMap data. The main objective is to develop an interactive web-based application that compares various routing algorithms, such as breadth-first search, Dijkstra, and A*, and visually represents their operation.  

A key contribution is the implementation of an efficient graph contraction technique, which significantly reduces computational effort by selectively eliminating intermediate nodes. Evaluation on different datasets (urban, rural, highway networks) demonstrates runtime improvements ranging from 10% to 95%, depending on the network structure and the chosen algorithm. For highway data, which has a low branching density, a node reduction of over 93% was achieved, leading to a computation speedup by a factor of 20.  

The developed application provides valuable insights into the functioning of routing algorithms and highlights the substantial optimization potential of structural graph transformations for efficient navigation in real-world road networks.

You can read more in the [documentation](/documentation.pdf).

## Installation

```bash
# Install dependencies
npm install
```

## Execution

```bash
# Start the simulation
npm start
```

The application will be available at `http://localhost:3000`.

## New Data

If you want to use new / your own data, you can use any of the given overpass queries in the `data/overpass` folder or create your own one. To get the data, you can simply use the provided `get_overpass_data` script. The script will download the data. After that, you get a json file which you can use in the application. The loading may take some time, depending on the size of the data.

```bash
# Get data
./get_overpass_data data/overpass/wilhelma.overpassql
```