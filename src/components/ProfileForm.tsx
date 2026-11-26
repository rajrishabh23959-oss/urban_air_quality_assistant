"use client";

import { useId } from "react";
import { Building2, Users } from "lucide-react";
import type {
  CommuteType,
  CookingFuel,
  HomeType,
  HouseholdProfile,
  VentilationType,
  VulnerableGroup,
} from "@/types";

interface ProfileFormProps {
  profile: HouseholdProfile;
  onChange: (next: HouseholdProfile) => void;
}

const VULNERABLE_OPTIONS: { value: VulnerableGroup; label: string }[] = [
  { value: "infants", label: "Infants / Children" },
  { value: "elderly", label: "Elderly (60+)" },
  { value: "asthma", label: "Asthma / Respiratory" },
  { value: "pregnant", label: "Pregnant Members" },
  { value: "outdoor_workers", label: "Outdoor Workers" },
];

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
          Tailors your GenAI routines, indoor hacks, and impact scaling. Saved locally in your browser.
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

      {profile.mode === "community" && (
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
            onChange={(e) =>
              onChange({ ...profile, communityHouseholds: Number(e.target.value) })
            }
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            <option value={25}>25 households (Small apartment block)</option>
            <option value={50}>50 households (RWA / School grade)</option>
            <option value={100}>100 households (Neighborhood cluster)</option>
            <option value={250}>250 households (Large society / campus)</option>
          </select>
        </div>
      )}

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
          Vulnerable Members
        </legend>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {VULNERABLE_OPTIONS.map((opt) => {
            const checked = profile.vulnerableGroups.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleVulnerable(opt.value)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-700 focus-visible:ring-sky-700"
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${baseId}-commute`} className="block text-xs font-semibold text-slate-800">
            Daily Commute
          </label>
          <select
            id={`${baseId}-commute`}
            value={profile.commute}
            onChange={(e) => onChange({ ...profile, commute: e.target.value as CommuteType })}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            <option value="petrol_car">Petrol / Diesel Car</option>
            <option value="two_wheeler">Two-Wheeler</option>
            <option value="public_transit">Public Transit (Metro / Bus)</option>
            <option value="walk_cycle">Walking / Cycling</option>
            <option value="wfh">Work / Study from Home</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${baseId}-cooking`} className="block text-xs font-semibold text-slate-800">
            Cooking Fuel
          </label>
          <select
            id={`${baseId}-cooking`}
            value={profile.cookingFuel}
            onChange={(e) => onChange({ ...profile, cookingFuel: e.target.value as CookingFuel })}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            <option value="lpg">LPG / Piped Gas</option>
            <option value="induction">Electric / Induction</option>
            <option value="biomass_other">Biomass / Solid Fuel</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${baseId}-home`} className="block text-xs font-semibold text-slate-800">
            Home Type
          </label>
          <select
            id={`${baseId}-home`}
            value={profile.homeType}
            onChange={(e) => onChange({ ...profile, homeType: e.target.value as HomeType })}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            <option value="apartment">Apartment / Flat</option>
            <option value="independent_house">Independent House</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${baseId}-vent`} className="block text-xs font-semibold text-slate-800">
            Home Ventilation
          </label>
          <select
            id={`${baseId}-vent`}
            value={profile.ventilation}
            onChange={(e) =>
              onChange({ ...profile, ventilation: e.target.value as VentilationType })
            }
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            <option value="cross_ventilation">Cross-Ventilation Windows</option>
            <option value="exhaust_only">Kitchen/Bath Exhaust Only</option>
            <option value="sealed_ac">Sealed / AC Recirculation</option>
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
