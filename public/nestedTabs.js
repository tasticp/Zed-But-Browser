// Minimal nested tabs model + small UI renderer
class Node {
  constructor(id, title, file=null, parent=null, syncedId=null){
    this.id = id
    this.title = title
    this.file = file // logical file path / identifier
    this.parent = parent
    this.children = []
    this.syncedId = syncedId // if set, shares state with another node id
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
    v.innerHTML = `<div>Synced view of <b>${node.title}</b> (source: ${node.syncedId})</div><div class="meta">file: ${node.file}</div>`
  } else {
    v.innerHTML = `<div>Viewing <b>${node.title}</b></div><div class="meta">file: ${node.file}</div>`
  }
  renderBreadcrumbs()
}

// initial demo content
window.addEventListener('load', ()=>{
  document.getElementById('add-root').onclick = ()=>{ const t=prompt('title','New Tab'); if(t) createRoot(t,'/file'+Math.floor(Math.random()*10)) }
  const a = createRoot('Home','/home.txt')
  const b = createRoot('Docs','/docs/readme.md')
  createChild(a.id,'Child A1','/home.txt')
  createChild(a.id,'Child A2','/other.md')
  // create a sync duplicate of a under root
  syncLinkNode(a.id,null)
  renderTree()
})
