import { notFound } from "next/navigation";
import PageContainer from "@/components/user/PageContainer";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import TabsHost from "@/components/profile/TabsHost";
import { getPublicProfileByHandle } from "@/lib/profile";

export const revalidate = 60;

type Params = { params: { handle: string } };

export async function generateMetadata({ params }: Params) {
  const data = await getPublicProfileByHandle(params.handle);
  if (!data) return {};
  const title = `${data.name} (@${data.handle}) | Randomtrip`;
  const description = data.bio || "Perfil público en Randomtrip.";
  const images = data.cover ? [data.cover] : undefined;
  return { title, description, openGraph: { title, description, images } };
}

export default async function PublicProfilePage({ params }: Params) {
  const data = await getPublicProfileByHandle(params.handle);
  if (!data || data.publicProfile === false) return notFound();

  return (
    <PageContainer>
      <ProfileHeader
        name={data.name}
        handle={data.handle}
        country={data.country}
        avatar={data.avatar}
        cover={data.cover}
        verified={data.verified}
        bio={data.bio}
        socials={data.socials}
      />

      <ProfileStats
        b={data.metrics.bookings12m}
        spendUSD={data.metrics.spendUSD}
        r={data.metrics.reviews}
        f={data.metrics.favs}
      />

      <TabsHost data={data} />

    </PageContainer>
  );
}
