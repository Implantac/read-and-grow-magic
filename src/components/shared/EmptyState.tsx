import React from 'react';
import { Ghost, PackageSearch, SearchX, Inbox } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/ui/base/button";

export type EmptyStateVariant = 'search' | 'list' | 'inbox' | 'inventory';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const icons = {
  search: <SearchX className="h-12 w-12 text-muted-foreground/40" />,
  list: <Ghost className="h-12 w-12 text-muted-foreground/40" />,
  inbox: <Inbox className="h-12 w-12 text-muted-foreground/40" />,
  inventory: <PackageSearch className="h-12 w-12 text-muted-foreground/40" />,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'list',
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center rounded-xl border-2 border-dashed border-muted/50 bg-muted/5",
      className
    )}>
      <div className="mb-4 p-4 rounded-full bg-background shadow-inner">
        {icons[variant]}
      </div>
      <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-[280px] leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={action.onClick}
          className="mt-6 font-bold uppercase text-[10px] h-9 px-6 bg-background shadow-sm hover:shadow-md transition-all"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
