 async function handler(req, res) {
 
    const response = await fetch('https://cloudbilling.googleapis.com/v1/services/6F81-5844-456A/skus?key=AIzaSyDVWa131rNBwaTJ29-Of1YfKBHAHwyiW18')
    const data = await response.json()
    const filter = [] 
    /*
    data.skus.forEach(obj => {
        if (obj.serviceRegions == "europe-west6"){
            console.log(obj)
        }
    });
    */

    data.skus.forEach(obj => {
        if(obj.category.resourceGroup == "N1Standard"){
            filter.push(obj)
        }
    })

    res.statusCode = 200
    return res.json(filter)
}

export default handler;
