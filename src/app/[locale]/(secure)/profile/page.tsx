"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/slices/userStore";
import SecureRoute from "@/components/auth/SecureRoute";
import Badge from "@/components/badge";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import Section from "@/components/layout/Section";
import HeaderHero from "@/components/journey/HeaderHero";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { Briefcase, Edit, Lock, Settings, User, X } from "lucide-react";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { toast } from "sonner";
import type { UserProfileMe } from "@/lib/types/UserProfileMe";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";

type TabType = "personal" | "preferences" | "security";

interface DetailsFormState {
  city: string;
  country: string;
  dislikes: string[];
  email: string;
  interests: string[];
  name: string;
  phone: string;
  state: string;
  street: string;
  travelerType: string;
  zipCode: string;
}

function profileToDetailsForm(p: UserProfileMe): DetailsFormState {
  const a = p.address;
  return {
    city: a?.city ?? "",
    country: a?.country ?? "",
    dislikes: [...p.dislikes],
    email: p.email,
    interests: [...p.interests],
    name: p.name,
    phone: p.phone ?? "",
    state: a?.state ?? "",
    street: a?.street ?? "",
    travelerType: p.travelerType ?? "",
    zipCode: a?.zipCode ?? "",
  };
}

function ProfileContent() {
  const params = useParams();
  const localeParam = (params?.locale as string) ?? "es";
  const resolvedLocale = hasLocale(localeParam) ? localeParam : "es";
  const dateLocaleTag = resolvedLocale === "en" ? "en-US" : "es-ES";

  const { data: session, update: updateSession } = useSession();
  const { user } = useUserStore();
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    travelerType: "",
    interests: [] as string[],
    dislikes: [] as string[],
  });
  const [stats, setStats] = useState({
    totalTrips: 0,
    averageRating: 0,
  });
  const [profileMe, setProfileMe] = useState<UserProfileMe | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isDetailsEditing, setIsDetailsEditing] = useState(false);
  const [detailsForm, setDetailsForm] = useState<DetailsFormState>({
    city: "",
    country: "",
    dislikes: [],
    email: "",
    interests: [],
    name: "",
    phone: "",
    state: "",
    street: "",
    travelerType: "",
    zipCode: "",
  });

  const currentUser = session?.user || user;
  const loadProfile = useCallback(async () => {
    if (!currentUser?.email) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    try {
      const res = await fetch("/api/user/me");
      const data = await res.json();
      if (data.user) {
        setProfileMe(data.user as UserProfileMe);
      }
    } catch (e) {
      console.error("Error loading profile:", e);
    } finally {
      setProfileLoading(false);
    }
  }, [currentUser?.email]);

  // Fetch user stats
  useEffect(() => {
    async function fetchStats() {
      if (!currentUser?.id) {
        console.log("No user ID available");
        return;
      }

      try {
        console.log("Fetching trips for user:", currentUser.id);
        const tripsRes = await fetch(`/api/trips?userId=${currentUser.id}`);
        const tripsData = await tripsRes.json();
        console.log("Trips response:", tripsData);

        if (tripsData.error) {
          console.error("API Error:", tripsData.error, tripsData.details);
          return;
        }

        const trips = tripsData.trips || [];

        const ratingsTrips = trips.filter((t: any) => t.customerRating);
        const avgRating =
          ratingsTrips.length > 0
            ? ratingsTrips.reduce(
                (sum: number, t: any) => sum + (t.customerRating || 0),
                0,
              ) / ratingsTrips.length
            : 0;

        console.log("Stats calculated:", {
          totalTrips: trips.length,
          avgRating,
        });
        setStats({
          totalTrips: trips.length,
          averageRating: avgRating,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }

    fetchStats();
  }, [currentUser?.id, session]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    getDictionary(resolvedLocale).then(setDict);
  }, [resolvedLocale]);

  useEffect(() => {
    if (!profileMe || isDetailsEditing) return;
    setDetailsForm(profileToDetailsForm(profileMe));
  }, [profileMe, isDetailsEditing]);

  const openModal = () => {
    setIsModalOpen(true);
    // Pre-fill form with current data
    // User data comes from NextAuth session or Zustand store
    const travelerType =
      (user as any)?.travelerType || (currentUser as any)?.travelerType || "";
    const interests =
      (user as any)?.interests || (currentUser as any)?.interests || [];
    const dislikes =
      (user as any)?.dislikes || (currentUser as any)?.dislikes || [];

    setFormData({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      travelerType,
      interests: Array.isArray(interests) ? interests : [],
      dislikes: Array.isArray(dislikes) ? dislikes : [],
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveTab("personal");
    setFormData({
      name: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      travelerType: "",
      interests: [],
      dislikes: [],
    });
  };

  const handleSavePersonal = async () => {
    if (!dict) return;
    const t = dict.profile.toasts;
    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name,
            email: data.user.email,
          },
        });

        toast.success(t.personalUpdated);
        await loadProfile();
        closeModal();
      } else {
        toast.error(t.personalError);
      }
    } catch (error) {
      console.error("Error updating personal info:", error);
      toast.error(t.personalError);
    }
  };

  const handleSavePreferences = async () => {
    if (!dict) return;
    const t = dict.profile.toasts;
    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          travelerType: formData.travelerType,
          interests: formData.interests.filter((i) => i.trim() !== ""),
          dislikes: formData.dislikes.filter((d) => d.trim() !== ""),
        }),
      });

      if (response.ok) {
        const data = await response.json();

        await updateSession({
          ...session,
          user: {
            ...session?.user,
            travelerType: data.user.travelerType,
            interests: data.user.interests,
            dislikes: data.user.dislikes,
          },
        });

        toast.success(t.preferencesUpdated);
        await loadProfile();
        closeModal();
      } else {
        toast.error(t.preferencesError);
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error(t.preferencesError);
    }
  };

  const handleChangePassword = async () => {
    if (!dict) return;
    const t = dict.profile.toasts;
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t.passwordsMismatch);
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error(t.passwordMinLength);
      return;
    }

    try {
      const response = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (response.ok) {
        toast.success(t.passwordUpdated);
        closeModal();
      } else {
        const data = await response.json();
        toast.error(
          typeof data.error === "string" ? data.error : t.passwordError,
        );
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(t.passwordError);
    }
  };

  const handleStartDetailsEdit = () => {
    if (!profileMe) return;
    setDetailsForm(profileToDetailsForm(profileMe));
    setIsDetailsEditing(true);
  };

  const handleCancelDetailsEdit = () => {
    if (profileMe) setDetailsForm(profileToDetailsForm(profileMe));
    setIsDetailsEditing(false);
  };

  const handleSaveDetails = async () => {
    if (!dict || !profileMe) return;
    const t = dict.profile.toasts;
    const trimmedName = detailsForm.name.trim();
    if (!trimmedName) {
      toast.error(t.nameRequired);
      return;
    }
    try {
      const [resUpdate, resPrefs] = await Promise.all([
        fetch("/api/user/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            email: detailsForm.email.trim(),
            phone: detailsForm.phone.trim() || null,
            address: {
              street: detailsForm.street.trim(),
              city: detailsForm.city.trim(),
              state: detailsForm.state.trim(),
              zipCode: detailsForm.zipCode.trim(),
              country: detailsForm.country.trim(),
            },
          }),
        }),
        fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            travelerType: detailsForm.travelerType || null,
            interests: detailsForm.interests.filter((i) => i.trim() !== ""),
            dislikes: detailsForm.dislikes.filter((d) => d.trim() !== ""),
          }),
        }),
      ]);

      if (!resUpdate.ok || !resPrefs.ok) {
        toast.error(t.saveError);
        return;
      }

      const prefsData = await resPrefs.json();
      const updateData = await resUpdate.json();

      await updateSession({
        ...session,
        user: {
          ...session?.user,
          address: updateData.user?.address,
          dislikes: prefsData.user?.dislikes,
          email: updateData.user?.email,
          interests: prefsData.user?.interests,
          name: updateData.user?.name,
          phone: updateData.user?.phone,
          travelerType: prefsData.user?.travelerType,
        },
      });

      await loadProfile();
      setIsDetailsEditing(false);
      toast.success(t.profileUpdated);
    } catch (e) {
      console.error("Error saving profile details:", e);
      toast.error(t.saveError);
    }
  };

  const memberSinceLabel = profileMe
    ? new Date(profileMe.createdAt).toLocaleDateString(dateLocaleTag, {
        month: "long",
        year: "numeric",
      })
    : "";

  if (!dict) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  const p = dict.profile;
  const tt = p.travelerTypes;
  const profileFieldClassName = cn(
    !isDetailsEditing && "cursor-not-allowed opacity-80",
  );

  return (
    <>
      <HeaderHero
        className="!h-[40vh]"
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle={p.hero.subtitle}
        title={p.hero.title}
        videoSrc="/videos/hero-video-1.mp4"
      />

      <Section>
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          {/* Profile Header Card */}
          <div
            className={cn(
              "flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md",
              "ring-1 ring-gray-100",
            )}
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <UserAvatar height={96} showStatus width={96} />

              <div className="flex-1 text-center md:text-left">
                <h1 className="mb-2 text-3xl font-bold text-neutral-900">
                  {currentUser?.name || p.header.userFallback}
                </h1>
                <p className="mb-3 text-neutral-600">
                  {currentUser?.email || p.header.emailFallback}
                </p>
                <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                  <Badge
                    color="primary"
                    item={{
                      key: "profile-traveler-active",
                      value: p.header.badgeActiveTraveler,
                    }}
                    size="md"
                  />
                </div>
              </div>

              <div aria-label={p.actionsAria} className="flex gap-3">
                {!isDetailsEditing ? (
                  <>
                    <Button
                      disabled={profileLoading || !profileMe}
                      onClick={handleStartDetailsEdit}
                      size="sm"
                      variant="secondary"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {p.buttons.editDetails}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleCancelDetailsEdit}
                      size="sm"
                      variant="secondary"
                    >
                      {p.buttons.cancel}
                    </Button>
                    <Button onClick={handleSaveDetails} size="sm">
                      {p.buttons.saveChanges}
                    </Button>
                  </>
                )}
                {(currentUser as any)?.role === "TRIPPER" && (
                  <Button asChild>
                    <a
                      href={pathForLocale(resolvedLocale, "/trippers/profile")}
                    >
                      <Briefcase className="mr-2 h-4 w-4" />
                      {p.buttons.tripperProfile}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2 text-left">
              <div
                className={cn(
                  "flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md",
                  "ring-1 ring-gray-100",
                )}
              >
                <h2 className="mb-4 font-barlow-condensed text-4xl font-bold uppercase text-gray-900 text-left">
                  {p.personalSectionTitle}
                </h2>
                <div className="space-y-4">
                  <FormField
                    className={profileFieldClassName}
                    id="profile-email"
                    label={p.labels.email}
                    onChange={(e) =>
                      setDetailsForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    readOnly={!isDetailsEditing}
                    type="email"
                    value={detailsForm.email}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      className={profileFieldClassName}
                      id="profile-name"
                      label={p.labels.name}
                      onChange={(e) =>
                        setDetailsForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      readOnly={!isDetailsEditing}
                      type="text"
                      value={detailsForm.name}
                    />
                    <FormField
                      className={profileFieldClassName}
                      id="profile-phone"
                      label={p.labels.phone}
                      onChange={(e) =>
                        setDetailsForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      readOnly={!isDetailsEditing}
                      type="tel"
                      value={detailsForm.phone}
                    />
                  </div>

                  <FormField
                    className={profileFieldClassName}
                    id="profile-street"
                    label={p.labels.street}
                    onChange={(e) =>
                      setDetailsForm((prev) => ({
                        ...prev,
                        street: e.target.value,
                      }))
                    }
                    readOnly={!isDetailsEditing}
                    type="text"
                    value={detailsForm.street}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      className={profileFieldClassName}
                      id="profile-city"
                      label={p.labels.city}
                      onChange={(e) =>
                        setDetailsForm((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      readOnly={!isDetailsEditing}
                      type="text"
                      value={detailsForm.city}
                    />
                    <FormField
                      className={profileFieldClassName}
                      id="profile-state"
                      label={p.labels.state}
                      onChange={(e) =>
                        setDetailsForm((prev) => ({
                          ...prev,
                          state: e.target.value,
                        }))
                      }
                      readOnly={!isDetailsEditing}
                      type="text"
                      value={detailsForm.state}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      className={profileFieldClassName}
                      id="profile-zip"
                      label={p.labels.zipCode}
                      onChange={(e) =>
                        setDetailsForm((prev) => ({
                          ...prev,
                          zipCode: e.target.value,
                        }))
                      }
                      readOnly={!isDetailsEditing}
                      type="text"
                      value={detailsForm.zipCode}
                    />
                    <FormField
                      className={profileFieldClassName}
                      id="profile-country"
                      label={p.labels.country}
                      onChange={(e) =>
                        setDetailsForm((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                      readOnly={!isDetailsEditing}
                      type="text"
                      value={detailsForm.country}
                    />
                  </div>

                  <FormField
                    className="cursor-not-allowed opacity-80"
                    id="profile-member-since"
                    label={p.labels.memberSince}
                    readOnly
                    type="text"
                    value={memberSinceLabel}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-1">
              <div
                className={cn(
                  "flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-md",
                  "ring-1 ring-gray-100",
                )}
              >
                <h2 className="mb-4 font-barlow-condensed text-4xl font-bold uppercase text-gray-900 text-left">
                  {p.preferencesSectionTitle}
                </h2>
                <div className="space-y-4">
                  <FormSelectField
                    className={profileFieldClassName}
                    disabled={!isDetailsEditing}
                    id="profile-traveler-type"
                    label={p.labels.travelerType}
                    onChange={(e) =>
                      setDetailsForm((prev) => ({
                        ...prev,
                        travelerType: e.target.value,
                      }))
                    }
                    value={detailsForm.travelerType}
                  >
                    <option value="">{tt.selectPlaceholder}</option>
                    <option value="solo">{tt.solo}</option>
                    <option value="couple">{tt.couple}</option>
                    <option value="family">{tt.family}</option>
                    <option value="group">{tt.group}</option>
                    <option value="honeymoon">{tt.honeymoon}</option>
                    <option value="paws">{tt.paws}</option>
                  </FormSelectField>

                  <FormField
                    className={profileFieldClassName}
                    id="profile-interests"
                    label={p.labels.interests}
                    onChange={(e) =>
                      setDetailsForm((prev) => ({
                        ...prev,
                        interests: e.target.value
                          .split(",")
                          .map((i) => i.trim())
                          .filter((i) => i !== ""),
                      }))
                    }
                    readOnly={!isDetailsEditing}
                    type="text"
                    value={detailsForm.interests.filter((i) => i).join(", ")}
                  />

                  <FormField
                    className={profileFieldClassName}
                    id="profile-dislikes"
                    label={p.labels.dislikes}
                    onChange={(e) =>
                      setDetailsForm((prev) => ({
                        ...prev,
                        dislikes: e.target.value
                          .split(",")
                          .map((i) => i.trim())
                          .filter((i) => i !== ""),
                      }))
                    }
                    readOnly={!isDetailsEditing}
                    type="text"
                    value={detailsForm.dislikes.filter((d) => d).join(", ")}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal with Tabs */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b flex items-center justify-between">
                <div className="flex-1 p-6">
                  <h3 className="text-xl font-semibold text-neutral-900">
                    {p.modal.title}
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className="p-6 text-neutral-500 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("personal")}
                    className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "personal"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    <User className="mr-2 inline h-4 w-4" />
                    {p.modal.tabPersonal}
                  </button>
                  <button
                    onClick={() => setActiveTab("preferences")}
                    className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "preferences"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    <Settings className="mr-2 inline h-4 w-4" />
                    {p.modal.tabPreferences}
                  </button>
                  <button
                    onClick={() => setActiveTab("security")}
                    className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "security"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    <Lock className="mr-2 inline h-4 w-4" />
                    {p.modal.tabSecurity}
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "personal" && (
                  <div className="space-y-4">
                    <FormField
                      id="modal-profile-name"
                      label={p.labels.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={p.modal.namePlaceholder}
                      type="text"
                      value={formData.name}
                    />
                    <FormField
                      id="modal-profile-email"
                      label={p.labels.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder={p.modal.emailPlaceholder}
                      type="email"
                      value={formData.email}
                    />
                  </div>
                )}

                {activeTab === "preferences" && (
                  <div className="space-y-4">
                    <FormSelectField
                      id="modal-profile-traveler"
                      label={p.modal.travelerType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          travelerType: e.target.value,
                        })
                      }
                      value={formData.travelerType}
                    >
                      <option value="">{tt.selectPlaceholder}</option>
                      <option value="solo">{tt.solo}</option>
                      <option value="couple">{tt.couple}</option>
                      <option value="family">{tt.family}</option>
                      <option value="group">{tt.group}</option>
                      <option value="honeymoon">{tt.honeymoon}</option>
                      <option value="paws">{tt.paws}</option>
                    </FormSelectField>

                    <FormField
                      id="modal-profile-interests"
                      label={p.modal.interests}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          interests: e.target.value
                            .split(",")
                            .map((i) => i.trim())
                            .filter((i) => i !== ""),
                        })
                      }
                      placeholder={p.modal.interestsPlaceholder}
                      type="text"
                      value={formData.interests.filter((i) => i).join(", ")}
                    />

                    <FormField
                      id="modal-profile-dislikes"
                      label={p.modal.dislikes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dislikes: e.target.value
                            .split(",")
                            .map((i) => i.trim())
                            .filter((i) => i !== ""),
                        })
                      }
                      placeholder={p.modal.dislikesPlaceholder}
                      type="text"
                      value={formData.dislikes.filter((d) => d).join(", ")}
                    />
                  </div>
                )}

                {activeTab === "security" && (
                  <div className="space-y-4">
                    <FormField
                      autoComplete="current-password"
                      id="modal-profile-current-password"
                      label={p.modal.currentPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder={p.modal.passwordPlaceholder}
                      type="password"
                      value={formData.currentPassword}
                    />

                    <FormField
                      autoComplete="new-password"
                      id="modal-profile-new-password"
                      label={p.modal.newPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder={p.modal.passwordPlaceholder}
                      type="password"
                      value={formData.newPassword}
                    />

                    <FormField
                      autoComplete="new-password"
                      id="modal-profile-confirm-password"
                      label={p.modal.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder={p.modal.passwordPlaceholder}
                      type="password"
                      value={formData.confirmPassword}
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 flex gap-3 border-t bg-white p-6">
                <Button
                  className="flex-1"
                  onClick={closeModal}
                  variant="outline"
                >
                  {p.buttons.modalCancel}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (activeTab === "personal") handleSavePersonal();
                    else if (activeTab === "preferences")
                      handleSavePreferences();
                    else if (activeTab === "security") handleChangePassword();
                  }}
                >
                  {p.buttons.modalSave}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}

const ProfilePage = dynamic(() => Promise.resolve(ProfilePageComponent), {
  ssr: false,
});

function ProfilePageComponent() {
  return (
    <SecureRoute>
      <ProfileContent />
    </SecureRoute>
  );
}

export default ProfilePage;
