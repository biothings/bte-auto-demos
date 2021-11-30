import path from "path";
import fs from "fs";
import axios from "axios";

class CallbackHandler {
  constructor() {
    this._awaitedCallbacks = {};
  }

  async receiveCallback(key, body) {
    if (this._awaitedCallbacks[key]) {
      this._awaitedCallbacks[key](body);
    }
  }

  async timeoutCallback(key) {
    this.receiveCallback(key, {
      error: "Request timed out from demotests side",
    });
  }

  async waitForCallback(key, startTime) {
    return new Promise((resolve, reject) => {
      this._awaitedCallbacks[key] = (body) => {
        resolve({
          responseTime: (new Date() - startTime) / 1000,
          response: body,
        });
      };
    });
  }
}

export default new CallbackHandler();
