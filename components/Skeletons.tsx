'use client';

export function VehicleCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-gray-200 rounded-full" />
          <div className="h-4 w-12 bg-gray-200 rounded-full" />
        </div>
        <div className="h-5 w-3/4 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-12 bg-gray-100 rounded-lg" />
          <div className="h-12 bg-gray-100 rounded-lg" />
          <div className="h-12 bg-gray-100 rounded-lg" />
          <div className="h-12 bg-gray-100 rounded-lg" />
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="space-y-1">
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-5 w-24 bg-gray-200 rounded" />
          </div>
          <div className="h-8 w-16 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function VehicleGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <VehicleCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-3 w-16 bg-gray-200 rounded-full" />
          <div className="h-3 w-12 bg-gray-200 rounded-full" />
        </div>
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-2/3 bg-gray-200 rounded" />
        <div className="h-3 w-full bg-gray-100 rounded" />
        <div className="h-3 w-4/5 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export function ManufacturerGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center gap-3 animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-gray-200" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-3 w-12 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}

export function ComparisonSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
            </div>
            <div className="h-6 w-10 bg-gray-200 rounded-full" />
            <div className="w-16 h-16 rounded-2xl bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FAQSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
            <div className="h-5 w-5 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EVComparisonSkeleton() {
  return (
    <div className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="h-6 w-48 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="h-8 w-72 bg-gray-200 rounded-lg mx-auto mb-3" />
          <div className="h-4 w-96 bg-gray-100 rounded mx-auto" />
        </div>
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xl">
              <div className="h-6 w-48 bg-gray-200 rounded mb-6" />
              <div className="h-12 bg-gray-100 rounded-xl mb-6" />
              <div className="h-3 w-full bg-gray-200 rounded mb-2" />
              <div className="h-2 w-full bg-gray-100 rounded mb-6" />
              <div className="h-32 bg-gray-100 rounded-2xl" />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
                <div className="h-16 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function VehicleDetailSkeleton() {
  return (
    <div className="bg-gray-50 min-h-screen animate-pulse">
      <div className="bg-gradient-to-r from-[#0a2e14] to-[#145a2c] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-64 bg-white/20 rounded mb-3" />
          <div className="h-4 w-48 bg-white/10 rounded" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="aspect-[4/3] bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded-full" />
            <div className="h-10 w-3/4 bg-gray-200 rounded" />
            <div className="h-6 w-full bg-gray-100 rounded" />
            <div className="h-6 w-5/6 bg-gray-100 rounded" />
            <div className="grid grid-cols-2 gap-3 pt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
