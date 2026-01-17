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
