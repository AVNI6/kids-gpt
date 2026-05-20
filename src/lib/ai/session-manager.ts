// Singleton session manager for AbortController lifecycle

import { aiLogger } from "./logger";

class SessionManager {
  private activeController: AbortController | null = null;
  private requestId: string | null = null;

  /**
   * Register a new active request. Automatically aborts any previous request.
   * Returns the AbortSignal to pass to fetch().
   */
  registerRequest(id: string): AbortSignal {
    // Abort any existing request first
    if (this.activeController) {
      aiLogger.warn("SessionManager", "Aborting previous request", {
        previousId: this.requestId || "unknown",
        newId: id,
      });
      this.activeController.abort();
    }

    this.activeController = new AbortController();
    this.requestId = id;

    aiLogger.debug("SessionManager", `Registered request: ${id}`);
    return this.activeController.signal;
  }

  /**
   * Abort the currently active request (if any).
   */
  abortActiveRequest(): void {
    if (this.activeController) {
      aiLogger.info("SessionManager", "Aborting active request", {
        requestId: this.requestId,
      });
      this.activeController.abort();
      this.activeController = null;
      this.requestId = null;
    }
  }

  /**
   * Clear all pending state. Used on route change, logout, tab close.
   */
  clearAllPending(): void {
    this.abortActiveRequest();
    aiLogger.info("SessionManager", "Cleared all pending requests");
  }

  /**
   * Check if a request is currently active.
   */
  isRequestActive(): boolean {
    return this.activeController !== null && !this.activeController.signal.aborted;
  }

  /**
   * Complete a request (mark it as finished).
   */
  completeRequest(id: string): void {
    if (this.requestId === id) {
      this.activeController = null;
      this.requestId = null;
      aiLogger.debug("SessionManager", `Completed request: ${id}`);
    }
  }

  /**
   * Get current request ID.
   */
  getCurrentRequestId(): string | null {
    return this.requestId;
  }
}

// Singleton export — works on client side only
let sessionManagerInstance: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  return sessionManagerInstance;
}
