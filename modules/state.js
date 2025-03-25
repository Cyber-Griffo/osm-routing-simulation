class State {
  constructor() {
    this.currZoom = null;
    this.showContractedGraph = false;
    this.isSettingStartPoint = false;
    this.isSettingEndPoint = false;
    this.nodesOfPathShown = false;
    this.isSelectedNodeToShowNextCrossings = false;
    this.startNode = null;
    this.endNode = null;
    this.selectedNodeToShowNextCrossings = null;
    this.pathResult = null;
    this.completeGraph = null;
    this.contractedGraph = null;
    this.graph = null;
    this.kdTree = null;
    this.startingNodes = null;
    this.endingNodes = null;

    // Simulation state
    this.isSimulating = false;
    this.simulationPaused = false;
    this.simulationSpeed = 100;
    this.currentAlgorithm = null;
    this.simulationResult = null;
  }

  resetModeStateVariables() {
    this.isSettingStartPoint = false;
    this.isSettingEndPoint = false;
    this.isSelectedNodeToShowNextCrossings = false;
    this.isSimulating = false;
    this.simulationPaused = false;
  }

  resetPathStateVariables() {
    this.endNode = null;
    this.startNode = null;
    this.selectedNodeToShowNextCrossings = null;
    this.pathResult = null;
    this.startingNodes = null;
    this.endingNodes = null;
    this.nodesOfPathShown = false;
    this.simulationResult = null;
    this.currentAlgorithm = null;
  }

  setSimulationState(isSimulating) {
    this.isSimulating = isSimulating;
    if (!isSimulating) {
      this.simulationPaused = false;
      this.simulationResult = null;
    }
  }
}

export const state = new State();
