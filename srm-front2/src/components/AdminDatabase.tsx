import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../config/api';
import Swal from 'sweetalert2';
import {
  Database, ChevronLeft, ChevronRight, Trash2, Plus, Save,
  RefreshCw, X, Search, ExternalLink, Upload, Filter
} from 'react-feather';

type CollectionMeta = { key: string; label: string; count: number };

type FieldState =
  | { t: 'readonly'; v: string }
  | { t: 'string'; v: string }
  | { t: 'number'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'password'; v: string }
  | { t: 'json'; v: string }
  | { t: 'url'; v: string };

type FieldEntry = { key: string; state: FieldState };

const USER_ROLES = ['Author', 'Reviewer', 'Editor', 'Admin'];

// Keys that are likely PDF/file URLs
const PDF_URL_KEYS = ['pdfUrl', 'copyrightFormUrl', 'cameraReadyUrl', 'fileUrl', 'documentUrl', 'url', 'pdf', 'file', 'attachment'];
const isUrlKey = (key: string) => PDF_URL_KEYS.some(k => key.toLowerCase().includes(k.toLowerCase()) || key.toLowerCase().endsWith('url') || key.toLowerCase().endsWith('pdf'));
const looksLikeUrl = (v: string) => /^https?:\/\//i.test(v.trim());

// ── Per-collection search fields (keyed on exact Mongoose collection name) ──
// Fields listed here MUST exist in the corresponding model schema.
const SEARCH_FIELDS: Record<string, { key: string; label: string }[]> = {
  // User.js: username, email, role, isGoogleAuth, verified, tempPassword
  users: [
    { key: 'email',    label: 'Email' },
    { key: 'username', label: 'Username' },
    { key: 'role',     label: 'Role' },
  ],

  // Paper.js (PaperSubmission): submissionId, paperTitle, authorName, email, institution, category, status
  papersubmissions: [
    { key: 'submissionId', label: 'Paper ID' },
    { key: 'email',        label: 'Author Email' },
    { key: 'authorName',   label: 'Author Name' },
    { key: 'paperTitle',   label: 'Title' },
    { key: 'status',       label: 'Status' },
    { key: 'category',     label: 'Category' },
    { key: 'institution',  label: 'Institution' },
  ],

  // Review.js (legacy): no plain text fields, all refs — only submissionId via linked paper
  // Provide minimal useful filter
  reviews: [
    { key: 'submissionId', label: 'Paper ID' },
  ],

  // ReviewerReview.js: reviewerEmail, reviewerName, submissionId
  reviewerreviews: [
    { key: 'reviewerEmail', label: 'Reviewer Email' },
    { key: 'reviewerName',  label: 'Reviewer Name' },
    { key: 'submissionId',  label: 'Paper ID' },
  ],

  // ReviewerAssignment.js: submissionId, reviewerEmail, reviewerName, paperTitle, status
  reviewerassignments: [
    { key: 'submissionId',  label: 'Paper ID' },
    { key: 'reviewerEmail', label: 'Reviewer Email' },
    { key: 'reviewerName',  label: 'Reviewer Name' },
    { key: 'paperTitle',    label: 'Paper Title' },
    { key: 'status',        label: 'Status' },
  ],

  // ReReview.js: submissionId, reviewerEmail, reviewerName, recommendation
  rereviews: [
    { key: 'submissionId',  label: 'Paper ID' },
    { key: 'reviewerEmail', label: 'Reviewer Email' },
    { key: 'reviewerName',  label: 'Reviewer Name' },
    { key: 'recommendation',label: 'Recommendation' },
  ],

  // Revision.js: submissionId, authorEmail, authorName, editorEmail, editorName, revisionStatus
  revisions: [
    { key: 'submissionId',   label: 'Paper ID' },
    { key: 'authorEmail',    label: 'Author Email' },
    { key: 'authorName',     label: 'Author Name' },
    { key: 'editorEmail',    label: 'Editor Email' },
    { key: 'revisionStatus', label: 'Status' },
  ],

  // RevisionReview.js: submissionId, reviewerEmail, reviewerName
  revisionreviews: [
    { key: 'submissionId',  label: 'Paper ID' },
    { key: 'reviewerEmail', label: 'Reviewer Email' },
    { key: 'reviewerName',  label: 'Reviewer Name' },
  ],

  // ReviewerMessage.js: submissionId — senderEmail is nested inside conversation array
  reviewermessages: [
    { key: 'submissionId', label: 'Paper ID' },
    { key: 'status',       label: 'Status' },
  ],

  // PaperMessage.js: submissionId, authorEmail
  papermessages: [
    { key: 'submissionId', label: 'Paper ID' },
    { key: 'authorEmail',  label: 'Author Email' },
  ],

  // SupportMessage.js: authorEmail, authorName
  supportmessages: [
    { key: 'authorEmail', label: 'Author Email' },
    { key: 'authorName',  label: 'Author Name' },
  ],

  // Copyright.js: submissionId, authorEmail
  copyrights: [
    { key: 'submissionId', label: 'Paper ID' },
    { key: 'authorEmail',  label: 'Author Email' },
    { key: 'status',       label: 'Status' },
    { key: 'paymentStatus',label: 'Payment Status' },
  ],

  // PaymentRegistration.js: submissionId, authorEmail, authorName, paperTitle
  paymentregistrations: [
    { key: 'submissionId', label: 'Paper ID' },
    { key: 'authorEmail',  label: 'Author Email' },
    { key: 'authorName',   label: 'Author Name' },
    { key: 'paperTitle',   label: 'Paper Title' },
  ],

  // PaymentDoneFinalUser.js: submissionId, authorEmail, authorName, institution
  paymentdonefinalusers: [
    { key: 'submissionId', label: 'Paper ID' },
    { key: 'authorEmail',  label: 'Author Email' },
    { key: 'authorName',   label: 'Author Name' },
    { key: 'institution',  label: 'Institution' },
  ],

  // FinalAcceptance.js: submissionId, authorEmail, authorName, paperTitle
  finalacceptances: [
    { key: 'submissionId', label: 'Paper ID' },
    { key: 'authorEmail',  label: 'Author Email' },
    { key: 'authorName',   label: 'Author Name' },
    { key: 'paperTitle',   label: 'Paper Title' },
  ],

  // RejectedPaper.js: submissionId, authorEmail, authorName, paperTitle
  rejectedpapers: [
    { key: 'submissionId', label: 'Paper ID' },
    { key: 'authorEmail',  label: 'Author Email' },
    { key: 'authorName',   label: 'Author Name' },
    { key: 'paperTitle',   label: 'Paper Title' },
  ],

  // ConferenceSelectedUser.js: submissionId, authorEmail, authorName, paperTitle, status
  conferenceselectedusers: [
    { key: 'submissionId', label: 'Paper ID' },
    { key: 'authorEmail',  label: 'Author Email' },
    { key: 'authorName',   label: 'Author Name' },
    { key: 'paperTitle',   label: 'Paper Title' },
    { key: 'status',       label: 'Status' },
  ],

  // ListenerRegistration.js: email, name, institution, country, paymentMethod
  listenerregistrations: [
    { key: 'email',         label: 'Email' },
    { key: 'name',          label: 'Name' },
    { key: 'institution',   label: 'Institution' },
    { key: 'country',       label: 'Country' },
    { key: 'paymentMethod', label: 'Payment Method' },
  ],

  // Committee.js: name, role, affiliation, country
  committees: [
    { key: 'name',        label: 'Name' },
    { key: 'role',        label: 'Role' },
    { key: 'affiliation', label: 'Affiliation' },
    { key: 'country',     label: 'Country' },
  ],

  // CommitteeMember.js: name, role, affiliation, country
  committeemembers: [
    { key: 'name',        label: 'Name' },
    { key: 'role',        label: 'Role' },
    { key: 'affiliation', label: 'Affiliation' },
    { key: 'country',     label: 'Country' },
  ],
};

/** Returns exact filter fields for this collection, or [] if none defined. */
function getSearchFields(collectionKey: string): { key: string; label: string }[] {
  return SEARCH_FIELDS[collectionKey] ?? [];
}

function documentToEntries(doc: Record<string, unknown> | null, isNew: boolean): FieldEntry[] {
  if (isNew || !doc) return [];
  const keys = Object.keys(doc).sort((a, b) => {
    if (a === '_id') return -1; if (b === '_id') return 1;
    if (a === '__v') return 1; if (b === '__v') return -1;
    return a.localeCompare(b);
  });

  const entries: FieldEntry[] = [];
  for (const key of keys) {
    const val = doc[key];
    if (key === '_id' || key === '__v') {
      entries.push({ key, state: { t: 'readonly', v: String(val) } });
    } else if (val === null || val === undefined) {
      entries.push({ key, state: { t: 'string', v: '' } });
    } else if (typeof val === 'boolean') {
      entries.push({ key, state: { t: 'bool', v: val } });
    } else if (typeof val === 'number') {
      entries.push({ key, state: { t: 'number', v: String(val) } });
    } else if (typeof val === 'string') {
      if (key === 'password') {
        entries.push({ key, state: { t: 'password', v: '' } });
      } else if (isUrlKey(key) && looksLikeUrl(val)) {
        entries.push({ key, state: { t: 'url', v: val } });
      } else {
        entries.push({ key, state: { t: 'string', v: val } });
      }
    } else {
      entries.push({ key, state: { t: 'json', v: JSON.stringify(val, null, 2) } });
    }
  }
  return entries;
}

function entriesToPayload(entries: FieldEntry[], isEdit: boolean): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const { key, state } of entries) {
    const k = key.trim();
    if (!k) continue;
    if (state.t === 'readonly') continue;
    if (state.t === 'password') { if (state.v === '' && isEdit) continue; o[k] = state.v; continue; }
    if (state.t === 'bool') { o[k] = state.v; continue; }
    if (state.t === 'number') {
      const s = state.v.trim();
      if (s === '') { o[k] = null; } else { const n = Number(s); o[k] = Number.isNaN(n) ? state.v : n; }
      continue;
    }
    if (state.t === 'json') {
      const raw = state.v.trim();
      if (raw === '') { o[k] = null; } else { try { o[k] = JSON.parse(raw); } catch { throw new Error(`Invalid JSON for field "${k}"`); } }
      continue;
    }
    if (state.t === 'url' || state.t === 'string') { o[k] = state.v === '' ? null : state.v; }
  }
  return o;
}

function humanizeKey(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
}

// ── Upload helper using the existing admin/upload endpoint ──────────────────
async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/api/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  if (res.data?.url) return res.data.url;
  if (res.data?.fileUrl) return res.data.fileUrl;
  throw new Error('Upload response did not include a URL');
}

// ── SmartCell: renders preview in the table ─────────────────────────────────
function SmartCell({ value, fieldKey }: { value: any; fieldKey?: string }) {
  const str = value == null ? '' : String(value);
  if (fieldKey && isUrlKey(fieldKey) && looksLikeUrl(str)) {
    return (
      <a href={str} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700 transition">
        <ExternalLink className="w-2.5 h-2.5" /> VIEW
      </a>
    );
  }
  return <span className="text-xs text-gray-600 truncate max-w-[200px]">{str || '—'}</span>;
}

// ── Main Component ──────────────────────────────────────────────────────────
const AdminDatabase = () => {
  const [collections, setCollections] = useState<CollectionMeta[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [fieldEntries, setFieldEntries] = useState<FieldEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [collectionSidebarOpen, setCollectionSidebarOpen] = useState(false);

  // ── Search & Filter ──
  const [searchField, setSearchField] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [filteredDocs, setFilteredDocs] = useState<any[]>([]);

  // Column keys that are actually URLs (detected from first doc)
  const [urlColumns, setUrlColumns] = useState<string[]>([]);

  // Preview columns to show in table
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const fetchMeta = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/db/meta');
      if (res.data.success) setCollections(res.data.collections || []);
    } catch (e: any) {
      Swal.fire('Error', e.response?.data?.message || 'Failed to load collections', 'error');
    }
  }, []);

  const fetchList = useCallback(async () => {
    if (!selectedKey) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/db/${selectedKey}`, {
        params: { page, limit, sort: 'updatedAt', order: 'desc' }
      });
      if (res.data.success) {
        const docs = res.data.documents || [];
        setDocuments(docs);
        setTotal(res.data.total ?? 0);
        setPages(res.data.pages ?? 1);

        // Detect URL columns & preview columns from first doc
        if (docs.length > 0) {
          const allKeys = Object.keys(docs[0]);
          setUrlColumns(allKeys.filter(k => isUrlKey(k) && docs.some((d: any) => looksLikeUrl(String(d[k] ?? '')))));
          // Pick up to 3 meaningful preview columns
          const skip = new Set(['_id', '__v', 'password', 'createdAt', 'updatedAt']);
          const previews = allKeys.filter(k => !skip.has(k)).slice(0, 4);
          setPreviewColumns(previews);
        }
      }
    } catch (e: any) {
      Swal.fire('Error', e.response?.data?.message || 'Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedKey, page, limit]);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);
  useEffect(() => { if (selectedKey) { setSearchValue(''); fetchList(); } }, [selectedKey, page, fetchList]);

  // Client-side filter
  useEffect(() => {
    if (!searchValue.trim() || !searchField) {
      setFilteredDocs(documents);
    } else {
      const q = searchValue.trim().toLowerCase();
      setFilteredDocs(documents.filter(doc => {
        const v = doc[searchField];
        if (v == null) return false;
        return String(v).toLowerCase().includes(q);
      }));
    }
  }, [documents, searchField, searchValue]);

  // Init search field when collection changes
  useEffect(() => {
    if (!selectedKey) return;
    const fields = getSearchFields(selectedKey);
    setSearchField(fields[0]?.key || '');
    setSearchValue('');
  }, [selectedKey]);

  const openNew = () => { setIsNew(true); setEditingId(null); setFieldEntries([]); setNewFieldKey(''); setEditorOpen(true); };
  const openEdit = (doc: any) => {
    setIsNew(false);
    setEditingId(doc._id ? String(doc._id) : null);
    setFieldEntries(documentToEntries(doc as Record<string, unknown>, false));
    setEditorOpen(true);
  };
  const closeEditor = () => setEditorOpen(false);

  const updateEntry = (index: number, next: FieldEntry) => {
    setFieldEntries(prev => { const c = [...prev]; c[index] = next; return c; });
  };
  const removeEntry = (index: number) => setFieldEntries(prev => prev.filter((_, i) => i !== index));

  const addNewFieldRow = () => {
    const k = newFieldKey.trim();
    if (!k) { Swal.fire('Field name required', '', 'warning'); return; }
    if (fieldEntries.some(e => e.key === k)) { Swal.fire('Duplicate field', '', 'warning'); return; }
    setFieldEntries(prev => [...prev, { key: k, state: { t: 'string', v: '' } }]);
    setNewFieldKey('');
  };

  const handleFileUpload = async (index: number, key: string, file: File) => {
    setUploadingField(key);
    try {
      const url = await uploadFile(file);
      updateEntry(index, { key, state: { t: 'url', v: url } });
      Swal.fire({ icon: 'success', title: 'Uploaded!', text: 'File uploaded. Click Save to apply.', timer: 2000, showConfirmButton: false });
    } catch (e: any) {
      Swal.fire('Upload failed', e.message || 'Could not upload file', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  const saveDocument = async () => {
    if (!selectedKey) return;
    let parsed: Record<string, unknown>;
    try { parsed = entriesToPayload(fieldEntries, !isNew); } catch (e: any) {
      Swal.fire('Invalid data', e.message, 'error'); return;
    }
    if (isNew && Object.keys(parsed).length === 0) { Swal.fire('Empty document', 'Add at least one field.', 'warning'); return; }
    try {
      if (isNew) {
        const res = await api.post(`/api/admin/db/${selectedKey}`, parsed);
        if (res.data.success) { Swal.fire('Created', 'Document created.', 'success'); setEditorOpen(false); fetchList(); fetchMeta(); }
      } else if (editingId) {
        const res = await api.put(`/api/admin/db/${selectedKey}/${editingId}`, parsed);
        if (res.data.success) { Swal.fire('Saved', 'Document updated.', 'success'); setEditorOpen(false); fetchList(); fetchMeta(); }
      }
    } catch (e: any) { Swal.fire('Error', e.response?.data?.message || 'Save failed', 'error'); }
  };

  const deleteDoc = async (doc: any) => {
    if (!selectedKey) return;
    const id = doc._id ? String(doc._id) : '';
    if (!id) return;
    if (selectedKey === 'users' && doc.role === 'Admin') {
      Swal.fire({
        icon: 'info',
        title: 'Not allowed',
        text: 'Admin user documents cannot be deleted from the database browser.'
      });
      return;
    }
    const r = await Swal.fire({
      title: 'Delete document?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Delete'
    });
    if (!r.isConfirmed) return;
    try {
      await api.delete(`/api/admin/db/${selectedKey}/${id}`);
      fetchList();
      fetchMeta();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Delete failed';
      Swal.fire({ icon: 'info', title: 'Could not delete', text: msg });
    }
  };

  // ── Field Renderer ────────────────────────────────────────────────────────
  const renderFieldInput = (entry: FieldEntry, index: number) => {
    const { key, state } = entry;
    const label = humanizeKey(key);
    const isUsers = selectedKey === 'users';
    const isRoleSelect = isUsers && key === 'role';
    const isUserTypeSelect = isUsers && key === 'userType';

    const fieldId = `field-${key}-${index}`;

    if (state.t === 'readonly') return (
      <div key={fieldId} className="border-b border-gray-100 pb-3 mb-3">
        <label className="block text-[10px] font-black text-gray-400 font-mono uppercase tracking-wider mb-1">{key}</label>
        <input readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-[11px] text-gray-600 font-mono" value={state.v} />
        <p className="text-[10px] text-gray-400 mt-0.5">Read-only</p>
      </div>
    );

    if (state.t === 'bool') return (
      <div key={fieldId} className="border-b border-gray-100 pb-3 mb-3">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">{label}</label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded text-[#F5A051]" checked={state.v}
            onChange={(e) => updateEntry(index, { key, state: { t: 'bool', v: e.target.checked } })} />
          <span className="text-sm text-gray-600">{state.v ? 'Yes' : 'No'}</span>
        </label>
      </div>
    );

    if (state.t === 'password') return (
      <div key={fieldId} className="border-b border-gray-100 pb-3 mb-3">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{label}</label>
        <input type="password" autoComplete="new-password"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F5A051]"
          placeholder={isNew ? 'New password' : 'Leave blank to keep current hash'}
          value={state.v}
          onChange={(e) => updateEntry(index, { key, state: { t: 'password', v: e.target.value } })} />
        {!isNew && <p className="text-[10px] text-amber-700 mt-1">Empty = do not change password.</p>}
      </div>
    );

    if (state.t === 'url') return (
      <div key={fieldId} className="border-b border-gray-100 pb-3 mb-3">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{label}</label>
        {/* Current file link */}
        {state.v && looksLikeUrl(state.v) && (
          <div className="mb-2 flex items-center gap-2">
            <a href={state.v} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition">
              <ExternalLink className="w-3.5 h-3.5" /> View File
            </a>
            <span className="text-[10px] text-gray-400 truncate max-w-[180px]">{state.v.split('/').pop()}</span>
          </div>
        )}
        {/* Text URL field */}
        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#F5A051] mb-2"
          placeholder="https://..."
          value={state.v}
          onChange={(e) => updateEntry(index, { key, state: { t: 'url', v: e.target.value } })} />
        {/* Re-upload button */}
        <div>
          <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
            className="hidden"
            ref={uploadingField === key ? fileInputRef : undefined}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) await handleFileUpload(index, key, file);
              e.target.value = '';
            }}
            id={`upload-${fieldId}`}
          />
          <label htmlFor={`upload-${fieldId}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
              uploadingField === key
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100'
            }`}>
            <Upload className="w-3 h-3" />
            {uploadingField === key ? 'Uploading...' : 'Re-upload / Change File'}
          </label>
        </div>
      </div>
    );

    if (state.t === 'json') return (
      <div key={fieldId} className="border-b border-gray-100 pb-3 mb-3">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{label}</label>
        <textarea rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#F5A051]"
          value={state.v} spellCheck={false}
          onChange={(e) => updateEntry(index, { key, state: { t: 'json', v: e.target.value } })} />
        <p className="text-[10px] text-gray-400 mt-0.5">Object or array — valid JSON</p>
      </div>
    );

    if (isRoleSelect) return (
      <div key={fieldId} className="border-b border-gray-100 pb-3 mb-3">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{label}</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F5A051]"
          value={state.t === 'string' ? state.v : ''}
          onChange={(e) => updateEntry(index, { key, state: { t: 'string', v: e.target.value } })}>
          {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
    );

    if (isUserTypeSelect) return (
      <div key={fieldId} className="border-b border-gray-100 pb-3 mb-3">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{label}</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F5A051]"
          value={state.t === 'string' ? (state.v ?? '') : ''}
          onChange={(e) => updateEntry(index, { key, state: { t: 'string', v: e.target.value || '' } })}>
          <option value="">(none / null)</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="scholar">Scholar</option>
        </select>
      </div>
    );

    if (state.t === 'number') return (
      <div key={fieldId} className="border-b border-gray-100 pb-3 mb-3">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{label}</label>
        <div className="flex gap-2">
          <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F5A051]"
            value={state.v} onChange={(e) => updateEntry(index, { key, state: { t: 'number', v: e.target.value } })} />
          {isNew && <button type="button" onClick={() => removeEntry(index)} className="text-red-500 text-xs px-2 shrink-0 hover:text-red-700">✕</button>}
        </div>
      </div>
    );

    // Default string
    return (
      <div key={fieldId} className="border-b border-gray-100 pb-3 mb-3">
        <label className="block text-[10px] font-black text-gray-400 font-mono uppercase tracking-wider mb-1">{key}</label>
        <div className="flex gap-2">
          <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F5A051]"
            value={state.t === 'string' ? state.v : ''}
            onChange={(e) => updateEntry(index, { key, state: { t: 'string', v: e.target.value } })} />
          {isNew && <button type="button" onClick={() => removeEntry(index)} className="text-red-500 text-xs px-2 shrink-0 hover:text-red-700">✕</button>}
        </div>
      </div>
    );
  };

  const searchFields = selectedKey ? getSearchFields(selectedKey) : [];

  return (
    <div className="flex gap-0 h-full relative">
      {/* Mobile Collections Toggle */}
      <button
        className="lg:hidden fixed bottom-6 left-20 z-30 bg-[#F5A051] text-white px-3 py-2 rounded-xl text-xs font-black shadow-lg flex items-center gap-2"
        onClick={() => setCollectionSidebarOpen(v => !v)}
      >
        <Database className="w-4 h-4" />
        {collectionSidebarOpen ? 'Close' : 'Collections'}
      </button>

      {/* Collections Sidebar */}
      <div className={`
        ${collectionSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:static top-0 left-0 h-full lg:h-auto z-40 lg:z-auto
        w-56 bg-white border-r border-gray-200 shadow-xl lg:shadow-none
        flex-col transition-transform duration-200
        flex lg:flex lg:rounded-xl lg:border lg:border-gray-100
      `} style={{ maxHeight: 'calc(100vh - 2rem)' }}>
        <button className="lg:hidden absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setCollectionSidebarOpen(false)}>✕</button>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xs font-black text-gray-900 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-[#F5A051]" /> Collections
          </h2>
          <button type="button" onClick={() => fetchMeta()} className="p-1.5 rounded-lg hover:bg-gray-100" title="Refresh">
            <RefreshCw className="w-3 h-3 text-gray-500" />
          </button>
        </div>
        <ul className="p-2 space-y-0.5 overflow-y-auto flex-1">
          {collections.map(c => (
            <li key={c.key}>
              <button type="button"
                onClick={() => { setSelectedKey(c.key); setPage(1); setEditorOpen(false); setCollectionSidebarOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${selectedKey === c.key
                  ? 'bg-[#F5A051]/15 text-[#F5A051] font-bold border border-[#F5A051]/30'
                  : 'hover:bg-gray-50 text-gray-700 border border-transparent'}`}
              >
                <div className="font-semibold truncate">{c.label}</div>
                <div className="text-[9px] text-gray-400 font-mono">{c.key} · {c.count}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {collectionSidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/30 z-30" onClick={() => setCollectionSidebarOpen(false)} />}

      {/* Documents Area */}
      <div className={`flex-1 bg-white rounded-xl border border-gray-100 shadow overflow-hidden flex flex-col min-w-0 transition-all duration-200 ${editorOpen ? 'lg:rounded-r-none' : ''}`}>
        {!selectedKey ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
            <Database className="w-10 h-10 opacity-20" />
            <p className="text-sm">Select a collection to view documents</p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-xl space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-gray-900 font-mono">{selectedKey}</h3>
                  <p className="text-[10px] text-gray-400">{total} total · showing {filteredDocs.length}</p>
                </div>
                <button type="button" onClick={openNew}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5A051] text-white rounded-lg text-xs font-bold hover:bg-[#e59045] transition shrink-0">
                  <Plus className="w-3.5 h-3.5" /> New document
                </button>
              </div>

              {/* Search / Filter Row */}
              {searchFields.length > 0 ? (
                <div className="flex flex-wrap gap-2 items-center">
                  <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <select value={searchField} onChange={e => { setSearchField(e.target.value); setSearchValue(''); }}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-600 focus:ring-2 focus:ring-[#F5A051] bg-white">
                    {searchFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                  <div className="flex-1 min-w-[160px] relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder={`Search by ${searchFields.find(f => f.key === searchField)?.label ?? 'field'}…`}
                      className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#F5A051] bg-white"
                      value={searchValue}
                      onChange={e => setSearchValue(e.target.value)} />
                  </div>
                  {searchValue && (
                    <button onClick={() => setSearchValue('')} className="text-gray-400 hover:text-gray-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 italic flex items-center gap-1">
                  <Filter className="w-3 h-3" /> No searchable fields defined for this collection
                </p>
              )}
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F5A051] border-t-transparent" />
              </div>
            ) : (
              <div className="overflow-auto flex-1">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-left text-[10px] uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2.5 font-bold">_id</th>
                      {previewColumns.map(col => (
                        <th key={col} className="px-3 py-2.5 font-bold">{humanizeKey(col)}</th>
                      ))}
                      <th className="px-3 py-2.5 font-bold w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredDocs.length === 0 ? (
                      <tr>
                        <td colSpan={previewColumns.length + 2} className="text-center py-12 text-gray-400 text-sm">
                          {searchValue ? `No documents matching "${searchValue}"` : 'No documents'}
                        </td>
                      </tr>
                    ) : filteredDocs.map(doc => {
                      const id = doc._id ? String(doc._id) : '';
                      const isEditing = editorOpen && editingId === id;
                      return (
                        <tr key={id} className={`transition ${isEditing ? 'bg-[#F5A051]/5 border-l-2 border-l-[#F5A051]' : 'hover:bg-gray-50/80'}`}>
                          <td className="px-3 py-2 font-mono text-[10px] text-gray-500 max-w-[140px] truncate">{id}</td>
                          {previewColumns.map(col => (
                            <td key={col} className="px-3 py-2 max-w-[180px]">
                              <SmartCell value={doc[col]} fieldKey={col} />
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right">
                            <div className="flex gap-1 justify-end">
                              <button type="button" onClick={() => openEdit(doc)}
                                className={`text-[11px] font-bold px-2 py-1 rounded transition ${isEditing ? 'bg-[#F5A051] text-white' : 'text-blue-600 hover:bg-blue-50'}`}>
                                {isEditing ? '✎ Editing' : 'Edit'}
                              </button>
                              <button type="button"
                                disabled={selectedKey === 'users' && doc.role === 'Admin'}
                                onClick={() => deleteDoc(doc)}
                                title={selectedKey === 'users' && doc.role === 'Admin' ? 'Admin users cannot be deleted here' : 'Delete document'}
                                className={`text-[11px] font-bold px-2 py-1 rounded transition ${
                                  selectedKey === 'users' && doc.role === 'Admin'
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                                }`}>
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-4 py-3 border-t border-gray-100 shrink-0">
                <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500">Page {page} / {pages}</span>
                <button type="button" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}
                  className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Inline Editor Panel */}
      {editorOpen && (
        <div className="w-full max-w-md bg-white border-l border-gray-200 shadow-xl flex flex-col rounded-r-xl overflow-hidden
          fixed lg:static inset-0 lg:inset-auto z-50 lg:z-auto">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-start shrink-0">
            <div>
              <h4 className="font-black text-gray-900 text-sm">{isNew ? '✦ New Document' : '✎ Edit Document'}</h4>
              {!isNew && editingId && <span className="text-[10px] font-mono text-gray-400 break-all">{editingId}</span>}
            </div>
            <button type="button" onClick={closeEditor} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              Edits are saved field-by-field. URL fields show a <strong>View</strong> button and a <strong>Re-upload</strong> option.
            </p>

            {isNew && (
              <div className="mb-5 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                <p className="text-xs font-bold text-violet-900 mb-2">Add fields</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="field name"
                    className="flex-1 px-2 py-1.5 border border-violet-200 rounded-lg text-xs"
                    value={newFieldKey}
                    onChange={e => setNewFieldKey(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewFieldRow())} />
                  <button type="button" onClick={addNewFieldRow}
                    className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700">Add</button>
                </div>
              </div>
            )}

            <div>{fieldEntries.map((entry, i) => renderFieldInput(entry, i))}</div>
            {fieldEntries.length === 0 && isNew && (
              <p className="text-center text-gray-400 py-8 text-xs">No fields yet — add field names above.</p>
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2 shrink-0 bg-gray-50">
            <button type="button" onClick={closeEditor}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 transition">Cancel</button>
            <button type="button" onClick={saveDocument}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F5A051] text-white font-bold text-sm hover:bg-[#e59045] transition">
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDatabase;
