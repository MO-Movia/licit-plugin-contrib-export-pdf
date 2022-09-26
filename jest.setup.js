// needed to mock this due to execute during loading
document.execCommand = document.execCommand || function execCommandMock() {};

HTMLCanvasElement.prototype.getContext = () => {
  // return whatever getContext has to return
};
