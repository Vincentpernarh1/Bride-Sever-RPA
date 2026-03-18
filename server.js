const express = require('express');
const app = express();
app.use(express.json());

// A simple in-memory queue for testing
let orders = [
    { id: "866289388", status: "PENDING", price: null },
    { id: "866254978", status: "PENDING", price: null },
    { id: "866290058", status: "PENDING", price: null },
    { id: "866290063", status: "PENDING", price: null },
    { id: "866284067", status: "PENDING", price: null },
    { id: "866201274", status: "PENDING", price: null },
    { id: "866289930", status: "PENDING", price: null },
    { id: "866289917", status: "PENDING", price: null },
    { id: "866254995", status: "PENDING", price: null },
    { id: "866289935", status: "PENDING", price: null },
    { id: "866289947", status: "PENDING", price: null },
    { id: "866254996", status: "PENDING", price: null },
    { id: "866289830", status: "PENDING", price: null },
    { id: "866290044", status: "PENDING", price: null },
    { id: "866289933", status: "PENDING", price: null },
    { id: "866289910", status: "PENDING", price: null },
    { id: "866289832", status: "PENDING", price: null },
    { id: "898549777", status: "PENDING", price: null },
    { id: "866201768", status: "PENDING", price: null }
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