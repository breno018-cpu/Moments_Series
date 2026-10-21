import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  display_order: number;
  active: boolean;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories' as any)
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Category[];
    },
  });


export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; color?: string; icon?: string }) => {
      const slug = slugify(input.name);
      const { data, error } = await supabase
        .from('categories' as any)
        .insert([{
          name: input.name,
          slug,
          color: input.color || '#8b5cf6',
          icon: input.icon || 'Tag',
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria criada');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao criar categoria'),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Category> & { id: string }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from('categories' as any).update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria atualizada');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao atualizar'),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['series_categories'] });
      qc.invalidateQueries({ queryKey: ['anime_categories'] });
      toast.success('Categoria removida');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao remover'),
  });
};

// ---- vínculos série ↔ categorias
export const useSeriesCategories = () =>
  useQuery({
    queryKey: ['series_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('series_categories' as any)
        .select('series_id, category_id');
      if (error) throw error;
      return (data || []) as unknown as { series_id: string; category_id: string }[];
    },
  });

export const useSetSeriesCategories = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ seriesId, categoryIds }: { seriesId: string; categoryIds: string[] }) => {
      // estratégia simples: deleta tudo do série + insere selecionados
      const del = await supabase.from('series_categories' as any).delete().eq('series_id', seriesId);
      if (del.error) throw del.error;
      if (categoryIds.length > 0) {
        const { error } = await supabase
          .from('series_categories' as any)
          .insert(categoryIds.map((cid) => ({ series_id: seriesId, category_id: cid })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['series_categories'] });
      toast.success('Tags atualizadas');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao salvar tags'),
  });
};

// ---- vínculos anime ↔ categorias
export const useAnimeCategories = () =>
  useQuery({
    queryKey: ['anime_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anime_categories' as any)
        .select('anime_id, category_id');
      if (error) throw error;
      return (data || []) as unknown as { anime_id: string; category_id: string }[];
    },
  });

export const useSetAnimeCategories = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ animeId, categoryIds }: { animeId: string; categoryIds: string[] }) => {
      const del = await supabase.from('anime_categories' as any).delete().eq('anime_id', animeId);
      if (del.error) throw del.error;
      if (categoryIds.length > 0) {
        const { error } = await supabase
          .from('anime_categories' as any)
          .insert(categoryIds.map((cid) => ({ anime_id: animeId, category_id: cid })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['anime_categories'] });
      toast.success('Tags atualizadas');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao salvar tags'),
  });
};
