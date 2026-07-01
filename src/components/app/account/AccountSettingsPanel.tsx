"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Briefcase,
  Calendar,
  Check,
  Clipboard,
  CreditCard,
  Edit,
  Globe,
  Lock,
  MapPin,
  Pencil,
  Settings,
  Star,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { useUserStore } from "@/store/slices/userStore";
import Badge from "@/components/badge";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { UserAvatar } from "@/components/ui/UserAvatar";
import EmptyState from "@/components/profile/EmptyState";
import { AccountSettingsTagList } from "@/components/app/account/AccountSettingsTagList";
import { AccountSettingsPasswordField } from "@/components/app/account/AccountSettingsPasswordField";
import { cn } from "@/lib/utils";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { UserProfileMe } from "@/lib/types/UserProfileMe";

type TabId =
  | "overview"
  | "personal"
  | "preferences"
  | "security"
  | "documents"
  | "payments";

const EDITABLE_TABS: TabId[] = ["personal", "preferences"];

const TRAVELER_TYPE_KEYS = [
  "solo",
  "couple",
  "family",
  "group",
  "honeymoon",
  "paws",
] as const;

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

interface SecurityFormState {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
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

interface AccountSettingsPanelProps {
  role: "client" | "tripper";
}

export function AccountSettingsPanel({ role }: AccountSettingsPanelProps) {
  const params = useParams();
  const localeParam = (params?.locale as string) ?? "es";
  const resolvedLocale = hasLocale(localeParam) ? localeParam : "es";
  const dateLocaleTag = resolvedLocale === "en" ? "en-US" : "es-ES";

  const { data: session, update: updateSession } = useSession();
  const { user } = useUserStore();
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [profileMe, setProfileMe] = useState<UserProfileMe | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
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
  const [securityForm, setSecurityForm] = useState<SecurityFormState>({
    confirmPassword: "",
    currentPassword: "",
    newPassword: "",
  });
  const [stats, setStats] = useState({ totalTrips: 0, averageRating: 0 });
  const [passwordJustSaved, setPasswordJustSaved] = useState(false);
  const passwordSavedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (passwordSavedTimeoutRef.current) {
        clearTimeout(passwordSavedTimeoutRef.current);
      }
    };
  }, []);

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
      if (data.user) setProfileMe(data.user as UserProfileMe);
    } catch (e) {
      console.error("Error loading profile:", e);
    } finally {
      setProfileLoading(false);
    }
  }, [currentUser?.email]);

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

  useEffect(() => {
    async function fetchStats() {
      if (!currentUser?.id) return;
      try {
        const res = await fetch(`/api/trips?userId=${currentUser.id}`);
        const data = await res.json();
        if (data.error) return;
        const trips = data.trips ?? [];
        const rated = trips.filter((t: any) => t.customerRating);
        const avg =
          rated.length > 0
            ? rated.reduce(
                (s: number, t: any) => s + (t.customerRating || 0),
                0,
              ) / rated.length
            : 0;
        setStats({ totalTrips: trips.length, averageRating: avg });
      } catch {}
    }
    fetchStats();
  }, [currentUser?.id, session]);

  // Strict role check — hasRoleAccess promotes admin to all roles,
  // so we check the roles array directly to avoid showing tripper UI to admins.
  const userRoles: string[] =
    profileMe?.roles ??
    (currentUser as { roles?: string[] } | null | undefined)?.roles ??
    [];
  const isTripper = userRoles.some((r) => r?.toLowerCase() === "tripper");

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
    if (!detailsForm.name.trim()) {
      toast.error(t.nameRequired);
      return;
    }
    try {
      const [resUpdate, resPrefs] = await Promise.all([
        fetch("/api/user/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: detailsForm.name.trim(),
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
      const [updateData, prefsData] = await Promise.all([
        resUpdate.json(),
        resPrefs.json(),
      ]);
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
    } catch {
      toast.error(t.saveError);
    }
  };

  const handleAvatarChange = async (file: File) => {
    if (!dict) return;
    const t = dict.profile.toasts;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t.avatarFileTooLarge);
      return;
    }
    setAvatarUploading(true);
    try {
      const oldAvatarUrl = user?.avatar;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("feature", "avatar");
      const uploadRes = await fetch("/api/upload", {
        body: formData,
        method: "POST",
      });
      if (!uploadRes.ok) {
        toast.error(t.avatarUploadError);
        return;
      }
      const { url } = (await uploadRes.json()) as { url?: string };
      if (!url) {
        toast.error(t.avatarUploadError);
        return;
      }
      const updateRes = await fetch("/api/user/update", {
        body: JSON.stringify({ avatarUrl: url }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!updateRes.ok) {
        toast.error(t.avatarUploadError);
        return;
      }
      await updateSession({
        ...session,
        user: { ...session?.user, image: url },
      });
      useUserStore.setState((s) => ({
        user: s.user ? { ...s.user, avatar: url } : s.user,
      }));
      if (oldAvatarUrl?.includes("/api/upload")) {
        void fetch(oldAvatarUrl, { method: "DELETE" }).catch(() => null);
      }
      toast.success(t.avatarUploadSuccess);
    } catch {
      toast.error(t.avatarUploadError);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!dict) return;
    const t = dict.profile.toasts;
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error(t.passwordsMismatch);
      return;
    }
    if (securityForm.newPassword.length < 6) {
      toast.error(t.passwordMinLength);
      return;
    }
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: securityForm.currentPassword,
          newPassword: securityForm.newPassword,
        }),
      });
      if (res.ok) {
        toast.success(t.passwordUpdated);
        setSecurityForm({
          confirmPassword: "",
          currentPassword: "",
          newPassword: "",
        });
        setPasswordJustSaved(true);
        passwordSavedTimeoutRef.current = setTimeout(
          () => setPasswordJustSaved(false),
          2000,
        );
      } else {
        const data = await res.json();
        toast.error(
          typeof data.error === "string" ? data.error : t.passwordError,
        );
      }
    } catch {
      toast.error(t.passwordError);
    }
  };

  if (!dict) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-light-blue border-t-transparent" />
      </div>
    );
  }

  const p = dict.profile;
  const tt = p.travelerTypes;
  const fieldCn = cn(!isDetailsEditing && "cursor-not-allowed opacity-80");

  const memberSince = profileMe
    ? new Date(profileMe.createdAt).toLocaleDateString(dateLocaleTag, {
        month: "long",
        year: "numeric",
      })
    : "";

  const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
    { id: "overview", label: p.nav.summary, Icon: User },
    { id: "personal", label: p.nav.personal, Icon: Pencil },
    { id: "preferences", label: p.nav.preferences, Icon: MapPin },
    { id: "security", label: p.nav.security, Icon: Lock },
    { id: "documents", label: p.nav.travelDocs, Icon: Clipboard },
    { id: "payments", label: p.nav.payments, Icon: CreditCard },
  ];

  // Cross-link to the public tripper profile / Tripper OS — only relevant
  // for client-side traveler accounts that also have the tripper role.
  const tripperNavLinks =
    role === "client" && isTripper
      ? [
          {
            href: pathForLocale(resolvedLocale, "/trippers/profile"),
            label: p.nav.tripperProfile,
            Icon: Briefcase,
          },
          {
            href: pathForLocale(resolvedLocale, "/dashboard/tripper"),
            label: p.nav.tripperOs,
            Icon: Settings,
          },
        ]
      : [];

  function renderTabHeader(title: string, tab: TabId) {
    if (!EDITABLE_TABS.includes(tab)) {
      return (
        <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
      );
    }
    return (
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
        {!isDetailsEditing ? (
          <Button
            disabled={profileLoading || !profileMe}
            onClick={handleStartDetailsEdit}
            size="sm"
            variant="secondary"
          >
            <Edit className="mr-2 h-4 w-4" />
            {p.buttons.editDetails}
          </Button>
        ) : (
          <div className="flex gap-2">
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
          </div>
        )}
      </div>
    );
  }

  const hasPreferences =
    detailsForm.travelerType ||
    detailsForm.interests.length > 0 ||
    detailsForm.dislikes.length > 0;

  const passwordsMatch =
    securityForm.newPassword.length > 0 &&
    securityForm.newPassword === securityForm.confirmPassword;
  const passwordsMismatchVisible =
    securityForm.newPassword.length > 0 &&
    securityForm.confirmPassword.length > 0 &&
    securityForm.newPassword !== securityForm.confirmPassword;

  return (
    <div className="space-y-6">
      {/* Horizontal tab bar */}
      <div className="overflow-x-auto border-b-2 border-gray-200">
        <div className="flex gap-1">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors",
                activeTab === id
                  ? "border-light-blue font-semibold text-light-blue"
                  : "border-transparent text-neutral-500 hover:text-neutral-700",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl bg-neutral-50 p-6 sm:flex-row sm:items-center">
            <UserAvatar
              height={64}
              onAvatarChange={handleAvatarChange}
              showStatus
              uploading={avatarUploading}
              width={64}
            />
            <div className="flex-1">
              <p className="text-lg font-bold text-neutral-900">
                {currentUser?.name || p.header.userFallback}
              </p>
              <p className="text-sm text-neutral-500">
                {currentUser?.email || p.header.emailFallback}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {isTripper ? (
                  <Badge
                    color="secondary"
                    item={{ key: "badge-tripper", value: p.header.badgeTripper }}
                    size="md"
                  />
                ) : (
                  <Badge
                    color="primary"
                    item={{
                      key: "badge-active",
                      value: p.header.badgeActiveTraveler,
                    }}
                    size="md"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                <Calendar className="h-4 w-4 text-light-blue" />
                {p.labels.memberSince}
              </div>
              <span className="mt-2 block font-barlow-condensed text-3xl font-extrabold text-gray-900">
                {memberSince || "—"}
              </span>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                <Globe className="h-4 w-4 text-light-blue" />
                {p.labels.totalTrips}
              </div>
              <span className="mt-2 block font-barlow-condensed text-3xl font-extrabold text-gray-900">
                {stats.totalTrips}
              </span>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                <Star className="h-4 w-4 text-light-blue" />
                {p.labels.avgRating}
              </div>
              <span className="mt-2 block font-barlow-condensed text-3xl font-extrabold text-gray-900">
                {stats.averageRating > 0
                  ? stats.averageRating.toFixed(1)
                  : "—"}
              </span>
            </div>
          </div>

          {hasPreferences && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">
                  {p.preferencesSectionTitle}
                </h3>
                <button
                  onClick={() => setActiveTab("preferences")}
                  className="text-sm text-light-blue hover:underline"
                >
                  {p.buttons.editDetails} →
                </button>
              </div>
              <div className="space-y-3">
                {detailsForm.travelerType && (
                  <div className="flex items-center gap-3">
                    <span className="w-[90px] shrink-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      {p.labels.travelerType}
                    </span>
                    <span className="text-sm text-neutral-800">
                      {tt[detailsForm.travelerType as keyof typeof tt] ??
                        detailsForm.travelerType}
                    </span>
                  </div>
                )}
                {detailsForm.interests.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="w-[90px] shrink-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      {p.labels.interests}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {detailsForm.interests.map((i) => (
                        <span
                          key={i}
                          className="rounded-full border border-gray-200 bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700"
                        >
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {detailsForm.dislikes.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="w-[90px] shrink-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      {p.labels.dislikes}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {detailsForm.dislikes.map((d) => (
                        <span
                          key={d}
                          className="rounded-full border border-gray-200 bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tripperNavLinks.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
              {tripperNavLinks.map(({ href, label, Icon }) => (
                <Button asChild key={href} size="sm" variant="ghost">
                  <Link href={href}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Personal */}
      {activeTab === "personal" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {renderTabHeader(p.personalSectionTitle, "personal")}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                className={fieldCn}
                id="acc-name"
                label={p.labels.name}
                onChange={(e) =>
                  setDetailsForm((f) => ({ ...f, name: e.target.value }))
                }
                readOnly={!isDetailsEditing}
                type="text"
                value={detailsForm.name}
              />
              <FormField
                className={fieldCn}
                id="acc-phone"
                label={p.labels.phone}
                onChange={(e) =>
                  setDetailsForm((f) => ({ ...f, phone: e.target.value }))
                }
                readOnly={!isDetailsEditing}
                type="tel"
                value={detailsForm.phone}
              />
            </div>
            <FormField
              className={fieldCn}
              id="acc-email"
              label={p.labels.email}
              onChange={(e) =>
                setDetailsForm((f) => ({ ...f, email: e.target.value }))
              }
              readOnly={!isDetailsEditing}
              type="email"
              value={detailsForm.email}
            />

            <p className="pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
              {p.labels.addressSection}
            </p>
            <FormField
              className={fieldCn}
              id="acc-street"
              label={p.labels.street}
              onChange={(e) =>
                setDetailsForm((f) => ({ ...f, street: e.target.value }))
              }
              readOnly={!isDetailsEditing}
              type="text"
              value={detailsForm.street}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                className={fieldCn}
                id="acc-city"
                label={p.labels.city}
                onChange={(e) =>
                  setDetailsForm((f) => ({ ...f, city: e.target.value }))
                }
                readOnly={!isDetailsEditing}
                type="text"
                value={detailsForm.city}
              />
              <FormField
                className={fieldCn}
                id="acc-state"
                label={p.labels.state}
                onChange={(e) =>
                  setDetailsForm((f) => ({ ...f, state: e.target.value }))
                }
                readOnly={!isDetailsEditing}
                type="text"
                value={detailsForm.state}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                className={fieldCn}
                id="acc-zip"
                label={p.labels.zipCode}
                onChange={(e) =>
                  setDetailsForm((f) => ({ ...f, zipCode: e.target.value }))
                }
                readOnly={!isDetailsEditing}
                type="text"
                value={detailsForm.zipCode}
              />
              <FormField
                className={fieldCn}
                id="acc-country"
                label={p.labels.country}
                onChange={(e) =>
                  setDetailsForm((f) => ({ ...f, country: e.target.value }))
                }
                readOnly={!isDetailsEditing}
                type="text"
                value={detailsForm.country}
              />
            </div>
          </div>
        </div>
      )}

      {/* Preferences */}
      {activeTab === "preferences" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {renderTabHeader(p.preferencesSectionTitle, "preferences")}
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-500">
                {p.labels.travelerType}
              </p>
              <div className="flex flex-wrap gap-2">
                {TRAVELER_TYPE_KEYS.map((key) => {
                  const active = detailsForm.travelerType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!isDetailsEditing}
                      onClick={() =>
                        setDetailsForm((f) => ({ ...f, travelerType: key }))
                      }
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors",
                        active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-neutral-500",
                        !isDetailsEditing &&
                          !active &&
                          "opacity-40 cursor-not-allowed",
                        isDetailsEditing &&
                          !active &&
                          "hover:border-gray-400",
                      )}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                      {tt[key]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-neutral-500">
                {p.labels.interests}
              </p>
              <AccountSettingsTagList
                addAriaLabel={p.tagList.addAriaLabel}
                editing={isDetailsEditing}
                items={detailsForm.interests}
                onAdd={(value) =>
                  setDetailsForm((f) => ({
                    ...f,
                    interests: [...f.interests, value],
                  }))
                }
                onRemove={(value) =>
                  setDetailsForm((f) => ({
                    ...f,
                    interests: f.interests.filter((i) => i !== value),
                  }))
                }
                placeholder={p.modal.interestsPlaceholder}
                removeAriaLabel={p.tagList.removeAriaLabel}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-neutral-500">
                {p.labels.dislikes}
              </p>
              <AccountSettingsTagList
                addAriaLabel={p.tagList.addAriaLabel}
                editing={isDetailsEditing}
                items={detailsForm.dislikes}
                onAdd={(value) =>
                  setDetailsForm((f) => ({
                    ...f,
                    dislikes: [...f.dislikes, value],
                  }))
                }
                onRemove={(value) =>
                  setDetailsForm((f) => ({
                    ...f,
                    dislikes: f.dislikes.filter((d) => d !== value),
                  }))
                }
                placeholder={p.modal.dislikesPlaceholder}
                removeAriaLabel={p.tagList.removeAriaLabel}
              />
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      {activeTab === "security" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">
              {p.sections.security}
            </h2>
            <Button
              disabled={!passwordsMatch}
              onClick={handleChangePassword}
              size="sm"
              className={cn(
                passwordJustSaved && "border-green-600 bg-green-600",
              )}
            >
              <Lock className="mr-2 h-4 w-4" />
              {passwordJustSaved ? p.toasts.passwordUpdated : p.buttons.saveChanges}
            </Button>
          </div>
          <div className="max-w-md space-y-4">
            <AccountSettingsPasswordField
              autoComplete="current-password"
              label={p.modal.currentPassword}
              onChange={(value) =>
                setSecurityForm((f) => ({ ...f, currentPassword: value }))
              }
              placeholder={p.modal.passwordPlaceholder}
              value={securityForm.currentPassword}
            />
            <AccountSettingsPasswordField
              autoComplete="new-password"
              label={p.modal.newPassword}
              onChange={(value) =>
                setSecurityForm((f) => ({ ...f, newPassword: value }))
              }
              placeholder={p.modal.passwordPlaceholder}
              value={securityForm.newPassword}
            />
            <div>
              <AccountSettingsPasswordField
                autoComplete="new-password"
                label={p.modal.confirmPassword}
                onChange={(value) =>
                  setSecurityForm((f) => ({ ...f, confirmPassword: value }))
                }
                placeholder={p.modal.passwordPlaceholder}
                value={securityForm.confirmPassword}
              />
              {passwordsMismatchVisible && (
                <p className="mt-1.5 text-xs text-red-600">
                  {p.toasts.passwordsMismatch}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Documents */}
      {activeTab === "documents" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-neutral-900">
            {p.sections.travelDocs}
          </h2>
          <EmptyState subtitle={p.comingSoonDescription} title={p.comingSoon} />
        </div>
      )}

      {/* Payments */}
      {activeTab === "payments" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-neutral-900">
            {p.sections.payments}
          </h2>
          <EmptyState subtitle={p.comingSoonDescription} title={p.comingSoon} />
        </div>
      )}
    </div>
  );
}
