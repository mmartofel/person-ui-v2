import { cn } from '@/lib/utils'

/**
 * The trigger of a popover picker (relation, country) styled like the other inputs and `SelectTrigger`: input border,
 * transparent background, no hover fill. Muted text only for a placeholder; an `emptyLabel` ("Any") is a choice.
 */
export function pickerTriggerClass(placeholder: boolean, className?: string) {
  return cn(
    'w-full justify-between border-input bg-transparent font-normal hover:bg-transparent hover:text-foreground',
    placeholder && 'text-muted-foreground hover:text-muted-foreground',
    className,
  )
}
