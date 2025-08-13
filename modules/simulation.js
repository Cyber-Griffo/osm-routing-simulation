import { drawNode } from "./utils.js";
import { mapHandler } from "./map.js";
import { displayPath } from "./graph.js";
import { state } from "./state.js";
import { showNotification } from "./notifications.js";
import Constants from "./constants.js";
import { disableSelectionButtons, enableSelectionButtons } from "./ui.js";

export class SimulationController {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.iterator = null;
    this.currentTimeout = null;
    this.lastValue = null;
    this.isContracted = false;
  }

  start(iterator, isContracted) {
    this.isRunning = true;
    this.isPaused = false;
    this.isContracted = isContracted;
    this.iterator = iterator;
    this.step();
    disableSelectionButtons();
  }

  step() {
    if (!this.isRunning || this.isPaused) return;

    const result = this.iterator.next();
    console.log("result", result);
    if (result.done) {
      this.stop();
      this.displayStep({ ...this.lastValue, final: true });
      return;
    } else {
      this.lastValue = result.value;
    }

    // Display current step
    this.displayStep({ ...result.value, final: false });

    this.currentTimeout = setTimeout(() => this.step(), state.speed || 0);
  }

  pause() {
    this.isPaused = true;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }

  resume() {
    if (this.isRunning) {
      this.isPaused = false;
      this.step();
    }
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    this.cleanupVisualization();

    this.updateSimulationControls();

    enableSelectionButtons();
  }

  setSpeed(speed) {
    state.speed = speed;
  }

  displayStep(stepResult) {
    if (this.isContracted) {
      this.displayStepContracted(stepResult);
    } else {
      this.displayStepComplete(stepResult);
    }
  }

  displayStepComplete({ visited, current, next, success, final }) {
    this.cleanupVisualization();

    const reconstructedPath = []

    // Reconstruct path
    for (let node = current; node != null; node = visited[node].pred) {
      reconstructedPath.push(node);
    }

    // Highlight start and end nodes
    drawNode(state.startNode, "green", 6, "Start");
    drawNode(state.endNode, "yellow", 6, "Ziel");

    // Draw all explored edges
    const exploredEdges = new Set();
    Object.keys(visited).forEach(nodeId => {
      if (visited[nodeId].pred) {
        const ids = [nodeId, visited[nodeId].pred].sort();
        exploredEdges.add(`${ids[0]}--${ids[1]}`);
      }
    });

    // Highlight all explored edges in light
    exploredEdges.forEach(edgeId => {
      const [node1, node2] = edgeId.split("--");
      displayPath([node1, node2], "cyan");
    });

    // Draw visited nodes (excluding current, start and end)
    Object.keys(visited).forEach(nodeId => {
      if (nodeId === current || nodeId === state.startNode || nodeId === state.endNode) return;
      drawNode(nodeId, "cyan", 3);
    })

    // Highlight current path
    displayPath(reconstructedPath, final ? "red" : "orange");

    if (final) {
      if (success) {
        showNotification("Path found successfully", "success");
        return;
      }
      showNotification("No Path Found", "error");
    }
    // Highlight current node
    if (current) {
      drawNode(current, "orange", 6, "current");
    }

    // Highlight next node
    if (next) {
      drawNode(next, "purple", 4, "next");
    }

    // Draw the edge connection current and next node
    if (current && next) {
      displayPath([current, next], "purple");
    }
  }

  displayStepContracted({ visited, pathToContractedStartNode, pathToContractedEndNode, contractedStartNode, contractedEndNode, current, next, success, final, totalContractedExploredEdges }) {
    // Clear previous visualization
    this.cleanupVisualization();

    // Highlight start and end nodes
    drawNode(state.startNode, "green", 6, "Start");
    drawNode(state.endNode, "yellow", 6, "Ziel");

    if (!final) {
      // Draw all explored edges
      const exploredEdges = new Set();
      Object.keys(visited).forEach(nodeId => {
        if (visited[nodeId].pred) {
          // Save the relations as "pred - nodeId" in order to call later the state.contractedGraph.getPathBetweenStartAndEndNode([pred, nodeId]) function
          exploredEdges.add(`${visited[nodeId].pred}--${nodeId}`);
        }
      });

      // Highlight all explored edges in light
      exploredEdges.forEach(edgeId => {
        const [from, to] = edgeId.split("--");
        if (!contractedEndNode && !contractedStartNode) {
          displayPath([from, to], "cyan");
        } else {
          displayPath(state.contractedGraph.getPathBetweenStartAndEndNode([from, to]), "cyan");
        }
      });

      // Draw visited nodes (excluding current, start and end)
      Object.keys(visited).forEach(nodeId => {
        if (nodeId === current || nodeId === contractedStartNode || nodeId === contractedEndNode || nodeId === state.startNode || nodeId === state.endNode) return;
        drawNode(nodeId, "cyan", 3);
      })

    } else {

      const totalContractedNodesExplored = new Set();
      totalContractedExploredEdges.forEach((edge) => {
        const [from, to] = edge.split("--");
        totalContractedNodesExplored.add(from);
        totalContractedNodesExplored.add(to);
        displayPath(state.contractedGraph.getPathBetweenStartAndEndNode([from, to]), "cyan");
      })

      // Draw visited nodes (excluding current, start and end)
      totalContractedNodesExplored.forEach(nodeId => {
        if (nodeId === current || nodeId === contractedStartNode || nodeId === contractedEndNode || nodeId === state.startNode || nodeId === state.endNode) return;
        drawNode(nodeId, "cyan", 3);
      })

    }
    if (contractedEndNode) {
      if (pathToContractedEndNode) {
        // Display path to contractedEndNode
        displayPath([contractedEndNode, ...pathToContractedEndNode], final ? "red" : "yellow");
      }
      // Highlight contractedEndNode
      !final && drawNode(contractedEndNode, "yellow", 8, "Contracted Ziel");
    }

    if (contractedStartNode) {
      if (pathToContractedStartNode) {
        // Display path to contractedStartNode
        displayPath([...pathToContractedStartNode, contractedStartNode], final ? "red" : "green");
      }
      // Highlight contractedStartNode
      !final && drawNode(contractedStartNode, "green", 8, "Contracted Start");
    }

    // Draw the reconstructed Path from Start to current
    if (contractedStartNode && current && contractedStartNode !== current) {
      const reconstructedContractedPath = []
      for (let node = current; node != null; node = visited[node].pred) {
        reconstructedContractedPath.push(node);
      }
      reconstructedContractedPath.reverse();
      displayPath(state.contractedGraph.getCompletePath(reconstructedContractedPath, contractedStartNode, current), final ? "red" : "orange");
    } else if (!contractedEndNode && !contractedStartNode) {
      const reconstructedPath = []
      for (let node = current; node != null; node = visited[node].pred) {
        reconstructedPath.push(node);
      }
      reconstructedPath.reverse();
      console.log("Reconstructing path from Start to current");
      displayPath(reconstructedPath, final ? "red" : "orange");
    }

    if (final) {
      if (success) {
        showNotification("Path found successfully", "success");
        return;
      }
      showNotification("No Path Found", "error");
    }

    // Highlight current node
    if (current) {
      drawNode(current, "orange", 6, "current");
    }

    // Highlight next node
    if (next) {
      drawNode(next, "purple", 4, "next");
    }

    // Draw the edge connection current and next node
    if (current && next) {
      displayPath(state.contractedGraph.getPathBetweenStartAndEndNode([current, next]), "purple");
    }
  }

  cleanupVisualization() {
    mapHandler.clearInteractions();
  }

  reset() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    this.updateSimulationButtons();
  }

  updateSimulationControls() {
    this.updateSimulationButtons();

    // Disable routing buttons during simulation;
    Constants.BUTTON_IDS.forEach(id => {
      document.getElementById(id).disabled = this.isRunning;
    });
  }

  updateSimulationButtons() {
    document.getElementById('startSimulation').disabled = (!state.start && !state.endNode) && !this.isRunning;
    document.getElementById('pauseSimulation').disabled = !this.isRunning;
    document.getElementById('stopSimulation').disabled = !this.isRunning;
    document.getElementById('simulationSpeed').disabled = !this.isRunning;
    document.getElementById('algorithmSelect').disabled = this.isRunning;
  }
}

export const simulationController = new SimulationController();