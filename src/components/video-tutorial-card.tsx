import { Card, CardContent } from "@/components/ui/card"
import { Play } from "lucide-react"
import { useState } from "react"

interface VideoTutorialCardProps {
  title: string
  thumbnail: string
  duration: string
  videoId?: string
}

export function VideoTutorialCard({ title, thumbnail, duration, videoId }: VideoTutorialCardProps) {
  const [showVideo, setShowVideo] = useState(false)
  
  const handleClick = () => {
    if (videoId) {
      setShowVideo(true)
    }
  }
  
  return (
    <Card className="overflow-hidden group cursor-pointer transition-all hover:shadow-md">
      <CardContent className="p-0 relative">
        {showVideo && videoId ? (
          <div className="aspect-video">
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0"
            ></iframe>
          </div>
        ) : (
          <div className="relative" onClick={handleClick}>
            <img src={thumbnail || "/placeholder.svg"} alt={title} className="w-full h-auto object-cover aspect-video" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white rounded-full p-3">
                <Play className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{duration}</div>
          </div>
        )}
        <div className="p-4">
          <h3 className="font-medium">{title}</h3>
        </div>
      </CardContent>
    </Card>
  )
}

