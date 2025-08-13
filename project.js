import { state } from './modules/state.js';
import { mapHandler } from './modules/map.js';
import { initializeGraphs } from './modules/graph.js';
import { setupMapEvents } from './modules/events.js';
import { showNotification, updateRuntimeDisplay } from './modules/notifications.js';
import { setupUI } from "./modules/ui.js";
import { handleStartPointSelection, handleEndPointSelection } from "./modules/utils.js";

async function init() {
	try {
		// Initialize graphs
		await initializeGraphs("./data/wilhelma.json");

		// Initialize map
		mapHandler.initializeMap();
		mapHandler.initializeHighlightLine();

		// Initialize UI
		setupUI();

		// Setup events
		setupMapEvents();

		// Set initial state
		state.currZoom = mapHandler.map.getView().getZoom();
		mapHandler.fitMapViewToVec();
		updateRuntimeDisplay(null);

		showNotification("Application initialized successfully", "success", 1500);

		if (state.startNode) {
			handleStartPointSelection(state.startNode);
		}
		if (state.endNode) {
			handleEndPointSelection(state.endNode);
		}
	} catch (error) {
		console.error("Initialization failed:", error);
		showNotification("Failed to initialize application", "error");
	}
}

window.onload = init;