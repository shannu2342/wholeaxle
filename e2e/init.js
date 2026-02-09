const detox = require('detox');
const config = require('../e2e/config.json');

jest.setTimeout(300000);

beforeAll(async () => {
    await detox.init(config);
});

beforeEach(async () => {
    await device.reloadReactNative();
});

afterAll(async () => {
    await detox.cleanup();
});