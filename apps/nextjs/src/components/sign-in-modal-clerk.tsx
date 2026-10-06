"use client";

import React, { useState } from "react";
import { OAuthStrategy } from "@clerk/types";
import { useSignIn } from "@clerk/nextjs";

import { Button } from "@saasfly/ui/button";
import * as Icons from "@saasfly/ui/icons";

import { Modal } from "~/components/modal";
import { useSigninModal } from "~/hooks/use-signin-modal";

export const SignInClerkModal = ({ dict }: { dict: Record<string, string> }) => {
  const signInModal = useSigninModal();
  const [signInClicked, setSignInClicked] = useState(false);
  const { signIn } = useSignIn();

  if (!signIn) {
    return null
  }

  const signInWith = (strategy: OAuthStrategy) => {
    const protocol = window.location.protocol
    const host = window.location.host
    return signIn
      .authenticateWithRedirect({
        strategy,
        redirectUrl: '/sign-in/sso-callback',
        redirectUrlComplete: `${protocol}//${host}/dashboard`,
      })
      .then((res) => {
        console.log(res)
      })
      .catch((err: unknown) => {
        // See https://clerk.com/docs/custom-flows/error-handling
        // for more info on error handling
        console.error(err);
      })
  }

  return (
    <Modal showModal={signInModal.isOpen} setShowModal={signInModal.onClose}>
      <div className="w-full">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-neutral-200 dark:border-neutral-800 bg-background px-4 py-6 pt-8 text-center md:px-16">
          <div className="flex items-center gap-2">
            <span className="font-black text-3xl tracking-tight text-foreground">Koment</span>
          </div>
          <h3 className="font-urban text-2xl font-bold">{dict.signup}</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">{dict.privacy}</p>
        </div>

        <div className="flex flex-col space-y-4 px-4 py-8 md:px-16">
          <Button
            variant="default"
            disabled={signInClicked}
            onClick={() => {
              setSignInClicked(true);
              void signInWith('oauth_github')
                .then(() => {
                  setTimeout(() => {
                    signInModal.onClose();
                  }, 1000)
                })
            }}
          >
            {signInClicked ? (
              <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.GitHub className="mr-2 h-4 w-4" />
            )}{" "}
            {dict.signup_github}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
