const express = require('express');
const app = express();
app.use(express.json());



// Some orders for testing and making render woeking before deployment.

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bridge Server live on port ${PORT}`));

// To activate the server again last test