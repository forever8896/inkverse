/**
 * Skeleton loading components for various UI elements
 */

import { Card, CardHeader, CardContent } from "../ui/card";

export function CardSkeleton() {
  return (
    <Card className="inkathon-card">
      <CardHeader>
        <div className="h-6 w-32 bg-slate-700 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-slate-700 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 w-full bg-slate-700 rounded animate-pulse" />
      ))}
    </div>
  );
}
