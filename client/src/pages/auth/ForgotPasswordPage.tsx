import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api, getApiErrorMessage } from "../../api/client.js";
import { Button } from "../../components/ui/Button.js";
import { Field, Input } from "../../components/ui/Field.js";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: { securityQuestion: string } }>(
        "/auth/forgot-password",
        { username }
      );
      setSecurityQuestion(res.data.data.securityQuestion);
      setStep(2);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Username lama helin."));
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        username,
        securityAnswer,
        newPassword,
        confirmPassword,
      });
      toast.success("Password-kaaga si guul leh ayaa loo beddelay. Fadlan soo gal.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Jawaabtu khalad ah."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white shadow-lg shadow-brand-600/20">
            R
          </div>
          <h1 className="mt-4 text-xl font-semibold text-ink-900">Password Illowday</h1>
          <p className="mt-1 text-sm text-gray-500">
            {step === 1 ? "Geli username-kaaga" : "Ka jawaab su'aasha sirta ah"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {step === 1 ? (
            <form onSubmit={handleStep1} className="flex flex-col gap-4">
              <Field label="Username" required>
                <Input autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
              </Field>
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Sii wad
              </Button>
            </form>
          ) : (
            <form onSubmit={handleStep2} className="flex flex-col gap-4">
              <Field label="Su'aasha sirta ah">
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-ink-900">{securityQuestion}</p>
              </Field>
              <Field label="Jawaab" required>
                <Input
                  autoFocus
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                />
              </Field>
              <Field label="Password Cusub" required hint="Ugu yaraan 8 xaraf, xuruuf + number">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Field>
              <Field label="Xaqiiji Password" required>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Field>
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Beddel Password
              </Button>
            </form>
          )}

          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-brand-600 hover:underline">
              Ku noqo Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
