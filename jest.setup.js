// needed to mock this due to execute during loading
document.execCommand = document.execCommand || function execCommandMock() {};

global.structuredClone = (val) => {
  return JSON.parse(JSON.stringify(val));
};

HTMLCanvasElement.prototype.getContext = () => {
  // return whatever getContext has to return
};
