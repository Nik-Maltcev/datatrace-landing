import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, Globe, MapPin, Copy, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';

// Types are intentionally permissive to survive partial/unknown shapes
export type CompanyOkved = {
  code?: string;
  text?: string;
  title?: string;
};

export type CompanyOwner = {
  name?: string;
  type?: string;
  inn?: string;
  share_text?: string;
  share_percent?: number;
};

export type CompanyManager = {
  name?: string;
  fio?: string;
  position?: string;
  post?: string;
};

export type CompanyContacts = {
  phones?: string[];
  emails?: string[];
  sites?: string[];
};

export type CompanyBlock = {
  name?: string | null;
  fullName?: string | null;
  shortName?: string | null;
  inn?: string | null;
  ogrn?: string | null;
  kpp?: string | null;
  opf?: string | null;
  registration_date?: string | null;
  years_from_registration?: number | null;
  status?: string | null; // "Действует" | "Ликвидирована" | ...
  address?: string | null;
  contacts?: CompanyContacts | null;
  charter_capital?: string | null;
};

export type CompanySummary = {
  company?: CompanyBlock | null;
  ceo?: CompanyManager | null;
  managers?: CompanyManager[];
  owners?: CompanyOwner[];
  okved?: {
    main?: CompanyOkved | null;
    additional?: CompanyOkved[];
  } | null;
  predecessors?: Array<string | { name?: string; ogrn?: string }>;
  former_names?: string[];
};

export type CompanyCardProps = {
  data: CompanySummary;
  className?: string;
};

function classNames(...list: Array<string | false | null | undefined>): string {
  return list.filter(Boolean).join(' ');
}

function StatusBadge({ status }: { status?: string | null }) {
  const isActive = /действует/i.test(status || '');
  const isLiquidated = /ликвид/i.test(status || '');
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border',
        isActive && 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
        isLiquidated && 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
        !isActive && !isLiquidated && 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700'
      )}
    >
      {isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : isLiquidated ? <XCircle className="h-3.5 w-3.5" /> : null}
      <span>{status || '—'}</span>
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value, copyable }: { label: string; value?: React.ReactNode; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);
  const text = typeof value === 'string' ? value : undefined;
  return (
    <div className="grid grid-cols-[140px_1fr_auto] items-start gap-3 py-1">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-sm text-slate-800 dark:text-slate-100 break-words">{value || '—'}</div>
      {copyable && text ? (
        <button
          onClick={async () => {
            try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {}
          }}
          className={classNames(
            'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs',
            'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          <Copy className="h-3.5 w-3.5" /> {copied ? 'Скопировано' : 'Копировать'}
        </button>
      ) : null}
    </div>
  );
}

function List({ items }: { items?: React.ReactNode[] }) {
  if (!items || items.length === 0) return <div className="text-sm text-slate-500">—</div>;
  return (
    <ul className="text-sm text-slate-800 dark:text-slate-100 list-disc pl-5 space-y-1">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

function CollapsibleList({ title, items, initial = 5 }: { title: string; items: React.ReactNode[]; initial?: number }) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, initial);
  const hasMore = items.length > shown.length;
  return (
    <div>
      <List items={shown} />
      {hasMore && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 dark:text-sky-300"
        >
          <ChevronDown className={classNames('h-4 w-4 transition-transform', open && 'rotate-180')} />
          {open ? 'Свернуть' : 'Показать ещё'}
        </button>
      )}
    </div>
  );
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ data, className }) => {
  const c = data?.company || {};
  const companyName = c.name || (c.fullName ?? c.shortName) || 'Компания';
  const statusText = c.status || undefined;

  const phones = c.contacts?.phones || [];
  const emails = c.contacts?.emails || [];
  const sites = c.contacts?.sites || [];

  const okvedMain = data.okved?.main;
  const okvedAdd = data.okved?.additional || [];

  const managers = useMemo(() => {
    const res: CompanyManager[] = [];
    if (data.ceo) res.push({ name: data.ceo.name || data.ceo.fio, position: data.ceo.position || data.ceo.post });
    if (Array.isArray(data.managers)) res.push(...data.managers);
    return res.filter(Boolean);
  }, [data.ceo, data.managers]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={classNames('w-full mx-auto max-w-3xl', className)}
    >
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 shadow-xl overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-200/70 dark:border-slate-800 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">{companyName}</h2>
            <StatusBadge status={statusText} />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {c.inn ? `ИНН ${c.inn}` : ''}{c.ogrn ? ` • ОГРН ${c.ogrn}` : ''}{c.kpp ? ` • КПП ${c.kpp}` : ''}
          </div>
        </div>

        <div className="p-4 md:p-6 grid grid-cols-1 gap-4 md:gap-6">
          {/* Основная информация */}
          <Section title="Основная информация">
            <div className="space-y-1">
              <Row label="Краткое название" value={c.shortName || c.name || '—'} />
              <Row label="Полное название" value={c.fullName || c.name || '—'} />
              <Row label="Дата регистрации" value={c.registration_date || '—'} />
              <Row label="Срок существования" value={c.years_from_registration ? `${c.years_from_registration} лет` : '—'} />
            </div>
          </Section>

          {/* Адрес */}
          <Section title="Адрес">
            <Row label="Юр. адрес" value={c.address || '—'} copyable />
          </Section>

          {/* Контакты */}
          {(phones.length || emails.length || sites.length) ? (
            <Section title="Контакты">
              <div className="grid gap-2">
                {emails.length ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <div className="flex gap-2 flex-wrap">
                      {emails.map((e) => (
                        <a key={e} href={`mailto:${e}`} className="text-sky-600 hover:underline">
                          {e}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
                {phones.length ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <div className="flex gap-2 flex-wrap">
                      {phones.map((p) => (
                        <a key={p} href={`tel:${p}`} className="text-sky-600 hover:underline">
                          {p}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
                {sites.length ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-slate-500" />
                    <div className="flex gap-2 flex-wrap">
                      {sites.map((s) => (
                        <a key={s} href={/^https?:\/\//i.test(s) ? s : `https://${s}`} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">
                          {s}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </Section>
          ) : null}

          {/* ОКВЭД */}
          {(okvedMain || (okvedAdd && okvedAdd.length)) ? (
            <Section title="ОКВЭД">
              {okvedMain ? (
                <div className="text-sm">
                  <span className="font-medium">Основной:</span> {okvedMain.code || '—'} {okvedMain.text || okvedMain.title || ''}
                </div>
              ) : null}
              {okvedAdd && okvedAdd.length ? (
                <div className="mt-2">
                  <div className="text-xs text-slate-500 mb-1">Дополнительные:</div>
                  <CollapsibleList
                    title="Дополнительные ОКВЭДы"
                    items={okvedAdd.map((v, i) => (
                      <span key={i}>{v.code || '—'} {v.text || v.title || ''}</span>
                    ))}
                    initial={6}
                  />
                </div>
              ) : null}
            </Section>
          ) : null}

          {/* Руководители */}
          {managers.length ? (
            <Section title="Руководители">
              <List items={managers.map((m) => <span key={(m.name||m.fio)||''}>{(m.name || m.fio) ?? '—'}{m.position || m.post ? ` — ${m.position || m.post}` : ''}</span>)} />
            </Section>
          ) : null}

          {/* Капитал и Владельцы */}
          {!!c.charter_capital || (data.owners && data.owners.length > 0) ? (
            <Section title="Капитал и Владельцы">
              {c.charter_capital ? <Row label="Уставной капитал" value={c.charter_capital} /> : null}
              {data.owners && data.owners.length ? (
                <div className="mt-2">
                  <List
                    items={data.owners.map((o, i) => (
                      <span key={i}>{[o.name, o.share_text, o.inn].filter(Boolean).join(' — ')}</span>
                    ))}
                  />
                </div>
              ) : null}
            </Section>
          ) : null}

          {/* История */}
          {(data.former_names && data.former_names.length) || (data.predecessors && data.predecessors.length) ? (
            <Section title="История">
              {data.former_names && data.former_names.length ? (
                <div className="mb-3">
                  <div className="text-xs text-slate-500 mb-1">Прежние названия:</div>
                  <List items={data.former_names.map((n) => <span key={n}>{n}</span>)} />
                </div>
              ) : null}
              {data.predecessors && data.predecessors.length ? (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Предшественники:</div>
                  <List
                    items={data.predecessors.map((p, i) => {
                      if (typeof p === 'string') return <span key={i}>{p}</span>;
                      return <span key={i}>{[p.name, p.ogrn].filter(Boolean).join(' — ')}</span>;
                    })}
                  />
                </div>
              ) : null}
            </Section>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

// Small helper to add KV rows where we don't have the Row component in scope
function addKV(container: HTMLElement | React.ReactNode, label: string, value?: string | number | null | undefined) {
  // This helper is kept for backward compatibility if needed.
}

export default CompanyCard;


