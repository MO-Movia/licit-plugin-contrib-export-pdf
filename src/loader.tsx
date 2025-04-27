
import * as React from 'react';

export class Loader extends React.PureComponent {
  render(): React.ReactElement {
    return (
      <div className="epdf-loader-fullscreen">
        <img
          className="epdf-loader-image"
          src="assets/images/modus-loading.gif"
          alt="Loading..."
        />
      </div>
    );
  }
}
