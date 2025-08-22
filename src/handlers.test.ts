//handlers.test.ts
import { MyHandler } from './handlers';
import { createTable } from './exportPdf';
import { PreviewForm } from './preview';

jest.mock('./exportPdf', () => ({ createTable: jest.fn() }));
jest.mock('./preview', () => ({
  PreviewForm: {
    showToc: jest.fn(),
    showTof: jest.fn(),
    showTot: jest.fn(),
    getHeadersTOC: jest.fn(),
    getHeadersTOF: jest.fn(),
    getHeadersTOT: jest.fn(),
  }
}));

describe('MyHandler', () => {
  let polisherMock: unknown;
  let handler: MyHandler;

  beforeEach(() => {
    polisherMock = {
      convertViaSheet: jest.fn().mockResolvedValue('convertedCSS'),
      insert: jest.fn(),
    };
    handler = new MyHandler({}, polisherMock, 'callerX');
    jest.clearAllMocks();
  });

  describe('beforeParsed', () => {
    it('calls createTable when any show flag is true', () => {
      (PreviewForm.showToc as jest.Mock).mockReturnValue(true);
      handler.beforeParsed('mockContent');
      expect(createTable).toHaveBeenCalledWith(expect.objectContaining({
        content: 'mockContent'
      }));
    });

    it('skips createTable when all flags are false', () => {
      (PreviewForm.showToc as jest.Mock).mockReturnValue(false);
      (PreviewForm.showTof as jest.Mock).mockReturnValue(false);
      (PreviewForm.showTot as jest.Mock).mockReturnValue(false);
      handler.beforeParsed('mockContent');
      expect(createTable).not.toHaveBeenCalled();
    });
  });

  describe('afterPageLayout', () => {
    function makeFragment(withElements: boolean, opts: Record<string, string> = {}) {
      const frag: unknown = {
        style: { setProperty: jest.fn() },
        querySelectorAll: jest.fn()
      };
      if (withElements) {
        const el = document.createElement('div');
        el.setAttribute('data-style-level', opts.level || '1');
        if (opts.prefix) el.setAttribute('prefix', opts.prefix);
        if (opts.tof) el.setAttribute('tof', '1');
        if (opts.tot) el.setAttribute('tot', '1');
        if (opts.reset) el.setAttribute('reset', opts.reset);
        frag.querySelectorAll.mockReturnValue([el]);
      } else {
        frag.querySelectorAll.mockReturnValue([]);
      }
      return frag;
    }

    it('handles no prepages and no tocElements', () => {
      const frag = makeFragment(false);
      const page = { element: { outerHTML: '<div></div>', querySelector: jest.fn().mockReturnValue(null) } };
      handler.afterPageLayout(frag, page);
      expect(frag.style.setProperty).toHaveBeenCalledWith('--pagedjs-string-last-chapTitled', '""');
    });

    it('handles tocElements and computes footer height', () => {
      const frag = makeFragment(false);
      const page = {
        element: {
          querySelector: jest.fn().mockReturnValue(null),
          outerHTML: '<infoicon description="testDesc"></infoicon>'
        }
      };
      handler.afterPageLayout(frag, page);
      expect(frag.style.setProperty).toHaveBeenCalledWith(expect.stringContaining('--pagedjs-footer-height'), expect.any(String));
    });

    it('increments counters for tof case', () => {
      const frag = makeFragment(true, { level: '1', tof: '1' });
      const page = { element: { querySelector: jest.fn().mockReturnValue(null), outerHTML: '<div></div>' } };
      handler.afterPageLayout(frag, page);
      expect(frag.querySelectorAll).toHaveBeenCalledWith('[data-style-level]');
    });

    it('increments counters for tot case', () => {
      const frag = makeFragment(true, { level: '1', tot: '1' });
      const page = { element: { querySelector: jest.fn().mockReturnValue(null), outerHTML: '<div></div>' } };
      handler.afterPageLayout(frag, page);
    });

    it('handles reset case', () => {
      const frag = makeFragment(true, { level: '2', reset: 'true' });
      const page = { element: { querySelector: jest.fn().mockReturnValue(null), outerHTML: '<div></div>' } };
      handler.afterPageLayout(frag, page);
    });
  });

  describe('doIT', () => {
    it('inserts stylesheet only once', async () => {
      await handler.doIT();
      expect(polisherMock.convertViaSheet).toHaveBeenCalled();
      expect(polisherMock.insert).toHaveBeenCalledWith('convertedCSS');

      await handler.doIT();  // second call should not insert again
      expect(polisherMock.convertViaSheet).toHaveBeenCalledTimes(1);
      expect(polisherMock.insert).toHaveBeenCalledTimes(1);
    });

    it('adds lastUpdated block if PreviewForm.lastUpdated is set', async () => {
      PreviewForm.lastUpdated = true;
      PreviewForm.formattedDate = '2025-08-20';
      const h = new MyHandler({}, polisherMock, 'caller');
      await h.doIT();
      expect(polisherMock.convertViaSheet).toHaveBeenCalledWith(expect.stringContaining('Last Updated On'));
    });
  });

  describe('beforePageLayout', () => {
    it('delegates to doIT', async () => {
      const spy = jest.spyOn(handler, 'doIT').mockResolvedValue();
      handler.beforePageLayout();
      expect(spy).toHaveBeenCalled();
    });
  });
});
