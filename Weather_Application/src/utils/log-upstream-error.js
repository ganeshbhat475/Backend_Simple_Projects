const logUpstreamError = (service, error) => {
    if (error.response) {
        const responseData = error.response.data
        const details = typeof responseData === 'string'
            ? responseData
            : JSON.stringify(responseData)
        console.error(
            `[${service}] Upstream HTTP ${error.response.status}: ${(details || 'No response details').slice(0, 500)}`
        )
        return
    }

    console.error(`[${service}] Network failure (${error.code || 'unknown'}).`)
}

module.exports = logUpstreamError
