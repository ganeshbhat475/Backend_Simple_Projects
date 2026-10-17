const axios = require('axios')
const logUpstreamError = require('./log-upstream-error')

const geocode = async (address, callback) => {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY
    if (!apiKey) {
        callback('Weather service is not configured. Please contact the site administrator.', undefined, 503)
        return
    }

    let response
    try {
        response = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
            params: {
                q: address.trim(),
                limit: 1,
                appid: apiKey
            },
            timeout: 10000
        })
    } catch (error) {
        logUpstreamError('OpenWeatherMap geocoding', error)
        if (error.code === 'ECONNABORTED') {
            callback('Location service timed out. Please try again.', undefined, 504)
        } else if (error.response && error.response.status === 401) {
            callback(
                'OpenWeatherMap rejected the API key. Verify that it is correct and active; newly created keys may take up to 2 hours to activate.',
                undefined,
                503
            )
        } else if (error.response && error.response.status === 403) {
            callback('OpenWeatherMap denied access to the geocoding API. Check your account access.', undefined, 503)
        } else if (error.response) {
            const statusCode = error.response.status === 429 || error.response.status >= 500 ? 503 : 502
            callback('Location service returned an error. Please try again.', undefined, statusCode)
        } else {
            callback('Unable to connect to location services!', undefined, 503)
        }
        return
    }

    const place = Array.isArray(response.data) && response.data[0]
    if (!place) {
        callback('Unable to find location. Try another search.', undefined, 404)
        return
    }

    if (
        !Number.isFinite(place.lat) ||
        !Number.isFinite(place.lon) ||
        typeof place.name !== 'string'
    ) {
        callback('Location service returned an invalid response.', undefined, 502)
        return
    }

    const location = [place.name, place.state, place.country]
        .filter((part, index, parts) => part && parts.indexOf(part) === index)
        .join(', ')

    callback(undefined, {
        latitude: place.lat,
        longitude: place.lon,
        location
    })
}

module.exports = geocode
