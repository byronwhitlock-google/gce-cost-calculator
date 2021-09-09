
import { array } from "prop-types"
import BaseApi from "./BaseApi.js"

class PricingApi extends BaseApi {
    
    // default api key
    apiKey =  'AIzaSyDVWa131rNBwaTJ29-Of1YfKBHAHwyiW18'

    //
    // SKU for Compute engine is 6F81-5844-456A
    // https://cloud.google.com/skus/?currency=USD&hl=en
    computeEngineSku = '6F81-5844-456A'
    
    /**
     * @param filter {{region:string, type:string} filter}
     */
    async GetInstancePricing(filter)
    {
        if (!this.apiKey) {
            throw new Error("Missing API Key")
        }
        if (!this.computeEngineSku) {
            throw new Error("Missing Compute Engine Sku")
        }

        // TODO: fetch multiple pages

        // TODO: apply filter 
        let url = `https://cloudbilling.googleapis.com/v1/services/${this.computeEngineSku}/skus/?key=${this.apiKey}`
        let pricing = await this.get(url)
        console.log(pricing)
        let allSkus = pricing.skus
        var timeout = 0

        while(pricing.nextPageToken || ++timeout > 5)
        {             
            pricing = await this.get(`${url}&pageToken=${pricing.nextPageToken}`)
            console.log(pricing)
            for (var sku in pricing.skus) {
                allSkus.push(sku)
            }
        }

        // todo add filtering (iterate pricing)

        console.log(`Returned ${allSkus.length} skus`)
        return allSkus
    }
}

export default PricingApi