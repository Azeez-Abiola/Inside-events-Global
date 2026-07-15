import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function ImageLightbox({
  url,
  title = "Image preview",
  open,
  onOpenChange,
}: {
  url: string | null;
  title?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!url) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[min(92vw,56rem)] border border-border/60 bg-card p-2 sm:p-3">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <img
          src={url}
          alt={title}
          className="max-h-[calc(92vh-3rem)] w-full rounded-lg object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
