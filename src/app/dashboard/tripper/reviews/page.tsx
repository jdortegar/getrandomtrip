'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  title: string;
  content: string;
  tripType: string;
  destination: string;
  packageTitle: string;
  createdAt: Date | string;
}

interface ReviewsData {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  nps: number;
  promoters: number;
  detractors: number;
}

export default function TripperReviewsPage() {
  const { data: session } = useSession();
  const [reviewsData, setReviewsData] = useState<ReviewsData>({
    reviews: [],
    averageRating: 0,
    totalReviews: 0,
    nps: 0,
    promoters: 0,
    detractors: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const response = await fetch('/api/tripper/reviews');
        const data = await response.json();

        if (response.ok) {
          setReviewsData(data);
        } else {
          console.error('Error fetching reviews:', data.error);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getNpsColor = (nps: number) => {
    if (nps >= 50) return 'text-green-600';
    if (nps >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">
        Reseñas & NPS
      </h1>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-sm text-neutral-600 mb-2">Rating Promedio</p>
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500 fill-current" />
            <p className="text-2xl font-bold text-neutral-900">
              {reviewsData.averageRating.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-sm text-neutral-600 mb-2">Total Reseñas</p>
          <p className="text-2xl font-bold text-neutral-900">
            {reviewsData.totalReviews}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-sm text-neutral-600 mb-2">NPS</p>
          <p
            className={`text-2xl font-bold ${getNpsColor(reviewsData.nps)}`}
          >
            {reviewsData.nps > 0 ? '+' : ''}
            {reviewsData.nps.toFixed(0)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-sm text-neutral-600 mb-2">Promotores</p>
          <p className="text-2xl font-bold text-green-600">
            {reviewsData.promoters}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {reviewsData.detractors} detractores
          </p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">
          Reseñas de Clientes
        </h2>

        {reviewsData.reviews.length === 0 ? (
          <p className="text-center text-neutral-500 py-8">
            Aún no tienes reseñas. Las reseñas aparecerán aquí cuando los
            clientes completen sus viajes y califiquen su experiencia.
          </p>
        ) : (
          <div className="space-y-6">
            {reviewsData.reviews.map((review) => (
              <div
                key={review.id}
                className="border-b border-neutral-100 pb-6 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {review.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-neutral-900">
                          {review.userName}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {review.packageTitle} • {review.destination}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < review.rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-neutral-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <h3 className="font-medium text-neutral-900 mb-2">
                      {review.title}
                    </h3>
                    {review.content && (
                      <p className="text-neutral-700 mb-2">{review.content}</p>
                    )}
                    <p className="text-xs text-neutral-500">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
