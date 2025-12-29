function addPDFAttributesToTable(
    tableElement: HTMLTableElement

): void {
    // Set table-level attributes
    tableElement.setAttribute('pdf-width', tableElement.offsetWidth.toString());
    tableElement.setAttribute('pdf-height', tableElement.offsetHeight.toString());

}

// Process all tables in a document
function processDocumentTables(
  documentElement: Document | HTMLElement
): void {
  const tables = documentElement.querySelectorAll('table');

  for (const table of tables) {
    addPDFAttributesToTable(table);
  }
}

// Export functions
export { processDocumentTables };