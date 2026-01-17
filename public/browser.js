// Minimal glue for the nested-tabs prototype
// Exposes an API for future wiring to backend commands
const BrowserAPI = {
  createRoot(title, file){ return createRoot(title, file) },
  createChild(parentId,title,file){ return createChild(parentId,title,file) },
  duplicate(nodeId){ return duplicateNode(nodeId) },
  syncLink(nodeId,parentId){ return syncLinkNode(nodeId,parentId) },
  close(nodeId){ return closeNode(nodeId) },
}

window.BrowserAPI = BrowserAPI
