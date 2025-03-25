import { state } from './state.js';
import { showNotification } from './notifications.js';
import { mapHandler } from './map.js';
import { calculatePath, displayPath, resetPath, displayPathNodes, resetPathNodes } from './graph.js';
import { activateButtons, activateCheckBoxes, enableSelectionButtons, resetUIStates, setActiveButton } from './ui.js';
import { style } from './style.js';
import Constants from './constants.js';
import { drawNode, handleEndPointSelection, handleNextCrossingsSelection, handleStartPointSelection } from "./utils.js";
import { simulationController } from './simulation.js';

export function setupMapEvents() {
  mapHandler.map.on('moveend', handleMapZoom);
  setupButtonEvents();
  setupCheckboxEvents();
  setupSimulationEvents();
}

function handleMapZoom() {
  state.currZoom = mapHandler.map.getView().getZoom();
  if (state.currZoom < Constants.ZOOM_THRESHOLD &&
    (state.isSelectedNodeToShowNextCrossings ||
      state.isSettingStartPoint ||
      state.isSettingEndPoint)) {
    mapHandler.deactivateHoverEffect();
    resetSelectionStates();
    removeMouseEvents();
    setActiveButton(null);
    showNotification("Please zoom in to set points", "warning");
  }
}

function resetSelectionStates() {
  state.isSelectedNodeToShowNextCrossings = false;
  state.isSettingStartPoint = false;
  state.isSettingEndPoint = false;
}

export function addMouseEvents() {
  mapHandler.map.on('click', handleMapClick);
  mapHandler.map.on('pointermove', handleMapMouseMove);
}

export function removeMouseEvents() {
  mapHandler.map.un('click', handleMapClick);
  mapHandler.map.un('pointermove', handleMapMouseMove);
}

function handleMapClick(evt) {
  if (!state.kdTree || !(state.isSettingStartPoint || state.isSettingEndPoint || state.isSelectedNodeToShowNextCrossings)) return;

  const coords = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
  const nearestNode = state.kdTree.NN_e(coords).id;

  if (state.isSettingStartPoint) {
    handleStartPointSelection(nearestNode);
  } else if (state.isSettingEndPoint) {
    handleEndPointSelection(nearestNode);
  } else if (state.isSelectedNodeToShowNextCrossings) {
    handleNextCrossingsSelection(nearestNode);
  }

  mapHandler.deactivateHoverEffect();
  removeMouseEvents();
  setActiveButton(null);
}

function handleMapMouseMove(evt) {
  if (!state.kdTree || !(state.isSettingStartPoint || state.isSettingEndPoint || state.isSelectedNodeToShowNextCrossings)) return;

  const coords = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
  const nearestNode = state.kdTree.NN_e(coords);
  const lineString = new ol.geom.LineString([coords, nearestNode.k]);
  mapHandler.nearestNodeHighlightLine.setGeometry(
    lineString.transform('EPSG:4326', 'EPSG:3857')
  );
}

function setupButtonEvents() {
  // Algorithm buttons
  document.getElementById("breadth").onclick = () => handleAlgorithmClick("breadth", false);
  document.getElementById("dijkstra").onclick = () => handleAlgorithmClick("dijkstra", false);
  document.getElementById("aStar").onclick = () => handleAlgorithmClick("a_star", false);
  document.getElementById("optimizedBreadth").onclick = () => handleAlgorithmClick("breadth", true);
  document.getElementById("optimizedDijkstra").onclick = () => handleAlgorithmClick("dijkstra", true);
  document.getElementById("optimizedAStar").onclick = () => handleAlgorithmClick("a_star", true);

  // Control buttons
  document.getElementById("setStartPoint").onclick = () => handleSelectNode("start");
  document.getElementById("setEndPoint").onclick = () => handleSelectNode("end");
  document.getElementById("reset").onclick = handleReset;
  document.getElementById("setRandomPoints").onclick = handleSetRandomPoints;
  document.getElementById("selectNodeToShowNextCrossings").onclick = () => handleSelectNode("crossing");
  document.getElementById("loadMapFile").onclick = handleLoadMapFile;
}

function setupCheckboxEvents() {
  document.getElementById("toggleContractedGraph").onchange = handleGraphToggle;
  document.getElementById("toggleNodesOfPath").onchange = handleNodesToggle;
  document.getElementById("toggleOnlyPath").onchange = handlePathOnlyToggle;
}

async function handleAlgorithmClick(algorithm, optimized) {
  try {
    const result = await calculatePath(algorithm, optimized);
    if (result.success) {
      resetPath(state.pathResult);
      state.pathResult = result;
      displayPath(result?.path);
      if (state.nodesOfPathShown) displayPathNodes(result?.path);
      activateCheckBoxes();
      showNotification("Route calculated successfully", "success");
    } else {
      showNotification("Failed to calculate route", "error");
    }
  } catch (error) {
    console.error(error);
    showNotification("Failed to calculate route", "error");
  } finally {
    // Clear out active button state
    setActiveButton(null);
    mapHandler.deactivateHoverEffect();
  }
}

function handleSelectNode(type) {
  if (state.currZoom < Constants.ZOOM_THRESHOLD) {
    showNotification("Please zoom in to set activate node selection", "warning");
    return;
  }

  const wasActive = (type === "start" && state.isSettingStartPoint) ||
    (type === "end" && state.isSettingEndPoint) ||
    (type === "crossing" && state.isSelectedNodeToShowNextCrossings);

  // Reset other selection modes
  state.resetModeStateVariables();

  if (wasActive) {
    setActiveButton(null);
    mapHandler.deactivateHoverEffect();
    removeMouseEvents();
    return;
  }

  // Set new selection mode
  switch (type) {
    case "start":
      state.isSettingStartPoint = true;
      break;
    case "end":
      state.isSettingEndPoint = true;
      break;
    case "crossing":
      state.isSelectedNodeToShowNextCrossings = true;
      break;
    default:
      showNotification("Unknown node type " + type, "error");
      return;
  }

  // Clear out existing path
  resetPath(state.pathResult);

  // Clear out existing nodes of path
  if (state.nodesOfPathShown) {
    resetPathNodes(state.pathResult);
  }

  // Activate hover effect & add mouse events
  addMouseEvents();
  mapHandler.activateHoverEffect();

  setActiveButton(type);
}

function handleReset() {
  // Clear interaction layer
  mapHandler.clearInteractions();

  // Reset UI state
  resetUIStates();

  // Reset state variables
  state.resetPathStateVariables();
  state.resetModeStateVariables();

  // Reset hover effect
  mapHandler.deactivateHoverEffect();
  setActiveButton(null);

  // Ensure map is displaying correct layer
  mapHandler.updateLayerVisibility();

  // Reset simulation
  simulationController.reset();

  // Enable Selection Buttons
  enableSelectionButtons();
}

function handleSetRandomPoints() {
  // Reset other selection modes
  state.resetModeStateVariables();

  // Clear interaction layer
  mapHandler.clearInteractions();

  // Clear out existing path
  resetPath(state.pathResult);

  const nodeIds = Object.keys(state.completeGraph.nodes);

  // Set random points
  const randomStartNode = nodeIds[Math.floor(Math.random() * nodeIds.length)];
  // Make sure start and end points are different
  let randomEndNode = null;
  do {
    randomEndNode = nodeIds[Math.floor(Math.random() * nodeIds.length)];
  } while (randomStartNode === randomEndNode);
  // Highlight random points
  handleStartPointSelection(randomStartNode);
  handleEndPointSelection(randomEndNode);

  // Reset active Buttons
  setActiveButton(null);

  // deactivate hover effect, if still active
  mapHandler.deactivateHoverEffect();

  // Activate buttons
  activateButtons();
}

function handleGraphToggle(event) {
  state.showContractedGraph = event.target.checked;
  mapHandler.toggleGraphVisibility(state.showContractedGraph);
}

function handleNodesToggle(event) {
  if (!state.pathResult) return;
  if (event.target.checked) {
    displayPathNodes(state.pathResult?.path);
  } else {
    resetPathNodes(state.pathResult);
  }
  state.nodesOfPathShown = event.target.checked;
}

function handlePathOnlyToggle(event) {
  mapHandler.togglePathOnlyVisibility(event.target.checked);
}

async function handleLoadMapFile() {
  const fileInput = document.getElementById('mapFileInput');
  const file = fileInput.files[0];

  if (!file) {
    showNotification("Please select a file first", "warning");
    return;
  }

  try {
    // Store current state in case loading fails
    const oldState = {
      completeGraph: state.completeGraph,
      contractedGraph: state.contractedGraph,
      kdTree: state.kdTree
    };

    const baseName = file.name.split('.')[0];
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
        state.completeGraph.fromSavedGraph(completeJson);

        state.contractedGraph = new c_Graph();
        state.contractedGraph.fromSavedGraph(contractedJson);

        loadedFromCache = true;
        console.log('Loaded graphs from cache');
      }
    } catch (e) {
      console.log('No cached graphs found, calculating new ones');
    }

    if (!loadedFromCache) {
      // Read and parse the file
      const fileContent = await file.text();
      const jsonData = JSON.parse(fileContent);

      // Initialize new complete graph
      const newCompleteGraph = new c_Graph();
      newCompleteGraph.debug = true;

      try {
        // Try to load the new map
        newCompleteGraph.fromOpenStreetMap(jsonData);

        // If successful, create contracted graph
        const newContractedGraph = new c_Graph(
          structuredClone(newCompleteGraph.nodes),
          structuredClone(newCompleteGraph.edges)
        );
        newContractedGraph.debug = true;
        newContractedGraph.contractGraph();

        state.completeGraph = newCompleteGraph;
        state.contractedGraph = newContractedGraph;

      } catch (error) {
        console.error("Error processing map data:", error);
        // Restore old state
        state.completeGraph = oldState.completeGraph;
        state.contractedGraph = oldState.contractedGraph;
        state.kdTree = oldState.kdTree;
        showNotification("Invalid map data format", "error");
        return;
      }
    }

    // Reset UI and state
    handleReset();

    // Clear existing vectors
    mapHandler.vecAllNodes.clear();
    mapHandler.vecContracted.clear();

    // Draw new graphs
    state.completeGraph.to_OL_VectorLayer(mapHandler.vecAllNodes, () => style());
    state.contractedGraph.to_OL_VectorLayer(mapHandler.vecContracted, () => style());

    // Create new KD tree
    state.kdTree = new kd_index(state.completeGraph.nodes, e => e, geo.nav.dist_haversin);

    // Fit map to new data
    mapHandler.fitMapViewToVec();

    showNotification("New map loaded successfully", "success");

  } catch (error) {
    console.error("Error reading file:", error);
    showNotification("Could not read file", "error");
  } finally {
    // Reset file input
    fileInput.value = null;
  }
}

function setupSimulationEvents() {
  document.getElementById('startSimulation').addEventListener('click', handleSimulationStart);
  document.getElementById('pauseSimulation').addEventListener('click', handleSimulationPause);
  document.getElementById('stopSimulation').addEventListener('click', handleSimulationStop);
  document.getElementById('simulationSpeed').addEventListener('input', handleSpeedChange);
}

function handleSimulationStart() {
  if (!state.startNode || !state.endNode) {
    showNotification("Please set start and end points first", "warning");
    return;
  }

  // Get current algorithm selection
  const currentAlgorithm = getCurrentAlgorithm();
  console.log(currentAlgorithm);
  if (!currentAlgorithm) {
    showNotification("Please select an algorithm first", "warning");
    return;
  }

  const isOptimized = currentAlgorithm.startsWith('optimized')
  const baseAlgorithm = currentAlgorithm.replace('optimized', '').toLowerCase();

  // Setup simulation
  const iterator = isOptimized ? state.contractedGraph.routeSimulationOptimized(state.startNode, state.endNode, baseAlgorithm) : state.completeGraph.routeSimulation(
    state.startNode,
    state.endNode,
    // Pass parameters based on algorithm
    ...getAlgorithmParameters(currentAlgorithm)
  );

  simulationController.start(iterator, isOptimized);
  simulationController.updateSimulationControls();
}

function handleSimulationPause() {
  if (simulationController.isPaused) {
    simulationController.resume();
    document.getElementById('pauseSimulation').textContent = 'Pause';
  } else {
    simulationController.pause();
    document.getElementById('pauseSimulation').textContent = 'Resume';
  }
}

function handleSimulationStop() {
  simulationController.stop();
  // Redraw start and end nodes
  state.startNode && drawNode(state.startNode, "green", 6, "start");
  state.endNode && drawNode(state.endNode, "yellow", 6, "end");
}

function handleSpeedChange(event) {
  const speed = parseInt(event.target.value);
  document.getElementById('speedValue').textContent = `${speed}ms`;
  simulationController.setSpeed(speed);
}

export function setupEvents() {
  setupMapEvents();
  setupSimulationEvents();
  setupAlgorithmSelect();
}

function getCurrentAlgorithm() {
  const algorithmSelect = document.getElementById('algorithmSelect');
  if (!algorithmSelect.value) {
    showNotification("Please select an algorithm first", "warning");
    return null;
  } return algorithmSelect.value;
}

function getAlgorithmParameters(algorithm) {
  const isOptimized = algorithm.startsWith('optimized');
  const baseAlgorithm = isOptimized ? algorithm.replace('optimized', '').toLowerCase() : algorithm;

  switch (baseAlgorithm) {
    case 'breadth':
      return [
        new c_Queue(),
        0,
        () => 0,
        null
      ];
    case 'dijkstra':
      return [
        new c_Dijkstra_Queue(),
        1,
        () => 0,
        null
      ];
    case 'a_star':
      return [
        new c_Priority_Queue(),
        1,
        (a) => geo.nav.dist_haversin(state.completeGraph.nodes[a].k, state.completeGraph.nodes[state.endNode].k),
        null
      ];
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }
}

function setupAlgorithmSelect() {
  const algorithmSelect = document.getElementById('algorithmSelect');
  algorithmSelect.addEventListener('change', (event) => {
    state.currentAlgorithm = event.target.value;
    document.getElementById('startSimulation').disabled = !event.target.value;
  });
}
