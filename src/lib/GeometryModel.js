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
    current="1"
    utilization=100
    utilization_desired=100
    recommended=0
    min_recommended=0
    max_recommended=0
    spread=0
    isOpen=false
    
    // id is not set incase we try to persist 
    constructor(title,type) {     
      // we have to have a title or we cant persist or load.
      if ( title ){

        this.title= title
        this.type= type
        
        this.id = title.replace( /[^a-z0-9]/g, '' ); // lowercase a-z only
        
        let current = localStorage.getItem(`${this.id}-current`)
        this.current = current>0 ? current : this.current

        let utilization = localStorage.getItem(`${this.id}-utilization`)
        this.utilization = utilization>0 ? utilization : this.utilization

        let utilization_desired = localStorage.getItem(`${this.id}-utilization_desired`)
        this.utilization_desired = utilization_desired>0 ? utilization_desired : this.utilization_desired

        this.spread = localStorage.getItem(`${this.id}-spread`)
        this.isOpen = localStorage.getItem(`${this.id}-isOpen`)
        

        if (this.isOpen == 'false') // local storage is always a string
          this.isOpen = false
      }
      this.calculateRecommendation()
    }

    
    calculateRecommendation() {
        if (this.utilization_desired) // prevent divide by zero
        {
            // now calculate recommendations.          
            this.recommended =  Math.ceil(this.current*this.utilization/this.utilization_desired)  
            if (this.spread> 0 ){
              this.min_recommended = (this.recommended - (this.recommended * this.spread/100)).toFixed(0)
              this.max_recommended = (this.recommended + (this.recommended * this.spread/100)).toFixed(0)  
            } else {
              this.max_recommended = this.min_recommended = this.recommended 
            }
            
            /// utiliztaion based on recommeneded
            if (this.current) {
            this.min_utilization_actual = (this.min_recommended / this.current *100).toFixed(0)
            this.max_utilization_actual = (this.max_recommended / this.current *100).toFixed(0)
            this.utilization_actual= (this.recommended/ this.current *100).toFixed(0)
          }
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
      if (this.spread>-1) {
        localStorage.setItem(`${this.id}-spread`,`${this.spread}`)
      }

      localStorage.setItem(`${this.id}-isOpen`,`${this.isOpen}`)
    }
    
}

export default GeometryModel