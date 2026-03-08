import { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useClients, type DbClient } from '@/hooks/useClients';

interface ClientSelectorProps {
  clientId: string | null;
  clientName: string;
  onSelect: (client: { id: string | null; name: string }) => void;
}

export function ClientSelector({ clientId, clientName, onSelect }: ClientSelectorProps) {
  const { data: clients = [] } = useClients();
  const [open, setOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const handleSelect = (client: DbClient) => {
    onSelect({ id: client.id, name: client.name });
    setOpen(false);
    setManualMode(false);
  };

  if (manualMode) {
    return (
      <div className="space-y-2">
        <Label>Cliente</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Nome do cliente..."
            value={clientName}
            onChange={(e) => onSelect({ id: null, name: e.target.value })}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => setManualMode(false)}>
            Buscar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Cliente</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 justify-start text-left font-normal">
              <Search className="mr-2 h-4 w-4 text-muted-foreground" />
              {clientName || 'Selecionar cliente...'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar cliente..." />
              <CommandList>
                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                <CommandGroup>
                  {clients.filter(c => c.status === 'active').map((client) => (
                    <CommandItem
                      key={client.id}
                      onSelect={() => handleSelect(client)}
                    >
                      <div>
                        <span className="font-medium">{client.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{client.document}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button type="button" variant="outline" size="icon" onClick={() => setManualMode(true)} title="Inserir manualmente">
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
