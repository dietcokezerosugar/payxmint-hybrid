# 🤖 WaveCollect Bot Operations Guide

This guide is for DevOps and developers managing the verification bots.

---

## 1. How Bots Work
The bots (`src/bot/*.js`) are Playwright scripts that run headlessly on the server. They perform three main tasks:
1.  **Persistent Login**: Maintain an active session with Google Pay / Business Apps.
2.  **Transaction Scraping**: Periodically refresh the "Transactions" list to extract UTRs, Amounts, and Notes.
3.  **Bridge Sync**: Send raw transaction data to the `MatchingEngine` via the `/api/bots/bridge` endpoint.

---

## 2. Managing Bots (PM2)
In production, bots should be managed by PM2 to ensure auto-restart on failure.

```bash
# View bot status
pm2 status

# Restart all bots
pm2 restart all

# View real-time logs
pm2 logs gpay-daemon
```

---

## 3. Remote Login Flow
When a bot loses its session (e.g., OTP expired), the Admin Dashboard will show **"WAITING_OTP"**.

1.  Admin clicks **"Force Login"** in the Global Fleet panel.
2.  The bot spawns a browser and hits the login screen.
3.  If Google asks for OTP, the bot updates the `otpCode` field in the database.
4.  Admin enters the OTP in the UI.
5.  The bot picks up the OTP and completes the session.

---

## 4. Troubleshooting

### Problem: "Bot is stuck on Heartbeat"
- **Cause**: Proxy might be dead or Google has flagged the IP.
- **Fix**: Check `proxyConfig` in the `GooglePayAccount` table and update the IP.

### Problem: "Transactions not matching"
- **Cause**: The SMS/Notification format from the bank might have changed.
- **Fix**: Check the `RawSmsLog` table to see the incoming text and update the regex in the scraper script.

---

## 5. Security Recommendations
- **Rotate Proxies**: Use residential rotating proxies for high-volume accounts.
- **Fingerprint Randomization**: The bots use custom headers to mimic real Android/iOS devices. Do not use default Chromium headers.
- **Encryption**: Always ensure `ENCRYPTION_KEY` is set in `.env` to protect VPA passwords.
