"use client";

interface ProfileSelectFieldProps {
  id: string;
  label: string;
  value: string | number;
  options: readonly { value: string | number; label: string }[];
  onChange: (value: string) => void;
}

/**
 * Reusable accessible labeled select field for the household/community profile form.
 */
export function ProfileSelectField({
  id,
  label,
  value,
  options,
  onChange,
}: ProfileSelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-800">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
