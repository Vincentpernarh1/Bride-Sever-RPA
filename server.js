const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static('public'));
const dotenv = require('dotenv');
dotenv.config();



// Some orders for testing and making render woeking before deployment.

// A simple in-memory queue for testing
let orders = [
    { id: "866289388", status: "PENDING", price: null },
    { id: "866254978", status: "DONE", price: null },
    { id: "866290058", status: "PENDING", price: null },
    { id: "866290063", status: "PENDING", price: null },
    { id: "866284067", status: "PENDING", price: null },
    { id: "866201274", status: "PENDING", price: null },
    { id: "866289930", status: "DONE", price: null },
    { id: "866289917", status: "PENDING", price: null },
    { id: "866254995", status: "DONE", price: null },
    { id: "866289935", status: "DONE", price: null },
    { id: "866289947", status: "PENDING", price: null },
    { id: "866254996", status: "PENDING", price: null },
    { id: "866289830", status: "DONE", price: null },
    { id: "866290044", status: "PENDING", price: null },
    { id: "866289933", status: "PENDING", price: null },
    { id: "866289910", status: "DONE", price: null },
    { id: "866289832", status: "PENDING", price: null },
    { id: "898549777", status: "PENDING", price: null },
    { id: "866201768", status: "PENDING", price: null }
];

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
    });
    res.json({ success: true });
});

// Frontend triggers this endpoint to send SAP sync data to VM
app.post('/trigger-sync', async (req, res) => {
    try {
        // TODO: Configure your VM endpoint URL here
        const VM_ENDPOINT = process.env.VM_ENDPOINT ;

        console.log("VM Endpoint:", VM_ENDPOINT);
        
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

        console.log(`🔄 Trigger SAP Sync: Sending ${tasks.length} orders to VM`);
        console.log('📦 Data:', JSON.stringify(tasks, null, 2));

        // Send data to VM endpoint using fetch (Node.js 18+) or you can use axios
        const response = await fetch(VM_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tasks)
        });

        const responseData = await response.text();
        let parsedData;
        try {
            parsedData = JSON.parse(responseData);
        } catch {
            parsedData = responseData;
        }

        if (response.ok) {
            console.log(`✅ VM responded successfully:`, parsedData);
            res.json({ 
                success: true, 
                message: `Sent ${tasks.length} orders to VM`,
                ordersSent: tasks.length,
                vmResponse: parsedData
            });
        } else {
            console.log(`⚠️ VM responded with error:`, parsedData);
            res.status(response.status).json({ 
                success: false, 
                message: 'VM returned error',
                vmResponse: parsedData 
            });
        }
    } catch (error) {
        console.error("❌ Error triggering sync:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to trigger synchronization", 
            error: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bridge Server live on port ${PORT}`));

// To activate the server again last test