"use client";

import { useAuth } from "@/components/AuthContext";
import { SectionTitle, RiskBadge } from "@/components/ui";
import { IconLock } from "@/components/icons";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Settings"
        subtitle="Account and security posture"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel panel-pad">
          <SectionTitle title="Your Account" />
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Username" value={user?.username ?? "—"} />
            <Field label="Role" value={user?.role ?? "—"} />
            <Field label="Email" value={user?.email ?? "—"} />
            <Field label="Session" value="Active (httpOnly JWT)" />
          </dl>
        </div>

        <div className="panel panel-pad">
          <SectionTitle title="How Detection Works" />
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
            <li>Each login is converted into a behavioural feature vector.</li>
            <li>
              An <strong className="text-slate-100">Isolation Forest</strong> scores
              how isolated the login is from the normal baseline.
            </li>
            <li>
              Rule-based heuristics check for new IPs, devices, unusual hours,
              repeated failures and geographic changes.
            </li>
            <li>
              The two signals are blended into a 0–100 risk score (
              <RiskBadge level="low" /> 0–30, <RiskBadge level="medium" /> 31–70,{" "}
              <RiskBadge level="high" /> 71–100).
            </li>
          </ol>
        </div>
      </div>

      <div className="panel panel-pad">
        <div className="mb-3 flex items-center gap-2">
          <IconLock className="text-sky-300" width={18} height={18} />
          <h3 className="text-sm font-semibold text-slate-100">
            Security Posture
          </h3>
        </div>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>• Passwords hashed with bcrypt (cost factor 12), never stored plaintext.</li>
          <li>• Sessions issued as signed JWTs in httpOnly, sameSite cookies.</li>
          <li>• Risk scores are computed server-side — never trusted from the client.</li>
          <li>• No real attacks, scans or external network calls are performed.</li>
        </ul>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-200">{value}</dd>
    </div>
  );
}
