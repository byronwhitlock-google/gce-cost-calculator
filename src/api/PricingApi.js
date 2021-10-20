
import { array } from "prop-types"
import BaseApi from "./BaseApi.js"

class PricingApi extends BaseApi {

    // default api key
    apiKey = 'AIzaSyDVWa131rNBwaTJ29-Of1YfKBHAHwyiW18'

    //
    // SKU for Compute engine is 6F81-5844-456A
    // https://cloud.google.com/skus/?currency=USD&hl=en
    computeEngineSku = '6F81-5844-456A'

    /**
     * @param filter {{region:string, type:string} filter}
     */
    async GetInstancePricing(filter) {
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

        const proxyUrl = 'https://cors-anywhere.herokuapp.com/'
        const apiUrl = 'https://cloudpricingcalculator.appspot.com/static/data/pricelist.json';

        try {
            const response = await fetch(proxyUrl + apiUrl)
            const data = await response.json();
            const [predefined, custom] = await this.filteredData(data);
            localStorage.setItem('predefined', JSON.stringify(predefined));
            localStorage.setItem('custom', custom);
            //console.log("predefined", predefined);
        } catch (error) {
            console.log(error);
        }

        while (pricing.nextPageToken || ++timeout > 5) {
            pricing = await this.get(`${url}&pageToken=${pricing.nextPageToken}`)
            //console.log(pricing)

            for (let i = 0; i < pricing.skus.length; i++) { // for loop in java script is almost fastest way to iterate
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
        for (let i = 0; i < allSkus.length; i++) { // for loop in java script is almost fastest way to iterate
            let sku = allSkus[i]
            let push = false
            // always filter on 
            //"category.resourceFamily": "Compute",
            //"category.usageType": "OnDemand"
            if (sku.category.resourceFamily == "Compute" && sku.category.usageType == "OnDemand") {
                push = true
            }
            /*
                        if (sku.category.resourceGroup == "CPU" || 
                            sku.category.resourceGroup == "RAM"|| 
                            sku.category.resourceGroup == "GPU" ||
                            sku.category.resourceGroup == "PdSnapshotEgress" )  {
                            push=false
                        }*/

            if (filter && filter.region) {
                if (!sku.serviceRegions.includes(filter.region)) {
                    push = false

                }
            }
            if (push) {
                filteredSkus.push(sku)
            }
        }
        console.log(`Returned ${filteredSkus.length} skus`)
        //console.log(filteredSkus['category'])
        return filteredSkus

    }

    async filteredData(data) {
        let predefined = []
        let custom = []
        
        /*
       {
        "us": 5.3244,
        "us-central1": 5.3244,
        "us-east1": 5.3244,
        "us-east4": 0,
        "us-west4": 0,
        "us-west1": 5.3244,
        "us-west2": 5.7751,
        "us-west3": 5.7751,
        "europe": 5.8255,
        "europe-west1": 5.8255,
        "europe-west2": 0,
        "europe-west3": 6.1746,
        "europe-central2": 6.1746,
        "europe-west4": 0,
        "europe-west6": 0,
        "europe-north1": 0,
        "northamerica-northeast1": 5.2929,
        "northamerica-northeast2": 5.2929,
        "asia": 0,
        "asia-east": 0,
        "asia-east1": 0,
        "asia-east2": 0,
        "asia-northeast": 6.6726,
        "asia-northeast1": 6.6726,
        "asia-northeast2": 6.6726,
        "asia-northeast3": 6.6726,
        "asia-southeast": 5.9232,
        "asia-southeast1": 5.9232,
        "australia-southeast1": 6.8135,
        "australia-southeast2": 6.8135,
        "australia": 6.8135,
        "southamerica-east1": 7.6369,
        "southamerica-west1": 7.613892,
        "asia-south1": 0,
        "asia-south2": 0,
        "cores": "160",
        "memory": "3844",
        "gceu": 440,
        "maxNumberOfPd": 16,
        "maxPdSize": 64,
        "ssd": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8
        ],
        "asia-southeast2": 6.456288
    }
    */

        //data.gcp_price_list
        //CP-COMPUTEENGINE-VMIMAGE predifined machines
        //CP-COMPUTEENGINE-CUSTOM-VM custom machines
        //CP-COMPUTEENGINE-PREDEFINED 
        for(let key in data.gcp_price_list){
            if(data.gcp_price_list.hasOwnProperty(key)){
                //console.log(key, data.gcp_price_list[key]);
                if(key.includes("CP-COMPUTEENGINE-VMIMAGE")){
                    predefined.push( { machine:key, price:data.gcp_price_list[key]})
                }
                if(key.includes("CP-COMPUTEENGINE-CUSTOM-VM")){
                    custom.push({machine: key, price:data.gcp_price_list[key]})
                }
            }
        }
        return [predefined, custom];
    }
}

export default PricingApi