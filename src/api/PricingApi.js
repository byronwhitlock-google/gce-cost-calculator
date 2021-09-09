
import BaseApi from "./BaseApi.js"

class PricingApi extends BaseApi {

    // default api key
    apiKey = 'AIzaSyDVWa131rNBwaTJ29-Of1YfKBHAHwyiW18'

    //
    // SKU for Compute engine is 6F81-5844-456A
    // https://cloud.google.com/skus/?currency=USD&hl=en
    computeEngineSku = '6F81-5844-456A'


    async GetInstancePricing() {
        if (!this.apiKey) {
            throw new Error("Missing API Key")
        }
        if (!this.computeEngineSku) {
            throw new Error("Missing Compute Engine Sku")
        }

        let url = `https://cloudbilling.googleapis.com/v1/services/${this.computeEngineSku}/skus/?key=${this.apiKey}`
        let pricing = await this.fetch(url)

        console.log(pricing)
        return pricing.skus
    }
}

// `https://cloudbilling.googleapis.com/v1/services/6F81-5844-456A/skus/?key=AIzaSyDVWa131rNBwaTJ29-Of1YfKBHAHwyiW18&pageToken=AD4oVHCRKVsf0Njdw16USpH8oZN8CEYQcWDPTuqwydtlSbmV6dml2_HFQA8v4JsF8JJoASWiKTpdRxRrowVKOAUTqVZoCH8pZtsT5rOYdsSgEtBP68NCJxU=`
const apiKey = 'AIzaSyDVWa131rNBwaTJ29-Of1YfKBHAHwyiW18'
const computeEngineSku = '6F81-5844-456A'
const urlFormated = `https://cloudbilling.googleapis.com/v1/services/${computeEngineSku}/skus/?key=${apiKey}`

function getSkus(progress, url = urlFormated, skus = []) {
    return new Promise((resolve, reject) => fetch(url)
        .then(response => {
            if (response.status !== 200) {
                throw `${response.status}: ${response.statusText}`;
            }
            response.json().then(data => {
                skus = skus.concat(data.skus);

                if (data.nextPageToken !== '') {
                    progress && progress(skus);
                    let tokenUrl = urlFormated+`&pageToken=${data.nextPageToken}` 
                    console.log("token url ::", tokenUrl)
                    getSkus(progress, tokenUrl, skus).then(resolve).catch(reject)
                } else {
                    resolve(skus);
                }
            }).catch(reject);
        }).catch(reject));
}

function progressCallback(skus) {
    // render progress
    console.log(`${skus.length} loaded`);
}

getSkus(progressCallback)
    .then(skus => {
        // all skus have been loaded
        console.log(skus.map(p => p))
    })
    .catch(console.error);

export default PricingApi


//https://cloudbilling.googleapis.com/v1/services/6F81-5844-456A/skus/?key=AIzaSyDVWa131rNBwaTJ29-Of1YfKBHAHwyiW18&pageToken=AD4oVHDosYcfAEXkIKg0n-3jNainPkv6EpK3NcUeKO3uoUtBylPVEdR_mlW1A6we1QzrEIe8GJ3Pi2HmaUeanmxNbq0715eaSG4qV0aT8ZJddYwurGYC5vU=