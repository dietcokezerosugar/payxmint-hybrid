async function testLogs() {
  try {
    const res = await fetch('http://localhost:3000/api/logs');
    const text = await res.text();
    console.log('Logs API Status:', res.status);
    console.log('Logs API Response:', text.substring(0, 500));
  } catch (e) {
    console.error('Fetch failed:', e.message);
  }
}

testLogs();
