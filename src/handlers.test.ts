import MyHandler from './handlers';
import { Array } from './handlers';

jest.mock('./exportPdf', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('./preview');

describe('MyHandler', () => {
    const mockChunker = jest.fn();
    const mockPolisher = jest.fn();
    const mockCaller = jest.fn();
    const handler = new MyHandler(mockChunker, mockPolisher, mockCaller);

    it('beforeParsed sets up pageFooters if Option includes 2', () => {

        jest.requireMock('./preview').Option = [1, 3, 2];
        handler.beforeParsed('content');
        expect(handler.pageFooters).toStrictEqual([]);
    });

    it('beforeParsed sets up pageFooters if Option includes 1', () => {
        jest.requireMock('./preview').Option = [1, 3, 2];

        const el = document.createElement('infoicon');
        el.setAttribute('description', 'text');
        const el1 = document.createElement('infoicon');
        el1.setAttribute('description', 'text');
        const pages = [
            { element: el },
            { element: el1 }
        ];

        handler.afterRendered(pages);
        handler.afterPageLayout({ dataset: { pageNumber: 2 }, style: { setProperty() { return 'bold'; } } });
        expect(Array.length).toBeGreaterThan(0);
    });

    it('afterPageLayout sets up pageFooters if Option !includes 2', () => {
        jest.requireMock('./preview').Option = [1, 3];

        const el = document.createElement('infoicon');
        el.setAttribute('description', 'text');
        const el1 = document.createElement('infoicon');
        el1.setAttribute('description', 'text');
        const pages = [
            { element: el },
            { element: el1 }
        ];

        handler.afterRendered(pages);
        handler.afterPageLayout({ dataset: { pageNumber: 1 }, style: { setProperty() { return 'bold'; } } });
        expect(Array.length).toBeGreaterThan(0);
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
        jest.requireMock('./preview').Option = [3, 2];
        myHandler.beforePageLayout();
        expect(myHandler.done).toBe(false);
    });

    it('Should call convertViaSheet and insert with correct arguments when Option includes 3', async () => {
        jest.requireMock('./preview').Option = [3];
        myHandler.beforePageLayout();
        expect(myHandler.done).toBe(true);
    });
    it('Should call convertViaSheet and insert with correct arguments when Option includes 2', async () => {
        jest.requireMock('./preview').Option = [2];
        myHandler.beforePageLayout();
        expect(myHandler.done).toBe(true);
    });
    it('Should call convertViaSheet and insert with correct arguments when Option includes 1', async () => {
        jest.requireMock('./preview').Option = [1];
        myHandler.beforePageLayout();
        expect(myHandler.done).toBe(true);
    });

});



