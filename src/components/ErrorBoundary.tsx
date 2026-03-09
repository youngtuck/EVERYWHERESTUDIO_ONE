import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background: "linear-gradient(180deg, #1c2c9e 0%, #111f88 100%)",
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 24, maxWidth: 400 }}>
            The app hit an error. Try refreshing the page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              background: "#fff",
              color: "#1e2da0",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Refresh page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
