
import BaseApi from "./BaseApi.js"

class PricingApi extends BaseApi {
    
    // default api key
    apiKey =  'AIzaSyDVWa131rNBwaTJ29-Of1YfKBHAHwyiW18'

    //
    // SKU for Compute engine is 6F81-5844-456A
    // https://cloud.google.com/skus/?currency=USD&hl=en
    computeEngineSku = '6F81-5844-456A'


    async GetInstancePricing()
    {
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

export default PricingApi