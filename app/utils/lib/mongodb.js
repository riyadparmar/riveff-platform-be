/* eslint-disable new-cap */
const mongoose = require('mongoose');

class MongoClient {
    constructor() {
        this.options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            connectTimeoutMS: 30000, 
            socketTimeoutMS: 30000,
        };
    }

    async initialize() {
        mongoose
            .connect(process.env.MONGODB_URI)
            .then(() => log.yellow('Database connected'))
            .catch(error => {
                throw error;
            });
    }

    mongify(id) {
        return new mongoose.Types.ObjectId(id);
    }
}

module.exports = new MongoClient();
