import { state } from './state.js';
import { showNotification, updateRuntimeDisplay } from './notifications.js';
import { style, nodeStyle } from './style.js';
import { mapHandler } from './map.js';
import { createNodeFeature } from './utils.js';

export async function initializeGraphs(file_path) {
  try {
    // Check for existing calculated graphs
    const baseName = file_path.split('/').pop().split('.')[0];
    console.log('Base name:', baseName);
    const completeGraphPath = `./data/cached/${baseName}_complete.json`;
    const contractedGraphPath = `./data/cached/${baseName}_contracted.json`;

    let loadedFromCache = false;

    try {
      const completeData = await fetch(completeGraphPath);
      const contractedData = await fetch(contractedGraphPath);

      if (completeData.ok && contractedData.ok) {
        const completeJson = await completeData.json();
        const contractedJson = await contractedData.json();

        state.completeGraph = new c_Graph();
        state.completeGraph.debug = false;
        state.completeGraph.fromSavedGraph(completeJson);

        state.contractedGraph = new c_Graph();
        state.contractedGraph.debug = false;
        state.contractedGraph.fromSavedGraph(contractedJson);

        loadedFromCache = true;
        console.log('Loaded graphs from cache');
      }
    } catch (e) {
      console.log('No cached graphs found, calculating new ones');
    }

    if (!loadedFromCache) {
      // Initialize complete graph
      state.completeGraph = new c_Graph();
      state.completeGraph.debug = true;
      const jsonData = await (await fetch(file_path)).json();
      state.completeGraph.fromOpenStreetMap(jsonData);

      console.log("complete Graph", state.completeGraph);

      // Initialize contracted graph
      state.contractedGraph = new c_Graph(
        structuredClone(state.completeGraph.nodes),
        structuredClone(state.completeGraph.edges)
      );
      state.contractedGraph.debug = true;
      state.contractedGraph.contractGraph();
    }

    // Draw graphs
    state.completeGraph.to_OL_VectorLayer(mapHandler.vecAllNodes, () => style());
    state.contractedGraph.to_OL_VectorLayer(mapHandler.vecContracted, () => style());

    // Initialize KD-Tree
    state.kdTree = new kd_index(state.completeGraph.nodes, e => e, geo.nav.dist_haversin);

    state.kdTree.debug = false;

    return true;
  } catch (error) {
    showNotification("Failed to initialize graphs", "error");
    return false;
  }
}

export function calculatePath(algorithm, optimized) {
  const displayName = `${optimized ? 'Optimized ' : ''}${algorithm.charAt(0).toUpperCase() + algorithm.slice(1)}`;
  const algorithmDisplay = document.getElementById('algorithmDisplay');

  let result = null;

  try {
    result = optimized ?
      state.contractedGraph.calculateOptimizedPath(state.startNode, state.endNode, algorithm) :
      executeBasicAlgorithm(algorithm);
    return result;
  } catch (error) {
    throw error;
  } finally {
    updateRuntimeDisplay(result);
    updateAlgorithmDisplay(algorithmDisplay, displayName, result?.success);
  }
}

function executeBasicAlgorithm(algorithm) {
  switch (algorithm) {
    case "breadth":
      return state.completeGraph.route_breadth_search(state.startNode, state.endNode);
    case "dijkstra":
      return state.completeGraph.route_dijkstra(state.startNode, state.endNode);
    case "a_star":
      return state.completeGraph.route_a_star(state.startNode, state.endNode);
    default:
      throw new Error("Unknown algorithm");
  }
}

function updateAlgorithmDisplay(display, name, success) {
  display.textContent = success ? name : `${name} (Failed)`;
  display.className = `runtime-value ${success ? 'success' : 'error'}`;
}

export function displayPath(path, color = "red") {
  if (!path) return;

  for (let i = 0; i < path.length - 1; i++) {
    const smaller = parseInt(path[i]) < parseInt(path[i + 1]) ? path[i] : path[i + 1];
    const greater = parseInt(path[i]) < parseInt(path[i + 1]) ? path[i + 1] : path[i];
    const edgeKey = `${smaller}--${greater}`;

    const edge = state.completeGraph.edges[edgeKey];
    const pathFeature = new ol.Feature({
      geometry: edge.getGeometry().clone(),
      edgeKey: edgeKey
    });
    pathFeature.setStyle(style(color));
    mapHandler.vecInteractions.addFeature(pathFeature);
  }
}

export function resetPath(pathResult) {
  if (!pathResult?.path) return;

  const features = mapHandler.vecInteractions.getFeatures();
  features.forEach(feature => {
    if (feature.get('edgeKey')) {
      mapHandler.vecInteractions.removeFeature(feature);
    }
  });
}

export function displayPathNodes(path, color = "red", simulation = false) {
  if (!path) return;

  path = structuredClone(path);
  path.shift();
  path.pop();

  path.forEach((nodeId, index) => {
    const node = {
      k: state.completeGraph.nodes[nodeId].k,
      id: nodeId
    };
    const nodeFeature = createNodeFeature(node);
    if (nodeFeature) {
      nodeFeature.setStyle(nodeStyle(color, 6, index.toString()));
      mapHandler.vecInteractions.addFeature(nodeFeature);
    }
  });
}

export function resetPathNodes(pathResult) {
  if (!pathResult?.path) return;

  let path = structuredClone(pathResult.path);
  path.shift();
  path.pop();

  // Create a Set of node IDs for efficient lookup
  const pathNodeIds = new Set(path.map(id => id.toString()));

  // Remove only features that correspond to nodes in the path
  const features = mapHandler.vecInteractions.getFeatures();
  features.forEach(feature => {
    const featureNodeId = feature.get('nodeId');
    if (featureNodeId && pathNodeIds.has(featureNodeId)) {
      mapHandler.vecInteractions.removeFeature(feature);
    }
  });
}

export function resetGraphState() {
  // Clear all interactions
  mapHandler.clearInteractions();

  // Update visibility of base layers
  mapHandler.updateLayerVisibility();
}
