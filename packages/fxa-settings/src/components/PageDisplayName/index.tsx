/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { navigate, RouteComponentProps } from '@reach/router';
import { useAccount } from '../../models';
import { useForm } from 'react-hook-form';
import React, { useState } from 'react';
import FlowContainer from '../FlowContainer';
import InputText from '../InputText';
import firefox from '../../lib/firefox';
import { useAlertBar, useMutation } from '../../lib/hooks';
import { gql } from '@apollo/client';
import AlertBar from '../AlertBar';
import { HomePath } from '../../constants';
import { Localized } from '@fluent/react';

const validateDisplayName = (currentDisplayName: string) => (
  newDisplayName: string
) => newDisplayName !== currentDisplayName && newDisplayName.length <= 256;

export const UPDATE_DISPLAY_NAME_MUTATION = gql`
  mutation updateDisplayName($input: UpdateDisplayNameInput!) {
    updateDisplayName(input: $input) {
      clientMutationId
    }
  }
`;

export const PageDisplayName = (_: RouteComponentProps) => {
  const account = useAccount();
  const alertBar = useAlertBar();
  const [errorText, setErrorText] = useState<string>();
  const [displayName, setDisplayName] = useState<string>();
  const initialValue = account.displayName || '';
  const { register, handleSubmit, formState, trigger } = useForm<{
    displayName: string;
  }>({
    mode: 'onTouched',
    defaultValues: {
      displayName: initialValue,
    },
  });
  const isValidDisplayName = validateDisplayName(initialValue);

  const [updateDisplayName] = useMutation(UPDATE_DISPLAY_NAME_MUTATION, {
    onCompleted: () => {
      firefox.profileChanged(account.uid);
      navigate(HomePath, { replace: true });
    },
    onError(err) {
      if (err.graphQLErrors?.length) {
        setErrorText(err.message);
      } else {
        alertBar.error('There was a problem updating your display name.');
      }
    },
    update: (cache) => {
      cache.modify({
        id: cache.identify({ __typename: 'Account' }),
        fields: {
          displayName() {
            return displayName;
          },
        },
      });
    },
  });

  const onSubmit = ({ displayName }: { displayName: string }) => {
    setDisplayName(displayName);
    updateDisplayName({ variables: { input: { displayName } } });
  };

  return (
    <FlowContainer title="Display Name">
      {alertBar.visible && (
        <AlertBar onDismiss={alertBar.hide} type={alertBar.type}>
          <p data-testid="update-display-name-error">{alertBar.content}</p>
        </AlertBar>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="my-6">
          <Localized id="display-name-input" attrs={{ label: true }}>
            <InputText
              name="displayName"
              label="Enter display name"
              className="mb-2"
              data-testid="display-name-input"
              autoFocus
              onChange={() => trigger('displayName')}
              inputRef={register({
                validate: isValidDisplayName,
              })}
              {...{ errorText }}
            />
          </Localized>
        </div>
        <div className="flex justify-center mb-4 mx-auto max-w-64">
          <Localized id="cancel-display-name">
            <button
              type="button"
              data-testid="cancel-display-name"
              className="cta-neutral mx-2 flex-1"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
          </Localized>
          <Localized id="submit-display-name">
            <button
              type="submit"
              data-testid="submit-display-name"
              className="cta-primary mx-2 flex-1"
              disabled={!formState.isDirty || !formState.isValid}
            >
              Save
            </button>
          </Localized>
        </div>
      </form>
    </FlowContainer>
  );
};

export default PageDisplayName;
