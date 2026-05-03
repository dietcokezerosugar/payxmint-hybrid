// Quick test: Create a payment intent and print the checkout URL
// Run: node create-test-intent.js

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const QRCode = require('qrcode');

const prisma = new PrismaClient();

async function main() {
  // 1. Get first active merchant + API key
  const merchant = await prisma.merchant.findFirst({
    where: { status: 'ACTIVE' },
    include: { 
      apiKeys: { where: { isBlocked: false }, take: 1 },
      gpayAccounts: { where: { status: 'ACTIVE' }, take: 1 }
    }
  });

  if (!merchant) {
    console.log('❌ No active merchant found. Create one first.');
    process.exit(1);
  }

  if (!merchant.apiKeys.length) {
    console.log('❌ No active API key found.');
    process.exit(1);
  }

  const apiKey = merchant.apiKeys[0];
  const gpayAccount = merchant.gpayAccounts[0];

  if (!gpayAccount) {
    console.log('❌ No active GPay account found. Deploy one first.');
    process.exit(1);
  }

  // 2. Generate test order
  const orderId = 'TEST-' + Date.now();
  const amount = 1.00; // ₹1 test

  // 3. Generate UPI deep link (exact BloomxHub logic)
  const merchantName = merchant.businessName || merchant.name;
  const upiParams = new URLSearchParams({
    pa: gpayAccount.upiId,
    pn: merchantName,
    am: amount.toFixed(2),
    tid: orderId,
    tr: orderId,
    tn: `Pay ${orderId}`,
    cu: 'INR',
  });
  const upiDeepLink = `upi://pay?${upiParams.toString()}`;

  // 4. Generate QR Code
  const qrData = await QRCode.toDataURL(upiDeepLink, { width: 300, margin: 2 });

  // 5. Generate payment token (md5 like BloomxHub)
  const tokenString = orderId + Date.now().toString() + Math.floor(1000 + Math.random() * 9000).toString();
  const paymentToken = crypto.createHash('md5').update(tokenString).digest('hex');

  // 6. Create intent in DB
  const expireAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  const intent = await prisma.paymentIntent.create({
    data: {
      merchantId: merchant.id,
      apiKeyId: apiKey.id,
      amount,
      referenceId: orderId,
      upiDeepLink,
      qrData,
      paymentToken,
      expireAt,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://192.168.2.62:3000';
  const checkoutUrl = `${appUrl}/pay/${paymentToken}`;

  console.log('\n════════════════════════════════════════');
  console.log('  ✅ TEST PAYMENT INTENT CREATED');
  console.log('════════════════════════════════════════');
  console.log(`  Amount:      ₹${amount}`);
  console.log(`  Order ID:    ${orderId}`);
  console.log(`  UPI ID:      ${gpayAccount.upiId}`);
  console.log(`  Merchant:    ${merchantName}`);
  console.log(`  Token:       ${paymentToken}`);
  console.log(`  Expires:     ${expireAt.toLocaleString()}`);
  console.log('────────────────────────────────────────');
  console.log(`  📱 OPEN ON PHONE:`);
  console.log(`  ${checkoutUrl}`);
  console.log('════════════════════════════════════════\n');
}

main()
  .catch(e => { console.error('Error:', e.message); })
  .finally(() => prisma.$disconnect());
