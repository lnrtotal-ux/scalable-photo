// API Configuration for PhotoShare

// Development environment
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.API_CONFIG = {
        baseUrl: 'http://localhost:3000/api'
    };
}
// Production environment on Azure
else {
    window.API_CONFIG = {
        baseUrl: '/api'  // Relative path - works with App Service
    };
}

export default window.API_CONFIG;
