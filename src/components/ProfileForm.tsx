"use client";

import { useId } from "react";
import { Building2, Users } from "lucide-react";
import {
  COMMUNITY_SCALE_OPTIONS,
  COMMUTE_OPTIONS,
  COOKING_FUEL_OPTIONS,
  HOME_TYPE_OPTIONS,
  HOUSEHOLD_SIZE_OPTIONS,
  VENTILATION_OPTIONS,
  VULNERABLE_OPTIONS,
} from "@/lib/profile-options";
import {
  CommuteTypeSchema,
  CookingFuelSchema,
  HomeTypeSchema,
  VentilationTypeSchema,
  type HouseholdProfile,
  type VulnerableGroup,
} from "@/types";

interface ProfileFormProps {
  profile: HouseholdProfile;
  onChange: (next: HouseholdProfile) => void;
}

export function ProfileForm({ profile, onChange }: ProfileFormProps) {
  const baseId = useId();

  function toggleVulnerable(group: VulnerableGroup) {
    const exists = profile.vulnerableGroups.includes(group);
    const next = exists
      ? profile.vulnerableGroups.filter((g) => g !== group)
      : [...profile.vulnerableGroups, group];
    onChange({ ...profile, vulnerableGroups: next });
  }

  return (
    <section
      aria-labelledby={`${baseId}-heading`}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 id={`${baseId}-heading`} className="text-lg font-bold text-slate-900">
          Household &amp; Community Profile
        </h2>
        <p className="mt-1 text-xs text-slate-700">
          Tailors your GenAI routines, indoor hacks, and impact scaling. Saved locally in your
          browser.
        </p>
      </div>

      <div>
        <span className="block text-xs font-semibold tracking-wide text-slate-700 uppercase">
          Planning Mode
        </span>
        <div className="mt-1.5 grid grid-cols-2 gap-2" role="group" aria-label="Planning mode">
          <button
            type="button"
            onClick={() => onChange({ ...profile, mode: "family" })}
            aria-pressed={profile.mode === "family"}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 ${
              profile.mode === "family"
                ? "border-sky-800 bg-sky-800 text-white"
                : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
            }`}
          >
            <Users aria-hidden="true" className="h-4 w-4" />
            <span>Family Mode</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...profile, mode: "community" })}
            aria-pressed={profile.mode === "community"}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 ${
              profile.mode === "community"
                ? "border-sky-800 bg-sky-800 text-white"
                : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
            }`}
          >
            <Building2 aria-hidden="true" className="h-4 w-4" />
            <span>Community Mode</span>
          </button>
        </div>
      </div>

      {profile.mode === "family" ? (
        <div>
          <label
            htmlFor={`${baseId}-household-size`}
            className="block text-xs font-semibold text-slate-800"
          >
            Household Size (Members)
          </label>
          <select
            id={`${baseId}-household-size`}
            value={profile.householdSize}
            onChange={(e) => onChange({ ...profile, householdSize: Number(e.target.value) })}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            {HOUSEHOLD_SIZE_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "member" : "members"}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label
            htmlFor={`${baseId}-community-size`}
            className="block text-xs font-semibold text-slate-800"
          >
            Community Scale (Households)
          </label>
          <select
            id={`${baseId}-community-size`}
            value={profile.communityHouseholds}
            onChange={(e) => onChange({ ...profile, communityHouseholds: Number(e.target.value) })}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            {COMMUNITY_SCALE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
          Vulnerable Members
        </legend>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {VULNERABLE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={profile.vulnerableGroups.includes(opt.value)}
                onChange={() => toggleVulnerable(opt.value)}
                className="h-4 w-4 rounded border-slate-300 text-sky-700 focus-visible:ring-sky-700"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${baseId}-commute`}
            className="block text-xs font-semibold text-slate-800"
          >
            Daily Commute
          </label>
          <select
            id={`${baseId}-commute`}
            value={profile.commute}
            onChange={(e) => {
              const parsed = CommuteTypeSchema.safeParse(e.target.value);
              if (parsed.success) {
                onChange({ ...profile, commute: parsed.data });
              }
            }}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            {COMMUTE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`${baseId}-cooking`}
            className="block text-xs font-semibold text-slate-800"
          >
            Cooking Fuel
          </label>
          <select
            id={`${baseId}-cooking`}
            value={profile.cookingFuel}
            onChange={(e) => {
              const parsed = CookingFuelSchema.safeParse(e.target.value);
              if (parsed.success) {
                onChange({ ...profile, cookingFuel: parsed.data });
              }
            }}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            {COOKING_FUEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${baseId}-home`} className="block text-xs font-semibold text-slate-800">
            Home Type
          </label>
          <select
            id={`${baseId}-home`}
            value={profile.homeType}
            onChange={(e) => {
              const parsed = HomeTypeSchema.safeParse(e.target.value);
              if (parsed.success) {
                onChange({ ...profile, homeType: parsed.data });
              }
            }}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            {HOME_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${baseId}-vent`} className="block text-xs font-semibold text-slate-800">
            Home Ventilation
          </label>
          <select
            id={`${baseId}-vent`}
            value={profile.ventilation}
            onChange={(e) => {
              const parsed = VentilationTypeSchema.safeParse(e.target.value);
              if (parsed.success) {
                onChange({ ...profile, ventilation: parsed.data });
              }
            }}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            {VENTILATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900">
        <input
          type="checkbox"
          checked={profile.hasHepaPurifier}
          onChange={(e) => onChange({ ...profile, hasHepaPurifier: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-sky-700 focus-visible:ring-sky-700"
        />
        <span>We currently have a HEPA air purifier at home</span>
      </label>
    </section>
  );
}
