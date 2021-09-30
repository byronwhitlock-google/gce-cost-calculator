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

  /**
   * SKU pricing data.
   * @export {!Object}
   */
  cloudSkuData = {};
  
  /**
   * Sustained use tier data.
   * @export {!Object.<string, number>}
   */
  sustainedUseTiers = {};
  
  /**
   * Sustained use base percentage.
   * @export {number}
   */
  sustainedUseBase = 0.0;
  
  /**
   * Prices updated date.
   * @export {string}
   */
  updated = '';


  setPriceList_(priceList) {
  this.cloudSkuData = priceList['sku'];
  this.updated = priceList['updated'];

  if (priceList['sku'] !== undefined) {
    this.sustainedUseTiers = priceList['sku']['sustained_use_tiers_new'];
    this.sustainedUseBase = priceList['sku']['sustained_use_base'];
  }

  // Iterate through the SKU data and pull out tiered prices
  goog.object.forEach(this.cloudSkuData, function(val, key) {
    if (val.tiers !== undefined) {
      this.tieredPricing[key] = val.tiers;
    }
  }, this);
};
 
}
export default Calculator

