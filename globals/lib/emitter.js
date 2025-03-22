const events = require('events');

const emitter = new events.EventEmitter();

emitter.asyncEmit = async (channel, data) => new Promise(resolve => emitter.emit(channel, data, resolve)); // eslint-disable-line no-promise-executor-return

module.exports = emitter;
