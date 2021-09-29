
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

            for (let i=0;i<pricing.skus.length;i++) { // for loop in java script is almost fastest way to iterate
                allSkus.push(pricing.skus[i])
            }
        }
        /*  SKUs look like this:
            {
                "name": "services/6F81-5844-456A/skus/000F-E31B-1D6F",
                "skuId": "000F-E31B-1D6F",
                "description": "N1 Predefined Instance Ram running in Zurich",
                "category": {
                    "serviceDisplayName": "Compute Engine",
                    "resourceFamily": "Compute",
                    "resourceGroup": "N1Standard",
                    "usageType": "OnDemand"
                },
                "serviceRegions": [
                    "europe-west6"
                ],
                "pricingInfo": [
                    {
                        "summary": "",
                        "pricingExpression": {
                            "usageUnit": "GiBy.h",
                            "usageUnitDescription": "gibibyte hour",
                            "baseUnit": "By.s",
                            "baseUnitDescription": "byte second",
                            "baseUnitConversionFactor": 3865470566400,
                            "displayQuantity": 1,
                            "tieredRates": [
                                {
                                    "startUsageAmount": 0,
                                    "unitPrice": {
                                        "currencyCode": "USD",
                                        "units": "0",
                                        "nanos": 5928000
                                    }
                                }
                            ]
                        },
                        "currencyConversionRate": 1,
                        "effectiveTime": "2021-09-10T08:56:47.271Z"
                    }
                ],
                "serviceProviderName": "Google",
                "geoTaxonomy": {
                    "type": "REGIONAL",
                    "regions": [
                        "europe-west6"
                    ]
                }
            } */
        // apply filter
        
        let filteredSkus = []
        for (let i=0;i<allSkus.length;i++) { // for loop in java script is almost fastest way to iterate
            let sku = allSkus[i]
            let push = false
            // always filter on 
            //"category.resourceFamily": "Compute",
            //"category.usageType": "OnDemand"
            if (sku.category.resourceFamily == "Compute" && sku.category.usageType == "OnDemand")  {
                push=true
            }  
/*
            if (sku.category.resourceGroup == "CPU" || 
                sku.category.resourceGroup == "RAM"|| 
                sku.category.resourceGroup == "GPU" ||
                sku.category.resourceGroup == "PdSnapshotEgress" )  {
                push=false
            }*/
            
            if (filter && filter.region) {
                if (! sku.serviceRegions.includes(filter.region)) {
                    push=false
                    
                }
            } 
            if (push) {
                filteredSkus.push(sku)
            }
        }
        console.log(`Returned ${filteredSkus.length} skus`)
        return filteredSkus
        
    }
}

export default PricingApi