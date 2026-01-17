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
  const tree = document.getElementById('tree')
  tree.innerHTML = ''
  for(const id of store.rootIds){
    const node = store.nodes.get(id)
    tree.appendChild(renderNode(node))
  }
  renderBreadcrumbs()
}

function renderNode(node){
  const el = document.createElement('div')
  el.className = 'node'
  if(store.selected === node.id) el.classList.add('selected')

  const title = document.createElement('div')
  title.textContent = node.title
  title.onclick = ()=>{ selectNode(node.id) }

  const meta = document.createElement('div')
  meta.className = 'meta'
  const info = document.createElement('span')
  info.textContent = node.file || 'untitled'
  const actions = document.createElement('span')

  const addChild = document.createElement('button')
  addChild.textContent = '+'; addChild.className='btn'; addChild.onclick=(e)=>{ e.stopPropagation(); const t=prompt('child title','child'); if(t) createChild(node.id,t,'/file'+Math.floor(Math.random()*10)) }
  const dup = document.createElement('button')
  dup.textContent='dup'; dup.className='btn'; dup.onclick=(e)=>{ e.stopPropagation(); duplicateNode(node.id) }
  const sync = document.createElement('button')
  sync.textContent='sync'; sync.className='btn'; sync.onclick=(e)=>{ e.stopPropagation(); const parent = prompt('sync under parent id (or leave empty for root)'); syncLinkNode(node.id, parent || null) }
  const close = document.createElement('button')
  close.textContent='x'; close.className='btn'; close.onclick=(e)=>{ e.stopPropagation(); if(confirm('Close this tab and its children?')) closeNode(node.id) }

  actions.appendChild(addChild)
  actions.appendChild(dup)
  actions.appendChild(sync)
  actions.appendChild(close)

  meta.appendChild(info)
  meta.appendChild(actions)

  el.appendChild(title)
  el.appendChild(meta)

  if(node.children.length){
    const childWrap = document.createElement('div')
    childWrap.className = 'children'
    for(const cid of node.children){
      childWrap.appendChild(renderNode(store.nodes.get(cid)))
    }
    el.appendChild(childWrap)
  }

  return el
}

function renderBreadcrumbs(){
  const out = document.getElementById('breadcrumbs')
  out.innerHTML = ''
  if(!store.selected){ out.textContent = 'No tab selected'; return }
  const path = []
  let cur = store.nodes.get(store.selected)
  while(cur){ path.unshift(cur); cur = cur.parent ? store.nodes.get(cur.parent) : null }
  for(const n of path){
    const b = document.createElement('button')
    b.textContent = n.title
    b.className='btn'
    b.onclick=()=>{ selectNode(n.id) }
    out.appendChild(b)
  }

  // show instances if the selected node has a file
  const instMap = store.instances()
  const file = store.nodes.get(store.selected).file
  if(file){
    const list = instMap.get(file) || []
    const badge = document.createElement('span')
    badge.style.marginLeft='8px'
    badge.style.color='var(--muted)'
    badge.textContent = `instances: ${list.length}`
    out.appendChild(badge)

    if(list.length>1){
      const menu = document.createElement('select')
      menu.style.marginLeft='8px'
      for(const id of list){
        const opt = document.createElement('option')
        opt.value=id
        opt.textContent = tracePath(id).join(' > ')
        menu.appendChild(opt)
      }
      menu.onchange = ()=>{ selectNode(menu.value) }
      out.appendChild(menu)
    }
  }
}

function tracePath(nodeId){
  const parts = []
  let cur = store.nodes.get(nodeId)
  while(cur){ parts.unshift(cur.title); cur = cur.parent ? store.nodes.get(cur.parent) : null }
  return parts
}

function selectNode(id){
  store.selected = id
  const v = document.getElementById('tab-view')
  const node = store.nodes.get(id)
  if(!node) { v.textContent = 'No such node'; renderBreadcrumbs(); return }

  // if node.syncedId -> show that it's linked and reflect content from source
  if(node.syncedId){
    const src = store.nodes.get(node.syncedId)
    v.innerHTML = `<div>Synced view of <b>${src.title}</b> (source: ${node.syncedId})</div><div class="meta">file: ${src.file}, url: ${src.currentUrl}</div>`
  } else {
    v.innerHTML = `<div>Viewing <b>${node.title}</b></div><div class="meta">file: ${node.file}, url: ${node.currentUrl}</div>`
  }
  renderBreadcrumbs()
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

// Search modal functions
function openSearchModal(){
  const modal = document.getElementById('search-modal')
  const input = document.getElementById('search-input')
  modal.classList.remove('hidden')
  input.focus()
  input.value = ''
  renderSearchResults('')
}

function closeSearchModal(){
  const modal = document.getElementById('search-modal')
  modal.classList.add('hidden')
}

function renderSearchResults(query){
  const results = document.getElementById('search-results')
  results.innerHTML = ''
  
  if(!query.trim()){
    // Show recent tabs
    const recent = Array.from(store.rootIds).slice(0, 10).map(id => store.nodes.get(id))
    for(const node of recent){
      const item = createSearchResultItem(node, 'Recent')
      results.appendChild(item)
    }
    return
  }

  // Search through all nodes
  const q = query.toLowerCase()
  const matches = []
  for(const [id, node] of store.nodes){
    if(node.title.toLowerCase().includes(q) || (node.file && node.file.toLowerCase().includes(q))){
      matches.push(node)
    }
  }

  for(const node of matches.slice(0, 20)){
    const item = createSearchResultItem(node, 'Tab')
    results.appendChild(item)
  }

  if(matches.length === 0){
    const noResult = document.createElement('div')
    noResult.style.padding = '20px'
    noResult.style.textAlign = 'center'
    noResult.style.color = 'var(--muted)'
    noResult.textContent = 'No matches found'
    results.appendChild(noResult)
  }
}

function createSearchResultItem(node, type){
  const item = document.createElement('div')
  item.className = 'search-result-item'
  item.onclick = ()=>{ selectNode(node.id); closeSearchModal() }
  
  const left = document.createElement('div')
  const title = document.createElement('div')
  title.className = 'search-result-title'
  title.textContent = node.title
  const path = document.createElement('div')
  path.className = 'search-result-path'
  path.textContent = node.file || 'untitled'
  left.appendChild(title)
  left.appendChild(path)
  
  const badge = document.createElement('span')
  badge.style.fontSize = '11px'
  badge.style.color = 'var(--muted)'
  badge.style.marginLeft = 'auto'
  badge.textContent = type
  
  item.appendChild(left)
  item.appendChild(badge)
  return item
}

// Search input handler
window.addEventListener('load', ()=>{
  const searchInput = document.getElementById('search-input')
  searchInput.addEventListener('input', (e)=>{ renderSearchResults(e.target.value) })
})

// initial demo content + load persisted
window.addEventListener('load', async ()=>{
  document.getElementById('add-root').onclick = ()=>{ const t=prompt('title','New Tab'); if(t) { createRoot(t,'/file'+Math.floor(Math.random()*10)); schedulePersist(); } }

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
    createChild(a.id,'Child A1','/home.txt')
    createChild(a.id,'Child A2','/other.md')
    // create a sync duplicate of a under root
    syncLinkNode(a.id,null)
    renderTree()
    schedulePersist()
  }

  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle')
  const sidebar = document.getElementById('sidebar')
  sidebarToggle.onclick = ()=>{ sidebar.classList.toggle('sidebar-collapsed') }

  // Search modal close on outside click
  const searchModal = document.getElementById('search-modal')
  searchModal.addEventListener('click', (e)=>{ if(e.target === searchModal) closeSearchModal() })
})
