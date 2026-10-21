import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAnimes, useUpdateAnime } from '@/hooks/useAnimes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export const AnimeImageManager = () => {
  const { data: animes, isLoading } = useAnimes();
  const updateAnime = useUpdateAnime();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File }>({});

  const handleFileSelect = (animeId: string, file: File | null) => {
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [animeId]: file }));
    } else {
      const newFiles = { ...selectedFiles };
      delete newFiles[animeId];
      setSelectedFiles(newFiles);
    }
  };

  const handleUpload = async (animeId: string) => {
    const file = selectedFiles[animeId];
    if (!file) {
      toast.error('Selecione uma imagem primeiro');
      return;
    }

    setUploadingId(animeId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${animeId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('anime-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('anime-images')
        .getPublicUrl(fileName);

      await updateAnime.mutateAsync({
        id: animeId,
        image_url: publicUrl,
      });

      handleFileSelect(animeId, null);
      toast.success('Imagem do anime atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error uploading anime image:', error);
      toast.error('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-base font-black text-zinc-950 mb-1 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-teal-600" />
          Gerenciar Imagens de Capa (Animes)
        </h3>
        <p className="text-xs text-zinc-500">
          Faça upload de novas artes em arquivo para os animes do catálogo.
        </p>
      </div>

      {animes && animes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {animes.map((a) => (
            <Card key={a.id} className="bg-white border-zinc-200/90 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-zinc-950">
                  <ImageIcon className="h-4 w-4 text-teal-600 shrink-0" />
                  <span className="truncate">{a.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <Label className="mb-1.5 block text-xs font-bold text-zinc-700">Imagem Atual</Label>
                    <div className="aspect-[2/3] max-h-40 bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200">
                      <img
                        src={a.image_url}
                        alt={a.title}
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x600?text=Sem+Imagem';
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 truncate max-w-full font-mono" title={a.image_url}>
                      {a.image_url}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor={`anime-file-${a.id}`} className="mb-1.5 block text-xs font-bold text-zinc-700">
                      Nova Imagem
                    </Label>
                    <div className="space-y-3">
                      <Input
                        id={`anime-file-${a.id}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(a.id, e.target.files?.[0] || null)}
                        disabled={uploadingId === a.id}
                      />

                      {selectedFiles[a.id] && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">Arquivo selecionado:</p>
                          <p className="text-sm text-muted-foreground">{selectedFiles[a.id].name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFiles[a.id].size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={() => handleUpload(a.id)}
                        disabled={!selectedFiles[a.id] || uploadingId === a.id}
                        className="w-full"
                      >
                        {uploadingId === a.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : selectedFiles[a.id] ? (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Fazer Upload e Atualizar
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Selecione uma imagem
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhum anime cadastrado ainda. Adicione animes primeiro para gerenciar suas imagens.
          </p>
        </div>
      )}
    </div>
  );
};
