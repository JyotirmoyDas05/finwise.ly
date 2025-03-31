import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface StyledDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  title: string
  children: React.ReactNode
}

export function StyledDialog({ open, onOpenChange, trigger, title, children }: StyledDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger}
      <DialogContent className={cn(
        "bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 shadow-2xl rounded-3xl p-6",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      )}>
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
} 