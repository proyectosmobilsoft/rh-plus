import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface SelectWithSearchProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  options: Array<{
    value: string
    label: string
    searchText?: string
  }>
  emptyText?: string
  maxItems?: number
}

export function SelectWithSearch({
  value,
  onValueChange,
  placeholder = "Seleccionar...",
  disabled = false,
  className,
  options,
  emptyText = "No se encontraron resultados",
  maxItems = 100
}: SelectWithSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)

  const displayedOptions = React.useMemo(() => {
    if (!searchValue) {
      return options.slice(0, maxItems)
    }
    const term = searchValue.toLowerCase()
    return options.filter(o =>
      o.label.toLowerCase().includes(term) ||
      (o.searchText && o.searchText.toLowerCase().includes(term))
    )
  }, [options, searchValue, maxItems])

  const totalFiltered = React.useMemo(() => {
    if (!searchValue) return options.length
    const term = searchValue.toLowerCase()
    return options.filter(o =>
      o.label.toLowerCase().includes(term) ||
      (o.searchText && o.searchText.toLowerCase().includes(term))
    ).length
  }, [options, searchValue])

  return (
    <Popover open={open} onOpenChange={(newOpen) => { setOpen(newOpen); if (!newOpen) setSearchValue("") }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-[40px]",
            !selectedOption && "text-muted-foreground font-normal",
            className
          )}
          disabled={disabled}
        >
          <span className={cn(
            !selectedOption ? "font-normal" : "",
            "truncate text-left flex-1 mr-2"
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Buscar ${placeholder.toLowerCase()}...`}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {displayedOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {!searchValue && options.length > maxItems && (
              <div className="px-2 py-1.5 text-xs text-center text-muted-foreground border-t">
                Mostrando {maxItems} de {options.length} — escriba para filtrar
              </div>
            )}
            {!!searchValue && totalFiltered > displayedOptions.length && (
              <div className="px-2 py-1.5 text-xs text-center text-muted-foreground border-t">
                {totalFiltered} resultado(s) — refine su búsqueda
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

