import { EmpresaOrderTemplate, InsertEmpresaOrderTemplate } from "@shared/schema";

const API_BASE_URL = "/api";

export const templatesService = {
  // Get all templates for a company
  async getEmpresaTemplates(empresaId: number): Promise<EmpresaOrderTemplate[]> {
    const response = await fetch(`${API_BASE_URL}/empresas/${empresaId}/templates`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    if (!response.ok) {
      throw new Error(`Error fetching templates: ${response.statusText}`);
    }
    return response.json();
  },

  // Get a specific template
  async getTemplate(id: number): Promise<EmpresaOrderTemplate> {
    const response = await fetch(`${API_BASE_URL}/order-templates/${id}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    if (!response.ok) {
      throw new Error(`Error fetching template: ${response.statusText}`);
    }
    return response.json();
  },

  // Get default template for a company
  async getDefaultTemplate(empresaId: number): Promise<EmpresaOrderTemplate | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/empresas/${empresaId}/templates/default`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (response.status === 404) {
        return null; // No default template
      }
      if (!response.ok) {
        throw new Error(`Error fetching default template: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error("Error getting default template:", error);
      return null;
    }
  },

  // Create a new template
  async createTemplate(template: InsertEmpresaOrderTemplate): Promise<EmpresaOrderTemplate> {
    const response = await fetch(`${API_BASE_URL}/order-templates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify(template),
    });
    if (!response.ok) {
      throw new Error(`Error creating template: ${response.statusText}`);
    }
    const result = await response.json();
    return result.template;
  },

  // Update a template
  async updateTemplate(id: number, template: Partial<InsertEmpresaOrderTemplate>): Promise<EmpresaOrderTemplate> {
    const response = await fetch(`${API_BASE_URL}/order-templates/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify(template),
    });
    if (!response.ok) {
      throw new Error(`Error updating template: ${response.statusText}`);
    }
    const result = await response.json();
    return result.template;
  },

  // Delete a template
  async deleteTemplate(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/order-templates/${id}`, {
      method: "DELETE",
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    if (!response.ok) {
      throw new Error(`Error deleting template: ${response.statusText}`);
    }
  },

  // Set default template
  async setDefaultTemplate(empresaId: number, templateId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/empresas/${empresaId}/templates/${templateId}/set-default`, {
      method: "POST",
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    if (!response.ok) {
      throw new Error(`Error setting default template: ${response.statusText}`);
    }
  }
};

