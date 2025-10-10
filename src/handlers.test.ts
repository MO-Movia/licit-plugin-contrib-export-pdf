import { PDFHandler } from './handlers'; // adjust path
import { PreviewForm } from './preview';
import { createTable } from './exportPdf';

jest.mock('./exportPdf', () => ({
  createTable: jest.fn(),
}));

jest.mock('./preview', () => ({
  PreviewForm: {
    showToc: jest.fn(),
    showTof: jest.fn(),
    showTot: jest.fn(),
    getHeadersTOC: jest.fn().mockReturnValue(['h1']),
    getHeadersTOF: jest.fn().mockReturnValue(['h2']),
    getHeadersTOT: jest.fn().mockReturnValue(['h3']),
  },
}));

describe('MyHandler', () => {
  let handler: PDFHandler;
  let frag: HTMLElement;
  let polisher: unknown;

  beforeEach(() => {
    polisher = {
      convertViaSheet: jest.fn().mockResolvedValue('converted-css'),
      insert: jest.fn(),
    };
    handler = new PDFHandler({}, polisher, {});
    frag = document.createElement('div');
    jest.spyOn(frag.style, 'setProperty');
  });

  describe('beforeParsed', () => {
    it('calls createTable when PreviewForm flags are true', () => {
      (PreviewForm.showToc as jest.Mock).mockReturnValue(true);
      (PreviewForm.showTof as jest.Mock).mockReturnValue(false);
      (PreviewForm.showTot as jest.Mock).mockReturnValue(false);
      const content = document.createElement('div');

      handler.beforeParsed(content);
      expect(createTable).toHaveBeenCalled();
    });

    it('does not call createTable when all flags are false', () => {
      (PreviewForm.showToc as jest.Mock).mockReturnValue(false);
      (PreviewForm.showTof as jest.Mock).mockReturnValue(false);
      (PreviewForm.showTot as jest.Mock).mockReturnValue(false);
      handler.beforeParsed(document.createElement('div'));
      expect(createTable).not.toHaveBeenCalled();
    });
  });

  describe('afterPageLayout', () => {
    it('returns early if page.element is missing', () => {
      handler.afterPageLayout(frag, {});
      expect(frag.style.setProperty).not.toHaveBeenCalled();
    });

    it('returns early if prepages exists', () => {
      const page = { element: document.createElement('div') };
      page.element.innerHTML = '<div class="prepages"></div>';
      handler.afterPageLayout(frag, page);
      expect(frag.style.setProperty).not.toHaveBeenCalled();
    });

    it('sets empty toc string when no tocElements', () => {
      const page = { element: document.createElement('div') };
      handler.afterPageLayout(frag, page);
      expect(frag.style.setProperty).toHaveBeenCalledWith(
        '--pagedjs-string-last-chapTitled',
        '""'
      );
    });

    it('handles tocElements and computes footer height', () => {
      const page = { element: document.createElement('div') };
      page.element.innerHTML = '<infoicon description="<b>Intro</b>"></infoicon>';
      handler.afterPageLayout(frag, page);
      expect(frag.style.setProperty).toHaveBeenCalledWith(
        expect.stringContaining('--pagedjs-footer-height'),
        expect.any(String)
      );
    });

    it('increments counters normally', () => {
      const page = { element: document.createElement('div') };
      handler.afterPageLayout(frag, page);
      const el = document.createElement('div');
      el.setAttribute('data-style-level', '1');
      frag.appendChild(el);
      handler.afterPageLayout(frag, page);
      expect(el.getAttribute('customcounter')).toBe('1.');
    });

    it('increments counters for tof', () => {
      const page = { element: document.createElement('div') };
      const el = document.createElement('div');
      el.setAttribute('data-style-level', '1');
      el.setAttribute('tof', 'true');
      frag.appendChild(el);
      handler.afterPageLayout(frag, page);
      expect(el.getAttribute('customcounter')).toContain('.');
    });

    it('increments counters for tot', () => {
      const page = { element: document.createElement('div') };
      const el = document.createElement('div');
      el.setAttribute('data-style-level', '1');
      el.setAttribute('tot', 'true');
      frag.appendChild(el);
      handler.afterPageLayout(frag, page);
      expect(el.getAttribute('customcounter')).toContain('.');
    });

    it('resets counters when reset attribute is true', () => {
      const page = { element: document.createElement('div') };
      const el = document.createElement('div');
      el.setAttribute('data-style-level', '2');
      el.setAttribute('reset', 'true');
      frag.appendChild(el);
      handler.afterPageLayout(frag, page);
      expect(el.getAttribute('customcounter')).toContain('.');
    });
  });

  it('stripHTML removes tags', () => {
    const result = handler.stripHTML('<b>Hello</b>');
    expect(result).toBe('Hello');
  });

  describe('beforePageLayout & doIT', () => {
    it('calls doIT and inserts css without lastUpdated', async () => {
      await handler.beforePageLayout();
      expect(polisher.convertViaSheet).toHaveBeenCalled();
      expect(polisher.insert).toHaveBeenCalled();
    });

    it('adds lastUpdatedStyle when PreviewForm.lastUpdated exists', async () => {
      PreviewForm.lastUpdated = true;
      PreviewForm.formattedDate = '2025-08-26';
      handler = new PDFHandler({}, polisher, {});
      await handler.doIT();
      expect(polisher.convertViaSheet).toHaveBeenCalledWith(expect.stringContaining('Last Updated On: 2025-08-26'));
    });

    it('does not run convertViaSheet if already done', async () => {
      handler.done = true;
      await handler.doIT();
      expect(polisher.convertViaSheet).not.toHaveBeenCalled();
    });
  });
});
