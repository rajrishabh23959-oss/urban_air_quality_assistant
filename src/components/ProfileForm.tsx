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
} from "@/lib/profile-options";
import {
  CommuteTypeSchema,
  CookingFuelSchema,
  HomeTypeSchema,
  VentilationTypeSchema,
  type HouseholdProfile,
  type VulnerableGroup,
} from "@/types";
import { ProfileSelectField } from "./ProfileSelectField";
import { VulnerableGroupSelector } from "./VulnerableGroupSelector";

interface ProfileFormProps {
  profile: HouseholdProfile;
  onChange: (next: HouseholdProfile) => void;
}

const HOUSEHOLD_OPTIONS = HOUSEHOLD_SIZE_OPTIONS.map((c) => ({
  value: c,
  label: `${c} ${c === 1 ? "member" : "members"}`,
}));

function PlanningModeToggle({
  mode,
  onSelect,
}: {
  mode: HouseholdProfile["mode"];
  onSelect: (mode: HouseholdProfile["mode"]) => void;
}) {
  return (
    <div>
      <span className="block text-xs font-semibold tracking-wide text-slate-700 uppercase">
        Planning Mode
      </span>
      <div className="mt-1.5 grid grid-cols-2 gap-2" role="group" aria-label="Planning mode">
        {(["family", "community"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            aria-pressed={mode === item}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 ${
              mode === item
                ? "border-sky-800 bg-sky-800 text-white"
                : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
            }`}
          >
            {item === "family" ? (
              <Users aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Building2 aria-hidden="true" className="h-4 w-4" />
            )}
            <span>{item === "family" ? "Family Mode" : "Community Mode"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileDetailsGrid({ baseId, profile, onChange }: ProfileFormProps & { baseId: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ProfileSelectField
        id={`${baseId}-commute`}
        label="Daily Commute"
        value={profile.commute}
        options={COMMUTE_OPTIONS}
        onChange={(v) => {
          const p = CommuteTypeSchema.safeParse(v);
          if (p.success) onChange({ ...profile, commute: p.data });
        }}
      />
      <ProfileSelectField
        id={`${baseId}-cooking`}
        label="Cooking Fuel"
        value={profile.cookingFuel}
        options={COOKING_FUEL_OPTIONS}
        onChange={(v) => {
          const p = CookingFuelSchema.safeParse(v);
          if (p.success) onChange({ ...profile, cookingFuel: p.data });
        }}
      />
      <ProfileSelectField
        id={`${baseId}-home`}
        label="Home Type"
        value={profile.homeType}
        options={HOME_TYPE_OPTIONS}
        onChange={(v) => {
          const p = HomeTypeSchema.safeParse(v);
          if (p.success) onChange({ ...profile, homeType: p.data });
        }}
      />
      <ProfileSelectField
        id={`${baseId}-vent`}
        label="Home Ventilation"
        value={profile.ventilation}
        options={VENTILATION_OPTIONS}
        onChange={(v) => {
          const p = VentilationTypeSchema.safeParse(v);
          if (p.success) onChange({ ...profile, ventilation: p.data });
        }}
      />
    </div>
  );
}

/**
 * Household and Community profile configuration form persisted locally.
 */
export function ProfileForm({ profile, onChange }: ProfileFormProps) {
  const baseId = useId();
  const toggleVulnerable = (group: VulnerableGroup) => {
    const exists = profile.vulnerableGroups.includes(group);
    onChange({
      ...profile,
      vulnerableGroups: exists
        ? profile.vulnerableGroups.filter((g) => g !== group)
        : [...profile.vulnerableGroups, group],
    });
  };

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
      <PlanningModeToggle mode={profile.mode} onSelect={(mode) => onChange({ ...profile, mode })} />
      {profile.mode === "family" ? (
        <ProfileSelectField
          id={`${baseId}-household-size`}
          label="Household Size (Members)"
          value={profile.householdSize}
          options={HOUSEHOLD_OPTIONS}
          onChange={(v) => onChange({ ...profile, householdSize: Number(v) })}
        />
      ) : (
        <ProfileSelectField
          id={`${baseId}-community-size`}
          label="Community Scale (Households)"
          value={profile.communityHouseholds}
          options={COMMUNITY_SCALE_OPTIONS}
          onChange={(v) => onChange({ ...profile, communityHouseholds: Number(v) })}
        />
      )}
      <VulnerableGroupSelector selected={profile.vulnerableGroups} onToggle={toggleVulnerable} />
      <ProfileDetailsGrid baseId={baseId} profile={profile} onChange={onChange} />
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
