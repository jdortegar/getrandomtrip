"use client";

import { Edit } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUserStore } from "@/store/slices/userStore";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { hasRoleAccess } from "@/lib/auth/roleAccess";
import type { SessionUser } from "@/lib/types/SessionUser";
import type { TripperProfilePageDict } from "@/lib/types/dictionary";
import type { User } from "@/store/slices/userStore";
import type {
  TripperSessionExtras,
  TripperOwnExperienceListItem,
} from "@/types/tripper";
import type { Locale } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { TripperProfileAccessDenied } from "./TripperProfileAccessDenied";
import type { TripperProfileFormState } from "./TripperProfileEditModal";
import { TripperProfileExperiencesPanel } from "./TripperProfileExperiencesPanel";
import { TripperProfileOverviewSection } from "./TripperProfileOverviewSection";
import { TripperProfilePerformancePanel } from "./TripperProfilePerformancePanel";
import { TripperProfileSidebarNav } from "./TripperProfileSidebarNav";
import HeaderHero from "@/components/journey/HeaderHero";

type TabType = "experiences" | "overview" | "performance";

interface TripperProfileClientProps {
  copy: TripperProfilePageDict;
  locale: Locale;
}

function replaceCount(template: string, value: number) {
  return template.replace("{count}", String(value));
}

function parseListInput(values: string[]): string[] {
  return values
    .join("\n")
    .split(/[,\n;]+/)
    .map((v) => v.trim())
    .filter((v) => v !== "");
}

function normalizeProfile(extras: TripperSessionExtras): TripperSessionExtras {
  return {
    availableTypes: extras.availableTypes ?? [],
    bio: extras.bio ?? "",
    commission: typeof extras.commission === "number" ? extras.commission : 0,
    destinations: extras.destinations ?? [],
    heroImage: extras.heroImage ?? "",
    location: extras.location ?? "",
    tierLevel: extras.tierLevel ?? "",
    tripperSlug: extras.tripperSlug ?? "",
  };
}

export function TripperProfileClient({
  copy,
  locale,
}: TripperProfileClientProps) {
  const { data: session, update: updateSession } = useSession();
  const { user } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [formData, setFormData] = useState<TripperProfileFormState>({
    name: "",
    email: "",
    bio: "",
    heroImage: "",
    location: "",
    tierLevel: "",
    destinations: [],
    tripperSlug: "",
    commission: 0,
    availableTypes: [],
  });
  const [stats, setStats] = useState({
    totalExperiences: 0,
    totalBookings: 0,
    averageRating: 0,
    totalEarnings: 0,
  });
  const [experiences, setExperiences] = useState<
    TripperOwnExperienceListItem[]
  >([]);
  const [profile, setProfile] = useState<TripperSessionExtras>({
    availableTypes: [],
    bio: "",
    commission: 0,
    destinations: [],
    heroImage: "",
    location: "",
    tierLevel: "",
    tripperSlug: "",
  });

  const u = session?.user || user;
  const currentUser = u as
    | ((SessionUser | User) & TripperSessionExtras)
    | undefined;
  const tripperSubject =
    u?.roles && u.roles.length > 0
      ? { role: u.role, roles: u.roles }
      : { role: u?.role };
  const isTripper = hasRoleAccess(tripperSubject, "tripper");
  const tripperDash = pathForLocale(locale, "/dashboard/tripper");
  const tripperExperiences = pathForLocale(
    locale,
    "/dashboard/tripper/experiences",
  );

  useEffect(() => {
    if (!isTripper || !currentUser?.id) return;
    let cancelled = false;
    (async function fetchTripperData() {
      try {
        const profileRes = await fetch("/api/user/tripper");
        const profileData = (await profileRes.json()) as {
          user?: TripperSessionExtras;
        };
        if (!cancelled && profileRes.ok && profileData.user) {
          const normalizedProfile = normalizeProfile(profileData.user);
          setProfile(normalizedProfile);
          setFormData((prev) => ({
            ...prev,
            availableTypes: normalizedProfile.availableTypes ?? [],
            bio: normalizedProfile.bio ?? "",
            commission: normalizedProfile.commission ?? 0,
            destinations: normalizedProfile.destinations ?? [],
            heroImage: normalizedProfile.heroImage ?? "",
            location: normalizedProfile.location ?? "",
            tierLevel: normalizedProfile.tierLevel ?? "",
            tripperSlug: normalizedProfile.tripperSlug ?? "",
          }));
        }

        const experiencesRes = await fetch(
          `/api/experiences?ownerId=${currentUser.id}`,
        );
        const experiencesData = (await experiencesRes.json()) as {
          experiences?: TripperOwnExperienceListItem[];
        };
        if (cancelled) return;
        const list = experiencesData.experiences ?? [];
        setExperiences(list);
        setStats((s) => ({ ...s, totalExperiences: list.length }));
      } catch (error) {
        console.error("Error fetching tripper data:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isTripper, currentUser?.id]);

  useEffect(() => {
    if (!isTripper || !currentUser) return;
    if (
      !isEditing &&
      !profile.tripperSlug &&
      !profile.bio &&
      !profile.location
    ) {
      const normalized = normalizeProfile(currentUser);
      setFormData((prev) => ({
        ...prev,
        availableTypes: normalized.availableTypes ?? [],
        bio: normalized.bio ?? "",
        commission: normalized.commission ?? 0,
        destinations: normalized.destinations ?? [],
        heroImage: normalized.heroImage ?? "",
        location: normalized.location ?? "",
        tierLevel: normalized.tierLevel ?? "",
        tripperSlug: normalized.tripperSlug ?? "",
      }));
    }
  }, [
    currentUser,
    isTripper,
    isEditing,
    profile.bio,
    profile.location,
    profile.tripperSlug,
  ]);

  if (!isTripper || !currentUser) {
    return (
      <TripperProfileAccessDenied copy={copy.accessDenied} locale={locale} />
    );
  }

  const openInlineEdit = () => {
    setIsEditing(true);
    setActiveTab("overview");
  };

  const cancelInlineEdit = () => {
    setIsEditing(false);
    setFormData((prev) => ({
      ...prev,
      availableTypes: profile.availableTypes ?? [],
      bio: profile.bio ?? "",
      commission: profile.commission ?? 0,
      destinations: profile.destinations ?? [],
      heroImage: profile.heroImage ?? "",
      location: profile.location ?? "",
      tierLevel: profile.tierLevel ?? "",
      tripperSlug: profile.tripperSlug ?? "",
    }));
  };

  const handleSaveTripper = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/tripper", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: formData.bio,
          heroImage: formData.heroImage,
          location: formData.location,
          tierLevel: formData.tierLevel,
          destinations: parseListInput(formData.destinations),
          tripperSlug: formData.tripperSlug,
          commission: formData.commission,
          availableTypes: parseListInput(formData.availableTypes),
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          user: TripperSessionExtras & { id?: string };
        };
        const nextProfile = normalizeProfile(data.user);
        setProfile(nextProfile);
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            bio: nextProfile.bio,
            heroImage: nextProfile.heroImage,
            location: nextProfile.location,
            tierLevel: nextProfile.tierLevel,
            destinations: nextProfile.destinations,
            tripperSlug: nextProfile.tripperSlug,
            commission: nextProfile.commission,
            availableTypes: nextProfile.availableTypes,
          },
        });
        toast.success(copy.toasts.success);
        setIsEditing(false);
      } else {
        toast.error(copy.toasts.error);
      }
    } catch (error) {
      console.error("Error updating tripper profile:", error);
      toast.error(copy.toasts.error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadHeroImage = async (file: File) => {
    setIsUploadingHeroImage(true);
    try {
      const upload = new FormData();
      upload.append("file", file);
      const response = await fetch("/api/tripper/blog-media", {
        body: upload,
        method: "POST",
      });
      if (!response.ok) throw new Error("upload failed");
      const data = (await response.json()) as { location?: string };
      if (!data.location) throw new Error("missing url");
      setFormData((prev) => ({ ...prev, heroImage: data.location as string }));
      setProfile((prev) => ({ ...prev, heroImage: data.location as string }));
    } catch (error) {
      console.error("Error uploading tripper cover image:", error);
      toast.error(copy.modal.imageUploadError);
    } finally {
      setIsUploadingHeroImage(false);
    }
  };

  const displayName = currentUser.name || copy.card.nameFallback;
  const tier = (profile.tierLevel || "rookie").toUpperCase();
  const locationLabel = profile.location || copy.card.noLocation;

  return (
    <>
      <HeaderHero title={copy.meta.title} description={copy.meta.description} />

      <section className="bg-neutral-50 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <UserAvatar height={96} showStatus width={96} />
              <div className="flex-1 text-center md:text-left">
                <h2 className="mb-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">
                  {displayName}
                </h2>
                <p className="mb-3 text-base text-neutral-600">
                  {currentUser.email}
                </p>
                <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                  <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800">
                    {copy.card.tripperBadgePrefix} {tier}
                  </span>
                  <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800">
                    {locationLabel}
                  </span>
                </div>
              </div>
              {!isEditing ? (
                <Button
                  onClick={openInlineEdit}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {copy.card.editProfile}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={cancelInlineEdit}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    {copy.modal.cancel}
                  </Button>
                  <Button
                    disabled={isSaving}
                    onClick={handleSaveTripper}
                    size="sm"
                    type="button"
                  >
                    {copy.modal.save}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {activeTab === "overview" ? (
                <TripperProfileOverviewSection
                  copy={copy}
                  formData={formData}
                  isEditing={isEditing}
                  onChange={setFormData}
                  onUploadHeroImage={handleUploadHeroImage}
                  uploadingHeroImage={isUploadingHeroImage}
                />
              ) : null}
              {activeTab === "experiences" ? (
                <TripperProfileExperiencesPanel
                  copy={copy}
                  experiences={experiences}
                  experiencesPath={tripperExperiences}
                  replaceCount={replaceCount}
                />
              ) : null}
              {activeTab === "performance" ? (
                <TripperProfilePerformancePanel
                  copy={copy}
                  dashboardPath={tripperDash}
                  stats={stats}
                />
              ) : null}
            </div>

            <TripperProfileSidebarNav
              activeTab={activeTab}
              copy={copy}
              dashboardPath={tripperDash}
              onTabChange={setActiveTab}
              stats={stats}
            />
          </div>
        </div>
      </section>
    </>
  );
}
