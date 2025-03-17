import * as React from 'react';

export class Loader extends React.PureComponent<any, any> {
  render(): React.ReactElement<any> {
    return (
      <div className="epdf-loader-container">
        <div className="epdf-loader"></div>
        <span>Loading ....</span>
      </div>
    );
  }
}


