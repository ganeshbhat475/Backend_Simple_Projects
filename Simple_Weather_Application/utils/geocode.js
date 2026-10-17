const geocode = (address, callback) => {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
    url.searchParams.set('name', address.trim())
    url.searchParams.set('count', '1')
    url.searchParams.set('language', 'en')
    url.searchParams.set('format', 'json')

    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Location service returned HTTP ${response.status}`)
            }
            return response.json()
        })
        .then((body) => {
            const place = body && Array.isArray(body.results) && body.results[0]
            if (!place) {
                callback('Unable to find location. Try another search.', undefined)
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
        }, () => {
            callback('Unable to connect to location services!', undefined)
        })
}

module.exports = geocode