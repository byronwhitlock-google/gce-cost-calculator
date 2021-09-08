 import { apiURL, apiKey } from '../../../config'

 async function handler(req, res) {
 
    var datatest = null
    const response = await fetch(`${apiURL}/6F81-5844-456A/skus?key=${apiKey}`)
        .then((res) => {
            while(res.nextPageToken != ""){
                let skus = nextBatch(res.nextPageToken)
                //datatest = res.skus.concate(skus)
            }
        })
    console.log(datatest)

    //const data = await response.json()


   
    //const filtered = getInstances(data)
    
    res.statusCode = 200
    return res.json(datatest)
}

function getInstances(data){
    const filter = [] 
    
    // get the filtered instance
    data.skus.forEach(obj => {
        // filter by instance type
        if(obj.category.resourceGroup == "N1Standard"){
            obj.geoTaxonomy.regions.forEach(region => {
                // filter by region
                if(region == "us-central1"){
                    filter.push(obj)
                }
            })
        }
    })
}

async function nextBatch(token){
    // if next token
    const nextRes = await fetch(`${apiURL}/6F81-5844-456A/skus?key=${apiKey}&pageToken=${res.nextPageToken}`)
    .then((res) => {
        return res.skus
    })

}

export default handler;
