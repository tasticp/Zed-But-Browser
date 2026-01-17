// Minimal glue for the nested-tabs prototype
// Exposes an API for wiring to backend commands if available
async function invokeTauri(cmd, ...args){
  if(window.invoke) return window.invoke(cmd, ...args)
  if(window.__TAURI__ && window.__TAURI__.invoke) return window.__TAURI__.invoke(cmd, ...args)
  throw new Error('Tauri not available')
}

async function saveStateToBackend(state){
  try{
    await invokeTauri('write_state', JSON.stringify(state))
    return true
  }catch(e){ console.warn('persist failed',e); return false }
}

async function loadStateFromBackend(){
  try{
    const raw = await invokeTauri('read_state')
    return JSON.parse(raw || '{}')
  }catch(e){ console.warn('load failed',e); return null }
}

async function getConfig(key){
  try{ return await invokeTauri('get_config', key) }catch(e){ return null }
}

async function setConfig(key, value){
  try{ return await invokeTauri('set_config', key, value) }catch(e){ return false }
}

const BrowserAPI = {
  createRoot(title, file){ return createRoot(title, file) },
  createChild(parentId,title,file){ return createChild(parentId,title,file) },
  duplicate(nodeId){ return duplicateNode(nodeId) },
  syncLink(nodeId,parentId){ return syncLinkNode(nodeId,parentId) },
  close(nodeId){ return closeNode(nodeId) },
  saveStateToBackend,
  loadStateFromBackend,
  getConfig,
  setConfig,
}

window.BrowserAPI = BrowserAPI

// Engine selector wiring
window.addEventListener('load', async ()=>{
  const select = document.getElementById('engine-select')
  if(!select) return
  
  const current = await getConfig('preferred_engine') || 'webkit'
  select.value = current
  select.onchange = async ()=>{ await setConfig('preferred_engine', select.value) }

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle')
  const sidebar = document.getElementById('sidebar')
  if(window.innerWidth <= 768){
    mobileToggle.classList.remove('hidden')
    sidebar.classList.add('sidebar-collapsed')
  }
  
  window.addEventListener('resize', ()=>{
    if(window.innerWidth <= 768){
      mobileToggle.classList.remove('hidden')
    } else {
      mobileToggle.classList.add('hidden')
      sidebar.classList.remove('sidebar-collapsed')
    }
  })
})
