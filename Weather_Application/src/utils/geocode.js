const axios = require('axios')

const geocode = async (address, callback) => {
    let response
    try {
        response = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
            params: {
                name: address.trim(),
                count: 1,
                language: 'en',
                format: 'json'
            },
            timeout: 10000
        })
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            callback('Location service timed out. Please try again.', undefined, 504)
        } else if (error.response) {
            callback('Location service returned an error. Please try again.', undefined, 502)
        } else {
            callback('Unable to connect to location services!', undefined, 503)
        }
        return
    }

    const place = response.data && Array.isArray(response.data.results) && response.data.results[0]
    if (!place) {
        callback('Unable to find location. Try another search.', undefined, 404)
        return
    }

    if (
        !Number.isFinite(place.latitude) ||
        !Number.isFinite(place.longitude) ||
        typeof place.name !== 'string'
    ) {
        callback('Location service returned an invalid response.', undefined, 502)
        return
    }

    const location = [place.name, place.admin1, place.country]
        .filter((part, index, parts) => part && parts.indexOf(part) === index)
        .join(', ')

    callback(undefined, {
        latitude: place.latitude,
        longitude: place.longitude,
        location
    })
}

module.exports = geocode
