import PreviewForm from './preview';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';

describe('PreviewForm', () => {

    it('should call handleInfoiconChange', () => {

        const el = document.createElement('div');
        jest.spyOn(document, 'getElementById').mockReturnValue(el);

        const props = {
            editorState: {} as unknown as EditorState,
            editorView: { dom: { parentElement: { parentElement: el } } } as unknown as EditorView,
            onClose() { return }
        };
        const Previewform = new PreviewForm(props)

        let event = { target: { checked: true } }
        let event_fal = { target: { checked: false } }

        Previewform.handleInfoiconChange(event_fal)

        expect(Previewform.handleTOCChange(event)).toBeUndefined();

        jest.spyOn(Previewform, 'getContainer').mockReturnValue({ cloneNode() { return { insertBefore() { return {} }, querySelectorAll() { return [{ appendChild() { return {} as unknown as Element } }] } } } } as unknown as HTMLElement)

        expect(Previewform.handleInfoiconChange(event)).toBeUndefined();
        expect(Previewform.handleTOCChange(event)).toBeUndefined();
        expect(Previewform.handleInfoiconChange(event_fal)).toBeUndefined();
    })



    it('should call handleTOCChange', () => {

        const el = document.createElement('div');
        jest.spyOn(document, 'getElementById').mockReturnValue(el);

        const props = {
            editorState: {} as unknown as EditorState,
            editorView: { dom: { parentElement: { parentElement: el } } } as unknown as EditorView,
            onClose() { return }
        };
        const Previewform = new PreviewForm(props)

        let event = { target: { checked: true } }
        let event_fal = { target: { checked: false } }

        expect(Previewform.handleTOCChange(event_fal)).toBeUndefined()

        expect(Previewform.handleTOCChange(event)).toBeUndefined();
        jest.spyOn(Previewform, 'getContainer').mockReturnValue({ cloneNode() { return { insertBefore() { return {} }, querySelectorAll() { return [{ appendChild() { return {} as unknown as Element } }] } } } } as unknown as HTMLElement)
        expect(Previewform.handleInfoiconChange(event)).toBeUndefined();

    })


    it('should call the function componentDidMount()',()=>{
        const el = document.createElement('div');
        jest.spyOn(document, 'getElementById').mockReturnValue(el);

        const props = {
            editorState: {} as unknown as EditorState,
            editorView: { dom: { parentElement: { parentElement: el } } } as unknown as EditorView,
            onClose() { return }
        };
        const Previewform = new PreviewForm(props)

        Previewform.tocActive();
        Previewform.InfoActive();
        Previewform.componentDidMount()
    })

    it('should call the function Tocdeactive() check the condition Option.includes(3)',()=>{
        const el = document.createElement('div');
        jest.spyOn(document, 'getElementById').mockReturnValue(el);

        const props = {
            editorState: {} as unknown as EditorState,
            editorView: { dom: { parentElement: { parentElement: el } } } as unknown as EditorView,
            onClose() { return }
        };
        const Previewform = new PreviewForm(props)

        Previewform.tocActive();
        Previewform.InfoActive();
        expect(Previewform.Tocdeactive()).toBeUndefined();
    })

    it('should call the function handleCancel()',()=>{
    
        const props = {
            editorState: {} as unknown as EditorState,
            editorView: { } as unknown as EditorView,
            onClose() { return 'close'}
        };
        const Previewform = new PreviewForm(props)
        expect(Previewform.handleCancel()).toBeUndefined();
    })

    xit('should call handleConfirm', () => {
            
        const mockPrintWindow = {
          document: {
            open: jest.fn(),
            write: jest.fn(),
            close: jest.fn(),
            querySelectorAll: jest.fn(),
            createElement: jest.fn(),
            appendChild: jest.fn(),
            removeChild: jest.fn(),
            documentElement:{firstChild: {},}
            
          },
        };
        //mockPrintWindow.document.documentElement.removeChild.mockImplementationOnce(() => null);
        const mockWindowOpen = jest.fn().mockReturnValue(mockPrintWindow);
        window.open = mockWindowOpen;
        document.getElementById = jest.fn().mockReturnValue({ 
          childNodes: [document.createElement('div')] 
        });
        jest.spyOn(document, 'createElement').mockReturnValue({
          appendChild: jest.fn(), removeChild: jest.fn()
        } as any);

        jest.spyOn(document, 'createElement').mockReturnValue({
           
          } as any);

          
    
        const props = {
            editorState: {} as unknown as EditorState,
            editorView: { } as unknown as EditorView,
            onClose() { return 'close'}
        };
        const Previewform = new PreviewForm(props)
        Previewform.handleConfirm()
      });
    xit('',()=>{
        const props = {
            editorState: {} as unknown as EditorState,
            editorView: { } as unknown as EditorView,
            onClose() { return 'close'}
        };
        const Previewform = new PreviewForm(props)
        Previewform.prepareCSSRules({head:{appendChild(){return ''}},createElement(){return {setAttribute(){},textContent:''}}})
    }) 
})



