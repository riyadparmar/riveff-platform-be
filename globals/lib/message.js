const customMessages = {
    custom_message: { code: 200, message: 'custom message' },
};
/**
 * Push notification messages
 */
const notifications = {};

const builder = {
    server_error: prefix => builder.prepare(500, prefix, 'server error'),
};

Object.defineProperty(builder, 'prepare', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: (code, prefix, message) => {
        const str = prefix ? `${prefix} ${message}` : message;
        return {
            code,
            message: str.charAt(0).toUpperCase() + str.slice(1),
        };
    },
});

module.exports = builder;
