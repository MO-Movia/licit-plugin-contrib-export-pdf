import * as React from 'react';
import './ui/loader.css';

export class Loader extends React.PureComponent<any, any> {
  render(): React.ReactElement<any> {
    return (
      <div className="loader-container">
        <div className="loader"></div>
        <span>Loading ....</span>
      </div>
    );
  }
}


