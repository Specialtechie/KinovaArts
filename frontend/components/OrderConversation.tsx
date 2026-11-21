'use client';

import { useState, type FormEvent } from 'react';
import { call, firstError } from '@/lib/client';
import { dateLabel } from '@/lib/format';

type Message = {
  id: number;
  body: string | null;
  images: string[] | null;
  created_at: string;
  sender?: { name: string; is_admin: boolean } | null;
};

const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;

export default function OrderConversation({
  endpoint,
  initialMessages,
}: {
  endpoint: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setError(null);
    const form = new FormData();
    if (body.trim()) form.append('body', body.trim());
    files.forEach((file) => form.append('images[]', file));
    const response = await call<Message>(endpoint, { form });
    setBusy(false);

    if (!response.ok) {
      setError(firstError(response.data));
      return;
    }

    setMessages((existing) => [...existing, response.data]);
    setBody('');
    setFiles([]);
    formElement.reset();
  }

  return (
    <section className="rounded-md border border-line bg-panel p-5">
      <h2 className="font-display text-lg font-semibold">Order conversation</h2>
      <div className="mt-4 flex max-h-[28rem] flex-col gap-3 overflow-y-auto">
        {messages.length === 0 && <p className="text-sm text-ink/60">No messages yet. Send an update or ask a question.</p>}
        {messages.map((message) => (
          <article key={message.id} className="rounded-md border border-line bg-white/70 p-3 text-sm">
            <div className="mb-1 flex justify-between gap-3 text-xs text-ink/50">
              <span>{message.sender?.is_admin ? 'Kinova Arts' : message.sender?.name || 'Customer'}</span>
              <time>{dateLabel(message.created_at)}</time>
            </div>
            {message.body && <p className="whitespace-pre-line">{message.body}</p>}
            {!!message.images?.length && (
              <div className="mt-2 flex flex-wrap gap-2">
                {message.images.map((image) => (
                  <a key={image} href={image} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="Order update" className="h-24 w-24 rounded object-cover" />
                  </a>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <label className="field-label">
          Message
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            maxLength={5000}
            className="field-input mt-1"
            placeholder="Share a progress update or ask a question."
          />
        </label>
        <label className="field-label">
          Photos (optional, up to 3; 1 MB max each)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => {
              const allSelected = Array.from(event.target.files ?? []);
              if (allSelected.length > 3) {
                setError('Please attach at most 3 photos.');
                setFiles([]);
                event.target.value = '';
                return;
              }
              const selected = allSelected;
              const tooLarge = selected.find((file) => file.size > MAX_IMAGE_SIZE_BYTES);
              if (tooLarge) {
                setError(`"${tooLarge.name}" is larger than 1 MB. Please choose a smaller image.`);
                setFiles([]);
                event.target.value = '';
                return;
              }
              setError(null);
              setFiles(selected);
            }}
            className="field-input mt-1"
          />
        </label>
        {files.length > 0 && <p className="text-xs text-ink/60">{files.length} photo(s) selected.</p>}
        {error && <p className="text-sm text-clay">{error}</p>}
        <button disabled={busy || (!body.trim() && files.length === 0)} className="btn-primary w-fit">
          {busy ? 'Sending…' : 'Send update'}
        </button>
      </form>
    </section>
  );
}
