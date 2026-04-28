# SAP Synchronization Deployment Guide

## 🎯 Overview
This setup allows you to trigger SAP synchronization from a web interface. When you click the button, it sends 6 sample orders to your VM for processing.

## 📋 Prerequisites
- Node.js version 18+ (for built-in fetch support)
- Your VM should have an endpoint ready to receive data

## 🚀 Deployment Steps

### 1. Configure VM Endpoint

**Option A: Using Environment Variable (Recommended)**
```bash
# Create .env file from template
cp .env.example .env

# Edit .env and set your VM endpoint
# Example: VM_ENDPOINT=http://192.168.1.100:5000/rpa-synchronize-sap
```

**Option B: Edit server.js Directly**
Open `server.js` and find line ~61:
```javascript
const VM_ENDPOINT = process.env.VM_ENDPOINT || 'http://YOUR_VM_IP:PORT/rpa-synchronize-sap';
```
Replace `YOUR_VM_IP:PORT` with your actual VM address.

### 2. Install Dependencies (if not already done)
```bash
npm install
```

### 3. Start the Server
```bash
node server.js
```

You should see:
```
Bridge Server live on port 3000
```

### 4. Open the Frontend
Open your browser and navigate to:
```
http://localhost:3000
```

### 5. Test the Flow

1. Click the "Trigger SAP Sync" button
2. The frontend will call `/trigger-sync` endpoint
3. The server will:
   - Select 6 PENDING orders
   - Transform them to SAP sync format
   - Send them to your VM endpoint
   - Return the response to the frontend

## 📊 Data Flow

```
[Frontend Button] 
    ↓ POST /trigger-sync
[Your Server] 
    ↓ POST /rpa-synchronize-sap
[Your VM] 
    ↓ Process orders
[Response back to Frontend]
```

## 🔍 Testing & Debugging

### Check Server Logs
When you click the button, you should see in the terminal:
```
🔄 Trigger SAP Sync: Sending 6 orders to VM
📦 Data: [array of orders]
✅ VM responded successfully: [response]
```

### Test Data Format
The server sends 6 orders in this format:
```json
[
  {
    "id": "866289388",
    "synchronize": true,
    "transportadora": "TRANSPORTADORA_388",
    "modal": "MODAL_88",
    "frete": "756.32",
    "planejamento": "PLAN_9388",
    "status": "PENDING_SYNC"
  },
  ...
]
```

### VM Endpoint Requirements
Your VM should accept:
- Method: POST
- Content-Type: application/json
- Body: Array of order objects (see format above)

### Common Issues

**Issue: fetch is not defined**
- Solution: Upgrade to Node.js 18+ or install `node-fetch`:
  ```bash
  npm install node-fetch
  ```
  Then update server.js to import it.

**Issue: Connection refused**
- Check VM is running and accessible
- Verify firewall rules
- Test VM endpoint with curl:
  ```bash
  curl -X POST http://YOUR_VM_IP:PORT/rpa-synchronize-sap \
    -H "Content-Type: application/json" \
    -d '[{"id":"test"}]'
  ```

**Issue: CORS errors**
- Not applicable here since frontend is served from same origin

## 🔄 Existing Endpoints (Still Working)

### GET /rpa/task
VM calls this to get pending tasks:
```bash
curl http://localhost:3000/rpa/task
```

### POST /rpa/result
VM calls this to send results back:
```bash
curl -X POST http://localhost:3000/rpa/result \
  -H "Content-Type: application/json" \
  -d '[{"id":"866289388","price":1500.00,"status":"success"}]'
```

## 🌐 Deploying to Production (Render, etc.)

1. Set environment variable in your hosting platform:
   ```
   VM_ENDPOINT=http://YOUR_VM_IP:PORT/rpa-synchronize-sap
   ```

2. Ensure your VM is accessible from the internet (or use VPN/tunnel)

3. Deploy as usual - the frontend will be available at your domain root

## 📝 Next Steps

- [ ] Configure VM endpoint URL
- [ ] Test locally
- [ ] Deploy to Render/production
- [ ] Test from production to VM
- [ ] Monitor logs for errors

## 🆘 Need Help?

Check the console logs in both:
- Browser Developer Tools (F12)
- Server terminal output
