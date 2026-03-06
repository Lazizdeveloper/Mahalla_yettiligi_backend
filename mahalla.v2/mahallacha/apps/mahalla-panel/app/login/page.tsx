"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  isTwoFactorChallengeResponse,
  panelAllowsRole,
  requestLoginOtp,
  setSession,
  verifyLoginOtp,
  verifyTwoFactor
} from "@mmbp/shared";

export default function MahallaLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!phone.trim()) {
      setError("Telefon raqamni kiriting.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!otp.trim()) {
        const otpResponse = await requestLoginOtp("mahalla", phone);
        if (otpResponse.otpCode) {
          setMessage(`OTP yuborildi. Test kod: ${otpResponse.otpCode}`);
        } else {
          setMessage("OTP yuborildi. SMS dagi kodni kiriting.");
        }
        return;
      }

      const verifyResponse = await verifyLoginOtp("mahalla", phone, otp);

      const tokens = isTwoFactorChallengeResponse(verifyResponse)
        ? await (async () => {
            const twoFaInput = window.prompt(
              "2FA kodini kiriting",
              verifyResponse.twoFactorCode ?? ""
            );

            if (!twoFaInput || !twoFaInput.trim()) {
              throw new ApiError("2FA kodi kiritilmadi.", 400, null);
            }

            return verifyTwoFactor(verifyResponse.pendingTwoFactorToken, twoFaInput);
          })()
        : verifyResponse;

      if (!panelAllowsRole("mahalla", tokens.user.role)) {
        throw new ApiError("Bu akkaunt Mahalla paneliga kira olmaydi.", 403, null);
      }

      setSession({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: tokens.user,
        panel: "mahalla"
      });

      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Login amalga oshmadi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-semibold text-center">Mahalla - Kirish</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium">Telefon raqam</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full rounded border px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">SMS OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full rounded border px-3 py-2 text-sm tracking-widest"
            />
          </div>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
          >
            {isSubmitting ? "Kutilmoqda..." : "Kirish"}
          </button>
        </form>
      </div>
    </main>
  );
}
