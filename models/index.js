/* eslint-disable prettier/prettier */
const User = require('./lib/UserSchema');
const Category = require('./lib/CategorySchema');
const Conversation = require('./lib/ConversationSchema');
const Message = require('./lib/MessageSchema');
const Notification = require('./lib/NotificationSchema');
const Order = require('./lib/OrderSchema');
const Payment = require('./lib/PaymentSchema');
const Service = require('./lib/OrderSchema');

module.exports = {
    User,
    Category,
    Message,
    Payment,
    Conversation,
    Notification,
    Order,
    Service,
};
