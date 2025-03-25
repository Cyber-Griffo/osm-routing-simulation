import { state } from './state.js';
import { style } from './style.js';

export class MapHandler {
  constructor() {
    this.map = null;
    this.vecContracted = new ol.source.Vector();
    this.vecAllNodes = new ol.source.Vector();
    this.vecInteractions = new ol.source.Vector();

    this.layerAll = new ol.layer.Vector({ source: this.vecAllNodes });
    this.layerContracted = new ol.layer.Vector({ source: this.vecContracted });
    this.layerInteractions = new ol.layer.Vector({ source: this.vecInteractions });

    this.nearestNodeHighlightLine = null;
  }

  initializeMap() {
    // Create base map
    this.map = new ol.Map({
      target: 'div_map',
      view: new ol.View({
        center: [0, 0],
        zoom: 2
      }),
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM({
            attributions: []
          })
        })
      ]
    });

    // Add vector layers after base layer
    this.layerAll.set('name', 'complete');
    this.layerContracted.set('name', 'contracted');
    this.layerInteractions.set('name', 'interactions');

    this.map.addLayer(this.layerAll);
    this.map.addLayer(this.layerContracted);
    this.map.addLayer(this.layerInteractions);

    // Get the checkbox values
    state.showContractedGraph = document.getElementById('toggleContractedGraph').checked;
    state.showOnlyPath = document.getElementById('toggleOnlyPath').checked;

    // Get the speed value
    state.speed = document.getElementById('simulationSpeed').value;
    document.getElementById('speedValue').textContent = `${state.speed}ms`;

    // Set initial visibility
    this.updateLayerVisibility();

    // Set current vector based on state
    this.vec = state.showContractedGraph ? this.vecContracted : this.vecAllNodes;
  }

  updateLayerVisibility() {
    if (state.showOnlyPath) {
      this.layerAll.setVisible(false);
      this.layerContracted.setVisible(false);
      this.layerInteractions.setVisible(true);
    } else {
      this.layerAll.setVisible(!state.showContractedGraph);
      this.layerContracted.setVisible(state.showContractedGraph);
      this.layerInteractions.setVisible(true);
    }
  }

  initializeHighlightLine() {
    this.nearestNodeHighlightLine = new ol.Feature({
      geometry: new ol.geom.LineString([[0, 0]]),
      isHighlight: true
    });
    this.nearestNodeHighlightLine.setStyle(style("red"));
  }

  activateHoverEffect() {
    const mapElement = document.getElementById('div_map');
    mapElement.onmouseover = () => {
      this.vecInteractions.addFeature(this.nearestNodeHighlightLine);
    };
    mapElement.onmouseout = () => {
      this.vecInteractions.removeFeature(this.nearestNodeHighlightLine);
    };
  }

  deactivateHoverEffect() {
    const mapElement = document.getElementById('div_map');
    this.vecInteractions.removeFeature(this.nearestNodeHighlightLine);
    mapElement.onmouseover = null;
    mapElement.onmouseout = null;
  }

  toggleGraphVisibility(showContracted) {
    state.showContractedGraph = showContracted;
    this.updateLayerVisibility();
    this.vec = showContracted ? this.vecContracted : this.vecAllNodes;
  }

  togglePathOnlyVisibility(showOnlyPath) {
    state.showOnlyPath = showOnlyPath;
    this.updateLayerVisibility();
  }

  clearInteractions() {
    this.vecInteractions.clear();
  }

  fitMapViewToVec() {
    this.map.getView().fit(this.vec.getExtent(), { padding: [20, 20, 20, 20] });
  }
}

export const mapHandler = new MapHandler();
