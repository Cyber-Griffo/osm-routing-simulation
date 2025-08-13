import { state } from './state.js';
import { mapHandler } from './map.js';
import { nodeStyle } from './style.js';
import { activateButtons } from './ui.js';

export function createNodeStructure(nodeId) {
  return {
    id: nodeId,
    k: state.completeGraph.nodes[nodeId].k
  };
}

export function drawNode(nodeId, color, size, text) {
  const node = createNodeStructure(nodeId);

  const nodeFeature = createNodeFeature(node);
  if (nodeFeature) {
    nodeFeature.setStyle(nodeStyle(color, size, text));
    mapHandler.vecInteractions.addFeature(nodeFeature);
  }
}

export function handleStartPointSelection(nodeId) {
  clearOldNode(state.startNode);
  state.startNode = nodeId;

  const node = createNodeStructure(nodeId);

  const nodeFeature = createNodeFeature(node);
  if (nodeFeature) {
    nodeFeature.setStyle(nodeStyle("green", 6, "Start"));
    mapHandler.vecInteractions.addFeature(nodeFeature);
  }

  state.isSettingStartPoint = false;
  activateButtons();
}

export function handleEndPointSelection(nodeId) {
  clearOldNode(state.endNode);
  state.endNode = nodeId;

  const node = createNodeStructure(nodeId);

  const nodeFeature = createNodeFeature(node);
  if (nodeFeature) {
    nodeFeature.setStyle(nodeStyle("yellow", 6, "End"));
    mapHandler.vecInteractions.addFeature(nodeFeature);
  }

  state.isSettingEndPoint = false;
  activateButtons();
}

export function handleNextCrossingsSelection(nodeId) {
  clearPreviousCrossingsSelection();
  state.selectedNodeToShowNextCrossings = parseInt(nodeId);
  showNextCrossings(nodeId);
  state.isSelectedNodeToShowNextCrossings = false;
}

export function clearPreviousCrossingsSelection() {
  state.startingNodes?.forEach(node => clearOldNode(node.id));
  state.endingNodes?.forEach(node => clearOldNode(node.id));
  state.selectedNodeToShowNextCrossings && clearOldNode(state.selectedNodeToShowNextCrossings);
}

export function showNextCrossings(nodeId) {
  state.startingNodes = state.contractedGraph.getNextCrossingNodesStart(nodeId);
  state.endingNodes = state.contractedGraph.getNextCrossingNodesEnd(nodeId);

  // Add selected node
  const node = createNodeStructure(nodeId);
  const selectedFeature = createNodeFeature(node);
  selectedFeature.setStyle(nodeStyle("cyan", 6, "Selected Node"));
  mapHandler.vecInteractions.addFeature(selectedFeature);

  // Add starting and ending nodes
  highlightCrossings(nodeId);
}

export function highlightCrossings(nodeId) {
  const startingNodeIds = state.startingNodes.map(e => parseInt(e.id));
  const endingNodeIds = state.endingNodes.map(e => parseInt(e.id));

  if (startingNodeIds[0] === endingNodeIds[0] === nodeId) return;

  if (startingNodeIds.length === 1 && endingNodeIds.length === 1) {
    highlightSingleCrossings(startingNodeIds[0], endingNodeIds[0]);
  } else if (startingNodeIds.length === 2 && endingNodeIds.length === 2) {
    highlightDoubleCrossings(startingNodeIds[0], endingNodeIds[0]);
  }
}

export function highlightSingleCrossings(startNode, endNode) {
  addNodeToInteractions(startNode, "green", "Next Start Crossing");
  addNodeToInteractions(endNode, "yellow", "Next End Crossing");
}

export function highlightDoubleCrossings(startNode, endNode) {
  if (startNode === endNode) {
    addNodeToInteractions(startNode, "orange", "Start/End 1-4");
    return
  }
  addNodeToInteractions(startNode, "orange", "Start/End 1");
  addNodeToInteractions(endNode, "orange", "Start/End 2");
}

function addNodeToInteractions(nodeId, color, text) {
  const node = createNodeStructure(nodeId);
  const nodeFeature = createNodeFeature(node);
  nodeFeature.setStyle(nodeStyle(color, 6, text));
  mapHandler.vecInteractions.addFeature(nodeFeature);
}

export function clearOldNode(nodeId) {
  if (!nodeId) return;

  const features = mapHandler.vecInteractions.getFeatures();
  features.forEach(feature => {
    if (feature.get('nodeId') === nodeId.toString()) {
      mapHandler.vecInteractions.removeFeature(feature);
    }
  });
}

export function createNodeFeature(node) {
  if (!node || !node.k) return null;

  const point = new ol.geom.Point(node.k).transform('EPSG:4326', 'EPSG:3857');
  const feature = new ol.Feature({
    geometry: point,
    nodeId: typeof node.id === 'undefined' ?
      (node.k ? node.k.toString() : 'unknown') :
      node.id.toString()
  });
  return feature;
}
