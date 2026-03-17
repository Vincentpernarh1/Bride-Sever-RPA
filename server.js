const express = require('express');
const app = express();
app.use(express.json());

// A simple in-memory queue for testing
let orders = [
    { id: "DHL-TEST-001", status: "PENDING", price: null },
    { id: "DHL-TEST-002", status: "PENDING", price: null },
     { id: "DHL-TEST-003", status: "PENDING", price: null },
      { id: "DHL-TEST-004", status: "PENDING", price: null }
];

// RPA calls this to see if there is work
app.get('/rpa/task', (req, res) => {
    const task = orders.find(o => o.status === "PENDING");
    task ? res.json(task) : res.status(404).send("No tasks");
});

// RPA calls this to send the price back
app.post('/rpa/result', (req, res) => {
    const { id, price } = req.body;
    const order = orders.find(o => o.id === id);
    if (order) {
        order.price = price;
        order.status = "COMPLETED";
        console.log(`✅ Order ${id} updated with price: ${price}`);
        return res.json({ success: true });
    }
    res.status(404).send("Order not found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bridge Server live on port ${PORT}`));