import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { api, hasOtpSession, setApiTokens, setOtpSession, getApiTokens } from "@/lib/api";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — KrishiSathi" },
      { name: "description", content: "किसान का डिजिटल साथी — Sign in with your mobile number." },
    ],
  }),
  component: AuthPage,
});

const LANGS = [
  { code: "hi", label: "हिंदी" },
  { code: "en", label: "English" },
  { code: "mr", label: "मराठी" },
];

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<"hi" | "en" | "mr">("hi");

  // Prevent redirect during render, only redirect in effect
  React.useEffect(() => {
    if ((!authLoading && user) || hasOtpSession()) {
      navigate({ to: "/" });
    }
  }, [authLoading, user, navigate]);

  async function handleSendOtp() {
    if (!phone.trim()) {
      toast.error("कृपया मोबाइल नंबर दर्ज करें");
      return;
    }
    setBusy(true);
    try {
      await api.auth.sendOtp(phone.trim());
      setOtpSent(true);
      toast.success("OTP भेजा गया! (Use 123456)");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "OTP भेजने में त्रुटि");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !otp.trim()) {
      toast.error("मोबाइल नंबर और OTP दर्ज करें");
      return;
    }
    setBusy(true);
    try {
      const data = await api.auth.verifyOtp(phone.trim(), otp.trim());
      if (!data || typeof data !== "object") throw new Error("Invalid response from server");
      if (!data.access_token || !data.refresh_token)
        throw new Error("Missing auth tokens from server");
      if (!data.user || !data.user.phone) throw new Error("Missing user information from server");
      setApiTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
      setOtpSession({ phone: data.user.phone, role: data.user.role });
      console.debug("Auth: setApiTokens and setOtpSession", getApiTokens(), localStorage.getItem('krishisathi_otp_session'));
      toast.success("✅ सफलतापूर्वक लॉगिन!");
      await refreshProfile();
      console.debug("Auth: refreshProfile returned, user in hook:", user);
      // Ensure we navigate to dashboard after profile refresh
      try {
        navigate({ to: "/" });
      } catch (e) {
        console.warn("Navigation after login failed:", e);
      }
      setOtp("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "OTP सत्यापन विफल");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left: Hero image with overlay */}
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/70 to-primary/20" />
        <div className="relative z-10 flex flex-col justify-between p-10 h-full w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-accent flex items-center justify-center text-2xl shadow-lg">
              🌾
            </div>
            <div>
              <div className="font-display font-bold text-white text-2xl leading-tight">
                KrishiSathi
              </div>
              <div className="text-white/80 text-sm">किसान का डिजिटल साथी</div>
            </div>
          </div>

          {/* Bottom quote */}
          <div className="text-white">
            <div className="text-4xl font-display font-bold leading-tight mb-4">
              "खेती को बनाएं
              <br />
              स्मार्ट और आसान"
            </div>
            <p className="text-white/80 text-lg mb-6">
              AI-powered crop advice, disease detection, and expert consultations — all in your language.
            </p>
            <div className="flex gap-3 flex-wrap">
              {["🌾 फसल सलाह", "🔬 रोग जाँच", "🏛️ सरकारी योजना"].map((f) => (
                <span
                  key={f}
                  className="bg-white/20 text-white text-sm px-3 py-1.5 rounded-full font-medium backdrop-blur-sm"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden bg-primary text-white px-5 py-8 text-center">
          <div className="text-5xl mb-3">🌾</div>
          <div className="font-display font-bold text-3xl text-white">KrishiSathi</div>
          <div className="text-white/80 mt-1">किसान का डिजिटल साथी</div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-sm">
            {/* Language toggle */}
            <div className="flex gap-2 mb-8 justify-center">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code as typeof lang)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                    lang === l.code
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-foreground border-border hover:border-primary"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <h1 className="font-display font-bold text-2xl text-foreground mb-1">
              {lang === "hi" ? "स्वागत है 🙏" : lang === "mr" ? "स्वागत आहे 🙏" : "Welcome 🙏"}
            </h1>
            <p className="text-muted-foreground text-base mb-8">
              {lang === "hi"
                ? "अपने मोबाइल नंबर से लॉगिन करें"
                : lang === "mr"
                  ? "मोबाईल नंबरने लॉगिन करा"
                  : "Sign in with your mobile number"}
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Phone input */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  📱{" "}
                  {lang === "hi" ? "मोबाइल नंबर" : lang === "mr" ? "मोबाईल नंबर" : "Mobile Number"}
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-white border-2 border-border rounded-lg text-sm font-bold text-foreground shrink-0">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    disabled={otpSent || busy}
                    maxLength={10}
                    className="flex-1 h-14 px-4 text-lg font-bold rounded-lg border-2 border-border bg-white focus:outline-none focus:border-primary transition-colors disabled:bg-muted disabled:opacity-60"
                  />
                </div>
              </div>

              {/* OTP input */}
              {otpSent && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-foreground mb-2">
                    🔐 {lang === "hi" ? "OTP दर्ज करें" : lang === "mr" ? "OTP टाका" : "Enter OTP"}
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    placeholder="• • • • • •"
                    className="w-full h-14 px-4 text-2xl font-bold text-center rounded-lg border-2 border-border bg-white focus:outline-none focus:border-primary tracking-[0.5em] transition-colors"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {lang === "hi" ? "OTP आपके मोबाइल पर भेजा गया है।" : "OTP sent to your mobile."}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-2 space-y-3">
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={busy || phone.trim().length < 10}
                    className="btn-saffron w-full flex items-center justify-center gap-3 text-lg"
                  >
                    {busy ? (
                      <span className="animate-spin text-2xl">⟳</span>
                    ) : (
                      <>
                        📲 {lang === "hi" ? "OTP भेजें" : lang === "mr" ? "OTP पाठवा" : "Send OTP"}
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      type="submit"
                      disabled={otp.trim().length < 6 || busy}
                      className="btn-primary-farm w-full flex items-center justify-center gap-3 text-lg"
                    >
                      {busy ? (
                        <span className="animate-spin text-2xl">⟳</span>
                      ) : (
                        <>
                          ✅{" "}
                          {lang === "hi"
                            ? "लॉगिन करें"
                            : lang === "mr"
                              ? "लॉगिन करा"
                              : "Verify & Login"}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                      }}
                      className="w-full text-sm text-primary font-bold hover:underline py-2"
                    >
                      ← {lang === "hi" ? "नंबर बदलें" : "Change number"}
                    </button>
                  </>
                )}
              </div>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-8">
              {lang === "hi"
                ? "लॉगिन करके आप KrishiSathi की शर्तों से सहमत हैं।"
                : "By signing in, you agree to KrishiSathi's Terms & Privacy Policy."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
