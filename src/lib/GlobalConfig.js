  /*
# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
*/

class GlobalConfig {
    // This only changes per server installation!
  defaultConfig = {
      apiKey:  'AIzaSyDVWa131rNBwaTJ29-Of1YfKBHAHwyiW18',
      locationId:'us-central1'
  }

  constructor(){
     // this.apiKey = localStorage.getItem("apiKey") || this.defaultConfig.apiKey
    this.locationId = localStorage.getItem("locationId") || this.defaultConfig.apiKey    
  }
  
  persist() {
    // dont store apikey locally.
    //localStorage.setItem("apiKey",this.apiKey)
    localStorage.setItem("locationId",this.locationId)
  }
}
export default GlobalConfig



