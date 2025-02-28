const mongoose = require('mongoose');
const { uploadOrder } = require('./MongoDBMaster');

const testOrder = {
    date: new Date(),
    totalPrice: 4,
    items: [
        { 
            itemId: new mongoose.Types.ObjectId('67b62d3b1d1cb121960a8863'),
            name: 'Coke', 
            category: 'Drink',
            quantity: 2, 
            price: 2 
        }
    ]
};

uploadOrder(testOrder.date, testOrder.totalPrice, testOrder.items)
    .then(() => console.log('Test order uploaded successfully'))
    .catch(err => console.error('Error uploading test order:', err));