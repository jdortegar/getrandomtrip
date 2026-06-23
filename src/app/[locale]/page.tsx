import { getAllTrippers, getHomepageTestimonials } from "@/lib/db/tripper-queries";
import { HomePageClient } from "./HomePageClient";

export default async function HomePage() {
  const [trippers, testimonials] = await Promise.all([
    getAllTrippers(),
    getHomepageTestimonials(),
  ]);
  return <HomePageClient trippers={trippers} testimonials={testimonials} />;
}
