// Minimal nested tabs model + small UI renderer
class Node {
  constructor(id, title, file=null, parent=null, syncedId=null){
    this.id = id
    this.title = title
    this.file = file // logical file path / identifier
    this.parent = parent
    this.children = []
    this.syncedId = syncedId // if set, shares state with another node id
    this.history = [] // array of URLs, current is last
    this.currentUrl = null
  }
}

const store = {
  nodes: new Map(),
  rootIds: [],
  selected: null,
  // file -> [nodeId,...]
  instances(){
    const m = new Map()
    for(const [id,node] of this.nodes){
      if(!node.file) continue
      const arr = m.get(node.file) || []
      arr.push(id)
      m.set(node.file,arr)
    }
    return m
  }
}

let idCounter = 1
function makeId(){ return 'n'+(idCounter++) }

function createRoot(title, file=null){
  const id = makeId();
  const node = new Node(id,title,file,null,null)
  store.nodes.set(id,node)
  store.rootIds.push(id)
  renderTree()
  return node
}

function createChild(parentId, title, file=null, syncTo=null){
  const parent = store.nodes.get(parentId)
  if(!parent) return null
  const id = makeId()
  const node = new Node(id,title,file,parentId,syncTo)
  store.nodes.set(id,node)
  parent.children.push(id)
  renderTree()
  return node
}

function duplicateNode(nodeId){
  const orig = store.nodes.get(nodeId)
  if(!orig) return
  const dup = createChild(orig.parent || null, orig.title+' (dup)', orig.file, null)
  renderTree()
}

function syncLinkNode(sourceId,targetParent){
  // create a new node under targetParent which syncs to sourceId
  const src = store.nodes.get(sourceId)
  if(!src) return
  const id = makeId()
  const node = new Node(id, src.title+' (sync)', src.file, targetParent, sourceId)
  store.nodes.set(id,node)
  if(targetParent){
    const p = store.nodes.get(targetParent)
    if(p) p.children.push(id)
  } else {
    store.rootIds.push(id)
  }
  renderTree()
}

function closeNode(id){
  const node = store.nodes.get(id)
  if(!node) return
  // remove from parent or rootIds
  if(node.parent){
    const p = store.nodes.get(node.parent)
    p.children = p.children.filter(x=>x!==id)
  } else {
    store.rootIds = store.rootIds.filter(x=>x!==id)
  }
  // recursive remove
  function rm(nid){
    const n = store.nodes.get(nid)
    if(!n) return
    for(const c of n.children) rm(c)
    store.nodes.delete(nid)
  }
  rm(id)
  if(store.selected===id) store.selected = null
  renderTree()
}

// UI rendering
function renderTree(){
  const tree = document.getElementById('file-tree')
  tree.innerHTML = ''
  for(const id of store.rootIds){
    const node = store.nodes.get(id)
    tree.appendChild(renderNode(node))
  }
  renderTabBar()
  renderEditorContent()
}

function renderNode(node){
  const el = document.createElement('div')
  el.className = 'file-entry'
  if(store.selected === node.id) el.classList.add('selected')

  const icon = document.createElement('div')
  icon.className = 'file-entry-icon' + (node.children.length ? ' folder' : ' file')
  icon.textContent = node.children.length ? '▼' : '📄'
  
  const title = document.createElement('div')
  title.className = 'file-entry-name'
  title.textContent = node.title
  
  el.appendChild(icon)
  el.appendChild(title)
  el.onclick = ()=>{ selectNode(node.id) }

  if(node.children.length){
    const childWrap = document.createElement('div')
    childWrap.className = 'file-entry-children'
    for(const cid of node.children){
      childWrap.appendChild(renderNode(store.nodes.get(cid)))
    }
    el.appendChild(childWrap)
  }

  return el
}

function renderBreadcrumbs(){
  // Zed IDE has no breadcrumbs - they're shown in the tab bar instead
}

// Render tab bar (open tabs at top)
function renderTabBar(){
  const tabList = document.getElementById('tab-list')
  tabList.innerHTML = ''
  
  for(const id of store.rootIds){
    const node = store.nodes.get(id)
    const tab = document.createElement('button')
    tab.className = 'editor-tab'
    if(store.selected === id) tab.classList.add('active')
    
    const icon = document.createElement('span')
    icon.className = 'tab-icon'
    icon.textContent = '📄'
    
    const label = document.createElement('span')
    label.textContent = node.title
    label.style.flex = '1'
    
    const closeBtn = document.createElement('span')
    closeBtn.className = 'tab-close'
    closeBtn.textContent = '×'
    closeBtn.onclick = (e)=>{ e.stopPropagation(); if(confirm('Close ' + node.title + '?')) closeNode(id) }
    
    tab.appendChild(icon)
    tab.appendChild(label)
    tab.appendChild(closeBtn)
    tab.onclick = ()=>{ selectNode(id) }
    
    tabList.appendChild(tab)
  }
}

// Render editor content based on selected node
function renderEditorContent(){
  const content = document.getElementById('editor-content')
  if(!store.selected){
    content.innerHTML = '<div class="empty-state"><div class="empty-message">Select a tab to view</div></div>'
    return
  }
  
  const node = store.nodes.get(store.selected)
  if(!node) {
    content.innerHTML = '<div class="empty-state"><div class="empty-message">Tab not found</div></div>'
    return
  }
  
  let html = `<div><h3>${node.title}</h3><p><strong>File:</strong> ${node.file || 'untitled'}</p>`
  if(node.currentUrl) html += `<p><strong>URL:</strong> ${node.currentUrl}</p>`
  html += `<p><strong>ID:</strong> ${node.id}</p></div>`
  
  content.innerHTML = html
}

function tracePath(nodeId){
  const parts = []
  let cur = store.nodes.get(nodeId)
  while(cur){ parts.unshift(cur.title); cur = cur.parent ? store.nodes.get(cur.parent) : null }
  return parts
}

function selectNode(id){
  store.selected = id
  const node = store.nodes.get(id)
  if(!node) return
  
  renderTabBar()
  renderEditorContent()
}

function navigateNode(nodeId, url){
  const node = store.nodes.get(nodeId)
  if(!node) return
  if(node.history.length === 0 || node.history[node.history.length-1] !== url){
    node.history.push(url)
  }
  node.currentUrl = url
  // If synced, propagate to all synced nodes
  if(node.syncedId){
    const src = store.nodes.get(node.syncedId)
    if(src){
      src.history = [...node.history]
      src.currentUrl = url
      // Update all other synced views
      for(const [id, n] of store.nodes){
        if(n.syncedId === node.syncedId && id !== nodeId){
          n.history = [...src.history]
          n.currentUrl = url
        }
      }
    }
  } else {
    // Propagate to synced children
    for(const [id, n] of store.nodes){
      if(n.syncedId === nodeId){
        n.history = [...node.history]
        n.currentUrl = url
      }
    }
  }
  if(store.selected === nodeId || store.nodes.get(store.selected)?.syncedId === nodeId){
    selectNode(store.selected)
  }
  schedulePersist()
}

// persistence helpers (debounced)
let saveTimer = null
async function persistState(){
  if(window.BrowserAPI && window.BrowserAPI.saveStateToBackend){
    const serial = serializeStore()
    await window.BrowserAPI.saveStateToBackend(serial)
  } else {
    localStorage.setItem('nestedTabsState', JSON.stringify(serializeStore()))
  }
}

function schedulePersist(){
  if(saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(()=>{ persistState() }, 250)
}

function serializeStore(){
  const nodes = {}
  for(const [id,n] of store.nodes) nodes[id] = { id:n.id, title:n.title, file:n.file, parent:n.parent, children:n.children, syncedId:n.syncedId, history:n.history, currentUrl:n.currentUrl }
  return { nodes, rootIds: store.rootIds, selected: store.selected }
}

function loadStore(obj){
  store.nodes = new Map()
  for(const id of Object.keys(obj.nodes||{})){
    const n = obj.nodes[id]
    const node = new Node(n.id,n.title,n.file,n.parent,n.syncedId)
    node.children = n.children || []
    node.history = n.history || []
    node.currentUrl = n.currentUrl || null
    store.nodes.set(id,node)
  }
  store.rootIds = obj.rootIds || []
  store.selected = obj.selected || null
  renderTree()
}

// keyboard bindings
window.addEventListener('keydown', (e)=>{
  // Don't trigger if user is typing in search or input field
  if(e.target.tagName === 'INPUT' && e.key !== 'Escape') return

  if((e.ctrlKey||e.metaKey) && e.key==='t'){
    e.preventDefault()
    openSearchModal()
  }
  if((e.ctrlKey||e.metaKey) && e.key==='w'){
    e.preventDefault(); if(store.selected) { if(confirm('Close selected?')) { closeNode(store.selected); schedulePersist(); } }
  }
  if((e.ctrlKey||e.metaKey) && e.key==='d'){
    e.preventDefault(); if(store.selected){ duplicateNode(store.selected); schedulePersist(); }
  }
  if(e.key === 'Escape'){
    closeSearchModal()
  }
})

// Search modal functions (command palette)
function openSearchModal(){
  const modal = document.getElementById('command-palette')
  const backdrop = document.getElementById('command-backdrop')
  const input = document.getElementById('command-input')
  modal.classList.remove('hidden')
  backdrop.classList.remove('hidden')
  input.focus()
  input.value = ''
  renderSearchResults('')
}

function closeSearchModal(){
  const modal = document.getElementById('command-palette')
  const backdrop = document.getElementById('command-backdrop')
  modal.classList.add('hidden')
  backdrop.classList.add('hidden')
}

function renderSearchResults(query){
  const results = document.getElementById('command-results')
  results.innerHTML = ''
  
  if(!query.trim()){
    // Show recent tabs
    const recent = Array.from(store.rootIds).slice(0, 10).map(id => store.nodes.get(id))
    if(recent.length === 0){
      const empty = document.createElement('div')
      empty.className = 'results-placeholder'
      empty.textContent = 'No tabs yet'
      results.appendChild(empty)
      return
    }
    for(const node of recent){
      const item = createSearchResultItem(node)
      results.appendChild(item)
    }
    return
  }

  // Search through all tabs
  const q = query.toLowerCase()
  const matches = []
  for(const id of store.rootIds){
    const node = store.nodes.get(id)
    if(node.title.toLowerCase().includes(q) || (node.file && node.file.toLowerCase().includes(q))){
      matches.push(node)
    }
  }

  if(matches.length === 0){
    const noResult = document.createElement('div')
    noResult.className = 'results-placeholder'
    noResult.textContent = 'No matches found'
    results.appendChild(noResult)
    return
  }

  for(const node of matches.slice(0, 20)){
    const item = createSearchResultItem(node)
    results.appendChild(item)
  }
}

function createSearchResultItem(node){
  const item = document.createElement('div')
  item.className = 'command-result-item'
  item.onclick = ()=>{ selectNode(node.id); closeSearchModal() }
  
  const left = document.createElement('div')
  const title = document.createElement('div')
  title.className = 'result-label'
  title.textContent = node.title
  const path = document.createElement('div')
  path.className = 'result-path'
  path.textContent = node.file || 'untitled'
  left.appendChild(title)
  left.appendChild(path)
  
  const badge = document.createElement('span')
  badge.className = 'result-badge'
  badge.textContent = 'Tab'
  
  item.appendChild(left)
  item.appendChild(badge)
  return item
}

// Search input handler
window.addEventListener('load', ()=>{
  const searchInput = document.getElementById('command-input')
  searchInput.addEventListener('input', (e)=>{ renderSearchResults(e.target.value) })
})

// initial demo content + load persisted
window.addEventListener('load', async ()=>{
  // try backend load first
  let loaded = null
  if(window.BrowserAPI && window.BrowserAPI.loadStateFromBackend){
    try{ loaded = await window.BrowserAPI.loadStateFromBackend() }catch(e){ loaded = null }
  } else {
    try{ loaded = JSON.parse(localStorage.getItem('nestedTabsState')||'null') }catch(e){ loaded = null }
  }

  if(loaded && Object.keys(loaded).length){
    loadStore(loaded)
  } else {
    const a = createRoot('Home','/home.txt')
    const b = createRoot('Docs','/docs/readme.md')
    const c = createRoot('Browse','/web.html')
    renderTree()
    schedulePersist()
  }

  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle-btn')
  const sidebar = document.getElementById('sidebar')
  sidebarToggle.onclick = ()=>{ sidebar.classList.toggle('collapsed') }

  // Command palette close on outside click
  const cmdBackdrop = document.getElementById('command-backdrop')
  cmdBackdrop.addEventListener('click', ()=>{ closeSearchModal() })
})
