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

class Calculator {
  constructor( PriceList){  
    this.priceList_ = PriceList;
    
  }

  // TODO: move machine pricing  into another libarary  
  /// machineTypeName: n2-highcpu-2
  getSkus(machineTypeName) {

    var family = machineTypeName.split('-').at(0).toLowerCase()
    var custom=false
    if (machineTypeName.toLowerCase().includes("custom")) {
      custom=true
    }

    var matchStandardRam = new RegExp(`^${family} Instance Ram`,'i')
    var matchStandardCpu = new RegExp(`^${family} Instance Core`,'i')

    var matchCustomRam = new RegExp(`^${family} Custom Instance Ram`,'i')
    var matchCustomCpu = new RegExp(`^${family} Custom Instance Core`,'i')
    if (family == 'e2') {
      matchCustomRam = matchStandardRam
      matchCustomCpu = matchStandardCpu
    }

    if (family == 'n1') {
      matchCustomRam = matchStandardRam = new RegExp(`^${family}.+ ram`,'ig')
      matchCustomCpu = matchStandardCpu = new RegExp(`^${family}.+ core`,'ig')
    }

     if (family == 'n2d') {
      matchStandardRam = new RegExp(`^${family} AMD Instance Ram running`,'i')
      matchStandardCpu = new RegExp(`^${family} AMD Instance Core running`,'i')
      matchCustomRam = new RegExp(`^${family} AMD Custom Instance Ram running`,'i')
      matchCustomCpu = new RegExp(`^${family} AMD Custom Instance Core running`,'i')
     }

    let skus = []
    for(var i in this.priceList_) {
        var sku = this.priceList_[i]
        var desc = sku['description'].toLowerCase()


       if (family)
        var push =false
        if (custom) {
          if (desc.match(matchCustomCpu) || desc.match(matchCustomRam)) {
            push=true
          }

        } else {
          if (desc.match(matchStandardCpu) || desc.match(matchStandardRam)) {
            push=true
          }          
        }
        
        if(push)
        {
          skus.push({
            price: this.getPrice(sku),
            units: this.getUnit(sku),
            skuId: sku['skuId'],
            resourceGroup: sku['category']['resourceGroup'],
            description: sku['description']
          })
        }

    }
    return skus
  }

  getPrice(sku) {
    if (!sku['pricingInfo']) return 0
    return 1000000/sku['pricingInfo'][0]['pricingExpression']['tieredRates'][0]['unitPrice']['nanos']        
  }
  getUnit(sku) {
    if (!sku['pricingInfo']) return 0
    return sku['pricingInfo'][0]['pricingExpression']['usageUnitDescription']
  }
 
}
export default Calculator

