/*
Zed-But-Browser/src-tauri/src/search_index.rs

Lightweight local search index for Tauri backend.

Features:
- Simple document indexing (url, title, content)
- Inverted index (token -> [(doc_id, term_freq)])
- Basic TF-IDF scoring for queries
- Persistence to "search_index.json" under the app data dir (atomic writes)
- Tauri commands for indexing, removing, searching and retrieving documents

Design constraints:
- Keep memory usage modest and structures straightforward
- Avoid external crates beyond serde/serde_json (already present)
- Each Tauri command loads/saves the index from/to disk (keeps runtime small and race-prone situations limited)
*/

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::AppHandle;
use tauri::Manager;

/// File name for persisted index in the app data dir.
const INDEX_FILE: &str = "search_index.json";

/// Minimal document representation persisted in the index.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Doc {
    pub id: u64,
    pub url: String,
    pub title: String,
    pub content: String,
    pub created_at: u64,
}

/// Posting: (doc_id, term_frequency)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Posting(pub u64, pub u32);

/// Persisted index representation.
#[derive(Debug, Serialize, Deserialize)]
struct PersistedIndex {
    docs: Vec<Doc>,
    // inverted index: token -> postings list
    inverted: HashMap<String, Vec<Posting>>,
}

/// Lightweight in-memory index used for operations (constructed from persisted).
struct Index {
    docs: HashMap<u64, Doc>,
    inverted: HashMap<String, Vec<Posting>>,
}

impl Index {
    fn new() -> Self {
        Self {
            docs: HashMap::new(),
            inverted: HashMap::new(),
        }
    }

    fn from_persisted(p: PersistedIndex) -> Self {
        let mut idx = Self::new();
        for d in p.docs.into_iter() {
            idx.docs.insert(d.id, d);
        }
        idx.inverted = p.inverted;
        idx
    }

    fn to_persisted(&self) -> PersistedIndex {
        let docs: Vec<Doc> = self.docs.values().cloned().collect();
        PersistedIndex {
            docs,
            inverted: self.inverted.clone(),
        }
    }

    fn next_id(&self) -> u64 {
        // choose id based on timestamp, fallback to increment
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);
        let mut id = now;
        while self.docs.contains_key(&id) {
            id = id.saturating_add(1);
        }
        id
    }

    /// Remove existing document by id (and remove its postings)
    fn remove_doc(&mut self, id: u64) -> bool {
        if let Some(doc) = self.docs.remove(&id) {
            // For efficiency remove doc from postings lists
            let mut to_clean: Vec<String> = Vec::new();
            for (token, postings) in self.inverted.iter_mut() {
                postings.retain(|p| p.0 != id);
                if postings.is_empty() {
                    to_clean.push(token.clone());
                }
            }
            for t in to_clean {
                self.inverted.remove(&t);
            }
            drop(doc);
            true
        } else {
            false
        }
    }

    /// Index a document (replace if a doc with same id exists).
    fn index_doc(&mut self, doc: Doc) {
        // Remove old instance if exists
        let id = doc.id;
        if self.docs.contains_key(&id) {
            self.remove_doc(id);
        }

        // Tokenize content and title and compute frequencies
        let mut freqs: HashMap<String, u32> = HashMap::new();
        for token in tokenize(&format!("{} {}", doc.title, doc.content)) {
            *freqs.entry(token).or_insert(0) += 1;
        }

        // Update postings
        for (token, tf) in freqs {
            let postings = self.inverted.entry(token).or_insert_with(Vec::new);
            postings.push(Posting(id, tf));
        }

        // Insert doc record
        self.docs.insert(id, doc);
    }

    /// Return number of documents
    fn doc_count(&self) -> usize {
        self.docs.len()
    }

    /// Search the index for query tokens. Returns Vec of (doc, score)
    fn search(&self, query: &str, limit: usize) -> Vec<(Doc, f64)> {
        if self.docs.is_empty() {
            return Vec::new();
        }

        let tokens = tokenize(query);
        if tokens.is_empty() {
            return Vec::new();
        }

        let n_docs = self.doc_count() as f64;
        let mut scores: HashMap<u64, f64> = HashMap::new();
        let mut seen_docs: HashSet<u64> = HashSet::new();

        // For each token compute idf and accumulate tf-idf-like scores
        for token in tokens.iter() {
            if let Some(postings) = self.inverted.get(token) {
                let df = postings.len() as f64;
                // idf with smoothing
                let idf = (1.0 + n_docs / (1.0 + df)).ln();

                for posting in postings.iter() {
                    let tf = posting.1 as f64;
                    // tf weight: log normalization
                    let tf_weight = 1.0 + tf.ln().max(0.0);
                    let score_delta = tf_weight * idf;
                    let entry = scores.entry(posting.0).or_insert(0.0);
                    *entry += score_delta;
                    seen_docs.insert(posting.0);
                }
            }
        }

        // Prepare results (fetch docs and normalize by doc length optionally)
        let mut results: Vec<(Doc, f64)> = Vec::new();
        for doc_id in seen_docs.into_iter() {
            if let Some(doc) = self.docs.get(&doc_id) {
                let score = scores.get(&doc_id).cloned().unwrap_or(0.0);
                results.push((doc.clone(), score));
            }
        }

        // Sort by score desc, then by recency
        results.sort_by(|a, b| {
            b.1.partial_cmp(&a.1)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| b.0.created_at.cmp(&a.0.created_at))
        });

        if results.len() > limit {
            results.truncate(limit);
        }
        results
    }
}

/// Tokenization: lowercase, split on non-alphanumeric, filter stopwords, de-duplicate adjacent whitespace
fn tokenize(text: &str) -> Vec<String> {
    // small stopword list
    const STOPWORDS: &[&str] = &[
        "the", "and", "or", "to", "of", "a", "in", "on", "for", "with", "is", "it", "by", "an",
        "be",
    ];

    let mut tokens: Vec<String> = Vec::new();
    let mut current = String::new();

    for ch in text.chars() {
        if ch.is_alphanumeric() {
            current.push(ch.to_ascii_lowercase());
        } else {
            if !current.is_empty() {
                if current.len() > 1 && !STOPWORDS.contains(&current.as_str()) {
                    tokens.push(current.clone());
                }
                current.clear();
            }
        }
    }
    if !current.is_empty() {
        if current.len() > 1 && !STOPWORDS.contains(&current.as_str()) {
            tokens.push(current);
        }
    }
    tokens
}

/// Helpers: path to index file under app data dir
fn index_path(app: &AppHandle) -> PathBuf {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .expect("Failed to get app data directory");
    if !app_data_dir.exists() {
        let _ = fs::create_dir_all(&app_data_dir);
    }
    app_data_dir.join(INDEX_FILE)
}

/// Load persisted index from disk. If missing or invalid, return empty Index.
fn load_index(app: &AppHandle) -> Index {
    let path = index_path(app);
    if !path.exists() {
        return Index::new();
    }
    match fs::read_to_string(&path) {
        Ok(s) => match serde_json::from_str::<PersistedIndex>(&s) {
            Ok(p) => Index::from_persisted(p),
            Err(_) => Index::new(),
        },
        Err(_) => Index::new(),
    }
}

/// Persist index to disk atomically.
fn save_index(app: &AppHandle, index: &Index) -> Result<(), String> {
    let path = index_path(app);
    let tmp = path.with_extension("tmp");
    let persisted = index.to_persisted();
    match serde_json::to_string_pretty(&persisted) {
        Ok(serialized) => {
            if let Err(e) = fs::write(&tmp, serialized.as_bytes()) {
                return Err(format!("Failed write temp index: {}", e));
            }
            if let Err(e) = fs::rename(&tmp, &path) {
                // try fallback
                if let Err(e2) = fs::write(&path, serialized.as_bytes()) {
                    return Err(format!("Failed write index file: {}, {}", e, e2));
                }
            }
            Ok(())
        }
        Err(e) => Err(format!("Failed serialize index: {}", e)),
    }
}

/// Create and persist a document into the index.
/// If `url` is already indexed (identical url), the old doc will be removed/replaced.
/// Returns the document id on success.
#[tauri::command]
pub fn index_page(
    app: AppHandle,
    url: String,
    title: String,
    content: String,
) -> Result<u64, String> {
    let mut idx = load_index(&app);

    // Check whether a doc with same URL exists; if so, remove it
    let existing_id = idx
        .docs
        .iter()
        .find_map(|(&id, d)| if d.url == url { Some(id) } else { None });

    if let Some(eid) = existing_id {
        let _ = idx.remove_doc(eid);
    }

    let mut id = idx.next_id();
    // defensive: ensure uniqueness
    while idx.docs.contains_key(&id) {
        id = id.saturating_add(1);
    }

    let created_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let doc = Doc {
        id,
        url,
        title,
        content,
        created_at,
    };

    idx.index_doc(doc);
    save_index(&app, &idx)?;
    Ok(id)
}

/// Remove a document by id
#[tauri::command]
pub fn remove_document(app: AppHandle, id: u64) -> Result<bool, String> {
    let mut idx = load_index(&app);
    let removed = idx.remove_doc(id);
    if removed {
        save_index(&app, &idx)?;
    }
    Ok(removed)
}

/// Search the local index. Returns documents with scores and their basic metadata.
/// `limit` bounds results to avoid large responses.
#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: u64,
    pub url: String,
    pub title: String,
    pub snippet: String,
    pub score: f64,
    pub created_at: u64,
}

#[tauri::command]
pub fn search(
    app: AppHandle,
    query: String,
    limit: Option<u32>,
) -> Result<Vec<SearchResult>, String> {
    let idx = load_index(&app);
    let l = limit.unwrap_or(10) as usize;
    let results = idx.search(&query, l);

    // For snippet: pick first 200 chars of content as simple summary
    let mut out: Vec<SearchResult> = Vec::new();
    for (doc, score) in results.into_iter() {
        let snippet = if doc.content.len() > 200 {
            let mut s = doc.content[0..200].to_string();
            // try to cut at last whitespace
            if let Some(pos) = s.rfind(' ') {
                s.truncate(pos);
            }
            s
        } else {
            doc.content.clone()
        };
        out.push(SearchResult {
            id: doc.id,
            url: doc.url,
            title: doc.title,
            snippet,
            score,
            created_at: doc.created_at,
        });
    }
    Ok(out)
}

/// Retrieve full document by id
#[tauri::command]
pub fn get_document(app: AppHandle, id: u64) -> Option<Doc> {
    let idx = load_index(&app);
    idx.docs.get(&id).cloned()
}

/// Rebuild the index from current persisted doc store (useful after manual edits).
#[tauri::command]
pub fn rebuild_index(app: AppHandle) -> Result<usize, String> {
    let path = index_path(&app);
    if !path.exists() {
        return Ok(0);
    }
    // load persisted, then re-index documents into a fresh index
    match fs::read_to_string(&path) {
        Ok(s) => match serde_json::from_str::<PersistedIndex>(&s) {
            Ok(persisted) => {
                let mut idx = Index::new();
                for d in persisted.docs.into_iter() {
                    idx.index_doc(d);
                }
                save_index(&app, &idx)?;
                Ok(idx.doc_count())
            }
            Err(e) => Err(format!("Failed parse index file: {}", e)),
        },
        Err(e) => Err(format!("Failed read index file: {}", e)),
    }
}

/// Return number of documents currently indexed.
#[tauri::command]
pub fn index_count(app: AppHandle) -> usize {
    let idx = load_index(&app);
    idx.doc_count()
}
