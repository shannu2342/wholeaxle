const axios = require('axios');

const normalizeBaseUrl = (url) => String(url || 'https://track.delhivery.com').replace(/\/+$/, '');

const getConfig = () => {
    const timeout = parseInt(process.env.DELHIVERY_TIMEOUT_MS || '15000', 10);
    const requestFormat = (process.env.DELHIVERY_REQUEST_FORMAT || 'form').toLowerCase();

    return {
        token: process.env.DELHIVERY_API_TOKEN || process.env.LOGISTICS_API_KEY || '',
        baseUrl: normalizeBaseUrl(process.env.DELHIVERY_BASE_URL),
        timeout: Number.isFinite(timeout) && timeout > 0 ? timeout : 15000,
        authHeader: process.env.DELHIVERY_AUTH_HEADER || 'Authorization',
        authPrefix: process.env.DELHIVERY_AUTH_PREFIX || 'Token',
        requestFormat: requestFormat === 'json' ? 'json' : 'form',
        createShipmentPath: process.env.DELHIVERY_CREATE_SHIPMENT_PATH || '/api/cmu/create.json',
        pickupPath: process.env.DELHIVERY_PICKUP_REQUEST_PATH || '/fm/request/new/',
        trackingPath: process.env.DELHIVERY_TRACKING_PATH || '/api/v1/packages/json/',
        waybillPath: process.env.DELHIVERY_WAYBILL_PATH || '/waybill/api/bulk/json/',
        serviceabilityPath: process.env.DELHIVERY_SERVICEABILITY_PATH || '/c/api/pin-codes/json/',
    };
};

const getPublicConfig = () => {
    const cfg = getConfig();
    return {
        configured: Boolean(cfg.token),
        baseUrl: cfg.baseUrl,
        timeout: cfg.timeout,
        requestFormat: cfg.requestFormat,
        createShipmentPath: cfg.createShipmentPath,
        pickupPath: cfg.pickupPath,
        trackingPath: cfg.trackingPath,
        waybillPath: cfg.waybillPath,
        serviceabilityPath: cfg.serviceabilityPath,
    };
};

const isConfigured = () => Boolean(getConfig().token);

const buildClient = () => {
    const cfg = getConfig();
    const headers = {
        Accept: 'application/json',
        'User-Agent': 'wholexale-backend/1.0',
    };

    if (cfg.token) {
        headers[cfg.authHeader] = `${cfg.authPrefix} ${cfg.token}`;
    }

    return axios.create({
        baseURL: cfg.baseUrl,
        timeout: cfg.timeout,
        headers,
    });
};

const providerError = (error, action) => {
    const statusCode = error?.response?.status || 502;
    const providerData = error?.response?.data || null;
    const message = providerData?.error || providerData?.message || error?.message || 'Delhivery request failed';

    const wrapped = new Error(message);
    wrapped.statusCode = statusCode;
    wrapped.provider = 'delhivery';
    wrapped.action = action;
    wrapped.providerData = providerData;
    return wrapped;
};

const postByFormat = async (client, path, payload, action) => {
    const cfg = getConfig();

    try {
        if (cfg.requestFormat === 'form') {
            const body = new URLSearchParams();
            body.set('format', 'json');
            body.set('data', typeof payload === 'string' ? payload : JSON.stringify(payload));

            const response = await client.post(path, body.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return response.data;
        }

        const response = await client.post(path, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        throw providerError(error, action);
    }
};

const allocateWaybills = async (count = 1) => {
    const client = buildClient();
    const cfg = getConfig();

    try {
        const response = await client.get(cfg.waybillPath, {
            params: { count: String(count) },
        });
        return response.data;
    } catch (error) {
        throw providerError(error, 'allocate_waybills');
    }
};

const createShipment = async (shipmentPayload) => {
    const client = buildClient();
    const cfg = getConfig();
    return postByFormat(client, cfg.createShipmentPath, shipmentPayload, 'create_shipment');
};

const createPickupRequest = async (pickupPayload) => {
    const client = buildClient();
    const cfg = getConfig();
    return postByFormat(client, cfg.pickupPath, pickupPayload, 'create_pickup');
};

const trackShipment = async ({ waybill, ref }) => {
    const client = buildClient();
    const cfg = getConfig();

    if (!waybill && !ref) {
        const err = new Error('Either waybill or ref is required for tracking');
        err.statusCode = 400;
        throw err;
    }

    try {
        const response = await client.get(cfg.trackingPath, {
            params: {
                ...(waybill ? { waybill } : {}),
                ...(ref ? { ref_ids: ref } : {}),
            },
        });
        return response.data;
    } catch (error) {
        throw providerError(error, 'track_shipment');
    }
};

const checkServiceability = async ({ pincode, weight, cod }) => {
    const client = buildClient();
    const cfg = getConfig();

    if (!pincode) {
        const err = new Error('pincode is required');
        err.statusCode = 400;
        throw err;
    }

    try {
        const response = await client.get(cfg.serviceabilityPath, {
            params: {
                filter_codes: pincode,
                ...(weight ? { weight } : {}),
                ...(cod !== undefined ? { cod } : {}),
            },
        });
        return response.data;
    } catch (error) {
        throw providerError(error, 'check_serviceability');
    }
};

const extractWaybill = (data) => {
    if (!data) return null;

    if (typeof data === 'string') {
        const parts = data.split(',').map((v) => v.trim()).filter(Boolean);
        return parts[0] || null;
    }

    if (Array.isArray(data)) {
        return extractWaybill(data[0]);
    }

    if (data.waybill) return String(data.waybill);
    if (data.awb) return String(data.awb);

    if (Array.isArray(data.waybills) && data.waybills.length > 0) {
        return extractWaybill(data.waybills[0]);
    }

    if (Array.isArray(data.packages) && data.packages.length > 0) {
        return extractWaybill(data.packages[0]);
    }

    if (data.data) return extractWaybill(data.data);
    if (data.response) return extractWaybill(data.response);

    return null;
};

const ensureConfiguredOrThrow = () => {
    if (!isConfigured()) {
        const error = new Error('Delhivery API is not configured');
        error.statusCode = 503;
        error.provider = 'delhivery';
        throw error;
    }
};

module.exports = {
    getConfig,
    getPublicConfig,
    isConfigured,
    ensureConfiguredOrThrow,
    allocateWaybills,
    createShipment,
    createPickupRequest,
    trackShipment,
    checkServiceability,
    extractWaybill,
};
