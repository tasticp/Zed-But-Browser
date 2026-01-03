/*
Zed-But-Browser/src-tauri/src/adblock.rs

Lightweight ad-blocking module intended for use in the Tauri backend.

Features:
- Simple rule model supporting:
  - domain rules (exact host or host suffix matching)
  - substring rules (match if URL contains substring)
  - wildcard rules with '*' (simple glob-like matching)
- Persistent storage of rules under the Tauri app data directory (file: adblock_rules.json)
- Small built-in default rule set (a tiny curated subset of common ad/tracker hosts)
- Tauri command wrappers to query/add/remove/list/reload rules

Design notes:
- No heavy dependencies (no regex/aho-corasick) to keep binary small.
- Matching logic favors O(1) checks for domain exact/suffix via HashSet and linear scans
  for substrings/wildcards. This is intentionally simple and memory efficient.
- The module does not itself intercept requests (that is platform/webview-specific).
  Instead, it exposes `should_block_url` as a Tauri command; the webview request
  hook should call into this command to decide whether to block a request.
*/

use serde::{Deserialize, Serialize};
use std::{collections::HashSet, fs, io::Read, path::PathBuf};
use tauri::AppHandle;
use tauri::Manager;

/// Filename for persisted adblock rules inside the app data dir.
const ADBLOCK_RULES_FILE: &str = "adblock_rules.json";

/// Types of simple rules.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RuleKind {
    Domain,    // e.g. "doubleclick.net" matches host suffixes
    Substring, // e.g. "/ads.js" matches if URL contains substring
    Wildcard,  // e.g. "*.adserver.example/*" with '*' wildcard matching
}

/// A rule record for persistence and management.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleRecord {
    pub kind: RuleKind,
    pub pattern: String,
    #[serde(default)]
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PersistedRules {
    pub rules: Vec<RuleRecord>,
}

/// Runtime compiled/adapted representation for efficient matching.
#[derive(Debug)]
pub struct AdBlock {
    // Host exact/suffix matches: store canonical lowercased host tokens
    domains: HashSet<String>,

    // Substring matches (kept as-is, lowercased for case-insensitive)
    substrings: Vec<String>,

    // Wildcard patterns (raw patterns, lowercased)
    wildcards: Vec<String>,
}

impl AdBlock {
    /// Build an empty AdBlock matcher.
    pub fn new() -> Self {
        Self {
            domains: HashSet::new(),
            substrings: Vec::new(),
            wildcards: Vec::new(),
        }
    }

    /// Load persisted rules from the app data directory. If none exist, returns
    /// an AdBlock instance populated with the small default rule-set.
    pub fn load_or_default(app: &AppHandle) -> Self {
        let path = adblock_rules_path(app);

        if path.exists() {
            if let Ok(mut f) = fs::File::open(&path) {
                let mut s = String::new();
                if f.read_to_string(&mut s).is_ok() {
                    if let Ok(p) = serde_json::from_str::<PersistedRules>(&s) {
                        return Self::from_persisted(p);
                    }
                }
            }
            // if loading fails, fallthrough to default
        }

        // Persist default rules for first-run convenience
        let ab = Self::with_default_rules();
        let _ = ab.save(app); // ignore error; best-effort
        ab
    }

    /// Convert persisted record list into runtime AdBlock matcher.
    pub fn from_persisted(p: PersistedRules) -> Self {
        let mut ab = AdBlock::new();
        for r in p.rules.into_iter() {
            match r.kind {
                RuleKind::Domain => {
                    let s = r.pattern.trim().to_lowercase();
                    if !s.is_empty() {
                        ab.domains.insert(s);
                    }
                }
                RuleKind::Substring => {
                    let s = r.pattern.trim().to_lowercase();
                    if !s.is_empty() {
                        ab.substrings.push(s);
                    }
                }
                RuleKind::Wildcard => {
                    let s = r.pattern.trim().to_lowercase();
                    if !s.is_empty() {
                        ab.wildcards.push(s);
                    }
                }
            }
        }
        ab
    }

    /// Save current rules back to disk (serializes to the persisted rules format).
    pub fn save(&self, app: &AppHandle) -> Result<(), String> {
        let persisted = self.to_persisted();
        let path = adblock_rules_path(app);
        if let Some(parent) = path.parent() {
            if !parent.exists() {
                if let Err(e) = fs::create_dir_all(parent) {
                    return Err(format!("Failed create dir: {}", e));
                }
            }
        }
        let tmp = path.with_extension("tmp");
        match serde_json::to_string_pretty(&persisted) {
            Ok(serialized) => {
                if fs::write(&tmp, serialized.as_bytes()).is_err() {
                    // fallback: try write directly
                    if fs::write(&path, serialized.as_bytes()).is_err() {
                        return Err("Failed to write adblock rules".to_string());
                    }
                } else {
                    let _ = fs::rename(&tmp, &path);
                }
                Ok(())
            }
            Err(_) => Err("Failed to serialize adblock rules".to_string()),
        }
    }

    /// Convert runtime rules into persistable representation.
    pub fn to_persisted(&self) -> PersistedRules {
        let mut rules = Vec::new();
        for d in &self.domains {
            rules.push(RuleRecord {
                kind: RuleKind::Domain,
                pattern: d.clone(),
                description: None,
            });
        }
        for s in &self.substrings {
            rules.push(RuleRecord {
                kind: RuleKind::Substring,
                pattern: s.clone(),
                description: None,
            });
        }
        for w in &self.wildcards {
            rules.push(RuleRecord {
                kind: RuleKind::Wildcard,
                pattern: w.clone(),
                description: None,
            });
        }
        PersistedRules { rules }
    }

    /// Create an AdBlock instance pre-populated with a small curated default set.
    pub fn with_default_rules() -> Self {
        // Keep list intentionally small to stay lightweight.
        let domain_list = vec![
            "doubleclick.net",
            "googlesyndication.com",
            "adservice.google.com",
            "ads.google.com",
            "pagead2.googlesyndication.com",
            "googlesyndication",
            "adsystem.com",
            "adnxs.com",
            "ads.yahoo.com",
            "adserver",
        ];

        let substrings = vec![
            "/ads.js", "/ads/", "/adframe", "adclick", "bannerad", "clickad",
        ];

        let wildcards = vec![
            "*.doubleclick.net/*",
            "*.googlesyndication.com/*",
            "*.adnxs.com/*",
        ];

        let mut ab = AdBlock::new();
        for d in domain_list.into_iter() {
            ab.domains.insert(d.to_string());
        }
        for s in substrings.into_iter() {
            ab.substrings.push(s.to_string());
        }
        for w in wildcards.into_iter() {
            ab.wildcards.push(w.to_string());
        }
        ab
    }

    /// Add a new rule record into the runtime matcher.
    pub fn add_rule(&mut self, rule: RuleRecord) {
        match rule.kind {
            RuleKind::Domain => {
                self.domains.insert(rule.pattern.to_lowercase());
            }
            RuleKind::Substring => {
                self.substrings.push(rule.pattern.to_lowercase());
            }
            RuleKind::Wildcard => {
                self.wildcards.push(rule.pattern.to_lowercase());
            }
        }
    }

    /// Remove any matching rule(s) that equal the provided pattern+kind.
    /// Returns true if something was removed.
    pub fn remove_rule(&mut self, kind: RuleKind, pattern: &str) -> bool {
        let pattern = pattern.trim().to_lowercase();
        match kind {
            RuleKind::Domain => self.domains.remove(&pattern),
            RuleKind::Substring => {
                let before = self.substrings.len();
                self.substrings.retain(|s| s != &pattern);
                before != self.substrings.len()
            }
            RuleKind::Wildcard => {
                let before = self.wildcards.len();
                self.wildcards.retain(|w| w != &pattern);
                before != self.wildcards.len()
            }
        }
    }

    /// Check whether the given URL should be blocked based on current rules.
    ///
    /// Algorithm:
    /// 1. Lowercase URL for simple, case-insensitive matching.
    /// 2. Extract host token if possible and check domain suffix rules (fast path).
    /// 3. Check substring matches.
    /// 4. Check wildcard patterns (simple glob '*' matcher).
    pub fn matches_url(&self, url: &str) -> bool {
        if url.is_empty() {
            return false;
        }

        let lower = url.to_lowercase();

        // Fast domain check: extract host and check if any domain token is a suffix.
        if let Some(host) = extract_host(&lower) {
            // exact host match or suffix match (e.g. domain rule "example.com" matches "sub.example.com")
            if self.domains.contains(&host) {
                return true;
            }
            for d in &self.domains {
                if host.ends_with(d) {
                    return true;
                }
            }
        }

        // substring rules
        for sub in &self.substrings {
            if lower.contains(sub) {
                return true;
            }
        }

        // wildcard rules (simple '*' semantics)
        for pat in &self.wildcards {
            if wildcard_match(pat, &lower) {
                return true;
            }
        }

        false
    }

    /// Return a flat list of RuleRecord currently present (order not preserved).
    pub fn list_rules(&self) -> Vec<RuleRecord> {
        let mut out = Vec::new();
        for d in &self.domains {
            out.push(RuleRecord {
                kind: RuleKind::Domain,
                pattern: d.clone(),
                description: None,
            });
        }
        for s in &self.substrings {
            out.push(RuleRecord {
                kind: RuleKind::Substring,
                pattern: s.clone(),
                description: None,
            });
        }
        for w in &self.wildcards {
            out.push(RuleRecord {
                kind: RuleKind::Wildcard,
                pattern: w.clone(),
                description: None,
            });
        }
        out
    }
}

/// Basic wildcard matcher where '*' matches any sequence of characters (including empty).
/// Patterns and text are expected to be lowercased by callers if case-insensitive matching is desired.
fn wildcard_match(pattern: &str, text: &str) -> bool {
    // Quick heuristics for simple cases
    if pattern == "*" {
        return true;
    }
    if pattern == text {
        return true;
    }

    let parts: Vec<&str> = pattern.split('*').collect();
    if parts.is_empty() {
        return pattern == text;
    }

    // If pattern has no '*', direct compare
    if !pattern.contains('*') {
        return pattern == text;
    }

    // Handle prefix
    let mut idx = 0usize;
    // If pattern does not start with '*', the first part must match at the beginning
    if !pattern.starts_with('*') {
        if !text.starts_with(parts[0]) {
            return false;
        }
        idx = parts[0].len();
    }

    // For middle parts, find them in sequence
    for (i, part) in parts.iter().enumerate() {
        if part.is_empty() {
            // consecutive '*'s
            continue;
        }
        // Last part: if pattern does not end with '*', it must match the end
        let is_last = i == parts.len() - 1;
        if is_last && !pattern.ends_with('*') {
            if !text[idx..].ends_with(*part) {
                return false;
            } else {
                // trailing match OK
                return true;
            }
        }
        // Find next occurrence of part after idx
        if let Some(pos) = text[idx..].find(*part) {
            idx += pos + part.len();
        } else {
            return false;
        }
    }

    true
}

/// Extract host from a given URL-like string without pulling in the `url` crate.
/// Returns lowercased host if it can be parsed simply, otherwise None.
///
/// This is intentionally lenient: it handles strings like:
///  - https://www.example.com/path?x=1
///  - http://sub.example.com:8080/
///  - www.example.com/page  (treats leading as host)
fn extract_host(url: &str) -> Option<String> {
    // Find scheme separator
    let mut s = url;
    if let Some(pos) = url.find("://") {
        s = &url[pos + 3..];
    }
    // Remove leading credentials if any (user:pass@host)
    if let Some(at) = s.rfind('@') {
        s = &s[at + 1..];
    }
    // Host is until first '/' or ':' or '?' or '#'
    let end_chars = ['/', ':', '?', '#'];
    let mut end = s.len();
    for c in end_chars.iter() {
        if let Some(p) = s.find(*c) {
            if p < end {
                end = p;
            }
        }
    }
    let host = &s[..end];
    let host = host.trim().trim_matches(|c: char| c == '/' || c == '\\');
    if host.is_empty() {
        None
    } else {
        Some(host.to_lowercase())
    }
}

/// Compute path for rules file inside the Tauri app data dir.
fn adblock_rules_path(app: &AppHandle) -> PathBuf {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .expect("Failed to get app data directory for adblock storage");
    if !app_data_dir.exists() {
        let _ = fs::create_dir_all(&app_data_dir);
    }
    app_data_dir.join(ADBLOCK_RULES_FILE)
}

/// ------------------------
/// Tauri command wrappers
/// ------------------------
/// These commands are intended to be exposed by the Tauri backend and invoked
/// by webview request handlers or the frontend to decide blocking behavior or
/// to manage rules at runtime.

/// Check whether a given URL should be blocked based on persisted rules.
/// This command loads the rules from disk and performs the match.
#[tauri::command]
pub fn should_block_url(app: AppHandle, url: String) -> bool {
    let ab = AdBlock::load_or_default(&app);
    ab.matches_url(&url)
}

/// Reload rules from disk into memory and return the count.
#[tauri::command]
pub fn reload_rules(app: AppHandle) -> Result<usize, String> {
    let ab = AdBlock::load_or_default(&app);
    let count = ab.list_rules().len();
    Ok(count)
}

/// Add a rule and persist it. Returns the new total rule count.
#[tauri::command]
pub fn add_rule(
    app: AppHandle,
    kind: RuleKind,
    pattern: String,
    description: Option<String>,
) -> Result<usize, String> {
    let mut ab = AdBlock::load_or_default(&app);
    let rec = RuleRecord {
        kind: kind.clone(),
        pattern: pattern.clone(),
        description,
    };
    ab.add_rule(rec);
    ab.save(&app)?;
    Ok(ab.list_rules().len())
}

/// Remove a rule by exact kind+pattern. Returns true if removed.
#[tauri::command]
pub fn remove_rule(app: AppHandle, kind: RuleKind, pattern: String) -> Result<bool, String> {
    let mut ab = AdBlock::load_or_default(&app);
    let removed = ab.remove_rule(kind, &pattern);
    if removed {
        ab.save(&app)?;
    }
    Ok(removed)
}

/// List current rules (loads from disk if present).
#[tauri::command]
pub fn list_rules(app: AppHandle) -> Vec<RuleRecord> {
    let ab = AdBlock::load_or_default(&app);
    ab.list_rules()
}

/// Reset rules to the minimal built-in set (persists it).
#[tauri::command]
pub fn reset_to_default_rules(app: AppHandle) -> Result<usize, String> {
    let ab = AdBlock::with_default_rules();
    ab.save(&app)?;
    Ok(ab.list_rules().len())
}
