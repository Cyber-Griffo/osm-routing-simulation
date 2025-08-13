const Constants = {
  ZOOM_THRESHOLD: 14,
  BUTTON_IDS: [
    "breadth",
    "dijkstra",
    "aStar",
    "optimizedBreadth",
    "optimizedDijkstra",
    "optimizedAStar",
    "startSimulation"
  ],
  CHECKBOX_IDS: [
    "toggleNodesOfPath",
  ],
  SELECTION_BUTTONS: {
    start: "setStartPoint",
    end: "setEndPoint",
    crossing: "selectNodeToShowNextCrossings",
    random: "setRandomPoints",
  }
};

export default Constants;
