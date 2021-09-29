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
class GeometryModel
{  
    title= ""
    type= ""
    current="0"
    utilization=100
    utilization_desired=100
    recommended=0
    isOpen=false
    
    // id is not set incase we try to persist 
    constructor(title,type) {     
      // we have to have a title or we cant persist or load.
      if ( title ){

        this.title= title
        this.type= type
        
        this.id = title.replace( /[^a-z0-9]/g, '' ); // lowercase a-z only
        
        let current = localStorage.getItem(`${this.id}-current`)
        this.current = current ? current : this.current

        let utilization = localStorage.getItem(`${this.id}-utilization`)
        this.utilization = utilization ? utilization : this.utilization

        let utilization_desired = localStorage.getItem(`${this.id}-utilization_desired`)
        this.utilization_desired = utilization_desired ? utilization_desired : this.utilization_desired

        this.isOpen = localStorage.getItem(`${this.id}-isOpen`)
      }
    }

    
    calculateRecommendation() {
        if (this.utilization_desired) // prevent divide by zero
        {
          // now calculate recommended.
          
              return this.recommended =  Math.ceil(this.current*this.utilization/this.utilization_desired)
            
        }        
    }

    //store shape to localstorge
    persist() {

      // don't store NaN or null or
      if (this.current) {
        localStorage.setItem(`${this.id}-current`,this.current)
      }

      if (this.utilization) {
        localStorage.setItem(`${this.id}-utilization`,this.utilization)
      }

      if (this.utilization_desired) {
        localStorage.setItem(`${this.id}-utilization_desired`,this.utilization_desired)
      }

      localStorage.setItem(`${this.id}-isOpen`,this.isOpen)
    }
    
}

export default GeometryModel