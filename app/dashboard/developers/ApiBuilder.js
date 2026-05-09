'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Key, Eye, EyeOff, Copy, Check, RefreshCw, Trash2,
  Layers, Globe, Play, Terminal, Clock, Zap,
  Code2, ChevronDown
} from 'lucide-react';
import { generateApiKey, revokeApiKey } from '@/app/actions/apikeys';
import styles from './developers.module.css';

const CATEGORIES = [
  'Technology', 'AI & ML', 'Global News', 'Outbreaks & Health',
  'Company News', 'Startups', 'Security', 'Cloud & Infrastructure',
  'Developer & Engineering', 'AI Tools', 'Business', 'Stocks & Trading',
];

/** Format a date string consistently to avoid SSR/client locale mismatch */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

// ─── Syntax Highlighted JSON ───────────────────────────────────────
function JsonSyntax({ data }) {
  const highlighted = useMemo(() => {
    const json = JSON.stringify(data, null, 2);
    // Tokenize JSON for syntax highlighting
    return json.replace(
      /("(?:\\.|[^"\\])*")\s*(:)?|(\b(?:true|false)\b)|(\bnull\b)|(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g,
      (match, str, colon, bool, nul, num) => {
        if (str && colon) {
          return `<span class="${styles.jsonKey}">${str}</span>:`;
        }
        if (str) return `<span class="${styles.jsonString}">${str}</span>`;
        if (bool) return `<span class="${styles.jsonBool}">${match}</span>`;
        if (nul) return `<span class="${styles.jsonNull}">${match}</span>`;
        if (num) return `<span class="${styles.jsonNumber}">${match}</span>`;
        return match;
      }
    );
  }, [data]);

  return (
    <pre
      className={styles.jsonContent}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

// ─── Main Component ────────────────────────────────────────────────
export default function ApiBuilder({ initialApiKey, sources }) {
  // API Key State
  const [apiKeyData, setApiKeyData] = useState(initialApiKey);
  const [keyVisible, setKeyVisible] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filter State
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);

  // Code Tab State
  const [activeTab, setActiveTab] = useState('curl');
  const [codeCopied, setCodeCopied] = useState(false);

  // Preview State
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [responseStatus, setResponseStatus] = useState(null);

  // ─── Grouped Sources ──────────────────────────────────────────
  const groupedSources = useMemo(() => {
    const groups = {};
    (sources || []).forEach(s => {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    });
    return groups;
  }, [sources]);

  // ─── API URL Builder ──────────────────────────────────────────
  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const baseUrl = origin ? `${origin}/api/v1/articles` : '/api/v1/articles';

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCategories.length > 0) {
      params.set('categories', selectedCategories.join(','));
    }
    if (selectedSources.length > 0) {
      params.set('sources', selectedSources.join(','));
    }
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  }, [baseUrl, selectedCategories, selectedSources]);

  const displayKey = apiKeyData?.api_key || 'YOUR_API_KEY';

  // ─── Code Snippets ────────────────────────────────────────────
  const codeSnippets = useMemo(() => ({
    curl: `curl -X GET "${apiUrl}" \\
  -H "x-api-key: ${displayKey}"`,

    javascript: `const response = await fetch("${apiUrl}", {
  method: "GET",
  headers: {
    "x-api-key": "${displayKey}",
  },
});

const data = await response.json();
console.log(data);`,

    python: `import requests

response = requests.get(
    "${apiUrl}",
    headers={
        "x-api-key": "${displayKey}",
    },
)

data = response.json()
print(data)`,
  }), [apiUrl, displayKey]);

  // ─── Handlers ─────────────────────────────────────────────────
  const handleGenerateKey = useCallback(async () => {
    setKeyLoading(true);
    try {
      const result = await generateApiKey();
      if (result.data) {
        setApiKeyData(result.data);
        setKeyVisible(true);
      }
    } finally {
      setKeyLoading(false);
    }
  }, []);

  const handleRevokeKey = useCallback(async () => {
    if (!apiKeyData?.id) return;
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
    setKeyLoading(true);
    try {
      const result = await revokeApiKey(apiKeyData.id);
      if (result.success) {
        setApiKeyData(null);
        setKeyVisible(false);
      }
    } finally {
      setKeyLoading(false);
    }
  }, [apiKeyData]);

  const handleCopyKey = useCallback(async () => {
    if (!apiKeyData?.api_key) return;
    await navigator.clipboard.writeText(apiKeyData.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [apiKeyData]);

  const handleCopyCode = useCallback(async () => {
    await navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [codeSnippets, activeTab]);

  const toggleCategory = useCallback((cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }, []);

  const toggleSource = useCallback((sourceId) => {
    setSelectedSources(prev =>
      prev.includes(sourceId) ? prev.filter(s => s !== sourceId) : [...prev, sourceId]
    );
  }, []);

  const handleTestRequest = useCallback(async () => {
    if (!apiKeyData?.api_key) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewData(null);

    const start = performance.now();
    try {
      const res = await fetch(apiUrl, {
        headers: { 'x-api-key': apiKeyData.api_key },
      });
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setResponseStatus(res.status);

      const json = await res.json();
      if (!res.ok) {
        setPreviewError(json.error || `HTTP ${res.status}`);
      } else {
        setPreviewData(json);
      }
    } catch (err) {
      setResponseTime(null);
      setResponseStatus(null);
      setPreviewError(err.message || 'Network error');
    } finally {
      setPreviewLoading(false);
    }
  }, [apiKeyData, apiUrl]);

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className={styles.portalHeader}>
        <h1 className={styles.portalTitle}>Developer Portal</h1>
        <p className={styles.portalSubtitle}>
          Generate an API key, customize your news feed filters, and integrate Feed Prism directly into your applications.
        </p>
      </div>

      {/* Bento Grid */}
      <div className={styles.bentoGrid}>

        {/* ── Bento 1: API Key Management ── */}
        <div className={`${styles.bentoCard} ${styles.cardApiKey}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><Key size={20} /></div>
            <div>
              <p className={styles.cardTitle}>API Key</p>
              <p className={styles.cardDescription}>Your secret key for authenticating requests</p>
            </div>
          </div>

          {apiKeyData ? (
            <>
              <div className={styles.apiKeyDisplay}>
                <span className={`${styles.apiKeyValue} ${!keyVisible ? styles.apiKeyMasked : ''}`}>
                  {keyVisible ? apiKeyData.api_key : '•'.repeat(40)}
                </span>
                <button
                  className={styles.iconBtn}
                  onClick={() => setKeyVisible(!keyVisible)}
                  title={keyVisible ? 'Hide key' : 'Reveal key'}
                  aria-label={keyVisible ? 'Hide API key' : 'Reveal API key'}
                >
                  {keyVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  className={styles.iconBtn}
                  onClick={handleCopyKey}
                  title="Copy to clipboard"
                  aria-label="Copy API key"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              <div className={styles.keyMeta}>
                <span className={styles.keyMetaItem}>
                  <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                    <span className={styles.statusIndicator} style={{ width: 6, height: 6, background: 'var(--status-success)', borderRadius: '50%', display: 'inline-block' }} />
                    Active
                  </span>
                </span>
                <span className={styles.keyMetaItem}>
                  <Clock size={12} />
                  Created {formatDate(apiKeyData.created_at)}
                </span>
                {apiKeyData.last_used_at && (
                  <span className={styles.keyMetaItem}>
                    <Zap size={12} />
                    Last used {formatDate(apiKeyData.last_used_at)}
                  </span>
                )}
              </div>

              <div className={styles.apiKeyActions} style={{ marginTop: '1rem' }}>
                <button
                  className={styles.btnGenerate}
                  onClick={handleGenerateKey}
                  disabled={keyLoading}
                >
                  {keyLoading ? <span className={styles.spinner} /> : <RefreshCw size={16} />}
                  Regenerate Key
                </button>
                <button
                  className={styles.btnRevoke}
                  onClick={handleRevokeKey}
                  disabled={keyLoading}
                >
                  <Trash2 size={16} />
                  Revoke
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.noKeyMessage}>
                You don&apos;t have an active API key yet. Generate one to get started.
              </p>
              <button
                className={styles.btnGenerate}
                onClick={handleGenerateKey}
                disabled={keyLoading}
              >
                {keyLoading ? <span className={styles.spinner} /> : <Key size={16} />}
                Generate API Key
              </button>
            </>
          )}
        </div>

        {/* ── Bento 2: Category Selector ── */}
        <div className={`${styles.bentoCard} ${styles.cardCategories}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><Layers size={20} /></div>
            <div>
              <p className={styles.cardTitle}>Categories</p>
              <p className={styles.cardDescription}>Filter by news category</p>
            </div>
          </div>

          <div className={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`${styles.categoryPill} ${selectedCategories.includes(cat) ? styles.categoryPillActive : ''}`}
                onClick={() => toggleCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <p className={styles.selectionCount}>
            {selectedCategories.length === 0
              ? 'All categories (no filter applied)'
              : `${selectedCategories.length} of ${CATEGORIES.length} selected`}
          </p>
        </div>

        {/* ── Bento 3: Source Selector ── */}
        <div className={`${styles.bentoCard} ${styles.cardSources}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><Globe size={20} /></div>
            <div>
              <p className={styles.cardTitle}>Sources</p>
              <p className={styles.cardDescription}>Filter by specific news sources</p>
            </div>
          </div>

          <div className={styles.sourceList}>
            {Object.entries(groupedSources).map(([category, categorySources]) => (
              <div key={category} className={styles.sourceGroup}>
                <p className={styles.sourceGroupTitle}>{category}</p>
                {categorySources.map(source => {
                  const isSelected = selectedSources.includes(source.id);
                  return (
                    <div
                      key={source.id}
                      className={`${styles.sourceItem} ${isSelected ? styles.sourceSelected : ''}`}
                      onClick={() => toggleSource(source.id)}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSource(source.id); } }}
                    >
                      <span className={`${styles.sourceCheckbox} ${isSelected ? styles.sourceCheckboxChecked : ''}`}>
                        {isSelected && <Check size={10} />}
                      </span>
                      <span className={styles.sourceName}>{source.name}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <p className={styles.selectionCount}>
            {selectedSources.length === 0
              ? 'All sources (no filter applied)'
              : `${selectedSources.length} source${selectedSources.length > 1 ? 's' : ''} selected`}
          </p>
        </div>

        {/* ── Bento 4: Dynamic Code Generator ── */}
        <div className={`${styles.bentoCard} ${styles.cardCode}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><Code2 size={20} /></div>
            <div>
              <p className={styles.cardTitle}>Integration Code</p>
              <p className={styles.cardDescription}>Auto-generated snippets from your selections</p>
            </div>
          </div>

          <div className={styles.codeTabs}>
            {[
              { id: 'curl', label: 'cURL' },
              { id: 'javascript', label: 'JavaScript' },
              { id: 'python', label: 'Python' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`${styles.codeTab} ${activeTab === tab.id ? styles.codeTabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.codeBlockWrapper}>
            <div className={styles.codeBlockHeader}>
              <button
                className={`${styles.copyBtn} ${codeCopied ? styles.copiedBtn : ''}`}
                onClick={handleCopyCode}
              >
                {codeCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
            <pre className={styles.codeBlock}>{codeSnippets[activeTab]}</pre>
          </div>
        </div>

        {/* ── Bento 5: Live JSON Preview ── */}
        <div className={`${styles.bentoCard} ${styles.cardPreview}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><Terminal size={20} /></div>
            <div>
              <p className={styles.cardTitle}>Live Preview</p>
              <p className={styles.cardDescription}>Test your API request and see the response</p>
            </div>
          </div>

          <div className={styles.previewControls}>
            <button
              className={styles.btnTest}
              onClick={handleTestRequest}
              disabled={!apiKeyData || previewLoading}
            >
              {previewLoading ? <span className={styles.spinner} /> : <Play size={16} />}
              {previewLoading ? 'Fetching…' : 'Run Test Request'}
            </button>

            {responseTime !== null && (
              <span className={styles.responseTime}>
                <span className={`${styles.statusIndicator} ${responseStatus && responseStatus < 400 ? styles.statusOk : styles.statusErr}`} />
                {responseStatus} · {responseTime}ms
              </span>
            )}
          </div>

          {previewLoading && (
            <div className={styles.loadingDots}>
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
            </div>
          )}

          {previewError && (
            <div className={styles.errorBox}>{previewError}</div>
          )}

          {previewData && (
            <div className={styles.jsonViewer}>
              <JsonSyntax data={previewData} />
            </div>
          )}

          {!previewData && !previewLoading && !previewError && (
            <div className={styles.emptyPreview}>
              <div className={styles.emptyPreviewIcon}><Terminal size={40} /></div>
              <p className={styles.emptyPreviewTitle}>No response yet</p>
              <p className={styles.emptyPreviewText}>
                {apiKeyData
                  ? 'Click "Run Test Request" to see live API output.'
                  : 'Generate an API key first, then test your request here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
