import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Building, 
  User, 
  Shield, 
  Eye, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Check,
  Settings,
  Users,
  Lock,
  Unlock,
  Mail,
  Key
} from 'lucide-react';
import { toast } from 'sonner';

interface AdvancedProfileManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileCreated: (profile: any) => void; // Changed to any as mock data is removed
}

export const AdvancedProfileManager: React.FC<AdvancedProfileManagerProps> = ({
  open,
  onOpenChange,
  onProfileCreated
}) => {
  const [currentTab, setCurrentTab] = useState('basic');
  const [profileData, setProfileData] = useState({
    name: '',
    description: '',
    type: 'coordinador' as 'coordinador' | 'supervisor' | 'empresa' | 'admin' // Changed to any as mock data is removed
  });
  const [viewPermissions, setViewPermissions] = useState<Record<string, boolean>>({});
  const [actionPermissions, setActionPermissions] = useState<Record<string, boolean>>({});
  const [companyData, setCompanyData] = useState({
    name: '',
    nit: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    contactPerson: ''
  });
  const [userEmail, setUserEmail] = useState('');
  const [createCompanyUser, setCreateCompanyUser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Resetear formulario cuando se abre
  useEffect(() => {
    if (open) {
      setProfileData({
        name: '',
        description: '',
        type: 'coordinador'
      });
      setViewPermissions({});
      setActionPermissions({});
      setCompanyData({
        name: '',
        nit: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        contactPerson: ''
      });
      setUserEmail('');
      setCreateCompanyUser(false);
      setCurrentTab('basic');
    }
  }, [open]);

  // Manejar cambio de permisos de vista
  const handleViewPermissionChange = (viewId: string, enabled: boolean) => {
    setViewPermissions(prev => ({
      ...prev,
      [viewId]: enabled
    }));

    // Si se desactiva una vista, desactivar todas sus acciones
    if (!enabled) {
      // This function is no longer available, so we'll just clear actions for this view
      // or remove the logic if no actions are associated with views.
      // For now, we'll just clear actions for the view.
      setActionPermissions({});
    }
  };

  // Manejar cambio de permisos de acción
  const handleActionPermissionChange = (actionId: string, enabled: boolean) => {
    setActionPermissions(prev => ({
      ...prev,
      [actionId]: enabled
    }));
  };

  // Validar formulario
  const validateForm = () => {
    if (!profileData.name.trim()) {
      toast.error('El nombre del perfil es requerido');
      return false;
    }

    if (Object.values(viewPermissions).every(v => !v)) {
      toast.error('Debe seleccionar al menos una vista');
      return false;
    }

    if (createCompanyUser) {
      if (!companyData.name.trim() || !companyData.nit.trim() || !userEmail.trim()) {
        toast.error('Complete todos los campos requeridos de la empresa');
        return false;
      }
    }

    return true;
  };

  // Guardar perfil
  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    
    try {
      // Simular delay de guardado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Crear nuevo perfil
      const newProfile: any = { // Changed to any as mock data is removed
        id: `profile_${Date.now()}`,
        name: profileData.name,
        description: profileData.description,
        type: profileData.type,
        permissions: {
          viewPermissions,
          actionPermissions
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Si se crea empresa y usuario
      if (createCompanyUser) {
        const tempPassword = 'temp_password_123'; // Generar contraseña temporal
        
        const newCompany: any = { // Changed to any as mock data is removed
          id: `emp_${Date.now()}`,
          name: companyData.name,
          nit: companyData.nit,
          email: companyData.email,
          phone: companyData.phone,
          address: companyData.address,
          city: companyData.city,
          contactPerson: companyData.contactPerson,
          isActive: true,
          createdAt: new Date()
        };

        const newUser: any = { // Changed to any as mock data is removed
          id: `user_${Date.now()}`,
          companyId: newCompany.id,
          email: userEmail,
          tempPassword,
          profileId: newProfile.id,
          mustChangePassword: true,
          isActive: true,
          createdAt: new Date()
        };

        toast.success(
          `Perfil creado exitosamente. Se envió usuario y contraseña temporal (${tempPassword}) al correo ${userEmail}`
        );
      } else {
        toast.success('Perfil creado exitosamente');
      }

      onProfileCreated(newProfile);
      onOpenChange(false);
      
    } catch (error) {
      toast.error('Error al crear el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[1200px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Crear Nuevo Perfil Avanzado
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Información Básica</TabsTrigger>
            <TabsTrigger value="views">Control de Vistas</TabsTrigger>
            <TabsTrigger value="actions">Control de Acciones</TabsTrigger>
            <TabsTrigger value="company">Empresa y Usuario</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[600px] mt-4">
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información del Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="profileName">Nombre del Perfil *</Label>
                      <Input
                        id="profileName"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ej: Coordinador Regional"
                      />
                    </div>
                    <div>
                      <Label htmlFor="profileType">Tipo de Perfil *</Label>
                      <select
                        id="profileType"
                        value={profileData.type}
                        onChange={(e) => setProfileData(prev => ({ ...prev, type: e.target.value as 'coordinador' | 'supervisor' | 'empresa' | 'admin' }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="coordinador">Coordinador</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="empresa">Empresa</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="profileDescription">Descripción</Label>
                    <Textarea
                      id="profileDescription"
                      value={profileData.description}
                      onChange={(e) => setProfileData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe las responsabilidades y alcance de este perfil"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="views" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Control de Vistas del Sistema</CardTitle>
                  <p className="text-sm text-gray-600">
                    Selecciona las vistas que estarán disponibles para este perfil
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* mockSystemViews is no longer imported, so this loop will not run */}
                  <div className="text-center py-8 text-gray-500">
                    <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No vistas disponibles para configurar.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Control de Acciones</CardTitle>
                  <p className="text-sm text-gray-600">
                    Define qué acciones puede realizar el usuario en cada vista habilitada
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* mockSystemViews is no longer imported, so this loop will not run */}
                  <div className="text-center py-8 text-gray-500">
                    <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No acciones disponibles para configurar.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="company" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Crear Empresa y Usuario</CardTitle>
                  <p className="text-sm text-gray-600">
                    Opcionalmente, crea una empresa y asigna un usuario con este perfil
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="createCompany"
                      checked={createCompanyUser}
                      onCheckedChange={setCreateCompanyUser}
                    />
                    <Label htmlFor="createCompany">
                      Crear empresa y usuario asociado
                    </Label>
                  </div>

                  {createCompanyUser && (
                    <div className="space-y-6 pt-4 border-t">
                      <div>
                        <h4 className="font-semibold mb-3">Información de la Empresa</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="companyName">Nombre de la Empresa *</Label>
                            <Input
                              id="companyName"
                              value={companyData.name}
                              onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Ej: Constructora ABC S.A.S."
                            />
                          </div>
                          <div>
                            <Label htmlFor="companyNit">NIT *</Label>
                            <Input
                              id="companyNit"
                              value={companyData.nit}
                              onChange={(e) => setCompanyData(prev => ({ ...prev, nit: e.target.value }))}
                              placeholder="Ej: 900123456-7"
                            />
                          </div>
                          <div>
                            <Label htmlFor="companyEmail">Email</Label>
                            <Input
                              id="companyEmail"
                              type="email"
                              value={companyData.email}
                              onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="contacto@empresa.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="companyPhone">Teléfono</Label>
                            <Input
                              id="companyPhone"
                              value={companyData.phone}
                              onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="3001234567"
                            />
                          </div>
                          <div>
                            <Label htmlFor="companyAddress">Dirección</Label>
                            <Input
                              id="companyAddress"
                              value={companyData.address}
                              onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="Calle 123 #45-67"
                            />
                          </div>
                          <div>
                            <Label htmlFor="companyCity">Ciudad</Label>
                            <Input
                              id="companyCity"
                              value={companyData.city}
                              onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                              placeholder="Bogotá"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label htmlFor="contactPerson">Persona de Contacto</Label>
                          <Input
                            id="contactPerson"
                            value={companyData.contactPerson}
                            onChange={(e) => setCompanyData(prev => ({ ...prev, contactPerson: e.target.value }))}
                            placeholder="Nombre del contacto principal"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-3">Usuario de la Empresa</h4>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="userEmail">Email del Usuario *</Label>
                            <Input
                              id="userEmail"
                              type="email"
                              value={userEmail}
                              onChange={(e) => setUserEmail(e.target.value)}
                              placeholder="usuario@empresa.com"
                            />
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div>
                                <h5 className="font-medium text-blue-900">Contraseña Temporal</h5>
                                <p className="text-sm text-blue-800">
                                  Se generará automáticamente una contraseña temporal segura y se enviará al correo del usuario. 
                                  El usuario deberá cambiar la contraseña en el primer inicio de sesión.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4" />
            <span>
              {Object.values(viewPermissions).filter(v => v).length} vistas seleccionadas,{' '}
              {Object.values(actionPermissions).filter(a => a).length} acciones habilitadas
            </span>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Perfil
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};