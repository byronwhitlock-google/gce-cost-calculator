class BaseApi {
    constructor(apiKey){
      this.apiKey = apiKey 
      
    }
    
    async get (url) {    
      console.log("in BaseApi.get()")
  
      const options = {
        method: "GET",
        headers: { 
        }
      }
  
      console.log(options)
      const response = await fetch(url, options);
      return this.handleResponse(response);  
    }
  
    async post (url,data) {
      const response = await fetch(url, {
            method: "POST",
            headers: { 
            },
            body: JSON.stringify(data)
          });
      return this.handleResponse(response);  
    }
  
    async handleResponse (response)
    {
      var res = ""
      try {
        res = await response.json();
      } catch (err){
        throw new Error(`Invalid JSON response from server. <Br>${response.status} ${response.statusText}`)
      }    
  
      if (response.status !== 200) 
        throw Error(response.status)     
      else 
        return res;
    }
  }
  export default BaseApi