import { processDocumentTables } from './table-image-helper';

describe('processDocumentTables', () => {

  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');

    container.innerHTML = `
      <table id="table1"></table>
      <table id="table2"></table>
    `;

    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should add pdf-width and pdf-height attributes to all tables', () => {
    const tables = container.querySelectorAll('table');

    tables.forEach(table => {
      Object.defineProperty(table, 'offsetWidth', { value: 500 });
      Object.defineProperty(table, 'offsetHeight', { value: 300 });
    });

    processDocumentTables(container);

    tables.forEach(table => {
      expect(table.getAttribute('pdf-width')).toBe('500');
      expect(table.getAttribute('pdf-height')).toBe('300');
    });
  });

});
