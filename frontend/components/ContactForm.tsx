'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { firstError } from '@/lib/client';
import { useAuth } from './store';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

type InquiryType = 'enquiry' | 'complaint';

type ContactFormData = {
  type: InquiryType;
  name: string;
  email: string;
  order_number: string;
  subject: string;
  message: string;
  company_website: string;
};

const initialForm: ContactFormData = {
  type: 'enquiry',
  name: '',
  email: '',
  order_number: '',
  subject: '',
  message: '',
  company_website: '',
};

export default function ContactForm() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (user) {
      setForm((current) => ({
        ...current,
        name: current.name || user.name,
        email: current.email || user.email,
      }));
    }
  }, [user]);

  function update(key: Exclude<keyof ContactFormData, 'type'>) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch(`${API}/api/contact-inquiries`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => null);

      if (response.ok) {
        setFeedback({ type: 'success', message: data?.message || 'Your message has been sent.' });
        setForm({ ...initialForm, name: user?.name || '', email: user?.email || '' });
      } else {
        setFeedback({ type: 'error', message: firstError(data, 'We could not send your message. Please try again.') });
      }
    } catch {
      setFeedback({ type: 'error', message: 'We could not reach the store. Please try again.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 border-t border-line pt-8" aria-labelledby="contact-form-heading">
      <h2 id="contact-form-heading" className="mb-2 font-display text-2xl font-semibold">Send us a message</h2>
      <p className="mb-6 text-sm text-ink/70">
        Choose an enquiry or complaint. For order-related messages, include your order number if you have it.
      </p>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="inquiry-type" className="field-label">I have a</label>
          <select
            id="inquiry-type"
            name="type"
            value={form.type}
            onChange={(event) => setForm((current) => ({
              ...current,
              type: event.target.value === 'complaint' ? 'complaint' : 'enquiry',
            }))}
            className="field-input"
          >
            <option value="enquiry">General enquiry</option>
            <option value="complaint">Complaint</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="field-label">Full name</label>
            <input id="contact-name" name="name" required maxLength={255} value={form.name} onChange={update('name')} className="field-input" />
          </div>
          <div>
            <label htmlFor="contact-email" className="field-label">Email</label>
            <input id="contact-email" name="email" type="email" required maxLength={255} value={form.email} onChange={update('email')} className="field-input" />
          </div>
        </div>

        <div>
          <label htmlFor="contact-order-number" className="field-label">Order number (optional)</label>
          <input id="contact-order-number" name="order_number" maxLength={100} value={form.order_number} onChange={update('order_number')} className="field-input" />
        </div>

        <div>
          <label htmlFor="contact-subject" className="field-label">Subject</label>
          <input id="contact-subject" name="subject" required maxLength={160} value={form.subject} onChange={update('subject')} className="field-input" />
        </div>

        <div>
          <label htmlFor="contact-message" className="field-label">Message</label>
          <textarea
            id="contact-message"
            name="message"
            required
            minLength={20}
            maxLength={5000}
            rows={6}
            value={form.message}
            onChange={update('message')}
            className="field-input"
          />
        </div>

        <div className="absolute left-[-9999px]" aria-hidden="true">
          <label htmlFor="contact-company-website">Leave this field empty</label>
          <input
            id="contact-company-website"
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
            value={form.company_website}
            onChange={update('company_website')}
          />
        </div>

        {feedback && (
          <div
            role={feedback.type === 'error' ? 'alert' : 'status'}
            className={`rounded-md border p-3 text-sm ${feedback.type === 'error' ? 'border-clay bg-clay/10 text-clay' : 'border-line bg-panel text-ink'}`}
          >
            {feedback.message}
          </div>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-fit">
          {busy ? 'Sending…' : 'Send message'}
        </button>
        <p className="text-xs text-ink/50">Please do not include passwords or full payment-card details.</p>
      </form>
    </section>
  );
}
