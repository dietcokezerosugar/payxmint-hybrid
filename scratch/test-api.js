async function testApi() {
  try {
    const res = await fetch('http://localhost:3000/api/gpay-accounts');
    const data = await res.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Fetch failed:', e.message);
  }
}

testApi();
