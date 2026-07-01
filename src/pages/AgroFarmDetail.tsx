import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Sprout, Calendar, Wheat } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/base/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { PageContainer } from '@/shared/components/PageContainer';
import {
  useAgroFields, useCreateAgroField,
  useAgroSeasons, useCreateAgroSeason,
  useAgroHarvests, useCreateAgroHarvest,
  useAgroFarms,
} from '@/hooks/useAgro';
import { toSafeNumber } from '@/lib/numericValidation';
import { EmptyState } from '@/shared/components/EmptyState';

export default function AgroFarmDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: farms = [] } = useAgroFarms();
  const farm = farms.find((f) => f.id === id);
  const { data: fields = [] } = useAgroFields(id);
  const createField = useCreateAgroField();

  const [selectedFieldId, setSelectedFieldId] = useState<string | undefined>();
  const { data: seasons = [] } = useAgroSeasons(selectedFieldId);
  const createSeason = useCreateAgroSeason();

  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>();
  const { data: harvests = [] } = useAgroHarvests(selectedSeasonId);
  const createHarvest = useCreateAgroHarvest();

  const [fieldOpen, setFieldOpen] = useState(false);
  const [fieldForm, setFieldForm] = useState({ code: '', name: '', area_ha: '', soil_type: '', current_crop: '' });

  const [seasonOpen, setSeasonOpen] = useState(false);
  const [seasonForm, setSeasonForm] = useState({ crop: '', variety: '', planting_date: '', expected_harvest_date: '', estimated_yield_per_ha: '', estimated_cost: '' });

  const [harvestOpen, setHarvestOpen] = useState(false);
  const [harvestForm, setHarvestForm] = useState({ harvest_date: new Date().toISOString().slice(0, 10), quantity: '', unit: 'kg', quality_grade: '', revenue: '' });

  const submitField = async () => {
    await createField.mutateAsync({
      farm_id: id!,
      code: fieldForm.code,
      name: fieldForm.name,
      area_ha: toSafeNumber(fieldForm.area_ha, 0, { min: 0 }),
      soil_type: fieldForm.soil_type || null,
      current_crop: fieldForm.current_crop || null,
    });
    setFieldForm({ code: '', name: '', area_ha: '', soil_type: '', current_crop: '' });
    setFieldOpen(false);
  };

  const submitSeason = async () => {
    if (!selectedFieldId) return;
    await createSeason.mutateAsync({
      field_id: selectedFieldId,
      crop: seasonForm.crop,
      variety: seasonForm.variety || null,
      planting_date: seasonForm.planting_date || null,
      expected_harvest_date: seasonForm.expected_harvest_date || null,
      estimated_yield_per_ha: seasonForm.estimated_yield_per_ha ? toSafeNumber(seasonForm.estimated_yield_per_ha, 0, { min: 0 }) : null,
      estimated_cost: toSafeNumber(seasonForm.estimated_cost, 0, { min: 0 }),
    });
    setSeasonForm({ crop: '', variety: '', planting_date: '', expected_harvest_date: '', estimated_yield_per_ha: '', estimated_cost: '' });
    setSeasonOpen(false);
  };

  const submitHarvest = async () => {
    if (!selectedSeasonId) return;
    await createHarvest.mutateAsync({
      season_id: selectedSeasonId,
      harvest_date: harvestForm.harvest_date,
      quantity: toSafeNumber(harvestForm.quantity, 0, { min: 0 }),
      unit: harvestForm.unit,
      quality_grade: harvestForm.quality_grade || null,
      revenue: toSafeNumber(harvestForm.revenue, 0, { min: 0 }),
    });
    setHarvestForm({ harvest_date: new Date().toISOString().slice(0, 10), quantity: '', unit: 'kg', quality_grade: '', revenue: '' });
    setHarvestOpen(false);
  };

  const totalHarvested = harvests.reduce((s, h) => s + Number(h.quantity || 0), 0);
  const totalRevenue = harvests.reduce((s, h) => s + Number(h.revenue || 0), 0);

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon"><Link to="/agro/fazendas"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Sprout className="h-5 w-5" />{farm?.name ?? 'Fazenda'}</h1>
            <p className="text-sm text-muted-foreground">{farm?.location} · {Number(farm?.total_area_ha ?? 0).toLocaleString('pt-BR')} ha</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="fields" className="w-full">
        <TabsList>
          <TabsTrigger value="fields">Talhões ({fields.length})</TabsTrigger>
          <TabsTrigger value="seasons" disabled={!selectedFieldId}>Safras</TabsTrigger>
          <TabsTrigger value="harvests" disabled={!selectedSeasonId}>Colheitas</TabsTrigger>
        </TabsList>

        {/* Talhões */}
        <TabsContent value="fields">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Talhões</CardTitle>
              <Dialog open={fieldOpen} onOpenChange={setFieldOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo talhão</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo talhão</DialogTitle></DialogHeader>
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Código</Label><Input value={fieldForm.code} onChange={(e) => setFieldForm({ ...fieldForm, code: e.target.value })} /></div>
                      <div><Label>Área (ha)</Label><Input type="number" value={fieldForm.area_ha} onChange={(e) => setFieldForm({ ...fieldForm, area_ha: e.target.value })} /></div>
                    </div>
                    <div><Label>Nome</Label><Input value={fieldForm.name} onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Tipo de solo</Label><Input value={fieldForm.soil_type} onChange={(e) => setFieldForm({ ...fieldForm, soil_type: e.target.value })} /></div>
                      <div><Label>Cultura atual</Label><Input value={fieldForm.current_crop} onChange={(e) => setFieldForm({ ...fieldForm, current_crop: e.target.value })} /></div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setFieldOpen(false)}>Cancelar</Button>
                    <Button onClick={submitField} disabled={!fieldForm.code || !fieldForm.name}>Cadastrar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              {fields.length === 0 ? (
                <EmptyState icon={Sprout} title="Nenhum talhão cadastrado" description="Cadastre talhões para associar safras, colheitas e insumos." />
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead className="text-right">Área (ha)</TableHead><TableHead>Cultura</TableHead><TableHead>Solo</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {fields.map((f) => (
                      <TableRow key={f.id} className={selectedFieldId === f.id ? 'bg-muted/50' : ''}>
                        <TableCell className="font-mono text-sm">{f.code}</TableCell>
                        <TableCell>{f.name}</TableCell>
                        <TableCell className="text-right">{Number(f.area_ha).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{f.current_crop || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{f.soil_type || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant={selectedFieldId === f.id ? 'default' : 'outline'} size="sm" onClick={() => { setSelectedFieldId(f.id); setSelectedSeasonId(undefined); }}>
                            <Calendar className="h-4 w-4 mr-1" />Safras
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Safras */}
        <TabsContent value="seasons">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Safras do talhão</CardTitle>
              <Dialog open={seasonOpen} onOpenChange={setSeasonOpen}>
                <DialogTrigger asChild><Button size="sm" disabled={!selectedFieldId}><Plus className="h-4 w-4 mr-1" />Nova safra</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nova safra</DialogTitle></DialogHeader>
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Cultura</Label><Input value={seasonForm.crop} onChange={(e) => setSeasonForm({ ...seasonForm, crop: e.target.value })} /></div>
                      <div><Label>Variedade</Label><Input value={seasonForm.variety} onChange={(e) => setSeasonForm({ ...seasonForm, variety: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Plantio</Label><Input type="date" value={seasonForm.planting_date} onChange={(e) => setSeasonForm({ ...seasonForm, planting_date: e.target.value })} /></div>
                      <div><Label>Colheita prevista</Label><Input type="date" value={seasonForm.expected_harvest_date} onChange={(e) => setSeasonForm({ ...seasonForm, expected_harvest_date: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Produtividade est. (kg/ha)</Label><Input type="number" value={seasonForm.estimated_yield_per_ha} onChange={(e) => setSeasonForm({ ...seasonForm, estimated_yield_per_ha: e.target.value })} /></div>
                      <div><Label>Custo estimado (R$)</Label><Input type="number" value={seasonForm.estimated_cost} onChange={(e) => setSeasonForm({ ...seasonForm, estimated_cost: e.target.value })} /></div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSeasonOpen(false)}>Cancelar</Button>
                    <Button onClick={submitSeason} disabled={!seasonForm.crop}>Criar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              {seasons.length === 0 ? (
                <EmptyState icon={Calendar} title="Nenhuma safra" description="Selecione um talhão e cadastre uma safra para começar." />
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Cultura</TableHead><TableHead>Variedade</TableHead><TableHead>Plantio</TableHead><TableHead>Prev. colheita</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {seasons.map((s) => (
                      <TableRow key={s.id} className={selectedSeasonId === s.id ? 'bg-muted/50' : ''}>
                        <TableCell className="font-medium">{s.crop}</TableCell>
                        <TableCell>{s.variety || '—'}</TableCell>
                        <TableCell>{s.planting_date || '—'}</TableCell>
                        <TableCell>{s.expected_harvest_date || '—'}</TableCell>
                        <TableCell><Badge variant="secondary">{s.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant={selectedSeasonId === s.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedSeasonId(s.id)}>
                            <Wheat className="h-4 w-4 mr-1" />Colheitas
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colheitas */}
        <TabsContent value="harvests">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total colhido</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalHarvested.toLocaleString('pt-BR')}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Receita</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Eventos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{harvests.length}</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Registros de colheita</CardTitle>
              <Dialog open={harvestOpen} onOpenChange={setHarvestOpen}>
                <DialogTrigger asChild><Button size="sm" disabled={!selectedSeasonId}><Plus className="h-4 w-4 mr-1" />Nova colheita</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nova colheita</DialogTitle></DialogHeader>
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Data</Label><Input type="date" value={harvestForm.harvest_date} onChange={(e) => setHarvestForm({ ...harvestForm, harvest_date: e.target.value })} /></div>
                      <div>
                        <Label>Unidade</Label>
                        <Select value={harvestForm.unit} onValueChange={(v) => setHarvestForm({ ...harvestForm, unit: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="kg">kg</SelectItem><SelectItem value="t">t</SelectItem><SelectItem value="sc">sacas</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Quantidade</Label><Input type="number" value={harvestForm.quantity} onChange={(e) => setHarvestForm({ ...harvestForm, quantity: e.target.value })} /></div>
                      <div><Label>Receita (R$)</Label><Input type="number" value={harvestForm.revenue} onChange={(e) => setHarvestForm({ ...harvestForm, revenue: e.target.value })} /></div>
                    </div>
                    <div><Label>Qualidade</Label><Input value={harvestForm.quality_grade} onChange={(e) => setHarvestForm({ ...harvestForm, quality_grade: e.target.value })} placeholder="A / B / C" /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setHarvestOpen(false)}>Cancelar</Button>
                    <Button onClick={submitHarvest} disabled={!harvestForm.quantity}>Registrar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              {harvests.length === 0 ? (
                <EmptyState icon={Wheat} title="Sem colheitas registradas" description="Registre colheitas para acompanhar produtividade e receita." />
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead className="text-right">Quantidade</TableHead><TableHead>Unidade</TableHead><TableHead>Qualidade</TableHead><TableHead className="text-right">Receita</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {harvests.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>{h.harvest_date}</TableCell>
                        <TableCell className="text-right">{Number(h.quantity).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{h.unit}</TableCell>
                        <TableCell>{h.quality_grade || '—'}</TableCell>
                        <TableCell className="text-right">R$ {Number(h.revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
