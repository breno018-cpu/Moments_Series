import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  useCRMStages,
  useCRMContacts,
  useUpdateContactStage,
  useCRMTags,
  useContactTags,
  useToggleTag,
  useCreateTag,
  useContactNotes,
  useAddNote,
  useCreateContact,
  useDeleteContact,
  CRMContact,
} from '@/hooks/useCRM';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Mail, Phone, Trash2, Tag as TagIcon, MessageSquare, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatPhone } from '@/lib/validators';

export function AdminCRMKanban() {
  const { data: stages = [] } = useCRMStages();
  const { data: contacts = [], isLoading } = useCRMContacts();
  const { data: tags = [] } = useCRMTags();
  const updateStage = useUpdateContactStage();
  const createContact = useCreateContact();
  const createTag = useCreateTag();
  const deleteContact = useDeleteContact();

  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
  const [newContactOpen, setNewContactOpen] = useState(false);
  const [newTagOpen, setNewTagOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [newContact, setNewContact] = useState({ email: '', name: '', phone: '' });
  const [newTag, setNewTag] = useState({ name: '', color: '#a855f7' });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const contactId = result.draggableId;
    const newStageId = result.destination.droppableId;
    if (result.source.droppableId === newStageId) return;
    updateStage.mutate({ id: contactId, stage_id: newStageId });
  };

  const filtered = contacts.filter(
    (c) =>
      !search ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.name?.toLowerCase().includes(search.toLowerCase()),
  );

  // Métricas
  const totalRevenue = contacts.reduce((s, c) => s + Number(c.total_spent), 0);
  const customers = contacts.filter((c) => c.orders_count > 0).length;
  const leads = contacts.filter((c) => c.orders_count === 0).length;
  const ticketMedio = customers > 0 ? totalRevenue / customers : 0;

  return (
    <div className="space-y-6">
      {/* Header com métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Contatos" value={contacts.length.toString()} icon={<Mail className="h-4 w-4" />} />
        <MetricCard label="Clientes" value={customers.toString()} icon={<TrendingUp className="h-4 w-4" />} />
        <MetricCard label="Leads" value={leads.toString()} icon={<TagIcon className="h-4 w-4" />} />
        <MetricCard
          label="Ticket Médio"
          value={`R$ ${ticketMedio.toFixed(2)}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Dialog open={newTagOpen} onOpenChange={setNewTagOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <TagIcon className="mr-2 h-4 w-4" /> Nova Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Tag</DialogTitle>
                <DialogDescription>Crie etiquetas para classificar contatos</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={newTag.name} onChange={(e) => setNewTag({ ...newTag, name: e.target.value })} />
                </div>
                <div>
                  <Label>Cor</Label>
                  <Input
                    type="color"
                    value={newTag.color}
                    onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                  />
                </div>
                <Button
                  onClick={() => {
                    if (!newTag.name) return toast.error('Nome obrigatório');
                    createTag.mutate(newTag, {
                      onSuccess: () => {
                        setNewTagOpen(false);
                        setNewTag({ name: '', color: '#a855f7' });
                      },
                    });
                  }}
                  className="w-full"
                >
                  Criar Tag
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={newContactOpen} onOpenChange={setNewContactOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Contato Manual</DialogTitle>
                <DialogDescription>Adicione um contato ao CRM</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: formatPhone(e.target.value) })}
                  />
                </div>
                <Button
                  onClick={() => {
                    if (!newContact.email) return toast.error('Email obrigatório');
                    const leadStage = stages.find((s) => s.slug === 'lead');
                    createContact.mutate(
                      { ...newContact, stage_id: leadStage?.id, source: 'manual' },
                      {
                        onSuccess: () => {
                          setNewContactOpen(false);
                          setNewContact({ email: '', name: '', phone: '' });
                        },
                      },
                    );
                  }}
                  className="w-full"
                >
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-zinc-500 font-medium">Carregando CRM...</div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {stages.map((stage) => {
              const stageContacts = filtered.filter((c) => c.stage_id === stage.id);
              return (
                <Droppable droppableId={stage.id} key={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-shrink-0 w-72 rounded-xl border p-3 snap-start transition-colors ${
                        snapshot.isDraggingOver
                          ? 'border-[#E31C25] bg-red-50/30'
                          : 'border-zinc-200 bg-zinc-50/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          <h3 className="font-bold text-sm text-zinc-950">{stage.name}</h3>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-zinc-200 text-zinc-800 font-bold border-zinc-300">
                          {stageContacts.length}
                        </Badge>
                      </div>

                      <div className="space-y-2 min-h-[100px]">
                        {stageContacts.map((contact, idx) => (
                          <Draggable draggableId={contact.id} index={idx} key={contact.id}>
                            {(prov, snap) => (
                              <Card
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                onClick={() => setSelectedContact(contact)}
                                className={`p-3 cursor-pointer bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all ${
                                  snap.isDragging ? 'shadow-lg ring-2 ring-zinc-950' : ''
                                }`}
                              >
                                <div className="font-bold text-sm text-zinc-950 truncate">
                                  {contact.name || contact.email}
                                </div>
                                <div className="text-xs text-zinc-500 font-medium truncate">
                                  {contact.email}
                                </div>
                                {contact.total_spent > 0 && (
                                  <div className="text-xs text-emerald-600 font-bold mt-1">
                                    R$ {Number(contact.total_spent).toFixed(2)} ·{' '}
                                    {contact.orders_count}x
                                  </div>
                                )}
                                <Badge
                                  variant="outline"
                                  className="text-[10px] mt-2 capitalize border-zinc-300 text-zinc-700 bg-zinc-50"
                                >
                                  {contact.source}
                                </Badge>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Detalhes do contato */}
      {selectedContact && (
        <ContactDetail
          contact={selectedContact}
          allTags={tags}
          onClose={() => setSelectedContact(null)}
          onDelete={(id) => {
            deleteContact.mutate(id);
            setSelectedContact(null);
          }}
        />
      )}
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="p-4 bg-white border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-zinc-500 font-medium">{label}</span>
        <span className="text-[#E31C25]">{icon}</span>
      </div>
      <div className="text-2xl font-black text-zinc-950 tracking-tight">{value}</div>
    </Card>
  );
}

function ContactDetail({
  contact,
  allTags,
  onClose,
  onDelete,
}: {
  contact: CRMContact;
  allTags: any[];
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const { data: contactTags = [] } = useContactTags(contact.id);
  const { data: notes = [] } = useContactNotes(contact.id);
  const toggleTag = useToggleTag();
  const addNote = useAddNote();
  const [noteBody, setNoteBody] = useState('');

  const tagIds = new Set(contactTags.map((t: any) => t.id));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact.name || contact.email}</DialogTitle>
          <DialogDescription>Detalhes do contato</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow icon={<Mail className="h-3 w-3" />} label="Email" value={contact.email} />
            <InfoRow icon={<Phone className="h-3 w-3" />} label="Telefone" value={contact.phone || '—'} />
            <InfoRow label="Origem" value={contact.source} />
            <InfoRow label="Compras" value={`${contact.orders_count}x`} />
            <InfoRow label="Total gasto" value={`R$ ${Number(contact.total_spent).toFixed(2)}`} />
            <InfoRow
              label="Última compra"
              value={contact.last_order_at ? new Date(contact.last_order_at).toLocaleDateString('pt-BR') : '—'}
            />
            {contact.utm_source && (
              <InfoRow label="UTM Source" value={contact.utm_source} />
            )}
            {contact.utm_campaign && (
              <InfoRow label="Campanha" value={contact.utm_campaign} />
            )}
          </div>

          {/* Tags */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <TagIcon className="h-4 w-4" /> Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {allTags.length === 0 && (
                <span className="text-xs text-muted-foreground">Nenhuma tag criada ainda</span>
              )}
              {allTags.map((t: any) => {
                const active = tagIds.has(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() =>
                      toggleTag.mutate({ contactId: contact.id, tagId: t.id, add: !active })
                    }
                    className={`text-xs px-2 py-1 rounded-full border transition-all ${
                      active ? 'text-white' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: active ? t.color : 'transparent',
                      borderColor: t.color,
                      color: active ? '#fff' : t.color,
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notas */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Notas
            </h4>
            <div className="flex gap-2 mb-3">
              <Textarea
                placeholder="Adicionar uma anotação..."
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={2}
              />
              <Button
                onClick={() => {
                  if (!noteBody.trim()) return;
                  addNote.mutate(
                    { contactId: contact.id, body: noteBody },
                    { onSuccess: () => setNoteBody('') },
                  );
                }}
              >
                Salvar
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notes.map((n) => (
                <div key={n.id} className="text-sm bg-muted/50 p-2 rounded">
                  <p>{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-xs text-muted-foreground">Sem notas ainda</p>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="destructive" size="sm" onClick={() => onDelete(contact.id)}>
              <Trash2 className="mr-2 h-3 w-3" /> Remover
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}
