"use client";

import { useCallback, useEffect, useState } from "react";
import { whatsappService } from "@/core/services/whatsapp.service";
import { GatewayError } from "@/core/gateway/response";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDateTime } from "@/core/utils/format";
import type { WhatsAppLinksList, WhatsAppPairingCode } from "@/types/platform";

type LoadState = "loading" | "ready" | "not-implemented" | "error";
type VerifyStep = "enter-phone" | "enter-code";

/**
 * wa.me click-to-chat deep link - used only by the fallback "message
 * us first" method below, for people who'd rather not wait on an OTP.
 */
function buildWhatsAppDeepLink(phoneNumber: string, text: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(text)}`;
}

export default function WhatsAppPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<WhatsAppLinksList | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  // Primary flow: type your number -> receive a code on WhatsApp -> confirm it.
  const [verifyStep, setVerifyStep] = useState<VerifyStep>("enter-phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);

  // Fallback flow: message Orbit's own number first.
  const [pairing, setPairing] = useState<WhatsAppPairingCode | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const load = useCallback(() => {
    setState("loading");
    whatsappService
      .list<WhatsAppLinksList>()
      .then((res) => {
        setData(res);
        setState("ready");
      })
      .catch((err) => {
        if (err instanceof GatewayError && err.status === 501) {
          setState("not-implemented");
        } else {
          setState("error");
          setErrorMessage(err instanceof Error ? err.message : "Unknown error");
        }
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSendCode() {
    setVerifyError(null);
    setVerifySubmitting(true);
    try {
      const res = await whatsappService.verifyStart(phoneInput);
      setCodeExpiresAt(res.expires_at);
      setVerifyStep("enter-code");
    } catch (err) {
      setVerifyError(
        err instanceof Error ? err.message : "Could not send a code to that number",
      );
    } finally {
      setVerifySubmitting(false);
    }
  }

  async function handleConfirmCode() {
    setVerifyError(null);
    setVerifySubmitting(true);
    try {
      await whatsappService.verifyConfirm(phoneInput, codeInput);
      setVerifyStep("enter-phone");
      setPhoneInput("");
      setCodeInput("");
      setCodeExpiresAt(null);
      load();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "That code didn't match");
    } finally {
      setVerifySubmitting(false);
    }
  }

  async function handleGeneratePairingCode() {
    setGenerating(true);
    setErrorMessage(null);
    try {
      const res = await whatsappService.createPairingCode<WhatsAppPairingCode>();
      setPairing(res);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not generate a pairing code");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDisconnect(id: string) {
    setActingId(id);
    try {
      await whatsappService.disconnect(id);
      setData((prev) =>
        prev ? { linked_numbers: prev.linked_numbers.filter((n) => n.id !== id) } : prev,
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not unlink this number");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-paper">WhatsApp</h1>
        <p className="mt-1 text-sm text-graphite-600">
          Ask Orbit about your business straight from WhatsApp - sales, cash flow, notifications,
          and forecasts, on demand.
        </p>
      </div>

      {state === "loading" && (
        <Card>
          <p className="text-sm text-graphite-600">Loading…</p>
        </Card>
      )}

      {state === "not-implemented" && (
        <Card>
          <p className="text-sm text-graphite-600">
            This capability isn&apos;t implemented in the Kernel yet - the pipeline is wired end
            to end and returns an honest &quot;not built yet&quot;, not an error.
          </p>
        </Card>
      )}

      {(state === "ready" || state === "error") && errorMessage && (
        <Card>
          <p role="alert" className="text-sm text-signal-red">
            {errorMessage}
          </p>
        </Card>
      )}

      {state === "ready" && (
        <>
          <Card>
            <p className="text-xs uppercase tracking-wide text-graphite-600">Connect a number</p>

            {verifyStep === "enter-phone" && (
              <>
                <p className="mt-2 text-sm text-graphite-300">
                  Enter your WhatsApp number, including country code. Orbit will send you a
                  one-time code to confirm it&apos;s yours.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="tel"
                    placeholder="+254712345678"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="sm:max-w-xs"
                  />
                  <Button
                    onClick={handleSendCode}
                    disabled={verifySubmitting || phoneInput.trim().length < 9}
                  >
                    {verifySubmitting ? "Sending…" : "Send verification code"}
                  </Button>
                </div>
              </>
            )}

            {verifyStep === "enter-code" && (
              <>
                <p className="mt-2 text-sm text-graphite-300">
                  We sent a code to <span className="font-mono">{phoneInput}</span> on WhatsApp.
                  Enter it below to finish connecting.
                  {codeExpiresAt ? (
                    <span className="block text-xs text-graphite-600">
                      Expires at {formatDateTime(codeExpiresAt)}
                    </span>
                  ) : null}
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    className="sm:max-w-[180px]"
                  />
                  <Button
                    onClick={handleConfirmCode}
                    disabled={verifySubmitting || codeInput.trim().length < 4}
                  >
                    {verifySubmitting ? "Verifying…" : "Verify and connect"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setVerifyStep("enter-phone");
                      setCodeInput("");
                    }}
                  >
                    Use a different number
                  </Button>
                </div>
                <button
                  type="button"
                  className="mt-3 text-xs text-graphite-600 underline"
                  onClick={handleSendCode}
                  disabled={verifySubmitting}
                >
                  Didn&apos;t get it? Resend code
                </button>
              </>
            )}

            {verifyError && (
              <p role="alert" className="mt-3 text-sm text-signal-red">
                {verifyError}
              </p>
            )}

            <button
              type="button"
              className="mt-5 text-xs text-graphite-600 underline"
              onClick={() => setShowFallback((v) => !v)}
            >
              {showFallback ? "Hide" : "Prefer to message us first instead?"}
            </button>

            {showFallback && (
              <div className="mt-4 border-t border-graphite-800 pt-4">
                <p className="text-sm text-graphite-300">
                  Generate a code, then send it as a WhatsApp message to the Orbit number to link
                  your account. Codes expire after 10 minutes.
                </p>

                {pairing ? (
                  <div className="mt-4 rounded-md border border-graphite-700 bg-graphite-950 p-4">
                    <p className="font-mono text-2xl tracking-[0.3em] text-signal-amber">
                      {pairing.code}
                    </p>
                    <p className="mt-2 text-sm text-graphite-300">
                      Send this code to{" "}
                      <span className="font-mono">{pairing.orbit_whatsapp_number}</span> on
                      WhatsApp.
                    </p>
                    <p className="mt-1 text-xs text-graphite-600">
                      Expires at {formatDateTime(pairing.expires_at)}
                    </p>
                    <a
                      href={buildWhatsAppDeepLink(pairing.orbit_whatsapp_number, pairing.code)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center rounded-md bg-[#25D366] px-4 py-2 text-sm font-medium text-black hover:opacity-90"
                    >
                      Open WhatsApp to link this number
                    </a>
                  </div>
                ) : null}

                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={handleGeneratePairingCode}
                  disabled={generating}
                >
                  {generating ? "Generating…" : pairing ? "Generate a new code" : "Generate code"}
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-wide text-graphite-600">Linked numbers</p>
            {data?.linked_numbers.length ? (
              <ul className="mt-4 flex flex-col gap-3">
                {data.linked_numbers.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-center justify-between rounded-md border border-graphite-700 p-3"
                  >
                    <div>
                      <p className="font-mono text-sm text-paper">{n.phone_number}</p>
                      <p className="text-xs text-graphite-600">
                        {n.user_email} · linked {formatDateTime(n.linked_at)}
                        {n.last_message_at ? ` · last active ${formatDateTime(n.last_message_at)}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => handleDisconnect(n.id)}
                      disabled={actingId === n.id}
                    >
                      {actingId === n.id ? "Unlinking…" : "Unlink"}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-graphite-600">
                No numbers linked yet - connect one above.
              </p>
            )}
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-wide text-graphite-600">What you can ask</p>
            <ul className="mt-3 flex flex-col gap-1 text-sm text-graphite-300">
              <li>&quot;sales today&quot; / &quot;dashboard&quot; - balance, 30-day flow, health, recent activity</li>
              <li>&quot;cash flow&quot; / &quot;balance&quot; / &quot;health&quot; - the same overview</li>
              <li>&quot;insights&quot; / &quot;anomalies&quot; - Orbit&apos;s latest flagged insights</li>
              <li>&quot;notifications&quot; / &quot;alerts&quot; - unread notifications</li>
              <li>&quot;forecast&quot; - projected balance</li>
              <li>&quot;report&quot; - recent generated reports</li>
              <li>&quot;use &lt;company name&gt;&quot; - switch which company you&apos;re asking about</li>
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
