// API Configuration for PhotoShare

// Development environment
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.API_CONFIG = {
        baseUrl: 'http://localhost:3000/api'
    };
}
// Production: Blob static site must call the App Service API via absolute URL
else {
    window.API_CONFIG = {
        baseUrl: 'https://scalable-photo-app.azurewebsites.net/api'
    };
}

export default window.API_CONFIG;
