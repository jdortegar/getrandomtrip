import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import ResetPasswordClient from "@/components/auth/ResetPasswordClient";

type Props = {
  params: Promise<{ locale?: string | string[] }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: Props) {
  const resolvedParams = await params;
  const raw = resolvedParams?.locale;
  const localeStr = typeof raw === "string" ? raw : raw?.[0];
  const locale = hasLocale(localeStr) ? localeStr : "es";
  const { token } = await searchParams;
  const dict = await getDictionary(locale);

  return (
    <ResetPasswordClient
      token={token ?? null}
      locale={locale}
      copy={dict.resetPasswordPage}
    />
  );
}
