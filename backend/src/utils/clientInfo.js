
export const parseClientInfo = (req) => {
    const userAgent = req.get('User-Agent') || '';
    const customSource = req.get('X-Client-Source') || ''; // Allow frontend to explicitly set it
    const uaLower = userAgent.toLowerCase();

    let clientOS = 'Unknown OS';
    let deviceType = 'Desktop';
    let clientType = 'Web Browser';
    let browserName = 'None';
    let eventSource = 'WEB';

    // 1. Determine OS
    if (uaLower.includes('android')) {
        clientOS = 'Android';
        deviceType = 'Mobile';
    } else if (uaLower.includes('iphone') || uaLower.includes('ipod')) {
        clientOS = 'iOS';
        deviceType = 'Mobile';
    } else if (uaLower.includes('ipad')) {
        clientOS = 'iOS';
        deviceType = 'Tablet';
    } else if (uaLower.includes('windows')) {
        clientOS = 'Windows';
        deviceType = 'Desktop';
    } else if (uaLower.includes('macintosh') || uaLower.includes('mac os x')) {
        clientOS = 'macOS';
        deviceType = 'Desktop';
    } else if (uaLower.includes('linux')) {
        clientOS = 'Linux';
        deviceType = 'Desktop';
    }

    // 2. Determine Client & Event Source
    if (customSource) {
        const srcUpper = customSource.toUpperCase();
        if (srcUpper.includes('ANDROID')) {
            clientOS = 'Android';
            deviceType = 'Mobile';
            clientType = 'Android App';
            eventSource = 'MOBILE_APP';
        } else if (srcUpper.includes('IOS')) {
            clientOS = 'iOS';
            deviceType = 'Mobile';
            clientType = 'iOS App';
            eventSource = 'MOBILE_APP';
        } else {
            clientType = customSource;
            eventSource = srcUpper;
        }
    } else if (uaLower.includes('postman') || uaLower.includes('curl') || uaLower.includes('axios')) {
        clientType = 'API Client';
        deviceType = 'Desktop';
        eventSource = 'API';
        if (uaLower.includes('postman')) clientOS = 'Postman';
    } else if (uaLower.includes('dart') || uaLower.includes('flutter')) {
        eventSource = 'MOBILE_APP';
        if (clientOS === 'Android') {
            clientType = 'Android App';
            deviceType = 'Mobile';
        } else if (clientOS === 'iOS') {
            clientType = 'iOS App';
            deviceType = 'Mobile';
        } else {
            clientType = 'Mobile App';
            deviceType = 'Mobile';
        }
    } else {
        // Standard Web Browser classification
        eventSource = 'WEB';
        if (uaLower.includes('edg/')) {
            browserName = 'Edge';
            clientType = 'Web Browser (Edge)';
        } else if (uaLower.includes('chrome/') && !uaLower.includes('chromium')) {
            browserName = 'Chrome';
            clientType = 'Web Browser (Chrome)';
        } else if (uaLower.includes('firefox/')) {
            browserName = 'Firefox';
            clientType = 'Web Browser (Firefox)';
        } else if (uaLower.includes('safari/') && !uaLower.includes('chrome')) {
            browserName = 'Safari';
            clientType = 'Web Browser (Safari)';
        } else {
            clientType = 'Web Browser';
        }
    }

    return {
        client_os: clientOS,
        client_type: clientType,
        device_type: deviceType,
        browser_name: browserName,
        event_source: eventSource
    };
};

export const getEventSource = (req) => {
    return parseClientInfo(req).event_source;
};

