"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/slices/userStore";
import SecureRoute from "@/components/auth/SecureRoute";
import Badge from "@/components/badge";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import HeaderHero from "@/components/journey/HeaderHero";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import {
  Briefcase,
  CreditCard,
  Edit,
  FileText,
  Lock,
  MapPin,
  Settings,
  Star,
  User,
  Calendar,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { toast } from "sonner";
import type { UserProfileMe } from "@/lib/types/UserProfileMe";
import { UserAvatar } from "@/components/ui/UserAvatar";
import Link from "next/link";

type TabId =
  | "resumen"
  | "personal"
  | "documentos"
  | "preferencias"
  | "pagos"
  | "seguridad";

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

function AccountContent() {
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
  const [activeTab, setActiveTab] = useState<TabId>("resumen");
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

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { getDictionary(resolvedLocale).then(setDict); }, [resolvedLocale]);

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
        const avg = rated.length > 0
          ? rated.reduce((s: number, t: any) => s + (t.customerRating || 0), 0) / rated.length
          : 0;
        setStats({ totalTrips: trips.length, averageRating: avg });
      } catch {}
    }
    fetchStats();
  }, [currentUser?.id, session]);

  // Strict role check — hasRoleAccess promotes admin to all roles,
  // so we check the roles array directly to avoid showing tripper UI to admins.
  const userRoles: string[] = profileMe?.roles ??
    (currentUser as { roles?: string[] } | null | undefined)?.roles ?? [];
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
    if (!detailsForm.name.trim()) { toast.error(t.nameRequired); return; }
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
      if (!resUpdate.ok || !resPrefs.ok) { toast.error(t.saveError); return; }
      const [updateData, prefsData] = await Promise.all([resUpdate.json(), resPrefs.json()]);
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
    if (file.size > 5 * 1024 * 1024) { toast.error(t.avatarFileTooLarge); return; }
    setAvatarUploading(true);
    try {
      const oldAvatarUrl = user?.avatar;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("feature", "avatar");
      const uploadRes = await fetch("/api/upload", { body: formData, method: "POST" });
      if (!uploadRes.ok) { toast.error(t.avatarUploadError); return; }
      const { url } = (await uploadRes.json()) as { url?: string };
      if (!url) { toast.error(t.avatarUploadError); return; }
      const updateRes = await fetch("/api/user/update", {
        body: JSON.stringify({ avatarUrl: url }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!updateRes.ok) { toast.error(t.avatarUploadError); return; }
      await updateSession({ ...session, user: { ...session?.user, image: url } });
      useUserStore.setState((s) => ({ user: s.user ? { ...s.user, avatar: url } : s.user }));
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
    if (securityForm.newPassword !== securityForm.confirmPassword) { toast.error(t.passwordsMismatch); return; }
    if (securityForm.newPassword.length < 6) { toast.error(t.passwordMinLength); return; }
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: securityForm.currentPassword, newPassword: securityForm.newPassword }),
      });
      if (res.ok) {
        toast.success(t.passwordUpdated);
        setSecurityForm({ confirmPassword: "", currentPassword: "", newPassword: "" });
      } else {
        const data = await res.json();
        toast.error(typeof data.error === "string" ? data.error : t.passwordError);
      }
    } catch {
      toast.error(t.passwordError);
    }
  };

  if (!dict) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  const p = dict.profile;
  const tt = p.travelerTypes;
  const fieldCn = cn(!isDetailsEditing && "cursor-not-allowed opacity-80");

  const memberSince = profileMe
    ? new Date(profileMe.createdAt).toLocaleDateString(dateLocaleTag, { month: "long", year: "numeric" })
    : "";

  const navItems: { id: TabId; label: string; Icon: React.ElementType }[] = [
    { id: "resumen",      label: p.nav.summary,      Icon: User },
    { id: "personal",     label: p.nav.personal,     Icon: Edit },
    { id: "documentos",   label: p.nav.travelDocs,   Icon: FileText },
    { id: "preferencias", label: p.nav.preferences,  Icon: MapPin },
    { id: "pagos",        label: p.nav.payments,     Icon: CreditCard },
    { id: "seguridad",    label: p.nav.security,     Icon: Lock },
  ];

  const tripperNavLinks = isTripper
    ? [
        { href: pathForLocale(resolvedLocale, "/trippers/profile"), label: p.nav.tripperProfile, Icon: Briefcase },
        { href: pathForLocale(resolvedLocale, "/dashboard/tripper"),          label: p.nav.tripperOs,      Icon: Settings },
      ]
    : [];

  return (
    <>
      <HeaderHero
        className="h-[40vh]"
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle={p.hero.subtitle}
        title={p.hero.title}
        videoSrc="/videos/hero-video-1.mp4"
      />

      <section className="bg-neutral-50 py-10">
        <div className="mx-auto max-w-6xl px-4">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">

            {/* ── Sidebar (left, desktop only, sticky) ── */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-24 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    {p.hero.title}
                  </p>
                </div>
                <nav className="flex flex-col gap-0.5 p-2">
                  {navItems.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                        activeTab === id
                          ? "bg-gray-100 font-semibold text-gray-900"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{label}</span>
                    </button>
                  ))}
                  {tripperNavLinks.length > 0 && (
                    <>
                      <div className="my-1 border-t border-gray-100" />
                      {tripperNavLinks.map(({ href, label, Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{label}</span>
                        </Link>
                      ))}
                    </>
                  )}
                </nav>
              </div>
            </aside>

            {/* ── Main content ── */}
            <div className="min-w-0 flex-1">

              {/* 1. Resumen */}
              {activeTab === "resumen" && (
                <div className="space-y-6">
                  {/* Profile header */}
                  <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-md ring-1 ring-gray-100">
                    <div className="flex flex-col items-center gap-6 md:flex-row">
                      <UserAvatar
                        height={96}
                        onAvatarChange={handleAvatarChange}
                        showStatus
                        uploading={avatarUploading}
                        width={96}
                      />
                      <div className="flex-1 text-center md:text-left">
                        <h1 className="mb-1 text-2xl font-bold text-neutral-900">
                          {currentUser?.name || p.header.userFallback}
                        </h1>
                        <p className="mb-3 text-sm text-neutral-500">
                          {currentUser?.email || p.header.emailFallback}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                          <Badge color="primary" item={{ key: "badge-active", value: p.header.badgeActiveTraveler }} size="md" />
                          {isTripper && (
                            <Badge color="secondary" item={{ key: "badge-tripper", value: "Tripper" }} size="md" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex flex-col gap-1 rounded-2xl bg-white p-5 shadow-md ring-1 ring-gray-100">
                      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
                        <Calendar className="h-4 w-4 text-light-blue" />
                        {p.labels.memberSince}
                      </div>
                      <span className="font-semibold text-neutral-900">{memberSince || "—"}</span>
                    </div>
                    <div className="flex flex-col gap-1 rounded-2xl bg-white p-5 shadow-md ring-1 ring-gray-100">
                      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
                        <Globe className="h-4 w-4 text-light-blue" />
                        {resolvedLocale === "en" ? "Total trips" : "Viajes totales"}
                      </div>
                      <span className="font-barlow-condensed font-bold text-4xl text-gray-900">
                        {stats.totalTrips}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 rounded-2xl bg-white p-5 shadow-md ring-1 ring-gray-100">
                      <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
                        <Star className="h-4 w-4 text-light-blue" />
                        {resolvedLocale === "en" ? "Avg. rating" : "Calificación prom."}
                      </div>
                      <span className="font-barlow-condensed font-bold text-4xl text-gray-900">
                        {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Preferences summary */}
                  {(detailsForm.travelerType || detailsForm.interests.length > 0 || detailsForm.dislikes.length > 0) && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-neutral-900">{p.preferencesSectionTitle}</h3>
                        <button
                          onClick={() => setActiveTab("preferencias")}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {p.buttons.editDetails}
                        </button>
                      </div>
                      <div className="space-y-3">
                        {detailsForm.travelerType && (
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-neutral-500 w-32 shrink-0">{p.labels.travelerType}</span>
                            <span className="text-sm text-neutral-800 capitalize">{detailsForm.travelerType}</span>
                          </div>
                        )}
                        {detailsForm.interests.length > 0 && (
                          <div className="flex items-start gap-3">
                            <span className="text-sm font-medium text-neutral-500 w-32 shrink-0">{resolvedLocale === "en" ? "Interests" : "Intereses"}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {detailsForm.interests.map((i) => (
                                <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-100">{i}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {detailsForm.dislikes.length > 0 && (
                          <div className="flex items-start gap-3">
                            <span className="text-sm font-medium text-neutral-500 w-32 shrink-0">{resolvedLocale === "en" ? "Avoid" : "Evitar"}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {detailsForm.dislikes.map((d) => (
                                <span key={d} className="px-2 py-0.5 text-xs rounded-full bg-red-50 text-red-700 border border-red-100">{d}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Datos personales */}
              {activeTab === "personal" && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-neutral-900">{p.personalSectionTitle}</h2>
                    {!isDetailsEditing ? (
                      <Button disabled={profileLoading || !profileMe} onClick={handleStartDetailsEdit} size="sm" variant="secondary">
                        <Edit className="mr-2 h-4 w-4" />{p.buttons.editDetails}
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={handleCancelDetailsEdit} size="sm" variant="secondary">{p.buttons.cancel}</Button>
                        <Button onClick={handleSaveDetails} size="sm">{p.buttons.saveChanges}</Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField className={fieldCn} id="acc-name" label={p.labels.name}
                        onChange={(e) => setDetailsForm((p) => ({ ...p, name: e.target.value }))}
                        readOnly={!isDetailsEditing} type="text" value={detailsForm.name} />
                      <FormField className={fieldCn} id="acc-phone" label={p.labels.phone}
                        onChange={(e) => setDetailsForm((p) => ({ ...p, phone: e.target.value }))}
                        readOnly={!isDetailsEditing} type="tel" value={detailsForm.phone} />
                    </div>
                    <FormField className={fieldCn} id="acc-email" label={p.labels.email}
                      onChange={(e) => setDetailsForm((p) => ({ ...p, email: e.target.value }))}
                      readOnly={!isDetailsEditing} type="email" value={detailsForm.email} />
                    <FormField className={fieldCn} id="acc-street" label={p.labels.street}
                      onChange={(e) => setDetailsForm((p) => ({ ...p, street: e.target.value }))}
                      readOnly={!isDetailsEditing} type="text" value={detailsForm.street} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField className={fieldCn} id="acc-city" label={p.labels.city}
                        onChange={(e) => setDetailsForm((p) => ({ ...p, city: e.target.value }))}
                        readOnly={!isDetailsEditing} type="text" value={detailsForm.city} />
                      <FormField className={fieldCn} id="acc-state" label={p.labels.state}
                        onChange={(e) => setDetailsForm((p) => ({ ...p, state: e.target.value }))}
                        readOnly={!isDetailsEditing} type="text" value={detailsForm.state} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField className={fieldCn} id="acc-zip" label={p.labels.zipCode}
                        onChange={(e) => setDetailsForm((p) => ({ ...p, zipCode: e.target.value }))}
                        readOnly={!isDetailsEditing} type="text" value={detailsForm.zipCode} />
                      <FormField className={fieldCn} id="acc-country" label={p.labels.country}
                        onChange={(e) => setDetailsForm((p) => ({ ...p, country: e.target.value }))}
                        readOnly={!isDetailsEditing} type="text" value={detailsForm.country} />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Documentos de viaje */}
              {activeTab === "documentos" && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-2">{p.sections.travelDocs}</h2>
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FileText className="h-14 w-14 text-neutral-200 mb-4" />
                    <p className="text-base font-medium text-neutral-500">{p.comingSoon}</p>
                    <p className="mt-1 text-sm text-neutral-400">{p.comingSoonDescription}</p>
                  </div>
                </div>
              )}

              {/* 4. Preferencias de viaje */}
              {activeTab === "preferencias" && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-neutral-900">{p.preferencesSectionTitle}</h2>
                    {!isDetailsEditing ? (
                      <Button disabled={profileLoading || !profileMe} onClick={handleStartDetailsEdit} size="sm" variant="secondary">
                        <Edit className="mr-2 h-4 w-4" />{p.buttons.editDetails}
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={handleCancelDetailsEdit} size="sm" variant="secondary">{p.buttons.cancel}</Button>
                        <Button onClick={handleSaveDetails} size="sm">{p.buttons.saveChanges}</Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <FormSelectField className={fieldCn} disabled={!isDetailsEditing} id="acc-traveler-type"
                      label={p.labels.travelerType}
                      onChange={(e) => setDetailsForm((p) => ({ ...p, travelerType: e.target.value }))}
                      value={detailsForm.travelerType}>
                      <option value="">{tt.selectPlaceholder}</option>
                      <option value="solo">{tt.solo}</option>
                      <option value="couple">{tt.couple}</option>
                      <option value="family">{tt.family}</option>
                      <option value="group">{tt.group}</option>
                      <option value="honeymoon">{tt.honeymoon}</option>
                      <option value="paws">{tt.paws}</option>
                    </FormSelectField>
                    <FormField className={fieldCn} id="acc-interests" label={p.labels.interests}
                      onChange={(e) => setDetailsForm((p) => ({
                        ...p, interests: e.target.value.split(",").map((i) => i.trim()).filter((i) => i !== ""),
                      }))}
                      readOnly={!isDetailsEditing} type="text"
                      value={detailsForm.interests.filter((i) => i).join(", ")} />
                    <FormField className={fieldCn} id="acc-dislikes" label={p.labels.dislikes}
                      onChange={(e) => setDetailsForm((p) => ({
                        ...p, dislikes: e.target.value.split(",").map((i) => i.trim()).filter((i) => i !== ""),
                      }))}
                      readOnly={!isDetailsEditing} type="text"
                      value={detailsForm.dislikes.filter((d) => d).join(", ")} />
                  </div>
                </div>
              )}

              {/* 5. Métodos de pago */}
              {activeTab === "pagos" && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-2">{p.sections.payments}</h2>
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <CreditCard className="h-14 w-14 text-neutral-200 mb-4" />
                    <p className="text-base font-medium text-neutral-500">{p.comingSoon}</p>
                    <p className="mt-1 text-sm text-neutral-400">{p.comingSoonDescription}</p>
                  </div>
                </div>
              )}

              {/* 6. Seguridad */}
              {activeTab === "seguridad" && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-neutral-900">{p.sections.security}</h2>
                    <Button onClick={handleChangePassword} size="sm">
                      <Lock className="mr-2 h-4 w-4" />{p.buttons.saveChanges}
                    </Button>
                  </div>
                  <div className="max-w-md space-y-4">
                    <FormField autoComplete="current-password" id="acc-current-password"
                      label={p.modal.currentPassword}
                      onChange={(e) => setSecurityForm((p) => ({ ...p, currentPassword: e.target.value }))}
                      placeholder={p.modal.passwordPlaceholder} type="password" value={securityForm.currentPassword} />
                    <FormField autoComplete="new-password" id="acc-new-password"
                      label={p.modal.newPassword}
                      onChange={(e) => setSecurityForm((p) => ({ ...p, newPassword: e.target.value }))}
                      placeholder={p.modal.passwordPlaceholder} type="password" value={securityForm.newPassword} />
                    <FormField autoComplete="new-password" id="acc-confirm-password"
                      label={p.modal.confirmPassword}
                      onChange={(e) => setSecurityForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                      placeholder={p.modal.passwordPlaceholder} type="password" value={securityForm.confirmPassword} />
                  </div>
                </div>
              )}


            </div>

          </div>
        </div>
      </section>
    </>
  );
}

const AccountPage = dynamic(() => Promise.resolve(AccountPageComponent), {
  ssr: false,
});

function AccountPageComponent() {
  return (
    <SecureRoute>
      <AccountContent />
    </SecureRoute>
  );
}

export default AccountPage;
