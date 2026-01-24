import { Loader } from "lucide-react";
import { cn } from "../../../lib/utils";

export function SnLoadingSpinner({className}: {className?: string}) {
  return <Loader className={cn("h-5 w-5 animate-spin text-muted-foreground", className)} />;
}