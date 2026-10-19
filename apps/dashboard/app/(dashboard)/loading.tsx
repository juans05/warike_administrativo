import { Card, Skeleton } from '../../components/ui';

export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Cargando" className="max-w-6xl space-y-6 p-4 pb-16 md:p-8">
      <Skeleton className="h-8 w-1/3" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="space-y-3 lg:col-span-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="w-full" />
          <Skeleton className="w-5/6" />
        </Card>
        <div className="space-y-6 lg:col-span-8">
          {[0, 1].map((i) => (
            <Card key={i} className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="w-full" />
              <Skeleton className="w-5/6" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
