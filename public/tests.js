// Simple tests for nestedTabs.js
// Run in browser console or with a test runner

function testPersistence(){
  // Create a node
  const node = createRoot('Test', '/test.txt')
  navigateNode(node.id, 'https://example.com')
  // Serialize
  const data = serializeStore()
  // Clear and load
  store.nodes.clear()
  store.rootIds = []
  loadStore(data)
  // Check
  const loaded = store.nodes.get(node.id)
  console.assert(loaded.title === 'Test', 'Title persisted')
  console.assert(loaded.currentUrl === 'https://example.com', 'URL persisted')
  console.log('Persistence test passed')
}

function testSync(){
  const src = createRoot('Source', '/src.txt')
  const sync = syncLinkNode(src.id, null)
  navigateNode(src.id, 'https://sync.com')
  const synced = store.nodes.get(sync.id)
  console.assert(synced.currentUrl === 'https://sync.com', 'Sync propagated')
  console.log('Sync test passed')
}

function testKeyboard(){
  // Simulate Ctrl+T
  const event = new KeyboardEvent('keydown', {key:'t', ctrlKey:true})
  window.dispatchEvent(event)
  console.assert(store.rootIds.length > 0, 'New tab created')
  console.log('Keyboard test passed')
}

// Run tests
testPersistence()
testSync()
testKeyboard()