import { SkeletonHeader, SkeletonCard, SkeletonGrid } from '../../components/SkeletonLoader';

export default function DashboardLoading() {
  return (
    <div className="max-w-6xl space-y-16 pb-32 p-6 md:p-10 lg:p-16">
      <SkeletonHeader />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-4">
          <SkeletonCard />
        </div>
        <div className="lg:col-span-8 space-y-12">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
