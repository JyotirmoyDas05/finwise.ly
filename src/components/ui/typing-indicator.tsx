import { Bot, Dot } from "lucide-react"

export function TypingIndicator() {
  // Assistant icon component
  const AIAvatar = () => (
    <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-accent/90 text-white shadow-sm ring-2 ring-background">
      <Bot className="h-4 w-4" />
    </div>
  );

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-end gap-2">
        <AIAvatar />
        <div className="rounded-2xl rounded-tl-none bg-muted p-3 shadow-sm text-foreground">
          <div className="flex -space-x-2.5">
            <Dot className="h-5 w-5 text-muted-foreground animate-typing-dot-bounce" />
            <Dot className="h-5 w-5 text-muted-foreground animate-typing-dot-bounce [animation-delay:90ms]" />
            <Dot className="h-5 w-5 text-muted-foreground animate-typing-dot-bounce [animation-delay:180ms]" />
          </div>
        </div>
      </div>
    </div>
  )
}
