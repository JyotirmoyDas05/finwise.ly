import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Section Skeleton */}
      <Card className="border-0 shadow-lg bg-gradient-to-b from-background to-background/40 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full ring-2 ring-primary/20 shadow-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full max-w-md mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Insights Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
            <CardHeader>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full rounded-xl shadow-inner" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Educational Section Skeleton */}
      <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
        <CardHeader>
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-16 mb-4 rounded-xl" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

