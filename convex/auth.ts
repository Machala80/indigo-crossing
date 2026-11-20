import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { ConvexError } from "convex/values";
import { sendBrevo, emailHtml } from "./brevo";

// Password reset: we email an 8-digit code through Brevo.
const ResetCode = Email({
  id: "brevo-reset",
  maxAge: 60 * 20,
  async generateVerificationToken() {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return String(a[0] % 100000000).padStart(8, "0");
  },
  async sendVerificationRequest({ identifier: email, token }) {
    await sendBrevo({
      to: email,
      subject: "Your reset code for The Crossing",
      text: `Your code to reset your password for The Crossing is ${token}. It works for 20 minutes. If you didn't ask for this, you can ignore this email.`,
      html: emailHtml("Reset your password", [
        "Here is your code to reset your password for The Crossing:",
        token,
        "It works for 20 minutes. If you didn't ask for this, you can ignore this email.",
      ]),
    });
  },
});

// Email confirmation: one 8-digit code the first time someone signs up or signs in.
const VerifyCode = Email({
  id: "brevo-verify",
  maxAge: 60 * 30,
  async generateVerificationToken() {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return String(a[0] % 100000000).padStart(8, "0");
  },
  async sendVerificationRequest({ identifier: email, token }) {
    await sendBrevo({
      to: email,
      subject: "Confirm your email for The Crossing",
      text: `Your code to confirm your email for The Crossing is ${token}. It works for 30 minutes. If you didn't try to sign up, you can ignore this email.`,
      html: emailHtml("Confirm your email", [
        "Here is your code to confirm your email for The Crossing:",
        token,
        "It works for 30 minutes. If you didn't try to sign up, you can ignore this email.",
      ]),
    });
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      reset: ResetCode,
      verify: VerifyCode,
      profile(params) {
        const email = String(params.email ?? "").trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          throw new ConvexError("Enter a full email address, like name@example.com.");
        }
        const out: Record<string, string> & { email: string } = { email };
        if (typeof params.name === "string" && params.name.trim()) out.name = params.name.trim().slice(0, 80);
        return out;
      },
      validatePasswordRequirements(password: string) {
        if (!password || password.length < 8) {
          throw new ConvexError("Use a password of at least 8 characters.");
        }
      },
    }),
  ],
});
