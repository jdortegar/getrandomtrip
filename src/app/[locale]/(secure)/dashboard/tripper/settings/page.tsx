"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import type {
  TripperSessionExtras,
  TripperSettingsFormState,
  TripperSettingsStats,
} from "@/types/tripper";

function normalizeExtras(extras: TripperSessionExtras): TripperSessionExtras {
  return {
    availableTypes: extras.availableTypes ?? [],
    bio: extras.bio ?? "",
    commission: typeof extras.commission === "number" ? extras.commission : 0,
    destinations: extras.destinations ?? [],
    heroImage: extras.heroImage ?? "",
    location: extras.location ?? "",
    nickname: extras.nickname ?? "",
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
  location: "",
  tierLevel: "",
  destinations: [],
  tripperSlug: "",
  commission: 0,
  availableTypes: [],
};

export default function TripperSettingsPage() {
  const params = useParams();
  const localeParam = params?.locale as string | undefined;
  const locale = hasLocale(localeParam) ? localeParam : "es";

  const { data: session, update: updateSession } = useSession();
  const { user } = useUserStore();
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [viewMode, setViewMode] = useState<TripperProfileViewMode>("tripper");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);
  const [formData, setFormData] =
    useState<TripperSettingsFormState>(EMPTY_FORM);
  const [profile, setProfile] = useState<TripperSessionExtras>({
    availableTypes: [],
    bio: "",
    commission: 0,
    destinations: [],
    heroImage: "",
    location: "",
    nickname: "",
    tierLevel: "",
    tripperSlug: "",
  });
  const [stats, setStats] = useState<TripperSettingsStats>({
    totalExperiences: 0,
    totalBookings: 0,
    averageRating: 0,
    totalReviews: 0,
  });

  const currentUser = (session?.user || user) as
    | ((SessionUser | User) & TripperSessionExtras)
    | undefined;

  useEffect(() => {
    getDictionary(locale).then(setDict);
  }, [locale]);

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

  if (!dict || !currentUser) {
    return (
      <Section className="py-10!">
        <div className="rt-container text-left">
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-light-blue border-t-transparent" />
          </div>
        </div>
      </Section>
    );
  }

  const copy = dict.tripperDashboard.settingsProfile;
  const tierLabels = {
    rookie: dict.tripperProfilePage.modal.tierRookie,
    pro: dict.tripperProfilePage.modal.tierPro,
    elite: dict.tripperProfilePage.modal.tierElite,
  };

  function openEdit() {
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setFormData((prev) => ({
      ...prev,
      ...profile,
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
          location: formData.location,
          nickname: formData.nickname,
          tierLevel: formData.tierLevel,
          destinations: formData.destinations,
          tripperSlug: formData.tripperSlug,
          commission: formData.commission,
          availableTypes: formData.availableTypes,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          user: TripperSessionExtras & { id?: string };
        };
        const nextProfile = normalizeExtras(data.user);
        setProfile(nextProfile);
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            bio: nextProfile.bio,
            heroImage: nextProfile.heroImage,
            location: nextProfile.location,
            nickname: nextProfile.nickname,
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
        toast.error(dict.tripperProfilePage.toasts.error);
      }
    } catch (error) {
      console.error("Error updating tripper profile:", error);
      toast.error(dict.tripperProfilePage.toasts.error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUploadHeroImage(file: File) {
    const MAX_HERO_BYTES = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_HERO_BYTES) {
      toast.error(copy.hero.imageTooLarge);
      return;
    }
    setIsUploadingHeroImage(true);
    try {
      const oldHeroImage = formData.heroImage;
      const upload = new FormData();
      upload.append("file", file);
      upload.append("feature", "tripper-hero");
      const response = await fetch("/api/upload", {
        body: upload,
        method: "POST",
      });
      if (!response.ok) throw new Error("upload failed");
      const data = (await response.json()) as { url?: string };
      if (!data.url) throw new Error("missing url");
      setFormData((prev) => ({ ...prev, heroImage: data.url as string }));
      setProfile((prev) => ({ ...prev, heroImage: data.url as string }));
      // Delete old blob (fire-and-forget)
      if (oldHeroImage?.includes("/api/upload")) {
        void fetch(oldHeroImage, { method: "DELETE" }).catch(() => null);
      }
    } catch (error) {
      console.error("Error uploading tripper cover image:", error);
      toast.error(copy.hero.imageUploadError);
    } finally {
      setIsUploadingHeroImage(false);
    }
  }

  return (
    <Section className="py-10!">
      <div className="rt-container text-left">
        <div className="space-y-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
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
              <TripperSettingsHeroCard
                copy={copy.hero}
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

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
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
                    copy={copy.publicUrl}
                    isEditing={isEditing}
                    locale={locale}
                    onSlugChange={(slug) =>
                      setFormData((prev) => ({ ...prev, tripperSlug: slug }))
                    }
                    slug={formData.tripperSlug}
                  />
                  <TripperSettingsAccountCard
                    commission={formData.commission}
                    copy={copy.account}
                    email={formData.email}
                    tierLabels={tierLabels}
                    tierLevel={formData.tierLevel}
                  />
                </div>
              </div>
            </>
          )}

          {viewMode === "traveler" && <AccountSettingsPanel role="tripper" />}
        </div>
      </div>
    </Section>
  );
}
