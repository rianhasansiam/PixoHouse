"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

import GoogleIcon from "./icons/GoogleIcon";

export function SocialDivider() {
  return (
    <div className="my-1 flex items-center gap-3">
      <div className="h-px flex-1 bg-linear-to-r from-transparent via-violet-200 to-violet-200" />

      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
        or continue with
      </span>

      <div className="h-px flex-1 bg-linear-to-l from-transparent via-violet-200 to-violet-200" />
    </div>
  );
}

export function SocialButtons() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGoogle = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    // After a successful Google sign-in we land back on the home page. The
    // signIn callback in `auth.ts` upserts the user into our DB.
    void signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="grid grid-cols-1 gap-2.5">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={isRedirecting}
        aria-busy={isRedirecting}
        className="group flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        <span className="transition-transform duration-300 group-hover:scale-110">
          {isRedirecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
        </span>

        <span>{isRedirecting ? "Redirecting..." : "Continue with Google"}</span>
      </button>
    </div>
  );
}
