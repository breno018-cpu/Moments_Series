import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CRMStage {
  id: string;
  name: string;
  slug: string;
  color: string;
  display_order: number;
}

export interface CRMContact {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  source: string;
  stage_id: string | null;
  total_spent: number;
  orders_count: number;
  last_order_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_page: string | null;
  referrer: string | null;
  last_contact_at: string | null;
  created_at: string;
}

export interface CRMTag {
  id: string;
  name: string;
  color: string;
}

export interface CRMNote {
  id: string;
  contact_id: string;
  body: string;
  created_at: string;
}

// Stages
export const useCRMStages = () =>
  useQuery({
    queryKey: ['crm_stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_stages')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as CRMStage[];
    },
  });

// Contacts
export const useCRMContacts = () =>
  useQuery({
    queryKey: ['crm_contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .order('last_contact_at', { ascending: false });
      if (error) throw error;
      return data as CRMContact[];
    },
  });

export const useUpdateContactStage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage_id }: { id: string; stage_id: string }) => {
      const { error } = await supabase
        .from('crm_contacts')
        .update({ stage_id, last_contact_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_contacts'] }),
    onError: (e: any) => toast.error('Erro ao mover contato: ' + e.message),
  });
};

export const useDeleteContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm_contacts'] });
      toast.success('Contato removido');
    },
  });
};

export const useCreateContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CRMContact>) => {
      const { error } = await supabase.from('crm_contacts').insert({
        email: payload.email!,
        name: payload.name,
        phone: payload.phone,
        source: payload.source || 'manual',
        stage_id: payload.stage_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm_contacts'] });
      toast.success('Contato criado');
    },
    onError: (e: any) => toast.error('Erro ao criar: ' + e.message),
  });
};

// Tags
export const useCRMTags = () =>
  useQuery({
    queryKey: ['crm_tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('crm_tags').select('*').order('name');
      if (error) throw error;
      return data as CRMTag[];
    },
  });

export const useContactTags = (contactId: string | null) =>
  useQuery({
    queryKey: ['crm_contact_tags', contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_contact_tags')
        .select('tag_id, crm_tags(*)')
        .eq('contact_id', contactId!);
      if (error) throw error;
      return (data || []).map((r: any) => r.crm_tags) as CRMTag[];
    },
  });

export const useToggleTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contactId,
      tagId,
      add,
    }: {
      contactId: string;
      tagId: string;
      add: boolean;
    }) => {
      if (add) {
        const { error } = await supabase
          .from('crm_contact_tags')
          .insert({ contact_id: contactId, tag_id: tagId });
        if (error && !error.message.includes('duplicate')) throw error;
      } else {
        const { error } = await supabase
          .from('crm_contact_tags')
          .delete()
          .eq('contact_id', contactId)
          .eq('tag_id', tagId);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['crm_contact_tags', vars.contactId] });
    },
  });
};

export const useCreateTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { error } = await supabase.from('crm_tags').insert({ name, color });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm_tags'] });
      toast.success('Tag criada');
    },
    onError: (e: any) => toast.error('Erro: ' + e.message),
  });
};

// Notes
export const useContactNotes = (contactId: string | null) =>
  useQuery({
    queryKey: ['crm_notes', contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_notes')
        .select('*')
        .eq('contact_id', contactId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CRMNote[];
    },
  });

export const useAddNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contactId, body }: { contactId: string; body: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from('crm_notes').insert({
        contact_id: contactId,
        body,
        author_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['crm_notes', vars.contactId] });
      toast.success('Nota adicionada');
    },
  });
};
