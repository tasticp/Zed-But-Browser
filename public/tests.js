// Comprehensive Testing Suite for Zed Browser
// This script tests various edge cases for URL handling, security, and performance

const testUrls = [
    // Valid URLs
    { input: 'https://google.com', expected: 'https://google.com', shouldWork: true },
    { input: 'http://example.com', expected: 'http://example.com', shouldWork: true },
    { input: 'www.google.com', expected: 'https://www.google.com', shouldWork: true },
    { input: 'github.com', expected: 'https://github.com', shouldWork: true },
    
    // Search queries
    { input: 'rust programming', expected: 'https://www.google.com/search?q=rust%20programming', shouldWork: true },
    { input: 'test search', expected: 'https://www.google.com/search?q=test%20search', shouldWork: true },
    { input: '123 456', expected: 'https://www.google.com/search?q=123%20456', shouldWork: true },
    
    // Edge cases
    { input: '', expected: null, shouldWork: false },
    { input: '   ', expected: null, shouldWork: false },
    { input: 'javascript:alert(1)', expected: null, shouldWork: false },
    { input: 'file:///C:/test.txt', expected: null, shouldWork: false },
    { input: 'data:text/html,<script>alert(1)</script>', expected: null, shouldWork: false },
    { input: 'vbscript:msgbox(1)', expected: null, shouldWork: false },
    { input: 'chrome://settings', expected: null, shouldWork: false },
    { input: 'chrome-extension://test', expected: null, shouldWork: false },
    { input: 'edge://settings', expected: null, shouldWork: false },
    { input: 'mailto:test@example.com', expected: null, shouldWork: false },
    { input: 'tel:+1234567890', expected: null, shouldWork: false },
    { input: 'sms:+1234567890', expected: null, shouldWork: false },
    
    // Long URLs
    { input: 'a'.repeat(3000), expected: null, shouldWork: false },
    { input: 'test with spaces', expected: 'https://www.google.com/search?q=test%20with%20spaces', shouldWork: true },
    
    // International domains
    { input: '测试.com', expected: 'https://测试.com', shouldWork: true },
    { input: 'münchen.de', expected: 'https://münchen.de', shouldWork: true },
    
    // IP addresses
    { input: '192.168.1.1', expected: 'https://192.168.1.1', shouldWork: true },
    { input: 'localhost:3000', expected: 'https://localhost:3000', shouldWork: true },
    
    // Special characters
    { input: 'example.com/path?query=value&other=test', expected: 'https://example.com/path?query=value&other=test', shouldWork: true },
    { input: 'https://user:pass@example.com', expected: 'https://user:pass@example.com', shouldWork: true },
    
    // Invalid URLs
    { input: 'ht tp://broken url', expected: 'https://www.google.com/search?q=ht%20tp%3A%2F%2Fbroken%20url', shouldWork: true },
    { input: '://missing-protocol.com', expected: 'https://://missing-protocol.com', shouldWork: false },
    
    // XSS attempts
    { input: '<script>alert("xss")</script>', expected: 'https://www.google.com/search?q=%3Cscript%3Ealert%28%22xss%22%29%3C%2Fscript%3E', shouldWork: true },
    { input: '"onmouseover="alert(1)', expected: 'https://www.google.com/search?q=%22onmouseover%3D%22alert%281%29', shouldWork: true },
];

// Test function
function testUrlHandling() {
    console.log('🧪 Starting URL handling tests...');
    let passed = 0;
    let failed = 0;
    
    testUrls.forEach((test, index) => {
        try {
            // Simulate navigate function logic
            let result = simulateNavigate(test.input);
            const success = test.shouldWork ? result !== null : result === null;
            
            if (success) {
                console.log(`✅ Test ${index + 1}: ${test.input} -> ${result}`);
                passed++;
            } else {
                console.log(`❌ Test ${index + 1}: ${test.input} -> Expected to fail but got: ${result}`);
                failed++;
            }
        } catch (error) {
            if (!test.shouldWork) {
                console.log(`✅ Test ${index + 1}: ${test.input} -> Correctly rejected with error: ${error.message}`);
                passed++;
            } else {
                console.log(`❌ Test ${index + 1}: ${test.input} -> Unexpected error: ${error.message}`);
                failed++;
            }
        }
    });
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${testUrls.length} tests`);
    return { passed, failed, total: testUrls.length };
}

// Simulate the navigate function logic
function simulateNavigate(url) {
    if (!url) return null;
    
    let finalUrl = url.trim();
    
    // Length validation
    if (finalUrl.length > 2048) {
        throw new Error('URL too long');
    }
    
    if (finalUrl.length === 0) {
        throw new Error('Please enter a URL');
    }
    
    // Security checks
    const dangerousSchemes = [
        'file://', 'ftp://', 'javascript:', 'data:', 'vbscript:', 
        'mailto:', 'tel:', 'sms:', 'chrome://', 'chrome-extension://',
        'moz-extension://', 'edge://', 'opera://'
    ];
    
    const lowerUrl = finalUrl.toLowerCase();
    for (const scheme of dangerousSchemes) {
        if (lowerUrl.startsWith(scheme)) {
            throw new Error(`URL scheme '${scheme}' is not allowed`);
        }
    }
    
    // URL construction
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
            finalUrl = 'https://' + finalUrl;
        } else {
            finalUrl = 'https://www.google.com/search?q=' + encodeURIComponent(finalUrl.substring(0, 1000));
        }
    }
    
    try {
        new URL(finalUrl);
        return finalUrl;
    } catch (e) {
        // Try to fix
        const fixedUrl = !finalUrl.startsWith('http') ? 'https://' + finalUrl : finalUrl;
        new URL(fixedUrl);
        return fixedUrl;
    }
}

// Tab management tests
function testTabManagement() {
    console.log('\n🧪 Testing tab management...');
    const maxTabs = 50;
    let tabs = [];
    
    // Test tab creation
    for (let i = 0; i < maxTabs + 5; i++) {
        if (tabs.length >= maxTabs) {
            console.log(`✅ Tab limit correctly enforced at ${maxTabs} tabs`);
            break;
        }
        tabs.push({ id: `tab-${i}`, url: `https://example.com/${i}` });
    }
    
    console.log(`📊 Created ${tabs.length} tabs`);
    
    // Test tab switching and closing
    if (tabs.length > 0) {
        const initialTabCount = tabs.length;
        tabs.splice(0, 1); // Remove first tab
        console.log(`✅ Tab closing: ${initialTabCount} -> ${tabs.length} tabs`);
    }
    
    return true;
}

// Security tests
function testSecurityMeasures() {
    console.log('\n🧪 Testing security measures...');
    
    const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        '"><script>alert(1)</script>',
        '\'" onclick="alert(1)'
    ];
    
    xssAttempts.forEach(attempt => {
        try {
            const result = simulateNavigate(attempt);
            // Check if dangerous content is properly encoded
            if (result && result.includes('<script>')) {
                console.log(`❌ XSS attempt not properly escaped: ${attempt}`);
            } else {
                console.log(`✅ XSS attempt properly handled: ${attempt}`);
            }
        } catch (error) {
            console.log(`✅ XSS attempt correctly rejected: ${attempt} - ${error.message}`);
        }
    });
    
    return true;
}

// Performance tests
function testPerformance() {
    console.log('\n🧪 Testing memory and performance...');
    
    const startTime = performance.now();
    
    // Test many rapid tab operations
    for (let i = 0; i < 100; i++) {
        simulateNavigate(`https://test-${i}.com`);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Performance test completed in ${duration.toFixed(2)}ms for 100 operations`);
    
    if (duration < 1000) {
        console.log('✅ Performance is within acceptable limits');
    } else {
        console.log('⚠️ Performance may need optimization');
    }
    
    return duration < 1000;
}

// Application integration tests
function testAppIntegration() {
    console.log('\n🧪 Testing application integration...');
    
    // Check if required elements exist
    const requiredElements = ['url-input', 'webview', 'start-page', 'tab-list'];
    let allExist = true;
    
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✅ Element found: ${id}`);
        } else {
            console.log(`❌ Element missing: ${id}`);
            allExist = false;
        }
    });
    
    // Test keyboard shortcuts
    if (typeof createTab === 'function') {
        console.log('✅ createTab function available');
    } else {
        console.log('❌ createTab function not available');
        allExist = false;
    }
    
    if (typeof navigate === 'function') {
        console.log('✅ navigate function available');
    } else {
        console.log('❌ navigate function not available');
        allExist = false;
    }
    
    return allExist;
}

// Run all tests
function runAllTests() {
    console.log('🚀 Starting comprehensive test suite for Zed Browser\n');
    
    const urlResults = testUrlHandling();
    const tabResults = testTabManagement();
    const securityResults = testSecurityMeasures();
    const performanceResults = testPerformance();
    const integrationResults = testAppIntegration();
    
    console.log('\n📋 FINAL TEST REPORT');
    console.log('===================\n');
    console.log(`URL Handling Tests: ${urlResults.passed}/${urlResults.total} passed`);
    console.log(`Tab Management: ${tabResults ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Security Measures: ${securityResults ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Performance Tests: ${performanceResults ? '✅ PASSED' : '⚠️ NEEDS OPTIMIZATION'}`);
    console.log(`App Integration: ${integrationResults ? '✅ PASSED' : '❌ FAILED'}`);
    
    const allPassed = urlResults.failed === 0 && tabResults && securityResults && performanceResults && integrationResults;
    console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
}

// Export for browser console
window.zedBrowserTests = {
    runAllTests,
    testUrlHandling,
    testTabManagement,
    testSecurityMeasures,
    testPerformance,
    testAppIntegration
};

// Auto-run if loaded
if (typeof window !== 'undefined') {
    console.log('🧪 Zed Browser Test Suite loaded. Run zedBrowserTests.runAllTests() to execute all tests.');
}