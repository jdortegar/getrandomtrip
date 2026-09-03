"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Section from "@/components/layout/Section";
import { AccountSettingsPanel } from "@/components/app/account/AccountSettingsPanel";
import { TripperSettingsHeroCard } from "@/components/app/dashboard/tripper/settings/TripperSettingsHeroCard";
import { TripperSettingsPublicPresenceCard } from "@/components/app/dashboard/tripper/settings/TripperSettingsPublicPresenceCard";
import { TripperSettingsPublicUrlCard } from "@/components/app/dashboard/tripper/settings/TripperSettingsPublicUrlCard";
import { TripperSettingsAccountCard } from "@/components/app/dashboard/tripper/settings/TripperSettingsAccountCard";
import {
  TripperViewToggle,
  type TripperProfileViewMode,
} from "@/components/app/dashboard/tripper/settings/TripperViewToggle";
import { useUserStore } from "@/store/slices/userStore";
import type { User } from "@/store/slices/userStore";
import type { SessionUser } from "@/lib/types/SessionUser";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { UserProfileMe } from "@/lib/types/UserProfileMe";
import type {
  TripperSessionExtras,
  TripperSettingsFormState,
  TripperSettingsStats,
  TripperTierCopy,
} from "@/types/tripper";
import {
  DEFAULT_COMMISSION,
  effectiveCommission,
} from "@/lib/tripper/commission";
import type { NormalizedCrop } from "@/lib/images/crop";

function normalizeExtras(extras: TripperSessionExtras): TripperSessionExtras {
  return {
    availableTypes: extras.availableTypes ?? [],
    bio: extras.bio ?? "",
    commission: effectiveCommission(extras.commission),
    destinations: extras.destinations ?? [],
    heroImage: extras.heroImage ?? "",
    heroImageOriginal: extras.heroImageOriginal ?? null,
    isActive: extras.isActive ?? true,
    location: extras.location ?? "",
    nickname: extras.nickname ?? "",
    socialLinks: Array.isArray(extras.socialLinks) ? extras.socialLinks : [],
    tierLevel: extras.tierLevel ?? "",
    tripperSlug: extras.tripperSlug ?? "",
  };
}

const EMPTY_FORM: TripperSettingsFormState = {
  name: "",
  nickname: "",
  email: "",
  bio: "",
  heroImage: "",
  heroImageOriginal: null,
  isActive: true,
  location: "",
  tierLevel: "",
  destinations: [],
  tripperSlug: "",
  commission: DEFAULT_COMMISSION,
  availableTypes: [],
  socialLinks: [],
};

interface TripperSettingsPageClientProps {
  locale: Locale;
  initialDict: Dictionary;
  initialExtras: TripperSessionExtras | null;
  initialStats: TripperSettingsStats;
  initialTravelerProfile: UserProfileMe | null;
  /** Which tab opens first. Defaults to "tripper" (the tripper settings
   * route); the traveler settings route passes "traveler" so a user who is
   * also a tripper lands on their traveler fields first, with the tripper
   * tab one click away. */
  initialViewMode?: TripperProfileViewMode;
}

export default function TripperSettingsPageClient({
  locale,
  initialDict,
  initialExtras,
  initialStats,
  initialTravelerProfile,
  initialViewMode = "tripper",
}: TripperSettingsPageClientProps) {
  const dict = initialDict;

  const { data: session, update: updateSession } = useSession();
  const { user } = useUserStore();
  const [viewMode, setViewMode] = useState<TripperProfileViewMode>(initialViewMode);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);
  const initialNormalized = initialExtras
    ? normalizeExtras(initialExtras)
    : null;
  const [formData, setFormData] = useState<TripperSettingsFormState>(() => ({
    ...EMPTY_FORM,
    ...(initialNormalized ?? {}),
    isActive: initialNormalized?.isActive ?? true,
  }));
  const [profile, setProfile] = useState<TripperSessionExtras>(
    initialNormalized ?? {
      availableTypes: [],
      bio: "",
      commission: DEFAULT_COMMISSION,
      destinations: [],
      heroImage: "",
      heroImageOriginal: null,
      isActive: true,
      location: "",
      nickname: "",
      socialLinks: [],
      tierLevel: "",
      tripperSlug: "",
    },
  );
  const [stats, setStats] = useState<TripperSettingsStats>(initialStats);

  const currentUser = (session?.user || user) as
    | ((SessionUser | User) & TripperSessionExtras)
    | undefined;

  // Sync formData's name/email once the client-side session resolves — the
  // server-fetched initialExtras has no session, so these start blank.
  useEffect(() => {
    if (!currentUser) return;
    setFormData((prev) => ({
      ...prev,
      name: currentUser.name || prev.name,
      email: currentUser.email || prev.email,
    }));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    (async function fetchSettingsData() {
      try {
        const [profileRes, experiencesRes, reviewsRes, dashboardRes] =
          await Promise.all([
            fetch("/api/user/tripper"),
            fetch(`/api/experiences?ownerId=${currentUser.id}`),
            fetch("/api/tripper/reviews"),
            fetch("/api/tripper/dashboard"),
          ]);

        if (cancelled) return;

        if (profileRes.ok) {
          const profileData = (await profileRes.json()) as {
            user?: TripperSessionExtras;
          };
          if (profileData.user) {
            const normalized = normalizeExtras(profileData.user);
            setProfile(normalized);
            setFormData((prev) => ({
              ...prev,
              ...normalized,
              isActive: normalized.isActive ?? true,
              name: currentUser.name || "",
              email: currentUser.email || "",
            }));
          }
        }

        if (experiencesRes.ok) {
          const experiencesData = (await experiencesRes.json()) as {
            experiences?: unknown[];
          };
          setStats((s) => ({
            ...s,
            totalExperiences: experiencesData.experiences?.length ?? 0,
          }));
        }

        if (reviewsRes.ok) {
          const reviewsData = (await reviewsRes.json()) as {
            averageRating?: number;
            totalReviews?: number;
          };
          setStats((s) => ({
            ...s,
            averageRating: reviewsData.averageRating ?? 0,
            totalReviews: reviewsData.totalReviews ?? 0,
          }));
        }

        if (dashboardRes.ok) {
          const dashboardData = (await dashboardRes.json()) as {
            stats?: { totalBookings?: number };
          };
          setStats((s) => ({
            ...s,
            totalBookings: dashboardData.stats?.totalBookings ?? 0,
          }));
        }
      } catch (error) {
        console.error("Error fetching tripper settings data:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.name, currentUser?.email]);

  const copy = dict.tripperDashboard.settingsProfile;
  const tierLabels: TripperTierCopy = {
    wanderer: copy.account.tierWanderer,
    scout: copy.account.tierScout,
    navigator: copy.account.tierNavigator,
    pioneer: copy.account.tierPioneer,
    luminary: copy.account.tierLuminary,
  };
  const tierDescriptions: TripperTierCopy = {
    wanderer: copy.account.tierWandererDescription,
    scout: copy.account.tierScoutDescription,
    navigator: copy.account.tierNavigatorDescription,
    pioneer: copy.account.tierPioneerDescription,
    luminary: copy.account.tierLuminaryDescription,
  };

  function openEdit() {
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setFormData((prev) => ({
      ...prev,
      ...profile,
      isActive: profile.isActive ?? true,
      name: currentUser?.name || "",
      email: currentUser?.email || "",
    }));
  }

  async function handleSave() {
    if (!dict) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/tripper", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: formData.bio,
          heroImage: formData.heroImage,
          heroImageOriginal: formData.heroImageOriginal,
          location: formData.location,
          nickname: formData.nickname,
          socialLinks: formData.socialLinks,
          tierLevel: formData.tierLevel,
          destinations: formData.destinations,
          tripperSlug: formData.tripperSlug,
          // commission is admin-owned and read-only here; the server ignores
          // it even if sent, but we don't send it at all — see PATCH
          // /api/admin/users/[id] for the write path.
          availableTypes: formData.availableTypes,
        }),
      });

      const responseBody = (await response.json().catch(() => ({}))) as {
        user?: TripperSessionExtras & { id?: string };
        error?: string;
      };

      if (response.ok && responseBody.user) {
        const nextProfile = normalizeExtras(responseBody.user);
        setProfile(nextProfile);
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            bio: nextProfile.bio,
            heroImage: nextProfile.heroImage,
            heroImageOriginal: nextProfile.heroImageOriginal,
            location: nextProfile.location,
            nickname: nextProfile.nickname,
            socialLinks: nextProfile.socialLinks,
            tierLevel: nextProfile.tierLevel,
            destinations: nextProfile.destinations,
            tripperSlug: nextProfile.tripperSlug,
            commission: nextProfile.commission,
            availableTypes: nextProfile.availableTypes,
          },
        });
        toast.success(dict.tripperProfilePage.toasts.success);
        setIsEditing(false);
      } else {
        const detail = responseBody.error;
        toast.error(
          detail
            ? `${dict.tripperProfilePage.toasts.error}: ${detail}`
            : dict.tripperProfilePage.toasts.error,
        );
      }
    } catch (error) {
      console.error("Error updating tripper profile:", error);
      const detail = error instanceof Error ? error.message : null;
      toast.error(
        detail
          ? `${dict.tripperProfilePage.toasts.error}: ${detail}`
          : dict.tripperProfilePage.toasts.error,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUploadHeroImage(
    file: File | undefined,
    crop: NormalizedCrop,
    originalUrl?: string,
  ) {
    const MAX_HERO_BYTES = 10 * 1024 * 1024; // 10 MB — matches /api/upload's cap
    if (file && file.size > MAX_HERO_BYTES) {
      toast.error(copy.hero.imageTooLarge);
      return;
    }
    setIsUploadingHeroImage(true);
    try {
      const oldHeroImage = formData.heroImage;
      const upload = new FormData();
      if (file) upload.append("file", file);
      upload.append("feature", "tripper-hero");
      upload.append("crop", JSON.stringify(crop));
      if (!file && originalUrl) {
        upload.append("originalKey", originalUrl.replace(/^\/api\/upload\//, ""));
      }
      const response = await fetch("/api/upload", {
        body: upload,
        method: "POST",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body?.error ?? "Upload failed");
      }

      const data = (await response.json()) as {
        url?: string;
        originalUrl?: string;
      };
      if (!data.url) throw new Error("No URL returned from upload");
      setFormData((prev) => ({
        ...prev,
        heroImage: data.url as string,
        heroImageOriginal: data.originalUrl ?? prev.heroImageOriginal,
      }));
      setProfile((prev) => ({
        ...prev,
        heroImage: data.url as string,
        heroImageOriginal: data.originalUrl ?? prev.heroImageOriginal,
      }));
      // Delete old baked blob (fire-and-forget) — the original is retained
      // for lossless re-crop, never deleted here.
      if (oldHeroImage?.includes("/api/upload")) {
        void fetch(oldHeroImage, { method: "DELETE" }).catch(() => null);
      }
    } catch (error) {
      console.error("Error uploading tripper cover image:", error);
      const detail = error instanceof Error ? error.message : null;
      toast.error(
        detail
          ? `${copy.hero.imageUploadError}: ${detail}`
          : copy.hero.imageUploadError,
      );
    } finally {
      setIsUploadingHeroImage(false);
    }
  }

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <div className="space-y-10">
          <div className="flex flex-row items-center justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
                {copy.eyebrow}
              </p>
              <h1 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
                {copy.heading}
              </h1>
            </div>
            <TripperViewToggle
              copy={copy.viewToggle}
              onChange={setViewMode}
              value={viewMode}
            />
          </div>

          {viewMode === "tripper" && (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                <div className="flex flex-col gap-6">
                  <TripperSettingsHeroCard
                    avatarToastCopy={dict.profile.toasts}
                    copy={copy.hero}
                    imageEditorCopy={dict.imageEditor}
                    formData={formData}
                    isEditing={isEditing}
                    isSaving={isSaving}
                    isUploadingHeroImage={isUploadingHeroImage}
                    onCancel={cancelEdit}
                    onChange={setFormData}
                    onEdit={openEdit}
                    onSave={handleSave}
                    onUploadHeroImage={handleUploadHeroImage}
                    stats={stats}
                    tierLabels={tierLabels}
                  />
                  <TripperSettingsPublicPresenceCard
                    copy={copy.publicPresence}
                    formData={formData}
                    isEditing={isEditing}
                    onChange={setFormData}
                    tagListCopy={dict.profile.tagList}
                    travelerTypesCopy={dict.profile.travelerTypes}
                  />
                </div>
                <div className="flex flex-col gap-6">
                  <TripperSettingsPublicUrlCard
                    canToggleVisibility={Boolean(profile.tripperSlug)}
                    copy={copy.publicUrl}
                    isActive={formData.isActive}
                    isEditing={isEditing}
                    locale={locale}
                    onIsActiveChange={async (next) => {
                      setFormData((prev) => ({ ...prev, isActive: next }));
                      try {
                        const res = await fetch("/api/user/tripper/status", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ isActive: next }),
                        });
                        if (res.ok) {
                          setProfile((prev) => ({ ...prev, isActive: next }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            isActive: !next,
                          }));
                          toast.error(copy.publicUrl.visibilityError);
                        }
                      } catch {
                        setFormData((prev) => ({ ...prev, isActive: !next }));
                        toast.error(copy.publicUrl.visibilityError);
                      }
                    }}
                    onSlugChange={(slug) =>
                      setFormData((prev) => ({ ...prev, tripperSlug: slug }))
                    }
                    slug={formData.tripperSlug}
                  />
                  <TripperSettingsAccountCard
                    commission={formData.commission}
                    copy={copy.account}
                    email={formData.email}
                    tierDescriptions={tierDescriptions}
                    tierLabels={tierLabels}
                    tierLevel={formData.tierLevel}
                  />
                </div>
              </div>
            </>
          )}

          {viewMode === "traveler" && (
            <AccountSettingsPanel
              initialProfile={initialTravelerProfile}
              role="tripper"
            />
          )}
        </div>
      </div>
    </Section>
  );
}
