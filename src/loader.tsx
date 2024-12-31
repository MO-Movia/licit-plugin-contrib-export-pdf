import * as React from 'react';

export class Loader extends React.PureComponent<any, any> {
  render(): React.ReactNode {
    return (
      <div className="epdf-loader-container">
        <div className="epdf-loader"></div>
        <span>Loading ....</span>
      </div>
    );
  }
}


