import { Card, CardContent, CardFooter } from "@/components/ui/card"

interface EducationalCardProps {
  title: string
  description: string
  icon: string
  readTime: string
}

export function EducationalCard({ title, description, icon, readTime }: EducationalCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="font-medium text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="bg-muted px-6 py-3 flex justify-between">
        <span className="text-xs text-muted-foreground">{readTime}</span>
        <a href="#" className="text-xs font-medium text-primary">
          Read Now
        </a>
      </CardFooter>
    </Card>
  )
}


