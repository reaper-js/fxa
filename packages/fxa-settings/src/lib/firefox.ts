export interface FirefoxMessage {
  id: string;
  message?: {
    command: string;
    data: Record<string, any> & {
      error?: {
        message: string;
        stack: string;
      };
    };
    messageId: string;
    error?: string;
  };
}

type FirefoxEvent = CustomEvent<FirefoxMessage | string>;

export class Firefox extends EventTarget {
  private broadcastChannel?: BroadcastChannel;
  readonly id: string;
  constructor() {
    super();
    this.id = 'account_updates';
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('firefox_accounts');
      this.broadcastChannel.addEventListener('message', (event) =>
        this.handleBroadcastEvent(event)
      );
    }
    window.addEventListener('WebChannelMessageToContent', (event) =>
      this.handleFirefoxEvent(event as FirefoxEvent)
    );
  }

  private handleBroadcastEvent(event: MessageEvent) {
    console.debug('broadcast', event);
    const envelope = JSON.parse(event.data);
    this.dispatchEvent(
      new CustomEvent(envelope.name, { detail: envelope.data })
    );
  }

  private handleFirefoxEvent(event: FirefoxEvent) {
    console.debug('webchannel', event);
    try {
      const detail =
        typeof event.detail === 'string'
          ? (JSON.parse(event.detail) as FirefoxMessage)
          : event.detail;
      if (detail.id !== this.id) {
        return;
      }
      const message = detail.message;
      if (message) {
        if (message.error || message.data.error) {
          const error = {
            message: message.error || message.data.error?.message,
            stack: message.data.error?.stack,
          };
          this.dispatchEvent(new CustomEvent('fxError', { detail: error }));
        } else {
          this.dispatchEvent(
            new CustomEvent(message.command, { detail: message.data })
          );
        }
      }
    } catch (e) {
      // TODO: log and ignore
    }
  }

  private formatEventDetail(
    command: string,
    data: any,
    messageId: string = ''
  ) {
    const detail = {
      id: this.id,
      message: {
        command,
        data,
        messageId,
      },
    };

    // Firefox Desktop and Fennec >= 50 expect the detail to be
    // sent as a string.
    // See https://bugzilla.mozilla.org/show_bug.cgi?id=1275616 and
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1238128
    return JSON.stringify(detail);
  }

  // send a message to the browser chrome
  send(command: string, data: any, messageId?: string) {
    window.dispatchEvent(
      new CustomEvent('WebChannelMessageToChrome', {
        detail: this.formatEventDetail(command, data, messageId),
      })
    );
  }

  // broadcast a message to other tabs
  broadcast(name: string, data: any) {
    this.broadcastChannel?.postMessage(JSON.stringify({ name, data }));
  }

  passwordChanged(
    email: string,
    uid: hexstring,
    sessionToken: hexstring,
    verified: boolean,
    keyFetchToken?: hexstring,
    unwrapBKey?: hexstring
  ) {
    this.send('fxaccounts:change_password', {
      email,
      uid,
      sessionToken,
      verified,
      keyFetchToken,
      unwrapBKey,
    });
    this.broadcast('fxaccounts:change_password', {
      uid,
    });
  }

  profileChanged(uid: hexstring) {
    this.send('profile:change', { uid });
    this.broadcast('profile:change', { uid });
  }
}

export default new Firefox();
