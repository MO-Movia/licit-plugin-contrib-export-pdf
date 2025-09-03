import * as React from 'react';
import {MyHandler} from './handlers';

export class Loader extends React.PureComponent {
  private interval: number;
  componentDidMount() {
    // trigger update of static values
    this.interval = setInterval(() => this.setState({time: Date.now()}), 1000);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }
  render(): React.ReactElement {
    return (
      <div className="epdf-loader-fullscreen">
        <img
          className="epdf-loader-image"
          src="assets/images/modus-loading.gif"
          alt="Loading..."
        />
        <span>Parsing section {MyHandler.state.currentPage}...</span>
      </div>
    );
  }
}
