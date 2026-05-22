import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI boundary caught a render error", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="overlay-screen game-over">
          <h1>Unexpected Error</h1>
          <p>The interface hit an unexpected problem. Reload to continue from your latest save.</p>
          <button className="btn btn-new-game" onClick={this.handleReload}>Reload</button>
        </div>
      );
    }

    return this.props.children;
  }
}
