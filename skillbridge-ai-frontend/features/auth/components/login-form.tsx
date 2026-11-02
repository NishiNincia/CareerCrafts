"use client";

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Briefcase, HardHat, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { authService } from "@/services/auth.service";
import type { Role } from "@/types/common";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [role, setRole] = useState<Role>("worker");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      const response = await authService.login(values.email, values.password);
      login(response.user.role, response.user.name, response.token);
      const returnPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(returnPath || (response.user.role === "worker" ? "/worker/dashboard" : "/employer/dashboard"));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not sign in.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-solid w-full max-w-md rounded-2xl p-8"
    >
      <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to SkillBridge AI.</p>

      <div className="mt-6 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Choose account type">
        {(
          [
            { role: "worker" as Role, label: "I'm a Worker", icon: HardHat },
            { role: "employer" as Role, label: "I'm an Employer", icon: Briefcase },
          ]
        ).map((opt) => (
          <button
            key={opt.role}
            type="button"
            role="radio"
            aria-checked={role === opt.role}
            onClick={() => setRole(opt.role)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
              role === opt.role ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
            )}
          >
            <opt.icon className="h-5 w-5" />
            {opt.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in as {role === "worker" ? "Worker" : "Employer"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to SkillBridge?{" "}
        <a href="/register" className="font-medium text-primary hover:underline">
          Create an account
        </a>
      </p>
    </motion.div>
  );
}
