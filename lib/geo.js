const cos = Math.cos, sin = Math.sin, tan = Math.tan;
const asin = x => Math.asin(Math.min(Math.max(x, -1), 1));
const M_PI = Math.PI;

class c_Transform {
	constructor() { }

	get grad2rad_f() { return M_PI / 180; }

	grad2rad(o) {
		let e = undefined;
		if (typeof (o.length) != "undefined") {
			e = [];
			for (let p of o)
				e.push(this.grad2rad(p));
		}
		else if (typeof o == "object") {
			e = {}
			for (let p in o)
				e[p] = this.grad2rad(o[p]);
		}
		else if (typeof o == "number")
			e = o * this.grad2rad_f;
		return e;
	}
}


class c_Nav {
	/**
	 Blubber
	 */
	constructor() { }
	get r() { return 6378137; }

	/**
	 * 
	 * Entspricht oberster Formel auf https://en.wikipedia.org/wiki/Haversine_formula
	 * @param {array} A - Coordinates points A WGS84 
	 * @param {array} B  - Coordinates points B WGS84
	 * @returns 
	 */
	dist_haversin(A, B) {
		const a = geo.transform.grad2rad(A), b = geo.transform.grad2rad(B);
		const deltaPhi_2 = (a[1] - b[1]) / 2, delatLambda_2 = (a[0] - b[0]) / 2, phiM = (a[1] + b[1]) / 2;
		return 2 * this.r * asin(
			Math.sqrt(
				sin(deltaPhi_2) ** 2 + (1 - sin(deltaPhi_2) ** 2 - sin(phiM) ** 2) * sin(delatLambda_2) ** 2
			)
		)
	}

	/**
	 * 
	 * Entspricht 2. oberster Formel auf https://en.wikipedia.org/wiki/Haversine_formula
	 * @param {array} A - Coordinates points A WGS84 
	 * @param {array} B  - Coordinates points B WGS84
	 * @returns 
	 */
	dist_haversin2(A, B) {
		const a = geo.transform.grad2rad(A), b = geo.transform.grad2rad(B);
		const diskr = sin((a[1] - b[1]) / 2) ** 2 + sin((a[0] - b[0]) / 2) ** 2 * cos(a[1]) * cos(b[1]);
		return 2 * this.r * asin(Math.sqrt(diskr));
	}

	/**
	 * 
	 * Entspricht 2. unterster Formel auf https://en.wikipedia.org/wiki/Haversine_formula
	 * @param {array} A - Coordinates points A WGS84 
	 * @param {array} B  - Coordinates points B WGS84
	 * @returns 
	 */
	dist_haversin3(A, B) {
		const a = geo.transform.grad2rad(A), b = geo.transform.grad2rad(B);
		const deltaPhi_2 = (a[1] - b[1]) / 2, delatLambda_2 = (a[0] - b[0]) / 2, phiM = (a[1] + b[1]) / 2;
		return 2 * this.r * asin(
			Math.sqrt(
				sin(deltaPhi_2) ** 2 * cos(delatLambda_2) ** 2 + cos(phiM) ** 2 * sin(delatLambda_2) ** 2
			)
		)
	}

	/**
	 * 
	 * Entspricht unterster Formel auf https://en.wikipedia.org/wiki/Haversine_formula
	 * @param {array} A - Coordinates points A WGS84 
	 * @param {array} B  - Coordinates points B WGS84
	 * @returns 
	 */
	dist_haversin4(A, B) {
		const a = geo.transform.grad2rad(A), b = geo.transform.grad2rad(B);
		return 2 * this.r * asin(
			Math.sqrt(
				(1 - cos(a[1] - b[1]) + cos(a[1]) * cos(b[1]) * (1 - cos(a[0] - b[0])))
				/ 2
			)
		);
	}

}

class c_Graph {

	constructor(nodes = {}, edges = {}) {
		this.edges = edges;
		this.nodes = nodes;
		this.debug = false;
	}

	/**
	s: Startknoten
	z: Zielknoten
	q: Warteschlange
	w: Gewichtsfaktor
	f_q: Heuristikfunkktion Distanz zum Ziel
	f_l: (limit) Limit Funktion
	*
	*/
	route(s, z, q, w, f_q, f_l) {
		const startTime = performance.now();
		s = this.ensureString(s), z = this.ensureString(z);

		const visited = {}, path = [];

		q.push({ key: 0, data: s }), visited[s] = { pred: null, dist: 0 };

		let currentnode
		for (currentnode; (currentnode = q.pop()?.data) && currentnode != z;) {
			this.nodes[currentnode].o.forEach(outgoing => {
				const [node_id_1, node_id_2] = outgoing.id.split("--");
				const to_node = node_id_1 === currentnode ? node_id_2 : node_id_1;
				const d2 = visited[currentnode].dist + (outgoing.w * w);
				const new_cost = d2 + f_q(to_node);
				if ((!(to_node in visited) || visited[to_node].dist > d2) && (!f_l || f_l(new_cost))) {
					visited[to_node] = { pred: currentnode, dist: d2 }
					q.push({ key: new_cost, data: to_node });
				}
			}
			);
		}

		if (currentnode != z) {
			this.debug && console.error("No path found");
			const endTime = performance.now();
			const ellapsedTime = endTime - startTime;
			return { path: null, cost: null, runtime: ellapsedTime, pathLength: null, success: false };
		}

		for (let nd = z; nd != null; nd = visited[nd].pred)
			path.push(nd);
		const cost = visited[z].dist;

		const endTime = performance.now();
		const ellapsedTime = endTime - startTime;

		return { path: path.reverse(), cost: cost, runtime: ellapsedTime, pathLength: cost, success: true };
	};

	/**
	s: Startknoten
	z: Zielknoten
	f_s: Abbruchbedingung
	f_l: (limit) Limit Funktion
	*/
	route_breadth_search(s, z, f_l) {
		return {
			...this.route(s, z, new c_Queue,
				0, // Distanz zwischen Knoten
				() => 0,// Distanz zum Ziel
				() => true // Abbruchbedingung
			), pathLength: "-"
		};
	}

	/**
	s: Startknoten
	z: Zielknoten
	f_l: (limit) Limit Funktion
	*/
	route_dijkstra(s, z, f_l) {
		return this.route(s, z, new c_Dijkstra_Queue,
			1,// Distanz zwischen Knoten
			() => 0, // Distanz zum Ziel
			(cost) => f_l ? f_l(cost) : true); // Abbruchbedingung
	}

	/**
	s: Startknoten
	z: Zielknoten
	f_l: (limit) Limit Funktion
	*/
	route_a_star(s, z, f_l) {
		return this.route(s, z, new c_Priority_Queue,
			1,// Berücksichtigung der Distanz zwischen Knoten
			(a) => geo.nav.dist_haversin(this.nodes[a].k, this.nodes[z].k), // Distanz zum Ziel
			(cost) => f_l ? f_l(cost) : true);// Abbruchbedingung
	}

	*routeSimulation(s, z, q, w, f_q, f_l) {
		s = this.ensureString(s), z = this.ensureString(z);

		const visited = {}, path = [];

		q.push({ key: 0, data: s }), visited[s] = { pred: null, dist: 0 };

		yield { visited: visited, current: s, next: null, success: undefined };

		try {
			let currentnode;
			while ((currentnode = q.pop()?.data) && currentnode !== z) {
				for (const outgoing of this.nodes[currentnode].o) {
					const [node_id_1, node_id_2] = outgoing.id.split("--");
					const to_node = node_id_1 === currentnode ? node_id_2 : node_id_1;
					const d2 = visited[currentnode].dist + (outgoing.w * w);
					const new_cost = d2 + f_q(to_node);


					if ((!(to_node in visited) || visited[to_node].dist > d2) && (!f_l || f_l(new_cost))) {
						visited[to_node] = { pred: currentnode, dist: d2 };
						q.push({ key: new_cost, data: to_node });

						yield { visited: visited, current: currentnode, next: to_node, success: undefined };
					}
				}
			}

			if (currentnode !== z) {
				// No path found
				yield { visited: visited, current: currentnode, next: null, success: false };
				return;
			}

			// Construct path
			for (let nd = z; nd != null; nd = visited[nd].pred) {
				path.push(nd);
			}
			const cost = visited[z].dist;

			yield { visited: visited, current: z, next: null, success: true, cost: cost, pathLength: cost };

		} catch (e) {
			console.error("Error in route simulation:", e);
			return null;
		}
	}



	fromOpenStreetMap(json_data) {
		json_data.elements.filter(e => e.type == "node").forEach(node => {
			this.nodes[node.id] = {
				k: [node.lon, node.lat],
				o: [],
				i: [],
				g: 0,
			}
		});

		json_data.elements.filter(e => e.type == "way").forEach(way => {
			for (let i = 0; i < way.nodes.length - 1; i++) {
				const s = way.nodes[i], z = way.nodes[i + 1];
				const weight = { w: geo.nav.dist_haversin(this.nodes[s].k, this.nodes[z].k) }
				const lower_number = Math.min(s, z);
				const higher_number = Math.max(s, z);
				const edge_id = `${lower_number}--${higher_number}`;
				const edge_obj = {
					id: edge_id,
					w: weight.w,
				}
				this.nodes[s].o.push(edge_obj)
				this.nodes[z].i.push(edge_obj)
				if (way.tags.oneway !== "yes") {
					this.nodes[s].i.push(edge_obj)
					this.nodes[z].o.push(edge_obj)
				}
				this.nodes[s].g += 1
				this.nodes[z].g += 1
			}
		});

		this.nodes = { ...this.nodes }
	}

	to_OL_VectorLayer(vec, style_fn) {
		for (const [_, node] of Object.entries(this.nodes)) {
			node.o.forEach(outgoing => {
				const [node_id_1, node_id_2] = outgoing.id.split("--");
				const feature = new ol.Feature({
					geometry: new ol.geom.LineString([this.nodes[node_id_1].k, this.nodes[node_id_2].k])
				});
				feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');
				if (style_fn)
					feature.setStyle(style_fn(node_id_1, node_id_2));
				vec.addFeature(feature);
				this.edges[outgoing.id] = feature;
			}
			)
		}
	}

	to_OL_VectorLayer_relevantNodes(vec, style_fn, relevant_node_ids) {
		relevant_node_ids.forEach(node_id => {
			if (this.nodes[node_id].disp) return // nothing to do, if already display component exists
			this.nodes[node_id].disp = new ol.Feature({
				geometry: new ol.geom.Point(this.nodes[node_id].k),
				name: node_id
			});
			this.nodes[node_id].disp.getGeometry().transform('EPSG:4326', 'EPSG:3857');
			vec.addFeature(this.nodes[node_id].disp);
		});
	}

	to_OL_VectorLayer_resetNode(vec, node_id) {
		// Only reset, if there is a display object
		if (this.nodes[node_id]?.disp) {
			this.nodes[node_id].disp.setStyle(new ol.style.Style({
				image: new ol.style.Circle({
					radius: 0,
					fill: new ol.style.Fill({ color: "black" })
				})
			}));
		}
	}

	contractGraph() {
		// Determine Nodes to remove -> Nodes with g = 2
		const nodeIdsToRemove = Object.entries(this.nodes)
			.filter(([_, nodeData]) => nodeData.g === 2)
			.map(([nodeId, _]) => nodeId);

		// Initialize data structure to store the next crossing for each node
		this.node_next_branching_nodes = {}
		this.nodes_uncontracted_to_contracted = {}

		// Merge edges
		nodeIdsToRemove.forEach(currNodeId => {
			const currNodeData = this.nodes[currNodeId];
			this.debug && console.log("Current nodeID", currNodeId);
			this.debug && console.log("Current nodeData", currNodeData);

			const incomingEdgeCount = currNodeData.i.length;
			const outgoingEdgeCount = currNodeData.o.length;

			this.debug && console.log("incomingEdgeCount", incomingEdgeCount);
			this.debug && console.log("outgoingEdgeCount", outgoingEdgeCount);

			// Check if incoming and outgoing edge count match
			if (incomingEdgeCount !== outgoingEdgeCount) {
				this.debug && console.warn("Incoming and outgoing edge count do not match. Keine Reduzierung für den Knoten möglich.", currNodeId, currNodeData);
				return;
			}

			// Check for circles leading back to the same node
			if (
				// All incoming and outgoingEdges have the same id
				currNodeData.i.every(incomingEdge => currNodeData.o.every(outgoingEdge => incomingEdge.id === outgoingEdge.id))
			) {
				console.warn("Circle detected. Keine Reduzierung für den Knoten möglich.", currNodeId, currNodeData);
				return;
			}

			// Case distinction
			if (incomingEdgeCount === 1) {
				// Node on a one-way street
				this.debug && console.log("Knoten auf einer Einbahnstraße");
				this.mergeDirectedEdges(currNodeId, currNodeData);
			} else if (incomingEdgeCount === 2) {
				// Node on a two-way street
				this.debug && console.log("Knoten auf einer Straße, die in beide Richtungen befahrbar ist");
				// return;
				this.mergeUndirectedEdges(currNodeId, currNodeData);
			} else {
				// Unexpected edge count -> Bigger than 2
				throw new Error("Unexpected edge count", incomingEdgeCount, "\nCurrentNodeData", currNodeData);
			}
		});

		// Update the node_mapped_to_next_crossing object so every node has a mapping to its next crossing. If the node is a crossing itself, than it is mapped to itself with a weight of 0
		const nodeIDsInNodesObj = Object.keys(this.nodes);

		nodeIDsInNodesObj.forEach(nodeId => {
			this.node_next_branching_nodes[nodeId] = {
				i: [{ id: nodeId, w: 0 }],
				o: [{ id: nodeId, w: 0 }]
			}
		})
	}

	mergeDirectedEdges(currNodeId, currNodeData) {
		const incomingEdge = currNodeData.i[0];
		const outgoingEdge = currNodeData.o[0];

		this.mergeEdge(currNodeId, incomingEdge, outgoingEdge);

		delete this.nodes_uncontracted_to_contracted[currNodeId];
		delete this.nodes[currNodeId];
	}

	mergeUndirectedEdges(currNodeId, currNodeData) {
		const [incomingEdge1, incomingEdge2] = currNodeData.i;
		const [outgoingEdge1, outgoingEdge2] = currNodeData.o;

		this.mergeEdge(currNodeId, incomingEdge1, outgoingEdge2);
		this.mergeEdge(currNodeId, incomingEdge2, outgoingEdge1);

		delete this.nodes_uncontracted_to_contracted[currNodeId];
		delete this.nodes[currNodeId];
	}

	mergeEdge(currNodeId, incomingEdge, outgoingEdge) {

		const incomingEdgeId = incomingEdge.id;
		const outgoingEdgeId = outgoingEdge.id;

		const neighborInNodeId = this.getNeighborId(incomingEdgeId, currNodeId);
		const neighborOutNodeId = this.getNeighborId(outgoingEdgeId, currNodeId);

		// Calculate new Weight and EdgeId
		const combinedWeight = incomingEdge.w + outgoingEdge.w;
		const newEdgeId = this.createNewEdgeId(neighborInNodeId, neighborOutNodeId);

		// Calculate new Path
		const incomingEdgePath = incomingEdge.p;
		const outgoingEdgePath = outgoingEdge.p;
		const newPath = this.constructNewPath(incomingEdgePath, currNodeId, outgoingEdgePath);

		// Store mapping for the next crossing
		this.storeMappingForNextCrossing(currNodeId, neighborInNodeId, neighborOutNodeId, incomingEdge, outgoingEdge);

		// Store mapping nodes_uncontracted_to_contracted
		this.storeInHelperDataStructures(currNodeId, neighborInNodeId, neighborOutNodeId);

		// Update helper structures
		this.updateHelperStructures(currNodeId, neighborInNodeId, incomingEdge, neighborOutNodeId, outgoingEdge);

		// Set new Outgoing Edge on the incoming neighbor of the current node
		this.replaceOutgoingEdge(neighborInNodeId, incomingEdgeId, newEdgeId, combinedWeight, newPath);
		// Set new Incoming Edge on the outgoing neighbor of the current node
		this.replaceIncomingEdge(neighborOutNodeId, outgoingEdgeId, newEdgeId, combinedWeight, newPath);
	}

	storeMappingForNextCrossing(currNodeId, neighborInNodeId, neighborOutNodeId, incomingEdge, outgoingEdge) {
		if (!this.node_next_branching_nodes[currNodeId]) {
			this.node_next_branching_nodes[currNodeId] = {
				i: [{ id: neighborInNodeId, w: incomingEdge.w }],
				o: [{ id: neighborOutNodeId, w: outgoingEdge.w }],
			}
		} else {
			this.node_next_branching_nodes[currNodeId].i.push({ id: neighborInNodeId, w: incomingEdge.w });
			this.node_next_branching_nodes[currNodeId].o.push({ id: neighborOutNodeId, w: outgoingEdge.w });
		}
	}

	storeInHelperDataStructures(currNodeId, neighborInNodeId, neighborOutNodeId) {
		if (!this.nodes_uncontracted_to_contracted[neighborInNodeId]) {
			this.nodes_uncontracted_to_contracted[neighborInNodeId] = { i: [], o: [] };
		}
		this.nodes_uncontracted_to_contracted[neighborInNodeId].i.push(currNodeId);
		if (!this.nodes_uncontracted_to_contracted[neighborOutNodeId]) {
			this.nodes_uncontracted_to_contracted[neighborOutNodeId] = { i: [], o: [] };
		}
		this.nodes_uncontracted_to_contracted[neighborOutNodeId].o.push(currNodeId);
	}

	updateHelperStructures(currNodeId, neighborInNodeId, incomingEdge, neighborOutNodeId, outgoingEdge) {
		// Check if the current node is present in the nodes_uncontracted_to_contracted as key
		const nodesToUpdate = this.nodes_uncontracted_to_contracted[currNodeId];

		if (!nodesToUpdate) return

		nodesToUpdate.i.forEach(nodeId => {
			// Update helper mapping to new incoming edge
			!this.nodes_uncontracted_to_contracted[neighborInNodeId].i.includes(nodeId) && this.nodes_uncontracted_to_contracted[neighborInNodeId].i.push(nodeId);

			if (this.node_next_branching_nodes[nodeId].i.find(e => e.id === neighborInNodeId)) {
				return
			};

			// Update the mapping in the crossings object to correctly represent the new incoming edge as the next crossing of the objects contained in the nodesToUpdate.i array
			const incomingEdgeToUpdate = this.node_next_branching_nodes[nodeId].i.find(e => e.id === currNodeId)

			if (incomingEdgeToUpdate) {
				incomingEdgeToUpdate.id = neighborInNodeId;
				incomingEdgeToUpdate.w += incomingEdge.w;
			} else {
				this.debug && console.log("Incoming edge not found in the node_mapped_to_next_crossing object", nodeId, currNodeId, this.node_next_branching_nodes, this.node_next_branching_nodes[nodeId])
				throw new Error("Incoming edge not found in the node_mapped_to_next_crossing object", nodeId, currNodeId)
			}
		})

		nodesToUpdate.o.forEach(nodeId => {
			// Update helper mapping to new outgoing edge
			!this.nodes_uncontracted_to_contracted[neighborOutNodeId].o.includes(nodeId) && this.nodes_uncontracted_to_contracted[neighborOutNodeId].o.push(nodeId);

			if (this.node_next_branching_nodes[nodeId].o.find(e => e.id === neighborOutNodeId)) return;

			// Update the mapping in the crossings object to correctly represent the new outgoing edge as the next crossing of the objects contained in the nodesToUpdate.o array
			const outgoingEdgeToUpdate = this.node_next_branching_nodes[nodeId].o.find(e => e.id === currNodeId)

			if (outgoingEdgeToUpdate) {
				outgoingEdgeToUpdate.id = neighborOutNodeId;
				outgoingEdgeToUpdate.w += outgoingEdge.w;
			} else {
				this.debug && console.log("Outgoing edge not found in the node_mapped_to_next_crossing object", nodeId, currNodeId, this.node_next_branching_nodes, this.node_next_branching_nodes[nodeId])
				throw new Error("Outgoing edge not found in the node_mapped_to_next_crossing object", nodeId, currNodeId)
			}
		})
	}

	replaceOutgoingEdge(nodeId, currEdgeId, newEdgeId, newWeight, newPath) {
		// Filter out old edge
		this.nodes[nodeId].o = this.nodes[nodeId].o.filter(e => e.id !== currEdgeId);
		// Add new edge
		this.nodes[nodeId].o.push({ id: newEdgeId, w: newWeight, p: newPath });
	}

	replaceIncomingEdge(nodeId, currEdgeId, newEdgeId, newWeight, newPath) {
		// Filter out old edge
		this.nodes[nodeId].i = this.nodes[nodeId].i.filter(e => e.id !== currEdgeId);
		// Add new edge
		this.nodes[nodeId].i.push({ id: newEdgeId, w: newWeight, p: newPath });
	}

	getNeighborId(edgeId, currNodeId) {
		const [node1, node2] = edgeId.split("--");
		return node1 === currNodeId ? node2 : node1;
	}

	createNewEdgeId(node1, node2) {
		return `${Math.min(parseInt(node1), parseInt(node2))}--${Math.max(parseInt(node1), parseInt(node2))}`;
	}

	constructNewPath(previousNodeIds = [], currNodeId, nextNodeIds = []) {
		previousNodeIds.push(currNodeId)
		return previousNodeIds.concat(nextNodeIds)
	}

	getNextCrossingNodesStart(nodeId) {
		// Return the next crossings for the given node to which the node is connected to. It has to be the outgoing edges of this node because you can only move in that direction. -> If the node is on a one-way street, there will only be one outgoing node, if it is on a two-way street, there will be two outgoing nodes
		return this.node_next_branching_nodes[nodeId].o;
	}

	getNextCrossingNodesEnd(nodeId) {
		// Return the next crossings for the given node to which the node is connected to. It has to be the incoming edges of this node because the node can only be reached from that Node. -> If the node is on a one-way street, there will only be one incoming node, if it is on a two-way street, there will be two incoming nodes
		return this.node_next_branching_nodes[nodeId].i;
	}

	calculateOptimizedPath(startNodeId, endNodeId, algo) {
		let routing_algo = null;
		switch (algo) {
			case "breadth":
				routing_algo = this.route_breadth_search.bind(this);
				break;
			case "dijkstra":
				routing_algo = this.route_dijkstra.bind(this);
				break;
			case "a_star":
				routing_algo = this.route_a_star.bind(this);
				break;
			default:
				throw new Error("Unknown routing algorithm", algo);
		}

		startNodeId = this.ensureString(startNodeId);
		endNodeId = this.ensureString(endNodeId);

		const startTime = performance.now();

		if (startNodeId === endNodeId)
			return { path: [startNodeId], cost: 0, pathLength: 0, contractedNodesPath: [], runtime: performance.now() - startTime, success: true };

		const startingNodes = this.getNextCrossingNodesStart(startNodeId);
		const endingNodes = this.getNextCrossingNodesEnd(endNodeId);

		const paths = [];
		let mostPromisingPathAccordingToSelectedAlgo = null;

		startingNodes.forEach(contractedStartNode => {
			endingNodes.forEach(contractedEndNode => {
				const pathToStartNode = this.getPathToStartingNode(startNodeId, contractedStartNode.id);

				this.debug && console.log("Calculating Path from", contractedStartNode.id, "to", contractedEndNode.id);
				this.debug && console.log("Starting Node", this.nodes[contractedStartNode.id]);
				this.debug && console.log("Ending Node", this.nodes[contractedEndNode.id]);

				// Check, if the endNodeId is lying on the same edge as the startNodeId -> In the direction of a the possible startingCrossingNodeId
				if (pathToStartNode.includes(endNodeId)) {
					this.debug && console.warn("Ist auf dem selben Wegstück")

					const pathToEndNode = pathToStartNode.slice(0, pathToStartNode.indexOf(endNodeId) + 1);

					const costStartToContractedStartCost = contractedStartNode.w;
					const costEndToContractedStartCost = this.getNextCrossingNodesStart(endNodeId).find(e => e.id === contractedStartNode.id).w;

					const path = { path: [...pathToEndNode], cost: costStartToContractedStartCost - costEndToContractedStartCost, startCrossingId: null, endCrossingNodeId: null, contractedNodes: false, success: true }

					mostPromisingPathAccordingToSelectedAlgo = this.validateAndUpdateMostPromisingPathAccordingToSelectedAlgorithm(path, mostPromisingPathAccordingToSelectedAlgo, algo);

					paths.push(path);
					return;
				}

				// Check if the path should be calculated
				if (!this.shouldCalculatePathNeedsContractedNodes(contractedStartNode, contractedEndNode, mostPromisingPathAccordingToSelectedAlgo, algo)) {
					// If the path should not be calculated, then return
					this.debug && console.warn("No need to calculate Path");
					return;
				}

				// Calculate the path from the contracted Start Node to the contracted End Node
				if (!this.nodes[contractedStartNode.id]) {
					console.log("No node found for startingNode", contractedStartNode.id);
				}
				if (!this.nodes[contractedEndNode.id]) {
					console.log("No node found for endNode", contractedEndNode.id);
				}
				let path = routing_algo(contractedStartNode.id, contractedEndNode.id, (newCostOfTotalPathBetweenContractedNodes) => {
					// return true if it should add the node to the queue
					// return false, if it should not add the node to the queue

					// Check if the newCostOfTotalPathBetweenContractedNodes is not defined, if its not, than there has not been found a path, so there is also no need to check if the path is better than the most promising path
					if (!mostPromisingPathAccordingToSelectedAlgo) return true;

					// If the newCostOfTotalPathBetweenContractedNodes plus the cost of the contractedStartNode.w and the contractedEndNode.w is bigger than the most promising path, then return false
					return newCostOfTotalPathBetweenContractedNodes + contractedStartNode.w + contractedEndNode.w < mostPromisingPathAccordingToSelectedAlgo.cost;
				});

				path = {
					path: path.path,
					cost: path.cost + contractedStartNode.w + contractedEndNode.w,
					startCrossingId: contractedStartNode.id,
					endCrossingNodeId: contractedEndNode.id,
					contractedNodes: true,
					success: path.success
				}

				mostPromisingPathAccordingToSelectedAlgo = this.validateAndUpdateMostPromisingPathAccordingToSelectedAlgorithm(path, mostPromisingPathAccordingToSelectedAlgo, algo);

				// Return result
				paths.push(path);
			});
		});

		this.debug && console.log("found Paths", paths);
		this.debug && console.log("mostPromisingPathAccordingToSelectedAlgo", mostPromisingPathAccordingToSelectedAlgo)

		if (!mostPromisingPathAccordingToSelectedAlgo) {
			// No path found
			const endTime = performance.now();
			const ellasedTime = endTime - startTime;
			return { path: null, cost: null, contractedNodesPath: null, runtime: ellasedTime, success: false };
		}

		this.debug && console.log("mostPromisingPathAccordingToSelectedAlgo", mostPromisingPathAccordingToSelectedAlgo)

		let contractedNodesPath = [];
		let completeNodesPath = [];

		if (mostPromisingPathAccordingToSelectedAlgo.startCrossingId && mostPromisingPathAccordingToSelectedAlgo.endCrossingNodeId) {
			// Start and End Node are on different edges -> Path has to be constructed
			contractedNodesPath = [...(startingNodes[0].w > 0 ? [startNodeId] : []), ...mostPromisingPathAccordingToSelectedAlgo.path, ...(endingNodes[0].w > 0 ? [endNodeId] : [])]

			completeNodesPath = this.getCompletePath(mostPromisingPathAccordingToSelectedAlgo.path, startNodeId, endNodeId);
		} else {
			// Start and End Node are on the same edge -> Path is already given
			completeNodesPath = mostPromisingPathAccordingToSelectedAlgo.path;
		}

		const endTime = performance.now();
		const ellasedTime = endTime - startTime;

		return {
			...mostPromisingPathAccordingToSelectedAlgo,
			pathLength: algo !== "breadth" ? mostPromisingPathAccordingToSelectedAlgo.cost : "-",
			contractedNodesPath: contractedNodesPath,
			path: completeNodesPath,
			runtime: ellasedTime,
			success: true
		};
	}

	validateAndUpdateMostPromisingPathAccordingToSelectedAlgorithm(path, mostPromisingPathAccordingToSelectedAlgo, algo) {
		if (!path.success) {
			this.debug && console.log("Path not considered for updating most promising path, because there was no path found", path, algo)
			return mostPromisingPathAccordingToSelectedAlgo;
		}
		if (!mostPromisingPathAccordingToSelectedAlgo) {
			// Set the fist calculated path as the most promising path according to the selected algorithm
			return path;
		} else {
			// Check based on the algo criterian which path is better
			return (algo !== "breadth")
				? (
					// If the algorithm is not breadth first search, then select the algorithm accoring to the cost
					path.cost < mostPromisingPathAccordingToSelectedAlgo.cost
						? path : mostPromisingPathAccordingToSelectedAlgo
				)
				: (
					// If the algorithm is breadth first search, then select the algorithm accoring to the path length (Path currently only exists of the contracted nodes, so this would select the path with the least amount of crossings)
					(
						(
							path.contractedNodes
								// If the path contains contracted nodes, then select the path with the least amount of crossings, otherwise, the path is already complete and the path does not contain any contracted nodes.
								? (path?.path || []).length : 0
						) < (
							mostPromisingPathAccordingToSelectedAlgo.contractedNodes
								? (mostPromisingPathAccordingToSelectedAlgo?.path || []).length : 0
						)
					)
						? path : mostPromisingPathAccordingToSelectedAlgo
				);
		}
	}

	shouldCalculatePathNeedsContractedNodes(startContractedNode, endContractedNode, currentBestPath, algo) {
		// If the algo is breadth first search, then calculate all paths -> There is no possibility to predict how many crossings will come in the future.
		// This case has to be verified on the fly while calculating the path
		if (!currentBestPath || algo === "breadth") return true;

		// Get the costs from the Start Node to the contracted Start Node
		const costStartToContractedStartCost = startContractedNode.w;

		// Get the costs from the End Node to the contracted End Node
		const costEndToContractedStartCost = endContractedNode.w;

		// Calculate the optimal straight line cost/distance between the contracted Start Node and the contracted End Node
		const directOptimalCostToEnd = geo.nav.dist_haversin(this.nodes[startContractedNode.id].k, this.nodes[endContractedNode.id].k);
		// Calculate the optimal/minimal costs from start to end Node
		const minimalCost = costStartToContractedStartCost + directOptimalCostToEnd + costEndToContractedStartCost;

		// Check if the current best path is already better than the minimal cost
		if (currentBestPath.cost <= minimalCost) {
			// The current best path is already better than the minimal cost -> No need to calculate the path
			return false;
		} else {
			// The current best path is not better than the minimal estimted cost -> Calculate the path to see if the new path is better
			return true;
		}
	}

	getCompletePath(contractedPathNodes, startNode, endNode) {
		const pathToStartNode = this.getPathToStartingNode(startNode, contractedPathNodes[0]);
		this.debug && console.log("pathToStartNode", pathToStartNode);

		const pathBetweenStartAndEndNode = this.getPathBetweenStartAndEndNode(contractedPathNodes);
		this.debug && console.log("pathBetweenStartAndEndNode", pathBetweenStartAndEndNode);

		const pathFromEndNode = this.getPathFromEndNode(endNode, contractedPathNodes[contractedPathNodes.length - 1]);
		this.debug && console.log("pathFromEndNode", pathFromEndNode);

		return [...pathToStartNode, ...pathBetweenStartAndEndNode, ...pathFromEndNode];
	}

	getPathBetweenStartAndEndNode(contractedPathNodes) {
		this.debug && console.log("contractedPathNodes", contractedPathNodes);
		let path = [];
		for (let i = 0; i < contractedPathNodes.length - 1; i++) {
			const subPath = this.getOutgoingPathBetweenNodes(contractedPathNodes[i], contractedPathNodes[i + 1]);
			path = [...path, contractedPathNodes[i], ...subPath];
		}

		return [...path, contractedPathNodes[contractedPathNodes.length - 1]];
	}

	getOutgoingPathBetweenNodes(nodeFrom, nodeTo) {
		const edgeId = this.createNewEdgeId(nodeFrom, nodeTo);
		return this.getLowestOutgoingCostEdgeFromContractedNode(nodeFrom, edgeId);
	}

	getLowestOutgoingCostEdgeFromContractedNode(contractedNodeId, edgeId) {
		const matchingOutgoingEdges = this.nodes[contractedNodeId].o.filter(e => e.id === edgeId);

		this.debug && console.log("matchingOutgoingEdges", matchingOutgoingEdges)

		if (!matchingOutgoingEdges || matchingOutgoingEdges.length === 0) {
			console.error("No matching outgoing edge found", contractedNodeId, edgeId);
			return [];
		}
		if (matchingOutgoingEdges.length === 1) {
			return matchingOutgoingEdges[0].p || []; // Return either the path or an empty array if the connected nodes are directly connected -> Then there is no contracted path between them
		}
		// If there are multiple outgoing edges that lead to the same contracted node, the path with the lowest cost has to be determined
		return matchingOutgoingEdges.reduce((acc, curr) => acc.w < curr.w ? acc : curr).p || []; // If the shortest path is a direct connection between the two contracted nodes, then there is no path of nodes in between them
	}

	getPathToStartingNode(nodeId, contractedStartNodeId) {
		if (nodeId === contractedStartNodeId)
			return []

		const edgeId = this.getEdgeIdWhereNodeIsPartOf(nodeId);

		const startNodeIncomingPath = this.getIncomingPathOfContractedNodeThatContainsNonContractedNode(contractedStartNodeId, nodeId, edgeId);

		this.debug && console.log("startNodeIncomingPath", startNodeIncomingPath)

		const startNodeIncomingPathNodeIndex = startNodeIncomingPath.findIndex(e => e === nodeId)

		return startNodeIncomingPath.slice(startNodeIncomingPathNodeIndex);
	}

	getPathFromEndNode(nodeId, contractedEndNodeId) {
		if (nodeId === contractedEndNodeId)
			return []

		const edgeId = this.getEdgeIdWhereNodeIsPartOf(nodeId);

		const endNodeOutgoingPath = this.getOutgoingPathOfContractedNodeThatContainsNonContractedNode(contractedEndNodeId, nodeId, edgeId);

		const endNodeOutgoingPathNodeIndex = endNodeOutgoingPath.findIndex(e => e === nodeId)

		return endNodeOutgoingPath.slice(0, endNodeOutgoingPathNodeIndex + 1);
	}

	getEdgeIdWhereNodeIsPartOf(nodeId) {
		const startingNodesOfEdge = this.getNextCrossingNodesStart(nodeId);
		const endingNodesOfEdge = this.getNextCrossingNodesEnd(nodeId);

		const nodeSet = [... new Set([...startingNodesOfEdge.map(e => e.id), ...endingNodesOfEdge.map(e => e.id)])];

		// If the node is part of a circle that leads back to the same contracted Node as it started, there is only one unique node Id in the set, where the edge Id then has to be specifically created
		if (nodeSet.length === 1) {
			return `${nodeSet[0]}--${nodeSet[0]}`;
		}
		// Normal Case
		if (nodeSet.length === 2) {
			return this.createNewEdgeId(nodeSet[0], nodeSet[1]);
		}
		// Should not happen -> If it does, there is an error in the data structure at creation time
		throw new Error("Unexpected nodeSet length", nodeSet);
	}

	getOutgoingPathOfContractedNodeThatContainsNonContractedNode(contractedNodeId, nodeId, edgeId) {
		// If a contracted node is directly connected to another contracted node, there is no path between them, so the path is undefined und an empty array is returned
		if (!this.nodes[contractedNodeId]) {
			console.log("No node found for contractedNodeId", contractedNodeId);
			return [];
		}
		const matchingOutgoingEdges = this.nodes[contractedNodeId].o.filter(e => e.id === edgeId);

		if (!matchingOutgoingEdges || matchingOutgoingEdges.length === 0) {
			// This can happen, if two contracted Nodes are passed in, so the node can not lie on the path between them
			if (this.nodes[contractedNodeId] && this.nodes[nodeId])
				return [];
			console.log("Outgoing res", res)
			console.log("nodeId", nodeId)
			console.log("contractedNodeId", contractedNodeId)
			console.log("Outgoing Still nothing found")
			console.log("matchingOutgoingEdges", matchingOutgoingEdges)
			return [];
		}
		if (matchingOutgoingEdges.length === 1) {
			return matchingOutgoingEdges[0].p || []; // Return either the path or an empty array if the connected nodes are directly connected -> Then there is no contracted path between them
		}
		// If there are multiple outgoing edges that lead to the same contracted node, the path has to be determined by the nodeId that is part of the path
		const res = matchingOutgoingEdges.filter(e =>
			e.p && e.p.length > 0 && e.p.includes(nodeId)
		)
		// If there is no path found, then there has to be an error in the data structure
		if (!res || res.length === 0) {
			console.error("No path found", contractedNodeId, nodeId, edgeId, matchingOutgoingEdges);
		}
		// If there is only one path that contains the nodeId, then return this path
		if (res.length === 1) {
			return res[0].p;
		} else if (res.length === 2) {
			// If there are two paths that contain the nodeId (e.g. in a bidirect circle (Backnang_Kreisel_Bidirektional))
			if (res[0].w === res[1].w) {
				// If the two have the same costs, then select either one
				return res[0].p;
			} else {
				// If the two have different costs, then select the one with the lowest cost
				return res.reduce((acc, curr) => acc.w < curr.w ? acc : curr).p;
			}
		} else {
			console.error("This case should not happen", res)
			throw new Error("This case should not happen", res)
		}
	}

	getIncomingPathOfContractedNodeThatContainsNonContractedNode(contractedNodeId, nodeId, edgeId) {
		// If a contracted node is directly connected to another contracted node, there is no path between them, so the path is undefined und an empty array is returned
		if (!this.nodes[contractedNodeId]) {
			console.log("No node found for contractedNodeId", contractedNodeId);
			return [];
		}
		const matchingIncomingEdges = this.nodes[contractedNodeId].i.filter(e => e.id === edgeId);

		if (!matchingIncomingEdges || matchingIncomingEdges.length === 0) {
			// This can happen, if two contracted Nodes are passed in, so the node can not lie on the path between them
			if (this.nodes[contractedNodeId] && this.nodes[nodeId])
				return [];
			console.warn("No matching incoming edge found", contractedNodeId, edgeId);
			console.log("Incoming res", res)
			console.log("nodeId", nodeId)
			console.log("contractedNodeId", contractedNodeId)
			console.log("Incoming Still nothing found")
			console.log("matchingIncomingEdges", matchingIncomingEdges)
			return [];
		}
		if (matchingIncomingEdges.length === 1) {
			return matchingIncomingEdges[0].p || []; // Return either the path or an empty array if the connected nodes are directly connected -> Then there is no contracted path between them
		}
		// If there are multiple incoming edges that lead to the same contracted node, the path has to be determined by the nodeId that is part of the path
		const res = matchingIncomingEdges.filter(e =>
			e.p && e.p.length > 0 && e.p.includes(nodeId)
		)
		// If there is no path found, then there has to be an error in the data structure
		if (!res || res.length === 0) {
			console.error("No path found", contractedNodeId, nodeId, edgeId, matchingIncomingEdges);
		}
		// If there is only one path that contains the nodeId, then return this path
		if (res.length === 1) {
			return res[0].p;
		} else if (res.length === 2) {
			// If there are two paths that contain the nodeId (e.g. in a bidirect circle (Backnang_Kreisel_Bidirektional))
			if (res[0].w === res[1].w) {
				// If the two have the same costs, then select the one, where the wanted Node is closer to the start
				const indexOfNodeInFirstPath = res[0].p.indexOf(nodeId);
				const indexOfNodeInSecondPath = res[1].p.indexOf(nodeId);
				console.log("indexOfNodeInFirstPath", indexOfNodeInFirstPath)
				console.log("FirstPath", res[0].p)
				console.log("indexOfNodeInSecondPath", indexOfNodeInSecondPath)
				console.log("SecondPath", res[1].p)
				return indexOfNodeInFirstPath > indexOfNodeInSecondPath ? res[0].p : res[1].p;
			} else {
				// If the two have different costs, then select the one with the lowest cost
				return res.reduce((acc, curr) => acc.w < curr.w ? acc : curr).p;
			}
		}
	}

	ensureString(nodeId) {
		return typeof nodeId === "number" ? nodeId.toString() : nodeId;
	}

	toJSON() {
		return {
			nodes: this.nodes,
			edges: this.edges,
			node_mapped_to_next_crossing: this.node_next_branching_nodes,
			nodes_uncontracted_to_contracted: this.nodes_uncontracted_to_contracted
		};
	}

	fromSavedGraph(data) {
		this.nodes = data.nodes;
		this.edges = data.edges;
		this.node_next_branching_nodes = data.node_mapped_to_next_crossing || {};
		this.nodes_uncontracted_to_contracted = data.nodes_uncontracted_to_contracted || {};
	}

	*routeSimulationOptimized(startNodeId, endNodeId, algo) {
		startNodeId = this.ensureString(startNodeId);
		endNodeId = this.ensureString(endNodeId);

		if (startNodeId === endNodeId) {
			yield { visited: { [startNodeId]: { pred: null } }, current: startNodeId, next: null, success: true, pathToContractedStartNode: null, pathToContractedEndNode: null, contractedStartNode: null, contractedEndNode: null };
			return;
		}

		// Get next crossings for start and end nodes
		const startingNodes = this.getNextCrossingNodesStart(startNodeId);
		const endingNodes = this.getNextCrossingNodesEnd(endNodeId);

		let paths = [];
		let mostPromisingPathAccordingToSelectedAlgo = null;
		let totalContractedExploredEdges = new Set();

		// For each possible start-end node combination
		for (const contractedStartNode of startingNodes) {
			for (const contractedEndNode of endingNodes) {
				console.log("Calculating Path from", contractedStartNode.id, "to", contractedEndNode.id);
				// Get path to starting crossing node
				const pathToStartNode = this.getPathToStartingNode(startNodeId, contractedStartNode.id);

				this.debug && console.log("pathToStartNode", pathToStartNode);

				// If end node is on the path to the starting crossing, we've found a direct path
				if (pathToStartNode.includes(endNodeId)) {
					const pathToEndNode = pathToStartNode.slice(0, pathToStartNode.indexOf(endNodeId) + 1);

					const costStartToContractedStartCost = contractedStartNode.w;
					const costEndToContractedStartCost = this.getNextCrossingNodesStart(endNodeId).find(e => e.id === contractedStartNode.id).w;

					const visited = { [startNodeId]: { pred: null } };
					for (let i = 0; i < pathToEndNode.length - 1; i++) {
						visited[pathToEndNode[i + 1]] = { pred: pathToEndNode[i] };
						console.log("Visited", visited);
					}

					const path = { path: pathToEndNode, cost: costStartToContractedStartCost - costEndToContractedStartCost, startCrossingId: null, endCrossingNodeId: null, contractedNodes: false, success: true, visited }

					console.log("startNodeId", startNodeId);
					console.log("path", path.path);
					console.log("endNodeId", endNodeId);

					yield {
						visited,
						current: endNodeId,
						next: null,
						success: true,
						pathToContractedStartNode: pathToStartNode,
						pathToContractedEndNode: this.getPathFromEndNode(endNodeId, contractedEndNode.id),
						contractedStartNode: null,
						contractedEndNode: null
					}

					mostPromisingPathAccordingToSelectedAlgo = this.validateAndUpdateMostPromisingPathAccordingToSelectedAlgorithm(path, mostPromisingPathAccordingToSelectedAlgo, algo);

					paths.push(path);
					break;
				}

				// Check if the path should be calculated
				if (!this.shouldCalculatePathNeedsContractedNodes(contractedStartNode, contractedEndNode, mostPromisingPathAccordingToSelectedAlgo, algo)) {
					console.warn("No need to calculate Path");
					// If the path should not be calculated, then break
					break;
				}

				// // Calculate path between contracted nodes using appropriate algorithm
				const routingResult = this.routeContractedPath(contractedStartNode.id, contractedEndNode.id, algo, (newCostOfTotalPathBetweenContractedNodes) => {
					// return true if it should add the node to the queue
					// return false, if it should not add the node to the queue

					// Check if the newCostOfTotalPathBetweenContractedNodes is not defined, if its not, than there has not been found a path, so there is also no need to check if the path is better than the most promising path
					if (!mostPromisingPathAccordingToSelectedAlgo) return true;

					// If the newCostOfTotalPathBetweenContractedNodes plus the cost of the contractedStartNode.w and the contractedEndNode.w is bigger than the most promising path, then return false
					return newCostOfTotalPathBetweenContractedNodes + contractedStartNode.w + contractedEndNode.w < mostPromisingPathAccordingToSelectedAlgo.cost;
				});

				let lastStepResult = null;

				for (const step of routingResult) {
					// Add intermediate nodes to visited
					console.log("step", step);
					if (step.current && step.next) {
						yield {
							visited: step.visited,
							current: step.current,
							next: step.next,
							success: undefined,
							pathToContractedStartNode: pathToStartNode,
							pathToContractedEndNode: this.getPathFromEndNode(endNodeId, contractedEndNode.id),
							contractedStartNode: contractedStartNode.id,
							contractedEndNode: contractedEndNode.id
						}
					}

					if (step.success) {
						lastStepResult = step;
					}

					Object.keys(step.visited).forEach(nodeId => {
						if (step.visited[nodeId].pred) {
							// Save the relations as "pred - nodeId" in order to call later the state.contractedGraph.getPathBetweenStartAndEndNode([pred, nodeId]) function
							totalContractedExploredEdges.add(`${step.visited[nodeId].pred}--${nodeId}`);
						}
					});
				}

				console.log("Last Step Result Outside", lastStepResult);

				if (!lastStepResult) {
					console.error("No last Step Result")
					break;
				}

				const path = []
				for (let node = lastStepResult.current; node != null; node = lastStepResult.visited[node].pred) {
					path.push(node);
				}
				path.reverse();

				mostPromisingPathAccordingToSelectedAlgo = this.validateAndUpdateMostPromisingPathAccordingToSelectedAlgorithm({
					visited: lastStepResult.visited,
					path,
					cost: lastStepResult.cost + contractedStartNode.w + contractedEndNode.w,
					startCrossingId: contractedStartNode.id,
					endCrossingNodeId: contractedEndNode.id,
					contractedNodes: true,
					success: lastStepResult.success,
				}, mostPromisingPathAccordingToSelectedAlgo, algo);
			}
		}

		if (!mostPromisingPathAccordingToSelectedAlgo) {
			// No path found
			yield {
				visited: { [startNodeId]: { pred: null } },
				current: startNodeId,
				next: null,
				success: false,
				pathToContractedStartNode: null,
				pathToContractedEndNode: null,
				contractedStartNode: null,
				contractedEndNode: null,
				totalContractedExploredEdges
			};
			return;
		}

		yield {
			visited: mostPromisingPathAccordingToSelectedAlgo.visited,
			current: mostPromisingPathAccordingToSelectedAlgo.endCrossingNodeId || endNodeId,
			next: null,
			success: true,
			pathToContractedStartNode: this.getPathToStartingNode(startNodeId, mostPromisingPathAccordingToSelectedAlgo.startCrossingId),
			pathToContractedEndNode: this.getPathFromEndNode(endNodeId, mostPromisingPathAccordingToSelectedAlgo.endCrossingNodeId),
			contractedStartNode: mostPromisingPathAccordingToSelectedAlgo.startCrossingId,
			contractedEndNode: mostPromisingPathAccordingToSelectedAlgo.endCrossingNodeId,
			totalContractedExploredEdges
		}
	}

	*routeContractedPath(startNode, endNode, algo, f_l) {
		// Choose appropriate queue and parameters based on algorithm
		let queue, weightFactor, heuristicFn, limitFn;
		switch (algo) {
			case 'breadth':
				queue = new c_Queue();
				weightFactor = 0;
				heuristicFn = () => 0;
				limitFn = null;
				break;
			case 'dijkstra':
				queue = new c_Dijkstra_Queue();
				weightFactor = 1;
				heuristicFn = () => 0;
				limitFn = (cost) => f_l(cost);
				break;
			case 'a_star':
				queue = new c_Priority_Queue();
				weightFactor = 1;
				heuristicFn = (a) => geo.nav.dist_haversin(this.nodes[a].k, this.nodes[endNode].k);
				limitFn = (cost) => f_l(cost);
				break;
			default:
				throw new Error(`Unknown algorithm: ${algo}`);
		}

		// Run pathfinding simulation between contracted nodes
		yield* this.routeSimulation(startNode, endNode, queue, weightFactor, heuristicFn, limitFn);
	}
}

class c_Queue {
	#length;
	constructor() {
		this.start = this.end = null;
		this.#length = 0;
	}

	push(data) {
		if (this.start == null)
			this.end = this.start = { data: data, next: null };
		else
			this.end = this.end.next = { data: data, next: null };
		this.#length++;
	}

	pop(data) {
		var res = undefined;
		if (this.start) {
			res = this.start.data;
			if (this.start != this.end)
				this.start = this.start.next;
			else
				this.start = this.end = null;
			this.#length--;
		}
		return res;
	}
	get length() { return this.#length; }
};

class c_Priority_Queue {
	constructor() {
		this.array = [];
	}

	push(o) {
		var ind;
		ind = this.array.length, this.array.push(o);
		let tmp = this.array[ind], p;
		while (ind > 0 && this.array[p = (ind - 1) >> 1].key > tmp.key)
			this.array[ind] = this.array[p], ind = p;
		this.array[ind] = tmp;
	}

	pop() {
		var r = undefined;
		if (this.array.length > 1) {
			r = this.array[0];
			let tmp = this.array.pop(), i = 0;
			while (true) {
				let left = 2 * i + 1, right = left + 1, cmp_obj = tmp, ind = undefined;
				if (left < this.array.length && this.array[left].key < cmp_obj.key)
					ind = left, cmp_obj = this.array[ind];
				if (right < this.array.length && this.array[right].key < cmp_obj.key)
					ind = right;
				if (ind == undefined)
					break;
				this.array[i] = this.array[ind], i = ind;
			}
			this.array[i] = tmp;
		}
		else if (this.array.length == 1) // Letztes / einziges Element
			r = this.array.pop();
		return r;
	}

	get length() {
		return this.array.length
	}
};


class c_Dijkstra_Queue {
	constructor() {
		this.array = [];
		this.map = new Map();
	}

	push(o) {
		const key = o.key, data = o.data;
		var ind;
		if (this.map.has(data))
			ind = this.map.get(data), this.array[ind] = { key: key, data: data };
		else
			ind = this.array.length, this.array.push({ key: key, data: data });
		let tmp = this.array[ind], p;
		while (ind > 0 && this.array[p = (ind - 1) >> 1].key > tmp.key)
			this.array[ind] = this.array[p], this.map.set(this.array[ind].data, ind), ind = p;
		this.array[ind] = tmp, this.map.set(tmp.data, ind);
	}

	pop() {
		var r = undefined;
		if (this.array.length > 1) {
			r = this.array[0], this.map.delete(r.data);
			let tmp = this.array.pop(), i = 0;
			while (true) {
				let left = 2 * i + 1, right = left + 1, cmp_obj = tmp, ind = undefined;
				if (left < this.array.length && this.array[left].key < cmp_obj.key)
					ind = left, cmp_obj = this.array[ind];
				if (right < this.array.length && this.array[right].key < cmp_obj.key)
					ind = right;
				if (ind == undefined)
					break;
				this.array[i] = this.array[ind], this.map.set(this.array[i].data, i), i = ind;
			}
			this.array[i] = tmp, this.map.set(tmp.data, i);
		}
		else if (this.array.length == 1) // Letztes / einziges Element
			r = this.array.pop(), this.map.delete(r.data);
		return r;
	}
	get length() {
		return this.array.length
	}
};

class kd_index {
	/**
	 data: Zu indizierendes Feld
	 fn_xy: Funktion die zu einem Datenelemnt aus o das Array [x, y] liefert
		Default: Pythagoras ** 2
	 fn_dist: Distanz zwischen zwei Punken
	 */
	constructor(data, fn_xy = e => e,
		fn_dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) {
		this.fn_xy = fn_xy, this.fn_dist = fn_dist, this.keys = [];
		this.bbox = [Infinity, Infinity, -Infinity, -Infinity];
		for (let e in data) {
			this.keys.push({ k: data[e].k, id: e });
			const [x, y] = fn_xy(data[e].k);
			if (this.bbox[0] > x)
				this.bbox[0] = x;
			else if (this.bbox[2] < x)
				this.bbox[2] = x;
			if (this.bbox[1] > y)
				this.bbox[1] = y;
			else if (this.bbox[3] < y)
				this.bbox[3] = y;
		}
		this.sort();
	}

	/**
	 p: Punkt zu dem NN gesucht wird
	 arr: Startindex und Länge als Array
	 Alle anderen per Defaultwert!
	 */
	#NN(p, arr = [0, this.keys.length], dim = 0, bbox = this.bbox,
		merk = { dist: Infinity, ind: undefined }, l = 0) {
		this.debug && console.log("".padEnd(l + 1, " "), l, bbox);
		if (arr[1] < 1 || this.dist_bbox_p(bbox, p) > merk.dist)
			return null;
		let m = arr[0] + (arr[1] >> 1), pos = this.fn_xy(this.keys[m].k), d2;
		if ((d2 = this.fn_dist(pos, p)) < merk.dist)
			merk.dist = d2, merk.ind = m;
		var bbox_1 = bbox.slice(), bbox_2 = bbox.slice();
		if (dim % 2 == 0)// aktuell x
			bbox_1[2] = bbox_2[0] = pos[0]; // right half , left half
		else // aktuell y
			bbox_1[3] = bbox_2[1] = pos[1]; // upper half, left half
		this.#NN(p, [arr[0], m - arr[0]], dim + 1, bbox_1, merk, l + 1);
		this.#NN(p, [m + 1, arr[0] + arr[1] - 1 - m], dim + 1, bbox_2, merk, l + 1);
		return merk.ind;
	}
	NN_k(p) {
		return this.fn_xy(this.NN_e(p));
	}
	NN_e(p) {
		return this.keys[this.#NN(p)];
	}

	dist_bbox_p(bb, p) {  // Only 2D !!!
		return (bb[0] <= p[0] && bb[1] <= p[1] && bb[2] >= p[0] && bb[3] >= p[1]) ? 0 :// p innerhalb bb
			this.fn_dist([
				(bb[2] < p[0]) ? bb[2] : ((bb[0] > p[0]) ? bb[0] : p[0]),
				(bb[3] < p[1]) ? bb[3] : ((bb[1] > p[1]) ? bb[1] : p[1])
			], p);
	}

	sort() {
		let stack = [], o = null;
		stack.push({ d: 0, start: 0, l: this.keys.length });
		while (o = stack.pop()) {
			if (o.l <= 1)
				continue;
			let m = o.l >> 1;
			this.select(o.d % 2, o.start + m, o.start, o.start + o.l - 1);
			stack.push({ d: o.d + 1, start: o.start + m + 1, l: o.l - m - 1 });
			stack.push({ d: o.d + 1, start: o.start, l: m });
		}
	}

	select(dim, k, li, re) { // Analog "Numerical Recipes in C"
		const val = (idx) => this.fn_xy(this.keys[idx].k)[dim];
		for (; ;) {
			if (re <= li + 1) { // Active partition contains 1 or 2elements.
				if (re == li + 1 && val(re) < val(li)) // Case of 2elements.
					this.swap(li, re);
				break;
			} else {
				let mid = (li + re) >> 1;
				this.swap(mid, li + 1);
				if (val(li) > val(re))
					this.swap(li, re);
				if (val(li + 1) > val(re))
					this.swap(li + 1, re);
				if (val(li) > val(li + 1))
					this.swap(li, li + 1);
				let i = li + 1, j = re;
				for (; ;) {
					while (val(++i) < val(li + 1));
					while (val(--j) > val(li + 1));
					if (j < i)
						break;
					this.swap(i, j);
				}
				this.swap(li + 1, j);
				if (j >= k)
					re = j - 1;
				if (j <= k)
					li = i;
			}
		}
	}

	swap(a, b) {
		const dummy = this.keys[a];
		this.keys[a] = this.keys[b], this.keys[b] = dummy;
	}
};

class Geo {
	constructor() {
	}
	get transform() { return new c_Transform(); }
	get nav() { return new c_Nav() }
};

var geo = new Geo();

if (typeof module != "undefined") {// node.js
	//	module.exports = geo = new Geo;
	geo = new Geo(); // tbd zeiel löschen
	module.exports = { geo, c_Graph, kd_index, c_Dijkstra_Queue, c_Priority_Queue, c_Queue, };
}