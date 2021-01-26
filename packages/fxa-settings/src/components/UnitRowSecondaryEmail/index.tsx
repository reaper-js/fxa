/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { ReactNode, useState } from 'react';
import { gql } from '@apollo/client';
import { useNavigate } from '@reach/router';
import firefox from '../../lib/firefox';
import { useAlertBar, useMutation } from '../../lib/hooks';
import { useAccount, useLazyAccount, Email } from '../../models';
import UnitRow from '../UnitRow';
import AlertBar from '../AlertBar';
import ModalVerifySession from '../ModalVerifySession';
import { ButtonIconTrash, ButtonIconReload } from '../ButtonIcon';

export const RESEND_EMAIL_CODE_MUTATION = gql`
  mutation resendSecondaryEmailCode($input: EmailInput!) {
    resendSecondaryEmailCode(input: $input) {
      clientMutationId
    }
  }
`;

export const MAKE_EMAIL_PRIMARY_MUTATION = gql`
  mutation updatePrimaryEmail($input: EmailInput!) {
    updatePrimaryEmail(input: $input) {
      clientMutationId
    }
  }
`;

export const DELETE_EMAIL_MUTATION = gql`
  mutation deleteSecondaryEmail($input: EmailInput!) {
    deleteSecondaryEmail(input: $input) {
      clientMutationId
    }
  }
`;

type UnitRowSecondaryEmailContentAndActionsProps = {
  secondary: Email;
  isLastVerifiedSecondaryEmail: boolean;
};

export const UnitRowSecondaryEmail = () => {
  const account = useAccount();
  const navigate = useNavigate();
  const alertBar = useAlertBar();
  const [queuedAction, setQueuedAction] = useState<() => void>();
  const [email, setEmail] = useState<string>();

  const secondaryEmails = account.emails.filter((email) => !email.isPrimary);
  const hasAtLeastOneSecondaryEmail = !!secondaryEmails.length;
  const lastVerifiedSecondaryEmailIndex = secondaryEmails
    .map((email) => email.verified)
    .lastIndexOf(true);

  const [getAccount, { accountLoading }] = useLazyAccount(() => {
    alertBar.error(`Sorry, there was a problem refreshing that email.`);
  });

  const [resendEmailCode] = useMutation(RESEND_EMAIL_CODE_MUTATION, {
    onCompleted() {
      navigate('/beta/settings/emails/verify', { state: { email } });
    },
    onError(error) {
      alertBar.error(
        `Sorry, there was a problem re-sending the verification code.`
      );
    },
  });

  const [makeEmailPrimary, { loading: makeEmailPrimaryLoading }] = useMutation(
    MAKE_EMAIL_PRIMARY_MUTATION,
    {
      onCompleted() {
        firefox.profileChanged(account.uid);
        alertBar.success(`${email} is now your primary email.`);
      },
      onError(error) {
        alertBar.error(
          `Sorry, there was a problem changing your primary email.`
        );
      },
      update: (cache) => {
        cache.modify({
          id: cache.identify({ __typename: 'Account' }),
          fields: {
            emails(existingEmails) {
              return existingEmails.map((x: Email) => {
                const e = { ...x };
                if (e.email === email) {
                  e.isPrimary = true;
                } else if (e.isPrimary) {
                  e.isPrimary = false;
                }

                return e;
              });
            },
          },
        });
      },
    }
  );

  const [deleteEmail, { loading: deleteEmailLoading }] = useMutation(
    DELETE_EMAIL_MUTATION,
    {
      onCompleted() {
        alertBar.success(`${email} email successfully deleted.`);
      },
      onError(error) {
        alertBar.error(`Sorry, there was a problem deleting this email.`);
      },
      update: (cache) => {
        cache.modify({
          id: cache.identify({ __typename: 'Account' }),
          fields: {
            emails(existingEmails) {
              const emails = [...existingEmails];
              emails.splice(
                emails.findIndex((x) => x.email === email),
                1
              );
              return emails;
            },
          },
        });
      },
    }
  );

  const SecondaryEmailUtilities = ({ children }: { children: ReactNode }) => (
    <>
      {queuedAction && (
        <ModalVerifySession
          onDismiss={() => {
            setQueuedAction(undefined);
            alertBar.info(
              `You'll need to verify your current session to perform this action.`
            );
          }}
          onError={(error) => {
            setQueuedAction(undefined);
            alertBar.error(
              'Sorry, there was a problem verifying your session',
              error
            );
          }}
          onCompleted={queuedAction}
        />
      )}
      {alertBar.visible && alertBar.content && (
        <AlertBar onDismiss={alertBar.hide} type={alertBar.type}>
          <p data-testid={`alert-bar-message-${alertBar.type}`}>
            {alertBar.content}
          </p>
        </AlertBar>
      )}
      {children}
    </>
  );

  const UnitRowSecondaryEmailNotSet = () => {
    // user doesn't have a secondary email (verified or unverified) set
    return (
      <UnitRow
        header="Secondary email"
        prefixDataTestId="secondary-email"
        headerValue={null}
        route="/beta/settings/emails"
        {...{
          alertBarRevealed: alertBar.visible,
        }}
      >
        <SecondaryEmailDefaultContent />
      </UnitRow>
    );
  };

  const UnitRowSecondaryEmailContentAndActions = ({
    secondary: { email, verified },
    isLastVerifiedSecondaryEmail,
  }: UnitRowSecondaryEmailContentAndActionsProps) => {
    const queueEmailAction = (action: (...args: any[]) => void) => {
      setEmail(email);
      setQueuedAction(() => {
        return () => {
          setQueuedAction(undefined);
          action({
            variables: { input: { email } },
          });
        };
      });
    };

    return (
      <>
        <div className="mobileLandscape:flex unit-row-multi-row">
          <div
            className="unit-row-content"
            data-testid="secondary-email-unit-row-content"
          >
            <p
              className="font-bold break-all"
              data-testid="secondary-email-unit-row-header-value"
            >
              <span className="flex justify-between items-center">
                {email}
                <span>
                  <ButtonIconTrash
                    title="Remove email"
                    classNames="mobileLandscape:hidden ltr:ml-1 rtl:mr-1"
                    disabled={deleteEmailLoading}
                    onClick={() => {
                      queueEmailAction(deleteEmail);
                    }}
                  />
                  {!verified && (
                    <ButtonIconReload
                      title="Refresh email"
                      classNames="mobileLandscape:hidden ltr:ml-1 rtl:mr-1"
                      disabled={accountLoading}
                      onClick={getAccount}
                    />
                  )}
                </span>
              </span>
              {!verified && (
                <span
                  data-testid="secondary-email-unverified-text"
                  className="uppercase block text-orange-600 font-bold text-xs"
                >
                  unverified
                </span>
              )}
            </p>
            {!verified && (
              <p className="text-xs mt-3 text-grey-400">
                Verification needed.
                <button
                  className="link-blue mx-1"
                  data-testid="secondary-email-resend-code-button"
                  onClick={() => {
                    setEmail(email);
                    resendEmailCode({
                      variables: { input: { email } },
                    });
                  }}
                >
                  Resend verification code
                </button>
                if it's not in your email or spam.
              </p>
            )}
          </div>
          <div
            className="unit-row-actions"
            data-testid="secondary-email-unit-row-actions"
          >
            <div className="flex items-center -mt-1">
              {verified && (
                <button
                  disabled={makeEmailPrimaryLoading}
                  className="cta-neutral cta-base disabled:cursor-wait whitespace-no-wrap"
                  onClick={() => {
                    queueEmailAction(makeEmailPrimary);
                  }}
                  data-testid="secondary-email-make-primary"
                >
                  Make primary
                </button>
              )}
              <ButtonIconTrash
                title="Remove email"
                classNames="hidden mobileLandscape:inline-block ltr:ml-1 rtl:mr-1"
                disabled={deleteEmailLoading}
                testId="secondary-email-delete"
                onClick={() => {
                  queueEmailAction(deleteEmail);
                }}
              />
              {!verified && (
                <ButtonIconReload
                  title="Refresh email"
                  classNames="hidden mobileLandscape:inline-block ltr:ml-1 rtl:mr-1"
                  testId="secondary-email-refresh"
                  disabled={accountLoading}
                  onClick={getAccount}
                />
              )}
            </div>
          </div>
        </div>
        {verified && isLastVerifiedSecondaryEmail && (
          <SecondaryEmailDefaultContent />
        )}
      </>
    );
  };

  if (!hasAtLeastOneSecondaryEmail) {
    return (
      <SecondaryEmailUtilities>
        <UnitRowSecondaryEmailNotSet />
      </SecondaryEmailUtilities>
    );
  }

  // user has at least one secondary email (verified or unverified) set
  return (
    <SecondaryEmailUtilities>
      <div className="unit-row">
        <div className="unit-row-header">
          <h3 data-testid="secondary-email-unit-row-header">Secondary email</h3>
        </div>
        <div className="mobileLandscape:flex-3 desktop:flex-5">
          {secondaryEmails.map((secondary, index) => (
            <UnitRowSecondaryEmailContentAndActions
              key={secondary.email}
              isLastVerifiedSecondaryEmail={
                index === lastVerifiedSecondaryEmailIndex
              }
              {...{
                secondary,
              }}
            />
          ))}
        </div>
      </div>
    </SecondaryEmailUtilities>
  );
};

const SecondaryEmailDefaultContent = () => (
  <div data-testid="secondary-email-default-content">
    <p className="text-sm mt-3">
      Access your account if you can't log in to your primary email.
    </p>
    <p className="text-grey-400 text-xs my-2">
      Note: a secondary email won't restore your information—you'll need a{' '}
      <a
        className="link-blue"
        href="#recovery-key"
        data-testid="secondary-email-link-recovery-key"
      >
        recovery key
      </a>{' '}
      for that.
    </p>
  </div>
);

export default UnitRowSecondaryEmail;
