const fs = require('fs');
const { createReadStream } = require('fs');
const { c_Graph } = require('../lib/geo.js');
const { createCustomTable } = require('../lib/console_table.js');
const path = require('path');
const { pipeline } = require('stream/promises');
const JSONStream = require('jsonstream-next');

class PerformanceTester {
    constructor(jsonFilePath, numberOfTests = 10, debug = false, isPartOfBundle = false, testName = null) {
        this.debug = debug;
        this.numberOfTests = numberOfTests;
        this.jsonFilePath = jsonFilePath;
        this.testName = testName;
        this.isPartOfBundle = isPartOfBundle;
        this.results = {
            complete: {
                breadth: [],
                dijkstra: [],
                aStar: []
            },
            contracted: {
                breadth: [],
                dijkstra: [],
                aStar: []
            }
        };
    }

    async initialize() {
        try {
            const baseName = this.jsonFilePath.split('/').pop().split('.')[0];

            const cachedGraphs = await this.loadGraphsFromCache(baseName);
            if (cachedGraphs) {
                console.log('Using cached graphs');
                this.completeGraph = cachedGraphs.completeGraph;
                this.contractedGraph = cachedGraphs.contractedGraph;
                return this;
            }

            console.log('Processing full dataset...');
            this.jsonData = { elements: [] };
            await this.streamParseJSON();

            console.log('Creating complete graph...');
            this.completeGraph = new c_Graph();
            this.completeGraph.fromOpenStreetMap(this.jsonData);

            console.log('Creating contracted graph...');
            this.contractedGraph = new c_Graph(
                structuredClone(this.completeGraph.nodes),
                structuredClone(this.completeGraph.edges)
            );
            this.contractedGraph.contractGraph();

            console.log('Saving graphs to cache...');
            await this.saveGraphsToCache(this.completeGraph, this.contractedGraph, baseName);

            return this;
        } catch (error) {
            console.error('Error initializing tester:', error);
            throw error;
        }
    }

    async streamParseJSON() {
        console.log('Starting JSON streaming...');
        const fileStream = createReadStream(this.jsonFilePath, {
            highWaterMark: 64 * 1024
        });

        await pipeline(
            fileStream,
            JSONStream.parse('elements.*'),
            async function* (source) {
                for await (const element of source) {
                    this.jsonData.elements.push(element);
                    if (this.jsonData.elements.length % 100000 === 0) {
                        await new Promise(resolve => setImmediate(resolve));
                    }
                }
            }.bind(this)
        );

        console.log(`Finished streaming. Total elements: ${this.jsonData.elements.length}`);
    }

    async saveGraphsToCache(completeGraph, contractedGraph, baseName) {
        try {
            const completeGraphPath = `../data/cached/${baseName}_complete.json`;
            const contractedGraphPath = `../data/cached/${baseName}_contracted.json`;
            const dir = path.dirname(completeGraphPath);
            await fs.promises.mkdir(dir, { recursive: true });

            const streamWriteGraph = async (graph, filePath) => {
                const writeStream = fs.createWriteStream(filePath);
                const graphData = graph.toJSON();

                writeStream.write('{');

                writeStream.write('"nodes":{');
                let firstNode = true;
                for (const [nodeId, nodeData] of Object.entries(graphData.nodes)) {
                    if (!firstNode) writeStream.write(',');
                    writeStream.write(`"${nodeId}":${JSON.stringify(nodeData)}`);
                    firstNode = false;
                }
                writeStream.write('},');

                writeStream.write('"edges":{');
                let firstEdge = true;
                for (const [edgeId, edgeData] of Object.entries(graphData.edges)) {
                    if (!firstEdge) writeStream.write(',');
                    writeStream.write(`"${edgeId}":${JSON.stringify(edgeData)}`);
                    firstEdge = false;
                }
                writeStream.write('},');

                writeStream.write('"node_mapped_to_next_crossing":');
                writeStream.write(JSON.stringify(graphData.node_mapped_to_next_crossing || {}));
                writeStream.write(',');
                writeStream.write('"nodes_uncontracted_to_contracted":');
                writeStream.write(JSON.stringify(graphData.nodes_uncontracted_to_contracted || {}));

                writeStream.write('}');

                return new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                    writeStream.end();
                });
            };

            console.log('Saving complete graph...');
            await streamWriteGraph(completeGraph, completeGraphPath);

            console.log('Saving contracted graph...');
            await streamWriteGraph(contractedGraph, contractedGraphPath);

            console.log('Successfully saved graphs to cache');
        } catch (e) {
            console.warn('Failed to save calculated graphs:', e);
        }
    }

    async loadGraphsFromCache(baseName) {
        try {
            const completeGraphPath = `../data/cached/${baseName}_complete.json`;
            const contractedGraphPath = `../data/cached/${baseName}_contracted.json`;

            const completeGraph = new c_Graph();
            await pipeline(
                createReadStream(completeGraphPath),
                JSONStream.parse(),
                async function* (source) {
                    for await (const data of source) {
                        completeGraph.fromSavedGraph(data);
                    }
                }
            );

            const contractedGraph = new c_Graph();
            await pipeline(
                createReadStream(contractedGraphPath),
                JSONStream.parse(),
                async function* (source) {
                    for await (const data of source) {
                        contractedGraph.fromSavedGraph(data);
                    }
                }
            );

            return { completeGraph, contractedGraph };
        } catch (e) {
            console.log('No cached graphs found...');
            return null;
        }
    }

    async runTests() {
        console.log('Starting performance tests...');
        console.log('Generating test cases...');
        this.testCases = this.generateTestCases(this.completeGraph);

        console.log('Running performance tests...');
        console.log('\nProgress:');

        for (let i = 0; i < this.numberOfTests; i++) {
            const { start, end } = this.testCases[i];

            this.results.complete.breadth.push(this.measurePerformance(() =>
                this.completeGraph.route_breadth_search(start, end)));

            this.results.complete.dijkstra.push(this.measurePerformance(() =>
                this.completeGraph.route_dijkstra(start, end)));

            this.results.complete.aStar.push(this.measurePerformance(() =>
                this.completeGraph.route_a_star(start, end)));

            this.results.contracted.breadth.push(this.measurePerformance(() =>
                this.contractedGraph.calculateOptimizedPath(start, end, "breadth")));

            this.results.contracted.dijkstra.push(this.measurePerformance(() =>
                this.contractedGraph.calculateOptimizedPath(start, end, "dijkstra")));

            this.results.contracted.aStar.push(this.measurePerformance(() =>
                this.contractedGraph.calculateOptimizedPath(start, end, "a_star")));

            if (i % 10 === 0) {
                process.stdout.write('.');
            }
        }

        console.log('\nPerformance tests completed.');

        this.displayResults();
    }

    generateTestCases(graph) {
        const nodeIds = Object.keys(graph.nodes);
        const testCases = [];

        for (let i = 0; i < this.numberOfTests; i++) {
            const start = nodeIds[Math.floor(Math.random() * nodeIds.length)];
            const end = nodeIds[Math.floor(Math.random() * nodeIds.length)];
            testCases.push({ start, end });
        }

        return testCases;
    }

    measurePerformance(fn) {
        const result = fn();
        if (result.success) {
            return {
                runtime: result.runtime,
                pathLength: result.pathLength,
                nodesInPath: result.path.length,
                success: true
            };
        } else {
            return {
                runtime: result.runtime,
                pathLength: 0,
                nodesInPath: 0,
                success: false
            };
        }
    }

    calculateAverages(results) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        const successStats = successful.length > 0 ? {
            runtime: successful.reduce((sum, r) => sum + r.runtime, 0) / successful.length,
            pathLength: successful.reduce((sum, r) => sum + r.pathLength, 0) / successful.length,
            nodesInPath: successful.reduce((sum, r) => sum + r.nodesInPath, 0) / successful.length,
        } : { runtime: 0, pathLength: 0, nodesInPath: 0 };

        const failureStats = failed.length > 0 ? {
            runtime: failed.reduce((sum, r) => sum + r.runtime, 0) / failed.length
        } : { runtime: 0 };

        const totalStats = {
            runtime: results.reduce((sum, r) => sum + r.runtime, 0) / results.length
        };

        return {
            ...successStats,
            failureRuntime: failureStats.runtime,
            totalRuntime: totalStats.runtime,
            successRate: (successful.length / results.length) * 100
        };
    }

    formatPathLength(length) {
        if (typeof length !== 'number') return '-';
        if (length >= 1000) {
            return `~${(length / 1000).toFixed(2)}km`;
        }
        return `${length.toFixed(2)}m`;
    }

    formatRuntime(ms) {
        if (ms >= 1000) {
            return `~${(ms / 1000).toFixed(2)}s`;
        }
        return `${ms.toFixed(2)}ms`;
    }

    displayResults() {
        const datasetName = this.jsonFilePath.split('/').pop();
        const displayPerformanceTestDatasetString = `Performance Test Results for dataset: ${datasetName}`;
        console.log('\n' + displayPerformanceTestDatasetString);
        console.log('='.repeat(displayPerformanceTestDatasetString.length) + '\n');

        const headers = [
            { name: "Graph Type", columns: ["Type", "Algorithm"] },
            { name: "Success", columns: ["Rate %"] },
            { name: "Successful Paths", columns: ["Runtime", "Length", "Nodes"] },
            { name: "Failed", columns: ["Runtime"] },
            { name: "Total", columns: ["Runtime"] }
        ];

        const rows = [];
        const algorithms = ['breadth', 'dijkstra', 'aStar'];

        const resultsByAlgo = {};
        algorithms.forEach(algo => {
            resultsByAlgo[algo] = {
                complete: {},
                contracted: {}
            };
        });

        ['complete', 'contracted'].forEach(graphType => {
            algorithms.forEach(algo => {
                const stats = this.calculateAverages(this.results[graphType][algo]);
                resultsByAlgo[algo][graphType] = stats;
                rows.push([
                    graphType,
                    algo,
                    stats.successRate.toFixed(1),
                    this.formatRuntime(stats.runtime),
                    this.formatPathLength(stats.pathLength),
                    Math.round(stats.nodesInPath),
                    this.formatRuntime(stats.failureRuntime),
                    this.formatRuntime(stats.totalRuntime)
                ]);
            });
        });

        algorithms.forEach(algo => {
            const completeStats = resultsByAlgo[algo].complete;
            const contractedStats = resultsByAlgo[algo].contracted;

            const successRateDiff = contractedStats.successRate - completeStats.successRate;
            const runtimeDiff = contractedStats.runtime - completeStats.runtime;
            const pathLengthDiff = (algo !== 'breadth' && completeStats.pathLength && contractedStats.pathLength)
                ? contractedStats.pathLength - completeStats.pathLength
                : '-';
            const nodesDiff = contractedStats.nodesInPath - completeStats.nodesInPath;
            const failureRuntimeDiff = contractedStats.failureRuntime - completeStats.failureRuntime;
            const totalRuntimeDiff = contractedStats.totalRuntime - completeStats.totalRuntime;

            rows.push([
                'difference',
                algo,
                (successRateDiff >= 0 ? '+' : '') + successRateDiff.toFixed(1),
                (runtimeDiff >= 0 ? '+' : '') + this.formatRuntime(runtimeDiff),
                (typeof pathLengthDiff === 'number' ? (pathLengthDiff >= 0 ? '+' : '') + this.formatPathLength(pathLengthDiff) : '-'),
                Math.round(nodesDiff),
                (failureRuntimeDiff >= 0 ? '+' : '') + this.formatRuntime(failureRuntimeDiff),
                (totalRuntimeDiff >= 0 ? '+' : '') + this.formatRuntime(totalRuntimeDiff)
            ]);
        });

        console.log(createCustomTable(headers, rows, [2, 5]));

        this.saveResultsToFile(datasetName, {
            headers,
            rows,
            testConfig: {
                numberOfTests: this.numberOfTests,
                completeGraphNodes: Object.keys(this.completeGraph.nodes).length,
                contractedGraphNodes: Object.keys(this.contractedGraph.nodes).length
            }
        });

        console.log('\nTest configuration:');
        console.log(`- Number of test cases: ${this.numberOfTests}`);
        console.log(`- Total nodes in complete Graph: ${Object.keys(this.completeGraph.nodes).length}`);
        console.log(`- Total nodes in contracted Graph: ${Object.keys(this.contractedGraph.nodes).length}`);
        console.log('\nLegend:');
        console.log('- Success Rate: Percentage of paths found');
        console.log('- Successful Paths Runtime: Average runtime for cases where a path was found');
        console.log('- Successful Paths Length: Average path length when a path was found');
        console.log('- Successful Paths Nodes: Average number of nodes in the path when a path was found');
        console.log('- Failed Paths Runtime: Average runtime for cases where no path was found');
        console.log('- Total Runtime: Average runtime across all attempts (successful and failed)');
        console.log('- Difference rows show contracted minus complete values (positive = increase = contracted slower)');

        if (this.debug) {
            console.log("\nNode Count Differences in A* Paths:");
            console.log("=================================");

            for (let i = 0; i < this.numberOfTests; i++) {
                const completeResult = this.results.complete.aStar[i];
                const contractedResult = this.results.contracted.aStar[i];

                if (completeResult.success && contractedResult.success) {
                    const completePath = completeResult.nodesInPath;
                    const contractedPath = contractedResult.nodesInPath;

                    if (completePath !== contractedPath) {
                        console.log(`\nTest case ${i + 1}:`);
                        console.log(`Start: ${this.testCases[i].start}`);
                        console.log(`End: ${this.testCases[i].end}`);
                        console.log(`Complete A* path nodes: ${completePath}`);
                        console.log(`Contracted A* path nodes: ${contractedPath}`);
                        console.log(`Difference: ${contractedPath - completePath} nodes`);
                    }
                }
            }

            const algorithms = ['breadth', 'dijkstra', 'aStar'];
            const graphTypes = ['complete', 'contracted'];

            console.log("\nFailed Tests Summary:");
            console.log("===================");

            let foundFailures = false;

            graphTypes.forEach(graphType => {
                algorithms.forEach(algo => {
                    const failures = this.results[graphType][algo]
                        .map((result, index) => ({ result, index }))
                        .filter(({ result }) => !result.success);

                    if (failures.length > 0) {
                        foundFailures = true;
                        console.log(`\n${graphType.charAt(0).toUpperCase() + graphType.slice(1)} Graph - ${algo}:`);
                        console.log("-".repeat(graphType.length + algo.length + 8));
                        failures.forEach(({ index }) => {
                            console.log(`Test ${index + 1}:`, this.testCases[index]);
                        });
                        console.log(`Total failed: ${failures.length} / ${this.numberOfTests}`);
                    }
                });
            });

            if (!foundFailures) {
                console.log("\nAll tests were successful across all algorithms and graph types.");
            }
        }
    }

    async saveResultsToFile(datasetName, results) {
        try {
            const baseDir = path.join(__dirname, 'results');
            const testType = this.isPartOfBundle ? 'bundle' : 'single';

            const timestamp = new Date().toLocaleString('de-DE', {
                timeZone: 'Europe/Berlin',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }).replace(", ", '_').replace(/[\/:]/g, '-').replace(/[\/.]/g, '-');

            const folderName = this.isPartOfBundle ? (this.testName ? this.testName : timestamp) : this.testName ? this.testName : "";
            const datasetBaseName = path.basename(datasetName, path.extname(datasetName));

            const resultDir = path.join(
                baseDir,
                testType,
                folderName,
                datasetBaseName
            );

            await fs.promises.mkdir(resultDir, { recursive: true });

            const jsonFileName = path.join(resultDir, `results_${timestamp}.json`);
            await fs.promises.writeFile(jsonFileName, JSON.stringify(results, null, 2));

            const tableContent = this.createHumanReadableTable(results, datasetName, timestamp);
            const tableFileName = path.join(resultDir, `table_${timestamp}.txt`);
            await fs.promises.writeFile(tableFileName, tableContent);

            console.log(`\nResults saved to:`);
            console.log(`- JSON: ${jsonFileName}`);
            console.log(`- Table: ${tableFileName}`);
        } catch (error) {
            console.error('Error saving results to file:', error);
        }
    }

    createHumanReadableTable(results, datasetName, timestamp) {
        let output = `Performance Test Results for dataset: ${datasetName}\n`;
        output += `Timestamp: ${timestamp}\n`;
        output += '='.repeat(50) + '\n\n';

        output += 'Test Configuration:\n';
        output += `-----------------\n`;
        output += `Number of test cases: ${results.testConfig.numberOfTests}\n`;
        output += `Complete Graph Nodes: ${results.testConfig.completeGraphNodes}\n`;
        output += `Contracted Graph Nodes: ${results.testConfig.contractedGraphNodes}\n\n`;

        output += createCustomTable(results.headers, results.rows, [2, 5]);

        output += '\n\nLegend:\n';
        output += ("-".repeat("Legend:".length) + '\n');
        output += '- Success Rate: Percentage of paths found\n';
        output += '- Successful Paths Runtime: Average runtime for cases where a path was found\n';
        output += '- Successful Paths Length: Average path length when a path was found\n';
        output += '- Successful Paths Nodes: Average number of nodes in the path when a path was found\n';
        output += '- Failed Paths Runtime: Average runtime for cases where no path was found\n';
        output += '- Total Runtime: Average runtime across all attempts (successful and failed)\n';
        output += '- Difference rows show contracted minus complete values (positive = increase = contracted slower)\n';

        return output;
    }
}

if (require.main === module) {
    const testName = process.argv[2] || null;
    const tester = new PerformanceTester(
        '../data/autobahnen_sn.json',
        1000,                               // number of tests 
        true,                               // debug mode
        false,                              // isPartOfBundle
        testName                            // test name from command line
    );

    tester.initialize()
        .then(initializedTester => initializedTester.runTests())
        .catch(console.error);
}

module.exports = {
    createTester: async (jsonFilePath, numberOfTests = 10, debug = false, isPartOfBundle = false, testName = null) => {
        const tester = new PerformanceTester(jsonFilePath, numberOfTests, debug, isPartOfBundle, testName);
        await tester.initialize();
        return tester;
    }
};