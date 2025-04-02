import { Card, CardContent, CardFooter } from "@/components/ui/card"

interface EducationalCardProps {
  title: string
  description: string
  icon: string
  readTime: string
  link?: string
  target?: string
}

export function EducationalCard({ title, description, icon, readTime, link = "#", target }: EducationalCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-xl hover:translate-y-[-2px] border-2 bg-gradient-to-br from-background to-background/40 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="text-4xl mb-4 drop-shadow-md transform hover:scale-105 transition-transform">{icon}</div>
        <h3 className="font-medium text-lg mb-2 text-foreground/90">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="bg-muted/50 backdrop-blur-sm px-6 py-3 flex justify-between border-t">
        <span className="text-xs text-muted-foreground">{readTime}</span>
        <a 
          href={link}
          target={target}
          className="text-xs font-medium text-primary hover:text-primary/90 transition-colors rounded-lg px-2 py-1 hover:bg-primary/10"
        >
          Read Now
        </a>
      </CardFooter>
    </Card>
  )
}


