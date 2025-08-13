function createCustomTable(headers, rows, horizontalSplitIndices = []) {
  // Calculate column widths for nested headers and rows
  function calculateColumnWidths(headers, rows) {
    const widths = [];

    // Calculate initial widths from flattened headers
    function flattenHeaders(headers) {
      return headers.reduce((acc, header) => {
        if (typeof header === 'string') {
          // For string headers, ensure minimum width is the header text length
          acc.push(header);
          widths.push(header.length);
        } else {
          // For object headers with columns
          const columnCount = header.columns.length;
          header.columns.forEach((col, i) => {
            acc.push(col);
            // For single column headers, ensure minimum width is the header name length
            if (columnCount === 1) {
              widths.push(Math.max(col.length, header.name.length));
            } else {
              widths.push(col.length);
            }
          });
        }
        return acc;
      }, []);
    }

    flattenHeaders(headers);

    // Update widths based on row content
    rows.forEach(row => {
      row.forEach((cell, i) => {
        widths[i] = Math.max(widths[i], String(cell).length);
      });
    });

    return widths;
  }

  // Create header line with spanning cells
  function createHeaderRow(headers, columnWidths) {
    let row = '|';
    let separator = '+';
    let subheader = '|';
    let subseparator = '+';

    let currentColumn = 0;
    headers.forEach(header => {
      if (typeof header === 'string' || !header.columns) {
        const width = columnWidths[currentColumn];
        row += ` ${(typeof header === 'string' ? header : header.name).padEnd(width)} |`;
        separator += '-'.repeat(width + 2) + '+';
        subseparator += '-'.repeat(width + 2) + '+';
        subheader += ` ${' '.padEnd(width)} |`;
        currentColumn++;
      } else {
        // Calculate width for grouped columns including the separators
        const groupWidth = header.columns.reduce((sum, _, i) => {
          const colWidth = columnWidths[currentColumn + i];
          // Add column width plus 3 for the separator (` | `) except for the last column
          return sum + colWidth + (i < header.columns.length - 1 ? 3 : 0);
        }, 0);

        row += ` ${header.name.padEnd(groupWidth)} |`;
        separator += '-'.repeat(groupWidth + 2) + '+';

        // Create subheader cells
        header.columns.forEach((subhead, i) => {
          const width = columnWidths[currentColumn];
          subheader += ` ${subhead.padEnd(width)} |`;
          subseparator += '-'.repeat(width + 2) + '+';
          currentColumn++;
        });
      }
    });

    // Only return subheader and subseparator if there are any nested headers
    const hasNestedHeaders = headers.some(header => header.columns);
    return hasNestedHeaders ?
      [row, separator, subheader, subseparator] :
      [row, separator];
  }

  // Create data rows
  function createDataRows(rows, columnWidths) {
    const rowLines = [];
    rows.forEach((row, index) => {
      let line = '|';
      row.forEach((cell, i) => {
        line += ` ${String(cell).padEnd(columnWidths[i])} |`;
      });
      rowLines.push(line);

      // Add horizontal separator after specified rows
      if (horizontalSplitIndices.includes(index)) {
        const separator = '+' + columnWidths.map(width => '-'.repeat(width + 2)).join('+') + '+';
        rowLines.push(separator);
      }
    });
    return rowLines;
  }

  const columnWidths = calculateColumnWidths(headers, rows);
  const [headerRow, headerSeparator, subheaderRow, subheaderSeparator] = createHeaderRow(headers, columnWidths);
  const dataRows = createDataRows(rows, columnWidths);

  // Create bottom separator without doubled separators
  const bottomSeparator = '+' + columnWidths.map(width => '-'.repeat(width + 2)).join('+') + '+';

  return [
    headerSeparator,
    headerRow,
    headerSeparator,
    subheaderRow,
    subheaderSeparator,
    ...dataRows,
    bottomSeparator
  ].join('\n');
}

// Only run if called directly (not imported)
if (require.main === module) {
  // Example usage with horizontal splits
  const headers = [
    { name: "Person", columns: ["Name", "Age"] },
    { name: "Job Details", columns: ["Position", "Department"] },
    "Country"
  ];

  const rows = [
    ["Alice", 25, "Developer", "IT", "Germany"],
    ["Bob", 30, "Manager", "HR", "USA"],
    ["Charlie", 35, "Designer", "Marketing", "UK"]
  ];

  // Test the table with separator after the first row (index 0)
  console.log(createCustomTable(headers, rows, [0]));
}

// Add this at the end of the file
module.exports = { createCustomTable };
