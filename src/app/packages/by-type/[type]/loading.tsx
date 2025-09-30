export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero skeleton */}
      <div className="h-96 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />

      {/* Content skeleton */}
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-12">
          {/* Title skeleton */}
          <div className="text-center space-y-4">
            <div className="h-12 bg-gray-200 rounded-lg w-3/4 mx-auto animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto animate-pulse" />
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          {/* Benefits skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-6 bg-white rounded-lg shadow-sm">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
