/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import AuthClient from 'fxa-auth-client/browser';
import {
  AuthContext,
  createAuthClient,
  useAccountDestroyer,
  useAuth,
  usePasswordChanger,
  useRecoveryKeyMaker,
} from './auth';

jest.mock('fxa-auth-client/browser', () => ({
  ...jest.requireActual('fxa-auth-client/browser'),
  __esModule: true,
  generateRecoveryKey: jest.fn().mockImplementation(() => Promise.resolve({})),
}));

describe('useAuth', () => {
  const client = createAuthClient('none');

  afterEach(() => {
    cleanup();
  });

  it('throws when the context is not set', () => {
    function App() {
      expect(() => useAuth()).toThrow(
        'Are you forgetting an AuthContext.Provider?'
      );
      return null;
    }

    render(<App />);
  });

  it('returns the auth-client', () => {
    function App() {
      expect(useAuth()).toEqual(client);
      return null;
    }

    render(
      <AuthContext.Provider value={{ auth: client }}>
        <App />
      </AuthContext.Provider>
    );
  });
});

describe('usePasswordChanger', () => {
  afterEach(() => {
    cleanup();
  });

  it('calls onSuccess when successful', async () => {
    const response = {
      uid: 'abcd',
      authAt: 1,
      verifified: true,
      sessionToken: 'happySessionToken',
    };
    const client = ({
      passwordChange: jest
        .fn()
        .mockImplementation(() => Promise.resolve(response)),
    } as any) as AuthClient;
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={{ auth: client }}>
        {children}
      </AuthContext.Provider>
    );
    const { result, waitForNextUpdate } = renderHook(
      () =>
        usePasswordChanger({
          onSuccess,
          onError,
        }),
      { wrapper }
    );
    act(() => {
      result.current.execute(
        'email',
        'oldPassword',
        'newPassword',
        'sessionToken'
      );
    });
    await waitForNextUpdate();
    expect(client.passwordChange).toBeCalledWith(
      'email',
      'oldPassword',
      'newPassword',
      { keys: true, sessionToken: 'sessionToken' }
    );
    // expect.anything() is the PromiseCallbackOptions of react-async-hook
    expect(onSuccess).toBeCalledWith(response, expect.anything());
    expect(onError).not.toBeCalled();
  });

  it('calls onError on failure', async () => {
    const error = { errno: 103 };
    const client = ({
      passwordChange: jest.fn().mockImplementation(() => Promise.reject(error)),
    } as any) as AuthClient;
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={{ auth: client }}>
        {children}
      </AuthContext.Provider>
    );
    const { result, waitForNextUpdate } = renderHook(
      () =>
        usePasswordChanger({
          onSuccess,
          onError,
        }),
      { wrapper }
    );
    act(() => {
      result.current.execute(
        'email',
        'oldPassword',
        'newPassword',
        'sessionToken'
      );
    });
    await waitForNextUpdate();

    // expect.anything() is the PromiseCallbackOptions of react-async-hook
    expect(onError).toBeCalledWith(error, expect.anything());
    expect(onSuccess).not.toBeCalled();
  });
});

describe('useAccountDestroyer', () => {
  afterEach(() => {
    cleanup();
  });

  it('calls onSuccess when successful', async () => {
    const response = {
      email: 'abcd',
      authAt: 1,
      verifified: true,
      sessionToken: 'happySessionToken',
    };
    const client = ({
      accountDestroy: jest
        .fn()
        .mockImplementation(() => Promise.resolve(response)),
    } as any) as AuthClient;
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={{ auth: client }}>
        {children}
      </AuthContext.Provider>
    );
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useAccountDestroyer({
          onSuccess,
          onError,
        }),
      { wrapper }
    );
    act(() => {
      result.current.execute('email', 'password', 'sessionToken');
    });
    await waitForNextUpdate();
    expect(client.accountDestroy).toBeCalledWith(
      'email',
      'password',
      {},
      'sessionToken'
    );
    // expect.anything() is the PromiseCallbackOptions of react-async-hook
    expect(onSuccess).toBeCalledWith(response, expect.anything());
    expect(onError).not.toBeCalled();
  });

  it('calls onError on failure', async () => {
    const error = { errno: 103 };
    const client = ({
      passwordChange: jest.fn().mockImplementation(() => Promise.reject(error)),
    } as any) as AuthClient;
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={{ auth: client }}>
        {children}
      </AuthContext.Provider>
    );
    const { result, waitForNextUpdate } = renderHook(
      () =>
        usePasswordChanger({
          onSuccess,
          onError,
        }),
      { wrapper }
    );
    act(() => {
      result.current.execute(
        'email',
        'oldPassword',
        'newPassword',
        'sessionToken'
      );
    });
    await waitForNextUpdate();

    // expect.anything() is the PromiseCallbackOptions of react-async-hook
    expect(onError).toBeCalledWith(error, expect.anything());
    expect(onSuccess).not.toBeCalled();
  });
});

describe('useRecoveryKeyMaker', () => {
  afterEach(() => {
    cleanup();
  });

  it('calls onSuccess when successful', async () => {
    const client = ({
      sessionReauth: jest.fn().mockImplementation(() => Promise.resolve({})),
      accountKeys: jest.fn().mockImplementation(() => Promise.resolve({})),
      createRecoveryKey: jest
        .fn()
        .mockImplementation(() => Promise.resolve({})),
    } as any) as AuthClient;
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={{ auth: client }}>
        {children}
      </AuthContext.Provider>
    );
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useRecoveryKeyMaker({
          onSuccess,
          onError,
        }),
      { wrapper }
    );
    act(() => {
      result.current.execute(
        'email',
        'password',
        '0123456789abcdef',
        'sessionToken'
      );
    });
    await waitForNextUpdate();
    expect(client.sessionReauth).toBeCalledWith(
      'sessionToken',
      'email',
      'password',
      {
        keys: true,
        reason: 'recovery_key',
      }
    );
    expect(client.accountKeys).toBeCalled();
    expect(client.createRecoveryKey).toBeCalled();
    expect(onSuccess).toBeCalled();
    expect(onError).not.toBeCalled();
  });

  it('calls onError on failure', async () => {
    const error = { errno: 103 };
    const client = ({
      sessionReauth: jest.fn().mockImplementation(() => Promise.reject(error)),
    } as any) as AuthClient;
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={{ auth: client }}>
        {children}
      </AuthContext.Provider>
    );
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useRecoveryKeyMaker({
          onSuccess,
          onError,
        }),
      { wrapper }
    );
    act(() => {
      result.current.execute(
        'email',
        'password',
        '0123456789abcdef',
        'sessionToken'
      );
    });
    await waitForNextUpdate();
    expect(client.sessionReauth).toBeCalledWith(
      'sessionToken',
      'email',
      'password',
      {
        keys: true,
        reason: 'recovery_key',
      }
    );
    expect(onSuccess).not.toBeCalled();
    // expect.anything() is the PromiseCallbackOptions of react-async-hook
    expect(onError).toBeCalledWith(error, expect.anything());
    expect(onError).toBeCalled();
  });
});
