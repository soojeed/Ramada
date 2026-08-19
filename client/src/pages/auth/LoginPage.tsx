import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext.js";
import { getApiErrorMessage } from "../../api/client.js";
import { Button } from "../../components/ui/Button.js";
import { Field, Input } from "../../components/ui/Field.js";

const schema = z.object({
  username: z.string().min(1, "Username waa lagama maarmaan."),
  password: z.string().min(1, "Password waa lagama maarmaan."),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await login(values.username, values.password);
      toast.success("Ku soo dhawoow!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Username ama password khalad ah."));
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
          <h1 className="mt-4 text-xl font-semibold text-ink-900">Ramada Hotel System</h1>
          <p className="mt-1 text-sm text-gray-500">Fadlan geli akoonkaaga si aad u sii wadato</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Field label="Username" required error={errors.username?.message}>
              <Input autoFocus placeholder="tusaale: admin" {...register("username")} />
            </Field>
            <Field label="Password" required error={errors.password?.message}>
              <Input type="password" placeholder="••••••••" {...register("password")} />
            </Field>

            <Button type="submit" loading={loading} className="mt-2 w-full" size="lg">
              Soo gal
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline">
              Ma illowday password-kaaga?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
