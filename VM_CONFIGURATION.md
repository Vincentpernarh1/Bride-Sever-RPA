# VM Configuration Guide - Pull-Based Architecture

## 🔄 Architecture Overview

**OLD (Doesn't Work):**
```
Render Server (public) → VM (private IP 10.46.161.166) ❌
```

**NEW (Works!):**
```
Button Click → Queue Tasks → VM Pulls Tasks → VM Processes → VM Sends Results ✅
```

## 📡 How It Works

1. **User clicks button** → Orders are queued on the server
2. **VM polls** `/rpa/sap-sync` endpoint (like it already does with `/rpa/task`)
3. **VM receives tasks** and processes them
4. **VM sends results** back to `/rpa/sap-result`

## 🔧 VM Configuration

### Your VM Python Script Should Call:

#### 1. Get SAP Sync Tasks
```python
import requests

# Your Render server URL (or localhost for testing)
SERVER_URL = "https://your-render-app.onrender.com"  # or "http://localhost:3000" for local testing

def get_sap_sync_tasks():
    try:
        response = requests.get(f"{SERVER_URL}/rpa/sap-sync")
        if response.status_code == 200:
            tasks = response.json()
            print(f"📥 Received {len(tasks)} SAP sync tasks")
            return tasks
        elif response.status_code == 404:
            print("📭 No SAP sync tasks available")
            return []
        else:
            print(f"❌ Error: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return []
```

#### 2. Send Results Back
```python
def send_sap_results(results):
    """
    results = [
        {
            "id": "866289388",
            "status": "success",  # or "failed"
            "error": None  # or error message if failed
        },
        ...
    ]
    """
    try:
        response = requests.post(
            f"{SERVER_URL}/rpa/sap-result",
            json=results,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            print(f"✅ Results sent successfully")
            return True
        else:
            print(f"❌ Error sending results: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error sending results: {e}")
        return False
```

#### 3. Main Loop (Similar to your existing RPA)
```python
import time

def main():
    while True:
        # Get SAP sync tasks
        tasks = get_sap_sync_tasks()
        
        if tasks:
            results = []
            for task in tasks:
                print(f"🔄 Processing order {task['id']}")
                try:
                    # YOUR SAP SYNC LOGIC HERE
                    # Example: sync_to_sap(task)
                    
                    results.append({
                        "id": task['id'],
                        "status": "success",
                        "error": None
                    })
                    print(f"✅ Order {task['id']} synced successfully")
                except Exception as e:
                    results.append({
                        "id": task['id'],
                        "status": "failed",
                        "error": str(e)
                    })
                    print(f"❌ Order {task['id']} failed: {e}")
            
            # Send results back
            send_sap_results(results)
        
        # Wait before checking again (adjust as needed)
        time.sleep(30)  # Check every 30 seconds

if __name__ == "__main__":
    main()
```

## 🌐 Server URLs

### Local Testing:
```python
SERVER_URL = "http://localhost:3000"
```

### Production (Render):
```python
SERVER_URL = "https://your-app-name.onrender.com"
```

## 📋 API Endpoints Summary

| Endpoint | Method | Called By | Purpose |
|----------|--------|-----------|---------|
| `/trigger-sync` | POST | Frontend | Queue 6 orders for SAP sync |
| `/rpa/sap-sync` | GET | VM | VM pulls tasks from queue |
| `/rpa/sap-result` | POST | VM | VM sends sync results |
| `/rpa/task` | GET | VM | Existing: VM gets price tasks |
| `/rpa/result` | POST | VM | Existing: VM sends price results |

## 🧪 Testing

### 1. Test Locally First:

**Terminal 1 - Start your server:**
```bash
node server.js
```

**Terminal 2 - Test queue creation:**
```bash
# Open http://localhost:3000 in browser and click button
# OR use curl:
curl -X POST http://localhost:3000/trigger-sync
```

**Terminal 3 - Test VM pulling tasks:**
```bash
curl http://localhost:3000/rpa/sap-sync
```

**Expected Response:**
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

**Terminal 3 - Test sending results:**
```bash
curl -X POST http://localhost:3000/rpa/sap-result \
  -H "Content-Type: application/json" \
  -d '[{"id":"866289388","status":"success","error":null}]'
```

### 2. Deploy to Render

1. Push your code to GitHub
2. Render will auto-deploy
3. Update your VM script to use Render URL
4. Test the flow

## ✅ Advantages of This Approach

1. ✅ **Works with private IPs** - VM initiates connection
2. ✅ **No firewall issues** - VM reaches public internet
3. ✅ **Same pattern** as existing `/rpa/task` flow
4. ✅ **Works from Render** - No network restrictions
5. ✅ **Reliable** - VM controls timing and retries

## 🔍 Troubleshooting

### Issue: VM can't reach server
**Solution:** Check SERVER_URL is correct and accessible

### Issue: No tasks returned
**Solution:** Click the button in the frontend first to queue tasks

### Issue: Tasks stuck in queue
**Solution:** Check VM is running and calling `/rpa/sap-sync` regularly

## 📊 Monitoring

Watch your server logs to see:
- ✅ Tasks queued
- 📤 VM requesting tasks
- 📥 VM sending results
- 📊 Queue size

```bash
node server.js
# You'll see:
# ✅ Queued 6 orders for SAP sync. Total in queue: 6
# 📤 VM requesting SAP sync tasks: Sending 6 tasks
# 📥 SAP Sync results received. Remaining in queue: 0
```
