const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://collinsb14:zmuipDsM5b3KZlDd@jakesdata.5o4i2.mongodb.net/MenuItems?retryWrites=true&w=majority&appName=JakesData')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Connection error:', err));

// Define Order Schema
const orderSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    items: [
        {
            itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
            name: { type: String, required: true },
            category: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ]
}, { collection: 'Orders' }); // Specify the collection name

const Order = mongoose.model('Order', orderSchema);

// Function to upload an order
async function uploadOrder(date, totalPrice, items) {
    try {
        const order = new Order({ date, totalPrice, items });
        await order.save();
        console.log('Order uploaded successfully');
    } catch (error) {
        console.error('Error uploading order:', error);
    }
}

module.exports = { uploadOrder };
