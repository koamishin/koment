import { Card, CardHeader } from "@saasfly/ui/card";
import { Skeleton } from "@saasfly/ui/skeleton";

import { BasicItemSkeleton } from "~/components/base-item";

export default function OrganizationLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </CardHeader>
        </Card>
      </div>
      <div className="divide-y divide-border rounded-md border">
        <BasicItemSkeleton />
        <BasicItemSkeleton />
        <BasicItemSkeleton />
      </div>
    </div>
  );
}
