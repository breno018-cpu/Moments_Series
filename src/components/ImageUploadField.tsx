import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Link as LinkIcon, Loader2, Image as ImageIcon, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  bucket?: 'series-images' | 'anime-images';
  idPrefix?: string;
}

export function ImageUploadField({
  label = 'Capa (Upload de Imagem ou Link Direto)',
  value,
  onChange,
  bucket = 'series-images',
  idPrefix = 'upload-cover',
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP, etc.)');
      return;
    }

    // Limite de 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB.');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Enviando imagem para o servidor seguro...');

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanFileName = file.name
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase()
        .slice(0, 30);
      const fileName = `${cleanFileName}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (data?.publicUrl) {
        onChange(data.publicUrl);
        toast.success('Imagem enviada e aplicada com sucesso!', { id: toastId });
      } else {
        throw new Error('Não foi possível obter a URL pública da imagem.');
      }
    } catch (err: any) {
      console.error('[ImageUploadField] Erro no upload:', err);
      toast.error(`Falha no upload: ${err.message || 'Verifique sua conexão.'}`, { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-[#E31C25]" />
          <span>{label}</span>
        </Label>
        <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              mode === 'upload'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Upload Arquivo
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              mode === 'url'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Colar Link
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 w-full min-w-0">
        {/* Preview miniatura se houver imagem */}
        {value ? (
          <div className="relative group w-14 h-20 rounded-xl overflow-hidden border border-zinc-200 shrink-0 bg-zinc-50 shadow-xs">
            <img
              src={value}
              alt="Prévia da capa"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => onChange('')}
              title="Remover capa"
              className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ) : (
          <div className="w-14 h-20 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 shrink-0 flex flex-col items-center justify-center text-zinc-400">
            <ImageIcon className="h-5 w-5" />
            <span className="text-[8px] font-bold mt-1 uppercase">Sem capa</span>
          </div>
        )}

        {/* Controles de inserção */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {mode === 'upload' ? (
            <div className="w-full min-w-0">
              <input
                ref={fileInputRef}
                type="file"
                id={idPrefix}
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-10 border-dashed border-zinc-300 hover:border-zinc-950 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#E31C25]" />
                    <span>Fazendo upload da foto...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-zinc-600" />
                    <span className="truncate">{value ? 'Substituir por arquivo' : 'Escolher imagem do dispositivo'}</span>
                  </>
                )}
              </Button>
              <p className="text-[10px] text-zinc-500 mt-1">
                Suporta PNG, JPG, JPEG e WEBP (até 10MB). O upload é salvo diretamente no Supabase Storage.
              </p>
            </div>
          ) : (
            <div className="w-full min-w-0">
              <div className="relative w-full">
                <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  type="url"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="pl-8 bg-white border-zinc-200 text-zinc-950 text-xs shadow-xs h-10 rounded-xl w-full"
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Cole uma URL direta da internet caso prefira utilizar um link externo.
              </p>
            </div>
          )}

          {value && (
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 w-full min-w-0 max-w-full overflow-hidden">
              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
              <span className="truncate block min-w-0 flex-1">Capa pronta: {value}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
