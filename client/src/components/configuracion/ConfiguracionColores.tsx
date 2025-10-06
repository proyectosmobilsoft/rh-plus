import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { coloresService, type ColorCategory, type ColorConfig } from '@/services/coloresService';
import { useColors } from '@/contexts/ColorsContext';
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Minus, Edit3, Palette } from 'lucide-react';

export default function ConfiguracionColores() {
  const { refreshColors } = useColors();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ColorCategory[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ColorConfig | null>(null);

  const categoryNames = useMemo(() => categories.map(c => c.nombre), [categories]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await coloresService.getGroupedByCategory();
      setCategories(data);
      // Mantener todas las subtablas contraídas por defecto
      if (data.length > 0) {
        const collapsed: Record<string, boolean> = {};
        data.forEach(d => { collapsed[d.nombre] = false; });
        setExpanded(collapsed);
      }
    } catch (err) {
      console.error(err);
      toast.error('No se pudo cargar la configuración de colores');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (name: string) => {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const openEditModal = (c: ColorConfig) => {
    setEditing({ ...c });
    setModalOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!coloresService.validateHexColor(editing.color_hex)) {
      toast.error('Color hexadecimal inválido');
      return;
    }
    try {
      setSaving(true);
      await coloresService.update(editing.id, {
        color_hex: editing.color_hex,
        color_tailwind: editing.color_tailwind,
        descripcion: editing.descripcion,
      });
      toast.success('Color actualizado');
      setModalOpen(false);
      setEditing(null);
      await refreshColors();
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('No se pudo actualizar el color');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-cyan-600" />
        <p className="mt-3 text-gray-600">Cargando colores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.length === 0 ? (
        <div className="text-center text-gray-600">No hay colores configurados.</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-cyan-600" /> Configuración de Colores
            </CardTitle>
            <CardDescription>Edita los colores que usa el sistema por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-56">Categoría</TableHead>
                    <TableHead>Detalle</TableHead>
                    <TableHead className="w-28 text-center">Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map(cat => (
                    <>
                      <TableRow key={`row-${cat.nombre}`} className="bg-cyan-50/60">
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleCategory(cat.nombre)}>
                            {expanded[cat.nombre] ? <Minus className="h-4 w-4 text-cyan-700" /> : <Plus className="h-4 w-4 text-cyan-700" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-semibold text-cyan-900">{cat.nombre}</TableCell>
                        <TableCell className="text-gray-600">{cat.descripcion}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">{cat.elementos.length}</Badge>
                        </TableCell>
                      </TableRow>

                      {expanded[cat.nombre] && (
                        <TableRow key={`detail-${cat.nombre}`} className="bg-gray-50">
                          <TableCell colSpan={4} className="p-0">
                            <div className="p-3">
                              <div className="rounded-md border overflow-hidden">
                                <Table className="text-xs">
                                  <TableHeader>
                                    <TableRow className="h-8">
                                      <TableHead className="w-56 h-8 px-3">Elemento</TableHead>
                                      <TableHead className="w-40 h-8 px-3">Hex</TableHead>
                                      <TableHead className="w-40 h-8 px-3">Vista</TableHead>
                                      <TableHead className="h-8 px-3">Clases Tailwind</TableHead>
                                      <TableHead className="w-20 h-8 px-3 text-center">Editar</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {cat.elementos.map(c => (
                                      <TableRow key={c.id} className="text-xs h-8">
                                        <TableCell className="py-1 px-3 font-medium">{c.elemento}</TableCell>
                                        <TableCell className="py-1 px-3">
                                          <span className="font-mono">{c.color_hex}</span>
                                        </TableCell>
                                        <TableCell className="py-1 px-3">
                                          <div className="flex items-center gap-2">
                                            <span className="h-4 w-4 rounded border" style={{ backgroundColor: c.color_hex }} />
                                            <span className="text-[10px] text-gray-500">preview</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-1 px-3 truncate max-w-[360px]">{c.color_tailwind}</TableCell>
                                        <TableCell className="py-1 px-3 text-center">
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(c)}>
                                            <Edit3 className="h-4 w-4 text-purple-600" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={modalOpen} onOpenChange={setModalOpen}>
        <AlertDialogContent className="max-w-sm p-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Editar color</AlertDialogTitle>
            <AlertDialogDescription>
              Ajusta el hex y las clases Tailwind. Se aplicará al guardar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block">Hex</Label>
              <div className="flex gap-2 items-center">
                <Input type="color" className="w-16 p-1" value={editing?.color_hex || '#000000'} onChange={e => setEditing(prev => prev ? { ...prev, color_hex: e.target.value } : prev)} />
                <Input value={editing?.color_hex || ''} onChange={e => setEditing(prev => prev ? { ...prev, color_hex: e.target.value } : prev)} />
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Clases Tailwind</Label>
              <Input value={editing?.color_tailwind || ''} onChange={e => setEditing(prev => prev ? { ...prev, color_tailwind: e.target.value } : prev)} />
            </div>
            <div>
              <Label className="mb-1 block">Descripción</Label>
              <Input value={editing?.descripcion || ''} onChange={e => setEditing(prev => prev ? { ...prev, descripcion: e.target.value } : prev)} />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={saveEdit} disabled={saving}>Guardar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

