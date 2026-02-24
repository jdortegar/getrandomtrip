'use client';

import { useRouter } from 'next/navigation';
import SecureRoute from '@/components/auth/SecureRoute';
import Section from '@/components/layout/Section';
import Hero from '@/components/Hero';
import BlogComposer from '@/components/tripper/blog/BlogComposer';
import type { BlogPost } from '@/types/blog';

function CreateBlogContent() {
  const router = useRouter();

  // Initial empty post for creation
  const initialPost: Partial<BlogPost> = {
    id: 'new',
    title: '',
    subtitle: '',
    blocks: [],
    status: 'draft',
  };

  return (
    <>
      <Hero
        content={{
          title: 'Crear Nuevo Post',
          subtitle: 'Comparte tus experiencias y consejos de viaje',
          videoSrc: '/videos/hero-video.mp4',
          fallbackImage: '/images/bg-playa-mexico.jpg',
        }}
        className="!h-[40vh]"
      />

      <Section>
        <div className="max-w-full mx-auto">
          <BlogComposer post={initialPost} mode="create" />
        </div>
      </Section>
    </>
  );
}

function CreateBlogPage() {
  return (
    <SecureRoute requiredRole="tripper">
      <CreateBlogContent />
    </SecureRoute>
  );
}

export default CreateBlogPage;
