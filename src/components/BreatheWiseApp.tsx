"use client";

import { useBreatheWiseData } from "@/hooks/useBreatheWiseData";
import { ActionPlanView } from "./ActionPlanView";
import { AirQualityDashboard } from "./AirQualityDashboard";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";
import { AssistantChat } from "./AssistantChat";
import { CitySearch } from "./CitySearch";
import { ImpactSimulator } from "./ImpactSimulator";
import { ProfileForm } from "./ProfileForm";

export function BreatheWiseApp() {
  const {
    location,
    setLocation,
    profile,
    handleProfileChange,
    airQuality,
    aqiLoading,
    aqiError,
    plan,
    planLoading,
    planError,
    selectedIds,
    handleToggleAction,
    handleSelectAll,
    handleClearAll,
    handleRefreshAqi,
    handleRegeneratePlan,
  } = useBreatheWiseData();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 focus:outline-none sm:px-6 lg:px-8"
      >
        <section
          aria-label="City and location selector"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <CitySearch
            selectedLocation={location}
            onSelectLocation={setLocation}
            isLoading={aqiLoading}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AirQualityDashboard
              snapshot={airQuality}
              isLoading={aqiLoading}
              error={aqiError}
              onRefresh={handleRefreshAqi}
            />
          </div>
          <div>
            <ProfileForm profile={profile} onChange={handleProfileChange} />
          </div>
        </div>

        <ImpactSimulator
          plan={plan}
          selectedIds={selectedIds}
          currentPm25={airQuality?.current.pm25 ?? 50}
          profile={profile}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
        />

        <ActionPlanView
          plan={plan}
          isLoading={planLoading}
          error={planError}
          selectedIds={selectedIds}
          onToggleAction={handleToggleAction}
          onRegenerate={handleRegeneratePlan}
        />

        <AssistantChat airQuality={airQuality} profile={profile} />
      </main>

      <AppFooter />
    </div>
  );
}
