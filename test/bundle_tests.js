const path = require('path');
const { createTester } = require('./performance_tests');

class BundleTester {
  constructor(config) {
    this.defaultTestSize = config.defaultTestSize || 100;
    this.debug = config.debug || false;
    this.testName = config.testName || null;
    this.datasets = this.processDatasets(config.datasets);
  }

  processDatasets(datasets) {
    return datasets.map(dataset => {
      if (typeof dataset === 'string') {
        return {
          path: dataset,
          testSize: this.defaultTestSize
        };
      }
      return {
        path: dataset.path,
        testSize: dataset.testSize || this.defaultTestSize
      };
    });
  }

  async runAllTests() {
    console.log('\nStarting bundle tests...');
    console.log('======================\n');
    console.log(`Default test size: ${this.defaultTestSize}`);
    console.log(`Total datasets: ${this.datasets.length}`);
    if (this.testName) {
      console.log(`Test name: ${this.testName}\n`);
    }

    for (const dataset of this.datasets) {
      console.log(`Testing dataset: ${path.basename(dataset.path)}`);
      console.log(`Test size: ${dataset.testSize}`);

      try {
        const tester = await createTester(
          dataset.path,
          dataset.testSize,
          this.debug,
          true,
          this.testName
        );
        await tester.runTests();
        console.log('\n-------------------------------------------\n');
      } catch (error) {
        console.error(`Failed to test dataset ${dataset.path}:`, error);
      }
    }

    console.log('Bundle tests completed.');
  }
}

if (require.main === module) {
  const testName = process.argv[2] || null;
  const config = {
    defaultTestSize: 1,
    debug: false,
    testName: testName,
    datasets: [
      '../data/wilhelma.json',
      "../data/stuttgart.json",
      "../data/backnang.json",
      '../data/autobahnen_de.json',
      "../data/autobahnen_sn.json",
      "../data/strassennetz_bw.json"
    ]
  };

  const bundleTester = new BundleTester(config);
  bundleTester.runAllTests().catch(console.error);
}

module.exports = BundleTester;
