const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static('public'));
const dotenv = require('dotenv');
dotenv.config();

localhost = 'http://localhost';


// Some orders for testing and making render woeking before deployment.

// A simple in-memory queue for testing
let orders = [
    { id: "866289388", status: "PENDING", price: null },
    { id: "866254978", status: "PENDING", price: null },
    { id: "866290058", status: "PENDING", price: null },
    { id: "866290063", status: "PENDING", price: null },
    { id: "866284067", status: "DONE", price: null },
    { id: "866201274", status: "DONE", price: null },
    { id: "866289930", status: "PENDING", price: null },
    { id: "866289917", status: "PENDING", price: null },
    { id: "866254995", status: "PENDING", price: null },
    { id: "866289935", status: "PENDING", price: null },
    { id: "866289947", status: "PENDING", price: null },
    { id: "866254996", status: "PENDING", price: null },
    { id: "866289830", status: "PENDING", price: null },
    { id: "866290044", status: "PENDING", price: null },
    { id: "866289933", status: "DONE", price: null },
    { id: "866289910", status: "PENDING", price: null },
    { id: "866289832", status: "PENDING", price: null },
    { id: "898549777", status: "DONE", price: null },
    { id: "866201768", status: "PENDING", price: null }
];

// Queue for SAP synchronization tasks
let sapSyncQueue = [];

// Log array to store all RPA results
let resultsLog = [];

// RPA calls this to see if there is work
app.get('/rpa/task', (req, res) => {
    const tasks = orders.filter(o => o.status === "PENDING");
    tasks.length > 0 ? res.json(tasks) : res.status(404).send("No tasks");
});

// RPA calls this to send the price back
app.post('/rpa/result', (req, res) => {
    
    const results = Array.isArray(req.body) ? req.body : [req.body];
    results.forEach(({ id, price ,status}) => {
        const order = orders.find(o => o.id === id);
        if (order) {
            order.price = price;
            order.status = status === 'success' ? "COMPLETED" : "FAILED";
            console.log(`✅ Order ${id} updated with price: ${price}`);
        }
        
        // Log the result with timestamp
        resultsLog.push({
            id,
            price,
            status,
            timestamp: new Date().toISOString(),
            fullData: req.body
        });
    });
    res.json({ success: true });
});

// Endpoint to get all logged results
app.get('/rpa/results-log', (req, res) => {
    res.json(resultsLog);
});

// Frontend triggers this endpoint to queue SAP sync tasks
app.post('/trigger-sync', (req, res) => {
    try {
        // Take 6 PENDING orders and transform them to SAP sync format
        const pendingOrders = orders.filter(o => o.status === "PENDING").slice(0, 6);
        
        const tasks = pendingOrders.map(order => ({
            id: order.id,
            synchronize: true,
            transportadora: "TRANSPORTADORA_" + order.id.slice(-3),
            modal: "MODAL_" + order.id.slice(-2),
            frete: (Math.random() * 1000 + 500).toFixed(2),
            planejamento: "PLAN_" + order.id.slice(-4),
            status: "PENDING_SYNC"
        }));

        // Add tasks to the queue
        sapSyncQueue.push(...tasks);

        console.log(`✅ Queued ${tasks.length} orders for SAP sync. Total in queue: ${sapSyncQueue.length}`);
        console.log('📦 Queued Data:', JSON.stringify(tasks, null, 2));

        res.json({ 
            success: true, 
            message: `Queued ${tasks.length} orders for SAP synchronization`,
            ordersQueued: tasks.length,
            totalInQueue: sapSyncQueue.length,
            tasks: tasks
        });
    } catch (error) {
        console.error("❌ Error queueing sync tasks:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to queue synchronization tasks", 
            error: error.message 
        });
    }
});

// VM calls this to get SAP sync tasks (similar to /rpa/task)
// Supporting both endpoint names for compatibility
app.get(['/rpa/sap-sync', '/rpa-synchronize-sap'], (req, res) => {
    if (sapSyncQueue.length > 0) {
        console.log(`📤 VM requesting SAP sync tasks: Sending ${sapSyncQueue.length} tasks`);
        const tasks = [...sapSyncQueue];
        res.json(tasks);
    } else {
        console.log(`📭 VM requesting SAP sync tasks: Queue is empty`);
        res.status(404).json({ message: "No SAP sync tasks available" });
    }
});

// VM calls this to send SAP sync results back
app.post('/rpa/sap-result', (req, res) => {
    const results = Array.isArray(req.body) ? req.body : [req.body];
    
    results.forEach(({ id, status, error }) => {
        // Remove completed task from queue
        const index = sapSyncQueue.findIndex(task => task.id === id);
        if (index !== -1) {
            sapSyncQueue.splice(index, 1);
            console.log(`✅ SAP Sync completed for order ${id}: ${status}${error ? ' - ' + error : ''}`);
        }
        
        // Update the order in main orders array if needed
        const order = orders.find(o => o.id === id);
        if (order) {
            order.status = status === 'success' ? 'SAP_SYNCED' : 'SAP_FAILED';
        }
    });
    
    console.log(`📥 SAP Sync results received. Remaining in queue: ${sapSyncQueue.length}`);
    res.json({ success: true, remainingInQueue: sapSyncQueue.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bridge Server live on port ${localhost}:${PORT}`));

// To activate the server again last test