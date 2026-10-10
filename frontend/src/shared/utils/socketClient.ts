type SocketCallback = (data: any) => void;

class DummySocketClient {
  private listeners: Record<string, SocketCallback[]> = {};

  emit(event: string, payload: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(payload));
    }
  }

  on(event: string, callback: SocketCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback?: SocketCallback) {
    if (!this.listeners[event]) return;
    if (callback) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    } else {
      delete this.listeners[event];
    }
  }

  disconnect() {
    this.listeners = {};
  }
}

export const socketClient = new DummySocketClient();
export default socketClient;
