
export default async(req, res) => {
    //const response = await fetch('https://cloudbilling.googleapis.com/v1/services?key=AIzaSyDVWa131rNBwaTJ29-Of1YfKBHAHwyiW18')// "serviceId":"6F81-5844-456A","displayName":"Compute Engine"
    const response = await fetch('https://cloudbilling.googleapis.com/v1/services/6F81-5844-456A/skus?key=AIzaSyDVWa131rNBwaTJ29-Of1YfKBHAHwyiW18')
    const data = await response.json()

    res.statusCode = 200
    return res.json({
        data: data,
    })
} 


// TODO

/*
    https://cloud.google.com/billing/docs/reference/budget/rest/v1/billingAccounts.budgets/list?authuser=2
    https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid?authuser=2
    https://cloud.google.com/billing/v1/getting-started?authuser=2
*/