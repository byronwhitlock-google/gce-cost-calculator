 import { apiURL, apiKey } from '../../../config'

 async function handler(req, res) {
 
    //const response = await fetch('https://cloudbilling.googleapis.com/v1/services/6F81-5844-456A/skus?key=AIzaSyDVWa131rNBwaTJ29-Of1YfKBHAHwyiW18&pageToken=AD4oVHCXlSQGTGWJhxOZyHrkvRj-HjuCkyMOEvT_KefZBhP8NX7vD7CFRNcHoQwcu-4dFRZyfPoh4Q8QnnV-T0qTvVntOjrpl8NxXYneOpPqsdE4Rpc4c4k=')
    const response = await fetch(`${apiURL}/6F81-5844-456A/skus?key=${apiKey}`)
    console.log(`${apiURL}/6F81-5844-456A/skus?key=${apiKey}`)
    const data = await response.json()
    const token = data.nextPageToken
    const filter = [] 
    
    // get the filtered instance
    data.skus.forEach(obj => {
        if(obj.category.resourceGroup == "N1Standard"){
            obj.geoTaxonomy.regions.forEach(region => {
                if(region == "us-central1"){
                    filter.push(obj)
                }
            })
            console.log(obj.geoTaxonomy.regions)
            //filter.push(obj)
        }
    })
    
    res.statusCode = 200
    return res.json(data)
}

export default handler;
