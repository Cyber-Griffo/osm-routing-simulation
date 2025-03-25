import { state } from './state.js';
import Constants from './constants.js';

export function setupUI() {
  setupInitialState();
}

function setupInitialState() {
  if (!state.startNode || !state.endNode) deactivateButtons();
  if (!state.pathResult) deactivateCheckBoxes();
  document.getElementById("toggleNodesOfPath").checked = false;
  document.getElementById("mapFileInput").value = null;
  document.getElementById("algorithmDisplay").textContent = "-";
  document.getElementById("algorithmDisplay").className = "runtime-value";
}

const SIMULATION_BUTTON_IDS = ['startSimulation', 'pauseSimulation', 'stopSimulation', 'simulationSpeed'];

export function activateButtons() {
  if (state.startNode && state.endNode) {
    // Activate routing buttons
    Constants.BUTTON_IDS.forEach(id => {
      document.getElementById(id).disabled = false;
    });

    // Activate simulation start button without pause and stop
    document.getElementById('startSimulation').disabled = false;
    document.getElementById('simulationSpeed').disabled = false;
  }
}

export function deactivateButtons() {
  // Deactivate routing buttons
  Constants.BUTTON_IDS.forEach(id => {
    document.getElementById(id).disabled = true;
  });

  // Deactivate all simulation controls
  SIMULATION_BUTTON_IDS.forEach(id => {
    document.getElementById(id).disabled = true;
  });
}

export function activateCheckBoxes() {
  Constants.CHECKBOX_IDS.forEach(id => {
    document.getElementById(id).disabled = false;
  });
}

export function deactivateCheckBoxes() {
  Constants.CHECKBOX_IDS.forEach(id => {
    document.getElementById(id).disabled = true;
  });
}

export function resetUIStates() {
  deactivateButtons();
  deactivateCheckBoxes();
  document.getElementById("toggleNodesOfPath").checked = false;
  document.getElementById("mapFileInput").value = null;
  document.getElementById("algorithmDisplay").textContent = "-";
  document.getElementById("algorithmDisplay").className = "runtime-value";

  // Reset simulation controls
  document.getElementById('pauseSimulation').textContent = 'Pause';
  SIMULATION_BUTTON_IDS.forEach(id => {
    document.getElementById(id).disabled = true;
  });
}

export function setActiveButton(type) {
  // Remove active class from all selection buttons
  Object.values(Constants.SELECTION_BUTTONS).forEach(id => {
    document.getElementById(id).classList.remove('active');
  });

  // Add active class to selected button
  if (type) {
    const buttonId = Constants.SELECTION_BUTTONS[type];
    document.getElementById(buttonId).classList.add('active');
  }
}

export function disableSelectionButtons() {
  Object.values(Constants.SELECTION_BUTTONS).forEach(id => {
    document.getElementById(id).disabled = true;
  });
}

export function enableSelectionButtons() {
  Object.values(Constants.SELECTION_BUTTONS).forEach(id => {
    document.getElementById(id).disabled = false;
  });
}