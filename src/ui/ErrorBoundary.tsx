import { Component } from "react";
import type { ReactNode } from "react";
import { PrimaryButton, Sigil } from "./components";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="app-surround">
        <main className="phone-shell">
          <div className="empty-state">
            <Sigil size={50} />
            <h2 style={{ marginTop: 30 }}>A thread came loose.</h2>
            <p>
              Your saved profile and locked match remain on this device. Reload
              to reconnect.
            </p>
            <div style={{ marginTop: 30 }}>
              <PrimaryButton onClick={() => window.location.reload()}>
                Reconnect
              </PrimaryButton>
            </div>
          </div>
        </main>
      </div>
    ) : (
      this.props.children
    );
  }
}
