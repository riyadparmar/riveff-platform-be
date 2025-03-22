require('dotenv').config();

require('./globals');

const { mongodb, redis } = require('./app/utils');

const router = require('./app/routers');

(async () => {
    try {
        await mongodb.initialize();
        router.initialize();
        log.blue(':-)');
    } catch (err) {
        log.blue(':-(');
        log.red(`reason: ${err.message}, stack: ${err.stack}`);
        process.exit(1);
    }
})();
