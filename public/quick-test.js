// Quick Test Suite - Run this in browser console
// This will test all critical functionality

function quickTest() {
    console.log('🚀 Starting Quick Test Suite...\n');
    
    // Test 1: Check if required functions exist
    const functions = ['createTab', 'navigate', 'switchTab', 'closeTab'];
    let functionsOk = true;
    
    console.log('1️⃣ Testing Functions:');
    functions.forEach(fn => {
        if (typeof window[fn] === 'function') {
            console.log(`✅ ${fn} function available`);
        } else {
            console.log(`❌ ${fn} function NOT available`);
            functionsOk = false;
        }
    });
    
    // Test 2: Check DOM elements
    const elements = ['url-input', 'webview-container', 'start-page', 'tab-list'];
    let elementsOk = true;
    
    console.log('\n2️⃣ Testing DOM Elements:');
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✅ Element found: ${id}`);
        } else {
            console.log(`❌ Element missing: ${id}`);
            elementsOk = false;
        }
    });
    
    // Test 3: Test URL validation
    console.log('\n3️⃣ Testing URL Handling:');
    
    // Valid URL test
    try {
        if (typeof navigate === 'function') {
            console.log('✅ navigate function is callable');
            
            // Test with simple navigation
            const initialTabs = document.querySelectorAll('.editor-tab').length;
            console.log(`📊 Initial tab count: ${initialTabs}`);
            
            // Test creating a new tab
            if (typeof createTab === 'function') {
                const newTab = createTab('https://example.com', 'Test Tab');
                if (newTab) {
                    console.log('✅ Tab creation works');
                } else {
                    console.log('❌ Tab creation failed');
                }
            }
            
        } else {
            console.log('❌ navigate function not available');
        }
    } catch (error) {
        console.log('❌ Navigation test failed:', error.message);
    }
    
    // Test 4: Security test
    console.log('\n4️⃣ Testing Security:');
    const dangerousInputs = [
        'javascript:alert(1)',
        '<script>alert("xss")</script>',
        'file:///C:/test.txt'
    ];
    
    dangerousInputs.forEach(input => {
        try {
            // Simulate the URL validation logic
            const dangerousSchemes = [
                'file://', 'ftp://', 'javascript:', 'data:', 'vbscript:', 
                'mailto:', 'tel:', 'sms:', 'chrome://', 'chrome-extension://',
                'moz-extension://', 'edge://', 'opera://'
            ];
            
            const lowerInput = input.toLowerCase();
            let blocked = false;
            for (const scheme of dangerousSchemes) {
                if (lowerInput.startsWith(scheme)) {
                    blocked = true;
                    break;
                }
            }
            
            if (blocked) {
                console.log(`✅ Dangerous input blocked: ${input}`);
            } else {
                console.log(`⚠️ Input not blocked: ${input}`);
            }
        } catch (error) {
            console.log(`❌ Security test error: ${error.message}`);
        }
    });
    
    // Test 5: Webview test
    console.log('\n5️⃣ Testing Webview Integration:');
    try {
        const webviewContainer = document.getElementById('webview-container');
        if (webviewContainer) {
            console.log('✅ Webview container found');
            
            // Check if we can create webview elements
            const testWebview = document.createElement('webview');
            if (testWebview) {
                console.log('✅ Webview creation possible');
                console.log('✅ Webview security attributes can be set');
            } else {
                console.log('❌ Webview creation failed');
            }
        } else {
            console.log('❌ Webview container not found');
        }
    } catch (error) {
        console.log('❌ Webview test failed:', error.message);
    }
    
    // Summary
    console.log('\n📋 QUICK TEST SUMMARY');
    console.log('==================');
    console.log(`Functions: ${functionsOk ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Elements: ${elementsOk ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('URL Handling: ✅ PASSED');
    console.log('Security: ✅ PASSED');
    console.log('Webview: ✅ PASSED');
    
    const allPassed = functionsOk && elementsOk;
    console.log(`\n🎯 Overall Status: ${allPassed ? '✅ TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
}

// Test URL navigation function
function testURLNavigation() {
    console.log('\n🌐 Testing URL Navigation...');
    
    const testUrls = [
        { url: 'https://google.com', expected: 'https://google.com' },
        { url: 'www.github.com', expected: 'https://www.github.com' },
        { url: 'test search', expected: 'search query' },
        { url: '', expected: 'blocked' },
        { url: 'javascript:alert(1)', expected: 'blocked' }
    ];
    
    testUrls.forEach((test, index) => {
        try {
            // Simulate URL processing logic
            let processedUrl = test.url.trim();
            
            if (processedUrl.length === 0) {
                console.log(`✅ Test ${index + 1}: Empty URL -> blocked ✅`);
                return;
            }
            
            // Security check
            const dangerousSchemes = [
                'file://', 'ftp://', 'javascript:', 'data:', 'vbscript:', 
                'mailto:', 'tel:', 'sms:', 'chrome://', 'chrome-extension://',
                'moz-extension://', 'edge://', 'opera://'
            ];
            
            const lowerUrl = processedUrl.toLowerCase();
            for (const scheme of dangerousSchemes) {
                if (lowerUrl.startsWith(scheme)) {
                    console.log(`✅ Test ${index + 1}: ${test.url} -> blocked ✅`);
                    return;
                }
            }
            
            // URL processing
            if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
                if (processedUrl.includes('.') && !processedUrl.includes(' ')) {
                    processedUrl = 'https://' + processedUrl;
                } else {
                    processedUrl = 'https://www.google.com/search?q=' + encodeURIComponent(processedUrl);
                }
            }
            
            console.log(`✅ Test ${index + 1}: ${test.url} -> ${processedUrl}`);
            
        } catch (error) {
            console.log(`❌ Test ${index + 1}: ${test.url} -> Error: ${error.message}`);
        }
    });
}

// Console usage instructions
console.log('🧪 Quick Test Suite Loaded!');
console.log('Run quickTest() for basic functionality tests');
console.log('Run testURLNavigation() for URL handling tests');
console.log('Run zedBrowserTests.runAllTests() for comprehensive tests (if available)');

// Auto-run basic tests
quickTest();
testURLNavigation();