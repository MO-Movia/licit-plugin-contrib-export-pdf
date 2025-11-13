import { Loader } from './loader';
import { PDFHandler } from './handlers';

jest.useFakeTimers();

describe('Loader component (no react-test-renderer)', () => {
    let loader: Loader;
    let originalSetInterval: typeof setInterval;
    let originalClearInterval: typeof clearInterval;

    beforeEach(() => {
        PDFHandler.state.currentPage = 0;
        loader = new Loader({});
        loader.setState = jest.fn();

        originalSetInterval = global.setInterval;
        originalClearInterval = global.clearInterval;
        global.setInterval = jest.fn((_fn, _ms) => {
            return 123 as unknown as number;
        });
        global.clearInterval = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
        global.setInterval = originalSetInterval;
        global.clearInterval = originalClearInterval;
    });

    test('componentDidMount sets up interval', () => {
        loader.componentDidMount();
        expect(global.setInterval).toHaveBeenCalledTimes(1);

        const callback = (global.setInterval as jest.Mock).mock.calls[0][0];
        callback();
        expect(loader.setState).toHaveBeenCalledWith(
            expect.objectContaining({ time: expect.any(Number) })
        );
    });

    test('componentWillUnmount clears interval', () => {
        loader.componentDidMount();
        loader.componentWillUnmount();
        expect(global.clearInterval).toHaveBeenCalledWith(loader['interval']);
    });

    test('increments pass1Counter when isOnLoad is true', () => {

        PDFHandler.state.isOnLoad = true;
        loader.componentDidMount();

        const callback = (global.setInterval as jest.Mock).mock.calls[0][0];

        const initialCounter = loader['passCounter'];
        callback();

        expect(loader['passCounter']).toBe(initialCounter + 1);
        expect(loader.setState).toHaveBeenCalledWith(
            expect.objectContaining({ time: expect.any(Number) })
        );
    });
});
