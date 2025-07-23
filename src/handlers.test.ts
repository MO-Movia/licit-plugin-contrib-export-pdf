import { MyHandler } from './handlers';
import { PreviewForm } from './preview';
import { Node } from 'prosemirror-model';

describe('MyHandler', () => {
  const mockChunker = jest.fn();
  const mockPolisher = jest.fn();
  const mockCaller = jest.fn();
  const handler = new MyHandler(mockChunker, mockPolisher, mockCaller);

  it('beforeParsed sets up pageFooters if Option includes 2', () => {
    const toc_data = {
      querySelector: () => {
        return {
          querySelector: (): string => {
            return '.tocHead';
          }
        };
      }
    };

    PreviewForm['isToc'] = true;
    const test_ = handler.beforeParsed(toc_data);
    expect(test_).toBeUndefined();
  });
  it('beforeParsed sets up pageFooters if Option includes 2 when getTocNodes return a value', () => {
    const toc_data = {
      querySelector: () => {
        return {
          querySelector: (): string => {
            return '.tocHead';
          }
        };
      }
    };

    PreviewForm['isToc'] = true;
    jest.spyOn(PreviewForm, 'getTocNodes').mockReturnValue([{} as unknown as Node]);
    const test_ = handler.beforeParsed(toc_data);
    expect(test_).toBeUndefined();
  });
  it('beforeParsed sets up pageFooters if Option includes 2 when tocElementDiv.querySelector(h4) is undefined', () => {
    const toc_data = {
      querySelector: () => {
        return {
          querySelector: (): string => {
            return undefined as unknown as string;
          }, insertBefore: () => { return {}; }
        };
      }
    };

    PreviewForm['isToc'] = true;
    jest.spyOn(PreviewForm, 'getTocNodes').mockReturnValue([{} as unknown as Node]);
    jest.spyOn(PreviewForm, 'getTofNodes').mockReturnValue([{} as unknown as Node]);
    jest.spyOn(PreviewForm, 'getTotNodes').mockReturnValue([{} as unknown as Node]);
    const test_ = handler.beforeParsed(toc_data);
    expect(test_).toBeUndefined();
  });
  it('beforeParsed sets up pageFooters if PreviewForm.isToc == true', () => {
    PreviewForm['isToc'] = true;
    PreviewForm['general'] = true;

    const el = document.createElement('infoicon');
    el.setAttribute('description', 'text');
    const el1 = document.createElement('infoicon');
    el1.setAttribute('description', 'text');
    const pages = [
      { element: el },
      { element: el1 }
    ];

    handler.afterRendered(pages);
    const test_ = handler.afterPageLayout({
      dataset: { pageNumber: 2 }, style: {
        setProperty() {
          return 'bold';
        }
      }
    });
    expect(test_).toBeUndefined();
  });

  it('afterPageLayout sets up pageFooters if PreviewForm.isToc == false', () => {
    PreviewForm['isToc'] = false;
    PreviewForm['general'] = true;
    const el = document.createElement('infoicon');
    el.setAttribute('description', 'text');
    const el1 = document.createElement('infoicon');
    el1.setAttribute('description', 'text');
    const pages = [
      { element: el },
      { element: el1 }
    ];

    handler.afterRendered(pages);
    const test_ = handler.afterPageLayout({
      dataset: { pageNumber: 1 }, style: {
        setProperty() {
          return 'bold';
        }
      }
    });
    expect(test_).toBeUndefined();
  });

});

describe('MyHandler - doIT', () => {

  const mockConvertViaSheet = jest.fn();
  const mockInsert = jest.fn();
  const mockPolisher = {
    convertViaSheet: mockConvertViaSheet,
    insert: mockInsert,
  };

  const chunker = {};
  const polisher = mockPolisher;
  const caller = {};

  const myHandler = new MyHandler(chunker, polisher, caller);

  it('Should call convertViaSheet and insert with correct arguments when Option includes 3 and 2', async () => {
    PreviewForm['isToc'] = true;
    myHandler.beforePageLayout();
    expect(myHandler.done).toBe(false);
  });

  it('Should call convertViaSheet and insert with correct arguments when Option includes 3', async () => {
    PreviewForm['isToc'] = false;
    myHandler.beforePageLayout();
    expect(myHandler.done).toBe(true);
  });

  it('Should call convertViaSheet and insert with correct arguments when Option includes 2', async () => {
    PreviewForm['isToc'] = true;
    myHandler.beforePageLayout();
    expect(myHandler.done).toBe(true);
  });

  it('Should call convertViaSheet and insert with correct arguments when Option includes 1', async () => {
    PreviewForm['isToc'] = false;
    myHandler.beforePageLayout();
    expect(myHandler.done).toBe(true);
  });

});
