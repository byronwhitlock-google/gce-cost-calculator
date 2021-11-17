/**
 * @fileoverview Calculator library for Cloud product skus
 */

'use strict';

goog.provide('cloudpricingcalculator.ComputePriceItem');
goog.provide('cloudpricingcalculator.SkuData');
goog.provide('cloudpricingcalculator.components.cloudcalculator.CloudCalculator');

goog.require('cloudpricingcalculator.components.cartdata.CartData');
goog.require('cloudpricingcalculator.components.pricelist.PriceList');
goog.require('goog.array');
goog.require('goog.object');

goog.scope(function() {


/**
 * @typedef {{
 *    totalPrice: number,
 *    cumulativeDiscount: number,
 *    effectiveRate: number,
 *    detailedView: Object.<number, number>,
 * }}
 */
cloudpricingcalculator.ComputePriceItem;


/**
 * @typedef {{
 *    sku: string,
 *    quantity: number,
 *    quantityLabel: string,
 *    region: string,
 *    displayName: string,
 *    displayDescription: string,
 *    uniqueId: (?number|undefined),
 *    price: (?number|undefined),
 *    items: !Object
 * }}
 */
cloudpricingcalculator.SkuData;


/**
 * @typedef {{
 *    unitPrice: number,
 *    fixed: boolean,
 * }}
 */
cloudpricingcalculator.UnitPrice;



/**
 * A service to perform the calculations on Cloud product skus.
 *
 * @param {!cloudpricingcalculator.components.cartdata.CartData} CartData
 * @param {!cloudpricingcalculator.components.pricelist.PriceList} PriceList
 * @param {!angular.$http} $http
 * @param {!angular.$location} $location
 * @param {!angular.$timeout} $timeout the Angular timeout service
 * @constructor
 * @ngInject
 */
cloudpricingcalculator.components.cloudcalculator.CloudCalculator = function(
    CartData, PriceList, $http, $location, $timeout) {
  /*
   * @private {!cloudpricingcalculator.components.cartdata.CartData}
   */
  this.cartData_ = CartData;

  /*
   * @private {!cloudpricingcalculator.components.pricelist.PriceList}
   */
  this.priceList_ = PriceList;

  /** @private {!angular.$http} */
  this.http_ = $http;

  /** @private {!angular.$location} */
  this.location_ = $location;

  /**
   * Total price for the estimated bill.
   * @export {number}
   */
  this.totalPrice = 0.0;

  /** @private {!angular.$timeout} */
  this.timeout_ = $timeout;

  /**
   * SKU pricing data.
   * @export {!Object}
   */
  this.cloudSkuData = {};

  /**
   * Prices updated date.
   * @export {string}
   */
  this.updated = '';

  /**
   * Tiered pricing data.
   * @export {!Object}
   */
  this.tieredPricing = {};

  /**
   * Sustained use tier data.
   * @export {!Object.<string, number>}
   */
  this.sustainedUseTiers = {};

  /**
   * Sustained use base percentage.
   * @export {number}
   */
  this.sustainedUseBase = 0.0;

  /**
   * Number of weeks in a month
   * @const {number}
   */
  this.WEEKS = 365 / (7 * 12);

  /**
   * @const {number}
   */
  this.TB_TO_GB = 1024;
  /**
   * Base GPU string
   * @const {string}
   */
  this.BASE_GPU_SKU = 'GPU_';
  /**
   * Base DATAFLOWGPU string
   * @const {string}
   */
  this.BASE_DATAFLOWGPU_SKU = 'DATAFLOWGPU_';
  /**
  /**
   * @const {!Object.<string, number>}
   */
  this.ML_UNITS_MAP = {
    'us': {
      'BASIC': 0.3878,
      'STANDARD_1': 4.0571,
      'PREMIUM_1': 33.7829,
      'BASIC_GPU': 1.6939,
      'BASIC_TPU': 9.5714,
    },
    'europe': {
      'BASIC': 0.4074,
      'STANDARD_1': 4.2630,
      'PREMIUM_1': 35.4889,
      'BASIC_GPU': 1.7222,
      'BASIC_TPU': 10.0741,
    },
    'asia': {
      'BASIC': 0.4074,
      'STANDARD_1': 4.2630,
      'PREMIUM_1': 35.4889,
      'BASIC_GPU': 1.7222,
    },
    'custom': {
      'us': {
        'standardCount': 0.3878,
        'largeCount': 0.9665,
        'complexSCount': 0.5788,
        'complexMCount': 1.1576,
        'complexLCount': 2.3151,
        'standardGpuCount': 1.6939,
        'complexMGpuCount': 5.2245,
        'complexLGpuCount': 6.7755,
        'standardP100Count': 3.7551,
        'complexMP100Count': 13.4694,
        'standardV100Count': 5.8367,
        'largeModelV100Count': 6.0278,
        'complexModelMV100': 21.7959,
        'complexModelLV100': 43.5918
      },
      'europe': {
        'standardCount': 0.4074,
        'largeCount': 1.0148,
        'complexSCount': 0.6081,
        'complexMCount': 1.2163,
        'complexLCount': 2.4326,
        'standardGpuCount': 1.7222,
        'complexMGpuCount': 5.2593,
        'complexLGpuCount': 6.8889,
        'standardP100Count': 3.7778,
        'complexMP100Count': 13.4815,
        'standardV100Count': 5.4970,
        'largeModelV100Count': 5.6867,
        'complexModelMV100': 20.4385,
        'complexModelLV100': 40.8770
      },
      'asia': {
        'standardCount': 0.4074,
        'largeCount': 1.0148,
        'complexSCount': 0.6081,
        'complexMCount': 1.2163,
        'complexLCount': 2.4326,
        'standardGpuCount': 1.7222,
        'complexMGpuCount': 5.2593,
        'complexLGpuCount': 6.8889,
        'standardP100Count': 3.7778,
        'complexMP100Count': 13.4815,
        'standardV100Count': 5.4970,
        'largeModelV100Count': 5.6867,
        'complexModelMV100': 20.4385,
        'complexModelLV100': 40.8770
      }
    },
  };

  /**
   * @const {!Object.<string, !Array.<number>>}
   */
  this.REDIS_TIERS = {
    'M1': [1, 4],
    'M2': [5, 10],
    'M3': [11, 35],
    'M4': [36, 100],
    'M5': [101, Number.POSITIVE_INFINITY]
  };

  /**
   * @export {number}
   */
  this.TOTAL_BILLING_HOURS = 730;

  /**
   * @const {number}
   */
  this.MAX_RAM_RATIO = {'n1': 6.5, 'n2': 8, 'n2d': 8};

  /**
   * @const {Object}
   */
  this.GCE_VMS_CORE_RAM_RATIO = {
    'n1': {'standard': 3.75, 'highmem': 6.5, 'highcpu': 0.9},
    'n2': {'standard': 4, 'highmem': 8, 'highmem-alternate': 6.75, 'highcpu': 1},
    'e2': {'standard': 4, 'highmem': 8, 'highcpu': 1},
    'n2d': {'standard': 4, 'highmem': 8, 'highcpu': 1},
    't2d': {'standard': 4},
    'c2': {'standard': 4, 'highcpu': 2},
    'a2': {'highgpu': 85 / 12, 'megagpu': 1360 / 96},
    'm1': {'megamem': 1433.6 / 96, 'ultramem': 961 / 40},
    'm2': {'ultramem': 5888 / 208, 'megamem': 5888 / 416}
  };

  /**
   * Sole-tenancy premium charge is 10%.
   * @const {number}
   */
  this.SOLE_TENANCY_PREMIUM = 0.1;

  /**
   * Sole-tenancy premium charge for CPU overcommit is 25%.
   * @const {number}
   */
  this.SOLE_TENANCY_CPU_OVERCOMMIT_PREMIUM = 0.25;

  /**
   * Memory-optimized premium charge is 13%.
   * @const {number}
   */
  this.MEMORY_OPTIMIZED_PREMIUM = 0.13;

  this.calculationId = this.location_.search().id;

  // retrieve Cartdata only once
  this.isRetrieved = false;
  /* 
  TODO: We need to inject pricelist data since we aren't using angular
*/

  // Get the pricelist data and then get saved data.
  var listener = goog.bind(function(event) {
    // splitted id from main window hash
    var parsedId = this.cartData_.parseUrlHash(event.data);
    this.calculationId = parsedId;
    // Get data from Datastore on initializing
    this.retrieveCartdata();
  }, this);

  if (window.addEventListener) {
    addEventListener('message', listener, false);
  } else {
    attachEvent('onmessage', listener);
  }

  this.priceList_.getAll()
      .then(goog.bind(this.setPriceList_, this))
      .then(goog.bind(this.retrieveCartdata, this));
  
};


var CloudCalculator =
    cloudpricingcalculator.components.cloudcalculator.CloudCalculator;


/**
 * Get the base percentage for sustained use.
 * @return {number} Base percentage to indicate sustained use for compute.
 */
CloudCalculator.prototype.getSustainedUseBase = function() {
  return this.sustainedUseBase;
};


/**
 * Sets the internal price list with data from the PriceList service.
 * @param {!Object} priceList The pricelist to build internal datastructures
 * @private
 */
CloudCalculator.prototype.setPriceList_ = function(priceList) {
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


/**
 * Retrieves the unit price from the price list.
 * @param {string} sku The product SKU
 * @param {string} region Region of the compute resources
 * @return {!cloudpricingcalculator.UnitPrice} Unit price for an item and if it
 *    has a fixed price.
 */
CloudCalculator.prototype.getUnitPrice = function(sku, region) {
  if (this.cloudSkuData[sku] === undefined) {
    return {'unitPrice': 0, 'fixed': false};
  }
  var item = this.cloudSkuData[sku];
  var unitPrice = item['us'];
  if (item[region] !== undefined) {
    unitPrice = item[region];
  }

  var fixed = item['fixed'] !== undefined ? item['fixed'] : false;

  return {'unitPrice': unitPrice, 'fixed': fixed};
};


/**
 * Returnes .
 * @param {string} sku The product SKU
 * @return {string} family this sku belongs.
 */
CloudCalculator.prototype.getFamilyFromSku = function(sku) {
  return sku ? sku.replace('CP-COMPUTEENGINE-VMIMAGE-', '').split('-')[0] : '';
};

/**
 * Retrieves the unit price based on vCPU and memory usage.
 * @param {string} sku The product SKU
 * @param {string} region Region of the compute resources
 * @param {?object} product product to apply specific premium cost
 * @return {!cloudpricingcalculator.UnitPrice} Unit price for an item and if it
 *    has a fixed price.
 */
CloudCalculator.prototype.getResourceBasedPrice = function(
    sku, region, product) {
  /** @type {string} */
  const family = this.getFamilyFromSku(sku);
  const prefix = `CP-COMPUTEENGINE-${family}-PREDEFINED-VM-`;
  if (!this.cloudSkuData[prefix + 'CORE']) {
    return this.getUnitPrice(sku, region);
  }
  let corePrice = 0;
  let ramPrice = 0;
  if (sku.indexOf('PREEMPTIBLE') == -1) {
    corePrice = this.getUnitPrice((prefix + 'CORE'), region).unitPrice;
    ramPrice = this.getUnitPrice((prefix + 'RAM'), region).unitPrice;
  } else {
    corePrice =
        this.getUnitPrice((prefix + 'CORE-PREEMPTIBLE'), region).unitPrice;
    ramPrice =
        this.getUnitPrice((prefix + 'RAM-PREEMPTIBLE'), region).unitPrice;
  }
  const cores = this.getCoresNumber(sku);
  const ram = this.getRAMValue(sku);


  let premiumCost = 0;
  const regex = /N1|N2|M1|M2|C2|N2D/i;
  if (sku.indexOf('VMIMAGE') != -1 && sku.indexOf('NODE') != -1 &&
      sku.match(regex).length != 0) {
    premiumCost = this.getPremiumCost(sku, region, 'SOLE_TENANCY_PREMIUM');
    const isCpuOvercommit = product ?
        (product.cpuOvercommit && ['N1', 'N2'].includes(family)) ? true :
                                                                   false :
        false;
    // add cpu-overcommit premium cost.
    premiumCost += isCpuOvercommit ?
        this.getPremiumCost(
            sku, region, 'SOLE_TENANCY_CPU_OVERCOMMIT_PREMIUM') :
        0;
  }
  if (sku.indexOf('VMIMAGE') != -1 && sku.indexOf('M2') != -1 &&
      sku.match(regex).length != 0) {
    premiumCost = this.getPremiumCost(sku, region, 'MEMORY_OPTIMIZED_PREMIUM');
  }
  const unitPrice = (cores * corePrice + ram * ramPrice) + premiumCost;
  return {'unitPrice': unitPrice, 'fixed': false};
};

/**
 * Retrieves Memory-optimized instance unit price based on vCPU and memory
 * usage.
 * @param {string} sku The product SKU
 * @param {string} cudSku The product CUD SKU
 * @param {string} region Region of the compute resources
 * @return {number} Unit price for an item
 */
CloudCalculator.prototype.getMemoryOptimizedCudPrice = function(
    sku, cudSku, region) {
  const corePrice = this.getUnitPrice((cudSku + 'CPU'), region).unitPrice;
  const ramPrice = this.getUnitPrice((cudSku + 'RAM'), region).unitPrice;
  const cores = this.getCoresNumber(sku);
  const ram = this.getRAMValue(sku);
  const family = this.getFamilyFromSku(sku);
  let prefix = `CP-COMPUTEENGINE-${family}-PREDEFINED-VM-`;
  const corePremiumCost = this.cloudSkuData[prefix + 'CORE'][region] *
      this.MEMORY_OPTIMIZED_PREMIUM;
  const ramPremiumCost =
      this.cloudSkuData[prefix + 'RAM'][region] * this.MEMORY_OPTIMIZED_PREMIUM;
  const maxSud = this.getMaxSudForSeries(family);
  const unitPrice =
      (cores * (corePrice + maxSud * corePremiumCost) +
       ram * (ramPrice + maxSud * ramPremiumCost));
  return unitPrice;
};
/**
 * Retrieves premium cost.
 * @param {string} sku The product SKU
 * @param {string} region Region of the compute resources
 * @param {string} premium type of premium
 * @return {number} Unit price for an item and if it
 *    has a fixed price.
 */
CloudCalculator.prototype.getPremiumCost = function(sku, region, premium) {
  /** @type {string} */
  let prefix = '';
  const family = this.getFamilyFromSku(sku);
  prefix = `CP-COMPUTEENGINE-${family}-PREDEFINED-VM-`;
  const corePrice = this.cloudSkuData[prefix + 'CORE'][region];
  const ramPrice = this.cloudSkuData[prefix + 'RAM'][region];
  const cores = this.getCoresNumber(sku);
  const ram = this.getRAMValue(sku);
  const premiumCost = (cores * corePrice + ram * ramPrice) * this[premium];
  return premiumCost;
};


/**
 * Gets custom vm unit price.
 * @param {string} sku The product SKU
 * @param {string} region Region of the compute resources
 * @return {!cloudpricingcalculator.UnitPrice} Unit price for an item and if it
 *    has a fixed price.
 */
CloudCalculator.prototype.getCustomVmPrice = function(sku, region) {
  let product = 'COMPUTEENGINE-';
  /** @type {string} */
  let family = '';
  if (sku.indexOf('CP-DB') == -1) {
    family = this.getFamilyFromSku(sku);
  }
  /** @type {string} */
  const prefix = sku.indexOf('CP-DB') != -1 ?
      `CP-DB-` :
      'CP-' + product + family + '-CUSTOM-VM-';
  let corePrice = 0;
  let ramPrice = 0;
  if (sku.indexOf('PREEMPTIBLE') !== -1) {
    corePrice = this.cloudSkuData[prefix + 'CORE-PREEMPTIBLE'][region];
    ramPrice = this.cloudSkuData[prefix + 'RAM-PREEMPTIBLE'][region];
  } else if (sku.indexOf('CUD') !== -1) {
    const term = sku.split('CUD-')[1];
    corePrice = this.cloudSkuData[prefix + 'CORE-CUD-' + term][region];
    ramPrice = this.cloudSkuData[prefix + 'RAM-CUD-' + term][region];
  } else {
    corePrice = this.cloudSkuData[prefix + 'CORE'][region];
    ramPrice = this.cloudSkuData[prefix + 'RAM'][region];
  }
  var parsedSku = this.parseCustomSKU(sku);
  var cores = parsedSku['cores'];
  var ram = parsedSku['ram'];

  /** @type {number} */
  let extendedMemoryCost = 0;
  let extMemoryVolume = 0;
  if (sku.indexOf('-EXTENDED') != -1) {
    extendedMemoryCost = this.getExtendedCost(sku, region, family);
    extMemoryVolume = this.getExtendedMemoryVolume(cores, ram, family);
    ram -= extMemoryVolume;
  }
  const unitPrice = (cores * corePrice + ram * ramPrice) + extendedMemoryCost;
  return {'unitPrice': unitPrice, 'fixed': false};
};


/**
 * Calculates extended memory cost.
 * @param {string} sku The product SKU
 * @param {string} region Region of the compute resources
 * @param {string} family instance family
 * @return {number} extended memory cost.
 */
CloudCalculator.prototype.getExtendedCost = function(sku, region, family) {
  var parsedSku = this.parseCustomSKU(sku);
  var cores = parsedSku['cores'];
  var ram = parsedSku['ram'];
  var cost = 0;
  var baseSku = `CP-COMPUTEENGINE-${family}-CUSTOM-VM-EXTENDED-RAM`;
  var cost = 0;
  if (sku.indexOf('PREEMPTIBLE') !== -1) {
    baseSku = baseSku + '-PREEMPTIBLE';
  }
  var extMemoryVolume = this.getExtendedMemoryVolume(cores, ram, family);
  var extMemoryPrice = this.cloudSkuData[baseSku][region];
  if (extMemoryVolume > 0) {
    cost = extMemoryVolume * extMemoryPrice;
  }
  return cost;
};


/**
 * Calculates volume of extended memory.
 * @param {number} cores number of cores.
 * @param {number} ram volume of ram
 * @param {string} family instance family
 * @return {number} Volume of extended memory.
 */
CloudCalculator.prototype.getExtendedMemoryVolume = function(
    cores, ram, family) {
  return Math.max(0, ram - cores * this.getMaxCoreRatio(family));
};


/**
 * Returnes max custom ram to core ratio per given machine family.
 * @param {string} family instance family
 * @return {number} ratio.
 */
CloudCalculator.prototype.getMaxCoreRatio = function(family) {
  family = family.toLowerCase();
  return family ? this.MAX_RAM_RATIO[family] : 0;
};


/**
 * Parses SKU for core and ram values.
 * @param {string} sku The product SKU
 * @return {!Object.<string, number>} Object containing core and ram information.
 */
CloudCalculator.prototype.parseCustomSKU = function(sku) {
  const parsedSku = sku.slice(sku.toUpperCase().search('CUSTOM') + 7).split('-');
  // GCE SKUs using MB while SQL GB
  const multiplier = sku.indexOf('CP-DB') === -1 ? this.TB_TO_GB : 1;
  const cores = parsedSku[0];
  const ram = parsedSku[1] / multiplier;
  return {'cores': parseFloat(cores), 'ram': parseFloat(ram)};
};


/**
 * Parses SKU for core and ram values.
 * @param {string} sku The product SKU
 * @return {Object.<string, number>} Object containing core and ram information.
 */
CloudCalculator.prototype.parseSkuWithFamily = function(sku) {
  const parsedSku = sku.replace('CP-COMPUTEENGINE-VMIMAGE-', '').split('-');t67
  const family = parsedSku[0].toLowerCase();
  const machineType = parsedSku[1].toLowerCase();
  let coreNumber = parseInt(parsedSku[2]);
  if (family == 'a2') {
    coreNumber =
        coreNumber * (sku.toLowerCase().indexOf('megagpu') != -1 ? 6 : 12);
  }
  if (!coreNumber) {
    return {'cores': 1, 'ram': 1};
  }
  let ram = this.GCE_VMS_CORE_RAM_RATIO[family][machineType] * coreNumber;
  // For SKUs who's discription is not Present in pricing.json.
  if (ram == null || isNaN(ram)) {
    ram = parseInt(parsedSku[3]);
  }
  return {'cores': coreNumber, 'ram': ram};
};


/**
 * Calculates the monthly price for a given SKU & quantity.
 * @param {string} sku The product SKU
 * @param {?number} quantity Quantity of billable units
 * @param {string=} region Region of the compute resources
 * @param {number|string=} dependedQuota free quota based on other resources.
 *    It can be a number or another Sku that this item depends on (optional).
 * @return {number} Total monthly price for a given SKU and quantity.
 */
CloudCalculator.prototype.calculateItemPrice = function(
    sku, quantity, region, dependedQuota) {
  // Redirect tiered pricing
  if (this.tieredPricing.hasOwnProperty(sku)) {
    if (typeof (dependedQuota) === 'number') {
      quantity -= dependedQuota;
    }
    if (typeof (dependedQuota) === 'string') {
      const sku = dependedQuota;
      const cart = this.cartData_.get();
      const cartItem = cart.find(cartItem => cartItem.sku === sku);
      if (cartItem) {
        quantity -= cartItem.quantity;
      }
    }

    return this.calculateTieredSKUPrice(sku, quantity);
  }

  /** @type {?cloudpricingcalculator.UnitPrice} */
  let priceResponse;
  if (sku.toUpperCase().indexOf('CUSTOM') != -1) {
    priceResponse = this.getCustomVmPrice(sku, region);
  } else if (sku.indexOf('CP-COMPUTEENGINE-') != -1) {
    priceResponse = this.getResourceBasedPrice(sku, region);
  } else {
    priceResponse = this.getUnitPrice(sku, region);
  }
  const unitPrice = priceResponse.unitPrice;
  /** @type {boolean} */
  const fixed = priceResponse.fixed;
  /** @type {number} */
  let freeQuota = 0;
  if (dependedQuota) {
    freeQuota = dependedQuota;
  } else {
    freeQuota = this.getFreeQuota(sku);
  }

  if (freeQuota > 0) {
    quantity = quantity - freeQuota > 0 ? quantity - freeQuota : 0;
  }

  // Add an hour multiplier for load balancing rules
  let multiplier = 1;
  if (sku.indexOf('FORWARDING_RULE_CHARGE') > -1) {
    multiplier = this.TOTAL_BILLING_HOURS;
  }

  let itemPrice = unitPrice * multiplier;
  if (!fixed) {
    itemPrice *= quantity;
  }

  return itemPrice;
};


/**
 * Checks if product has freequota.
 * @param {string} sku The product SKU
 * @return {number} volume of free quota.
 */
CloudCalculator.prototype.getFreeQuota = function(sku) {
  var quota = 0;
  if (this.cloudSkuData[sku] === undefined) {
    return quota;
  }
  var item = this.cloudSkuData[sku];
  if (item.freequota) {
    quota = item.freequota.quantity;
  }
  return quota;
};


/**
 * Checks if it has commitment prices.
 * @param {string} sku The product SKU
 * @param {number} commitment commitment term
 * @return {number} volume of free quota.
 */
CloudCalculator.prototype.checkForCommitment = function(sku, commitment) {
  return this.cloudSkuData[sku + '-CUD-' + commitment + '-YEAR'] !== undefined;
};


/**
 * Return local ssd price per hour.
 * @param {string} region data center location.
 * @param {boolean} isPreemptible whether instance is preemptible.
 * @param {number} cudTerm commitment term.
 * @return {number} ssd price.
 */
CloudCalculator.prototype.getSsdPrice = function(
    region, isPreemptible, cudTerm) {
  var location = region || 'us';
  var sku = 'CP-COMPUTEENGINE-LOCAL-SSD'
  if (isPreemptible) {
    sku = sku + '-PREEMPTIBLE';
  }
  if (cudTerm && !isPreemptible) {
    sku += `-CUD-${cudTerm}-YEAR`
  }
  if (!this.cloudSkuData[sku][location]) {
    return 0;
  }
  return this.cloudSkuData[sku][location];
};


/**
 * Calculates pricing for tiered product SKUs.
 * @param {string} sku The product SKU
 * @param {number} quantity Quantity of billable units in Gigabytes
 * @return {number} Total monthly price for a given SKU and quantity.
 */
CloudCalculator.prototype.calculateTieredSKUPrice = function(sku, quantity) {
  var pricingLevels = sku.indexOf('SUPPORT') == -1 ?
      this.tieredPricing[sku] :
      this.cloudSkuData[sku]['schedule'];
  var newPrice = 0;

  // All prices
  var price;
  var lastLevel = 0;
  goog.object.forEach(pricingLevels, function(value, level) {
    // get first price
    price = value;
    if (quantity > 0) {
      var delta = level - lastLevel;
      if (quantity > delta) {
        quantity -= delta;

        newPrice += delta * price;
      } else {
        newPrice += quantity * price;
        quantity = 0;
      }
    }
    lastLevel = level;
  });

  // Calculate the final amount beyond the top tier
  if (quantity > 0) {
    newPrice += (quantity * price);
  }

  return newPrice;
};


/**
 * Calculates the pricing for sustained use SKUS.
 * @param {string} sku The SKU of the compute product
 * @param {number} billableHours Quantity of billable units in Hours
 * @param {string} region Region of the compute resources
 * @param {number} quantity total number of instances
 * @param {?object} product product to apply specific premium cost
 * @return {!cloudpricingcalculator.ComputePriceItem} Total monthly price,
 *    cumulative discount, effective rate and breakdown of the tiers used to
 *    build the final blended discount.
 */
CloudCalculator.prototype.calculateSustainedUseDiscountPrice = function(
    sku, billableHours, region, quantity, product) {
  // Update totalBillingHours as per days in month .
  const totalBillingHours = billableHours > 730 ? 744 : 730;
  // Calculate the percent of hours used
  var percentUsed = billableHours / totalBillingHours;

  // Get the unit price
  /** @type {!cloudpricingcalculator.UnitPrice} */
  var priceResponse = {};
  if (sku.toUpperCase().indexOf('CUSTOM') != -1) {
    priceResponse = this.getCustomVmPrice(sku, region);
  } else if (
      sku.indexOf('F1') != -1 || sku.indexOf('G1') != -1 ||
      sku.indexOf('E2-MICRO') !== -1 ||
      sku.indexOf('E2-SMALL') !== -1 ||
      sku.indexOf('E2-MEDIUM') !== -1 ||
      sku.indexOf('DB') != -1 ||
      sku.indexOf('CP-CLOUDSQLSERVER-LICENCING') != -1) {
    priceResponse = this.getUnitPrice(sku, region);
  } else {
    priceResponse = this.getResourceBasedPrice(sku, region, product);
  }

  var unitPrice = priceResponse.unitPrice;

  // Get the normal price
  var normalPrice = unitPrice * billableHours;
  var detailedView = {};
  var isPreemptible = sku.indexOf('-PREEMPTIBLE') != -1;
  var family = this.getFamilyFromSku(sku).toLowerCase();
  var tiers = this.sustainedUseTiers[family] || this.sustainedUseTiers['n1'];
  var totalPrice = 0.0;
  var lastLevel = 0;
  var levelDelta = 0;
  var isDiscount = true;
  goog.object.forEach(tiers, function(value, level) {
    if (value > 0) {
      levelDelta = level - lastLevel;
      lastLevel = level;
      var delta = percentUsed - levelDelta;
      if (delta < 0 && isDiscount) {
        var tierPrice = percentUsed * unitPrice * value * totalBillingHours;
        totalPrice += tierPrice;

        detailedView[level] = {
          'price': tierPrice * quantity,
          'hours': totalBillingHours * percentUsed * quantity,
          'discount': 1 - value
        };

        isDiscount = false;
      } else if (isDiscount) {
        var tierPrice = levelDelta * unitPrice * value * totalBillingHours;
        totalPrice += tierPrice;
        percentUsed -= levelDelta;
        detailedView[level] = {
          'price': tierPrice * quantity,
          'hours': totalBillingHours * levelDelta * quantity,
          'discount': 1 - value
        };
      }
    }
  }, this);

  var cumulativeDiscount = 1 - (totalPrice / normalPrice);
  var effectiveRate = totalPrice / billableHours;

  /** @type {!cloudpricingcalculator.ComputePriceItem} */
  var priceItem = {
    totalPrice: isPreemptible ? normalPrice : totalPrice,
    cumulativeDiscount: cumulativeDiscount,
    effectiveRate: effectiveRate,
    detailedView: detailedView
  };

  return priceItem;
};


/**
 * Helper function determines if two items are equal, or if they're both null.
 * @param {string|number|null} item1 First item to compare
 * @param {string|number|null} item2 Second item to compare
 * @return {boolean} Whether the items are equal, or if they're both null.
 */
CloudCalculator.prototype.isEqualOrBothNaN = function(item1, item2) {
  return (item1 == item2 || (isNaN(item1) && isNaN(item2)));
};


/**
 * Adds an item to the cloud cart.
 * @param {!cloudpricingcalculator.SkuData} newItem
 * @param {number=} incomingPrice Optional incoming price
 * @param {boolean=} recalc if it is going to be recalculated (optional)
 * @return {number} Price for testing and verification.
 */
CloudCalculator.prototype.addItemToCart = function(
    newItem, incomingPrice, recalc) {
  /*
   * if the exact same item already exists in the cart,
   * simply increase its quantity value
   */
  var cart = this.cartData_.get();
  for (var i = 0; i < cart.length; i++) {
    var item = cart[i];
    if (newItem.sku.indexOf('CP-COMPUTEENGINE-VMIMAGE') == -1 &&
        newItem.sku.indexOf('CP-CLOUDSQL') == -1 &&
        newItem.sku.indexOf('CP-GKE-AUTOPILOT') == -1 &&
        newItem.sku.indexOf('CP-DB') == -1 &&
        newItem.sku.indexOf('CP-CLOUDFORSQLSERVER-JOB') == -1 &&
        newItem.sku.indexOf('CP-BIGQUERY-') == -1 &&
        newItem.sku.indexOf('CP-ARTIFACT-REGISTRY') == -1 &&
        newItem.sku.indexOf('CP-BIGTABLE') == -1 &&
        newItem.sku.indexOf('CP-SECURITY-COMMAND-CENTER') == -1 &&
        newItem.sku.indexOf('CP-ML') == -1 &&
        newItem.sku.indexOf('CP-DATAFLOW') == -1 &&
        newItem.sku.indexOf('CP-CLOUD-RUN') == -1 &&
        newItem.sku.indexOf('CP-CERTIFICATE-AUTHORITY') == -1 &&
        newItem.sku.indexOf('CP-VMWARE-') == -1 &&
        newItem.sku.indexOf('CP-DATAPROC') == -1 &&
        newItem.sku.indexOf('CP-SPANNER-GENERAL') == -1 &&
        newItem.sku.indexOf('CP-FUNCTIONS') == -1 &&
        newItem.sku.indexOf('-PROF-') == -1 &&
        newItem.sku.indexOf('BIG_QUERY_FLAT_RATE_ANALYSIS') == -1 &&
        newItem.sku.indexOf('CP-SUPPORT') == -1 &&
        newItem.sku.indexOf('CP-PREMIUM-SUPPORT') == -1 &&
        newItem.sku.indexOf('CP-ENHANCED-SUPPORT') == -1 &&
        newItem.sku.indexOf('CP-STANDARD-SUPPORT') == -1 &&
        newItem.sku.indexOf('CP-CUD') == -1 &&
        newItem.sku.indexOf('CP-CONTAINER-BUILD-TIME-') == -1 &&
        newItem.sku.indexOf('CP-MICROSOFT-AD') == -1 &&
        newItem.sku.indexOf('CP-COMPUTEENGINE-INTERNET-EGRESS') == -1 &&
        newItem.sku.indexOf('CP-CLOUD-TPU') == -1 &&
        newItem.sku.indexOf('CP-COMPOSER') == -1 &&
        newItem.sku.indexOf('CP-ORBITERA') == -1 &&
        newItem.sku.indexOf('CP-NETWORK-SERVICES-CLOUD-NAT') == -1 &&
        newItem.sku.indexOf('CP-NETWORK-SERVICES-CLOUD-ARMOR') == -1 &&
        newItem.sku.indexOf('CP-DEDICATED-INTERCONNECTVPN') == -1 &&
        newItem.sku.indexOf('CP-PARTNER-INTERCONNECTVPN') == -1 &&
        newItem.sku.indexOf('CP-RECOMMENDATIONS-AI') == -1 &&
        newItem.sku.indexOf('CP-VPN') == -1 &&
        newItem.sku.indexOf('CP-SECRET-MANAGER') == -1 &&
        newItem.sku.indexOf('CP-MEMORYSTORE-MEMCACHED') == -1 &&
        newItem.sku.indexOf('CP-APP-ENGINE-INSTANCES') == -1 &&
        newItem.sku.indexOf('CP-RECAPTCHA') == -1 &&
        newItem.sku.indexOf('CP-DATAFUSION') == -1 &&
        newItem.sku.indexOf('CP-STACKDRIVER-MONITORED-RESOURCES-VOLUME') ==
            -1 &&
        newItem.sku.indexOf('CP-MEMORYSTORE-REDIS') == -1 &&
        newItem.sku.indexOf('CP-SPEECH-TO-TEXT') == -1 &&
        newItem.sku.indexOf('CP-BIGSTORE') == -1 &&
        this.isEqualOrBothNaN(item.quantityLabel, newItem.quantityLabel) &&
        this.isEqualOrBothNaN(item.quantityLabel, newItem.quantityLabel) &&
        this.isEqualOrBothNaN(item.region, newItem.region) &&
        this.isEqualOrBothNaN(item.displayName, newItem.displayName) &&
        this.isEqualOrBothNaN(
            item.displayDescription, newItem.displayDescription)) {
      if (newItem.sku === item.sku && newItem.region === item.region) {
        if ((item.sku.indexOf('FORWARDING_RULE_CHARGE_BASE') > -1) &&
            (item.quantity + newItem.quantity > 5)) {
          var remainingQuantity = newItem.quantity - (5 - item.quantity);
          var EXTRA_RULE = 'FORWARDING_RULE_CHARGE_EXTRA';
          /** @type {!cloudpricingcalculator.SkuData} */
          var remainingRulesItem = {
            sku: EXTRA_RULE.toUpperCase(),
            quantity: remainingQuantity,
            quantityLabel: '',
            region: item.region,
            displayName: 'Forwarding rules',
            displayDescription: 'Forwarding Rules',
            items: item.items
          };

          this.addItemToCart(remainingRulesItem);

          newItem.quantity = 5 - item.quantity;
          if (newItem.quantity <= 0) {
            return 0;
          }
        }

        // Increment the quantity on the item
        item.quantity += newItem.quantity;

        // Remove the original price from the total
        this.totalPrice -= item.price;

        item.price = this.calculateItemPrice(
            item.sku, item.quantity, newItem.region,
            newItem.items.dependedQuota);

        // If any other item depends on this, recalculate that one
        if (newItem.items.dependedSku) {
          this.recalculateDependedItem(newItem.items.dependedSku);
        }

        // Add the new price to the total
        this.totalPrice += item.price;
        this.cartData_.update(i, item);
        return item.price;
      }
    }
  }
  /*
   * Generate a random number to be used as a unique identifier
   * for each item in the cart
   */
  newItem.uniqueId = Math.random();
  if (newItem.price) {
    newItem.oldPrice = newItem.price;
  }
  // check for legacy regions only for saved items;
  recalc && this.checkLegasyRegion_(newItem);

  // Check for incoming price
  newItem.price = incomingPrice != null ?
      incomingPrice :
      this.calculateItemPrice(
          newItem.sku, newItem.quantity, newItem.region,
          newItem.items.dependedQuota);

  if (newItem.sku.indexOf('CP-COMPUTEENGINE-VMIMAGE') != -1 && recalc &&
      newItem.items.editHook.product != 'soleTenant') {
    const quantity = newItem.items.editHook.initialInputs.quantity;
    /**
     * Calculate the days / month based on average 4.3 weeks in a month
     * @type {number}
     */
    const hoursPerMonth = newItem.quantity / quantity;
    let perHostPrice = 0;
    const cudTerm = newItem.items.editHook.initialInputs.cud;
    const isCud = typeof cudTerm === 'number' && cudTerm > 0;
    // For old estimates before addSud check box we shghould set it as true
    const addCudCheckbox = newItem.items.editHook.initialInputs.addSud;
    const sku = newItem.sku;
    let addSud =
        typeof addCudCheckbox === 'undefined' ? true : addCudCheckbox;
    const isResourceBased = !sku.match(/e2-micro|e2-small|e2-medium|F1|G1/i);
    const isSudEligible = !sku.match(/A2|E2/i);
    addSud = addSud && isSudEligible;
    let region = newItem.items.editHook.initialInputs.location;
    // makes legacy items bekave like new
    this.sanitizeLegacyObject_(newItem);
    newItem.displayDescription =
        sku.replace('CP-COMPUTEENGINE-VMIMAGE-', '').toLowerCase();
    const isPreemptible = sku.indexOf('-PREEMPTIBLE') != -1;
    switch (region) {
      case 'us':
        region = 'us-central1';
        break;
      case 'europe':
        region = 'europe-west1';
        break;
    }
    if (isCud) {
      perHostPrice =
          this.getCUDCost(sku, region, cudTerm) * this.TOTAL_BILLING_HOURS;
    } else {
      if (addSud) {
        const sustainedPriceItem = this.calculateSustainedUseDiscountPrice(
            sku, hoursPerMonth, region, quantity);

        perHostPrice = sustainedPriceItem.totalPrice;
        newItem.items.detailedView = sustainedPriceItem.detailedView;
      } else {
        if (sku.indexOf('CUSTOM') != -1) {
          perHostPrice = this.getCustomVmPrice(sku, region).unitPrice;
        } else if (!isResourceBased) {
          perHostPrice = this.getUnitPrice(sku, region).unitPrice;
        } else {
          perHostPrice = this.getResourceBasedPrice(sku, region).unitPrice;
        }
        perHostPrice = perHostPrice * hoursPerMonth;
      }
    }
    // Add Skylake premium to GCE cost if applicable.
    let reGceCost = quantity * perHostPrice;
    const totalHoursPerMonth = quantity * hoursPerMonth;

    newItem.items.gceCost = reGceCost;

    const ssd = newItem.items.editHook.initialInputs.ssd;
    let ssdCost = 0;
    let ssdPrice = 0;
    if (ssd) {
      ssdPrice = this.getSsdPrice(region, isPreemptible, cudTerm);
      // each ssd solid disk has 375 gb
      ssdCost = ssdPrice * totalHoursPerMonth * ssd * 375;
    }
    let containerCost = 0;
    if (newItem.items.containerCost) {
      containerCost = newItem.items.containerCost;
    }

    const gpuCost = newItem.items.gpuCost || 0;

    let os = newItem.items.editHook.initialInputs.os || '';
    if (isCud && os.indexOf('sles-sap-1') > -1) {
      os = `${os}-cud-${cudTerm}-year`;
    }
    const numberOfGPUs = gpuCost ? newItem.items.gpuCount : 0;
    const osPrice = os === 'free' ? 0 : this.getOsPrice(os, sku, numberOfGPUs);
    const osCost = osPrice * totalHoursPerMonth;
    newItem.items.osCost = osCost;

    // TODO: add norm recalc
    const extendedMemoryCost = newItem.items.extendedMemoryCost !== undefined ?
        newItem.items.extendedMemoryCost :
        0;

    if (isCud && extendedMemoryCost) {
      reGceCost += extendedMemoryCost;
    }

    newItem.items.extendedMemoryCost = extendedMemoryCost;
    const nvidiaGridCost = newItem.items.nvidiaGridCost || 0;
    const publicIpPrice = newItem.items.publicIpPrice || 0;
    newItem.price = reGceCost + osCost + ssdCost + containerCost + gpuCost +
        nvidiaGridCost + publicIpPrice;
  }

  if (newItem.sku.indexOf('CP-COMPUTEENGINE-VMIMAGE') != -1 && recalc &&
      newItem.items.editHook.product === 'soleTenant') {
    const quantity = newItem.items.editHook.initialInputs.nodesCount;
    /**
     * Calculate the days / month based on average 4.3 weeks in a month
     * @type {number}
     */
    const hoursPerMonth = newItem.quantity / quantity;
    let perHostPrice = 0;
    const region = newItem.items.editHook.initialInputs.location;
    const cudTerm = newItem.items.editHook.initialInputs.cud;
    const isCud = typeof cudTerm === 'number' && cudTerm > 0;

    if (isCud) {
      perHostPrice = this.getCUDCost(
                         newItem.sku, region, cudTerm,
                         newItem.items.editHook.initialInputs) *
          this.TOTAL_BILLING_HOURS;
    } else {
      const sustainedPriceItem = this.calculateSustainedUseDiscountPrice(
          newItem.sku, hoursPerMonth, region, quantity,
          newItem.items.editHook.initialInputs);

      perHostPrice = sustainedPriceItem.totalPrice;
      newItem.items.detailedView = sustainedPriceItem.detailedView;
    }
    // Add Skylake premium to GCE cost if applicable.
    let reGceCost = quantity * perHostPrice;
    // Re-calculation of gpuCost and ssdCost
    let reGpuCost = 0;
    /** @const {string} */
    const gpuType = newItem.items.gpuType || '';
    const gpuCount = newItem.items.gpuCount * newItem.quantity;
    let isGpuCommitted = false;
    if (newItem.items.editHook.initialInputs.addGPUs &&
        newItem.items.editHook.initialInputs.nodeType ==
            'CP-COMPUTEENGINE-VMIMAGE-N1-NODE-96-624') {
      let gpuSKU = this.BASE_GPU_SKU + gpuType;
      if (newItem.items.isCud &&
          this.checkForCommitment(
              gpuSKU, newItem.items.editHook.initialInputs.cudTerm)) {
        isGpuCommitted = true;
        gpuSKU = gpuSKU + '-CUD-' +
            newItem.items.editHook.initialInputs.cudTerm + '-YEAR';
      }
      reGpuCost = this.calculateItemPrice(gpuSKU, gpuCount, region, 0);
      if (newItem.items.sustainedUse) {
        reGpuCost = reGpuCost * (1 - newItem.items.sustainedUseDiscount);
      } else if (newItem.items.isCud && !isGpuCommitted) {
        reGpuCost = reGpuCost * 0.7;
      }
    }


    const ssd = newItem.items.ssd;
    const ssdPrice = this.getSsdPrice(region, false, 0);
    // each ssd solid disk has 375 gb
    let reSsdCost = ssdPrice * newItem.quantity * ssd * 375;
    newItem.items.gceCost = reGceCost;
    newItem.items.gpuCost = reGpuCost;

    newItem.price = reGceCost + reSsdCost + reGpuCost;
  }
  if (newItem.sku.indexOf('CP-COMPUTEENGINE-VMIMAGE') != -1 && recalc &&
      newItem.items.editHook.product === 'containerEngine') {
    let hoursPerMonth = newItem.items.hoursPerMonth;
    const quantity = newItem.items.editHook.initialInputs.quantity;
    let cores = 0;
    const ram = newItem.items.editHook.initialInputs.custom.ram;
    const family = newItem.items.editHook.initialInputs.series.toUpperCase();
    /**
     * @type {string}
     */
    let sku = newItem.items.editHook.initialInputs.instance;
    /** @const {string} */
    const PB_SKU = '-PREEMPTIBLE';
    if (sku == 'custom') {
      cores = newItem.items.editHook.initialInputs.custom.cpu;
      sku = `CP-COMPUTEENGINE-VMIMAGE-${family}-CUSTOM-${cores}-${
                ram * this.TB_TO_GB}`
                .toUpperCase();
      if (newItem.items.isMemoryExtended) {
        sku = sku + '-EXTENDED';
      }
    }
    cores = cores > 0 ? cores : this.getCoresNumber(sku);
    /**
     * @type {string}
     */
    const region = newItem.items.editHook.initialInputs.location;
    /**
     * @type {number}
     */
    let perHostPrice = 0;
    const cudTerm = newItem.items.editHook.initialInputs.cud;
    /** @type {boolean} */
    const isCud = newItem.items.isCud;
    let sustainedUse = false;
    let isPreemptible = newItem.items.isPreemptible;
    let sustainedPriceItem = {};
    let sustainedUseDiscount = null;
    if (isCud && !newItem.items.isCudDisabled) {
      hoursPerMonth = this.TOTAL_BILLING_HOURS;
      perHostPrice = this.getCUDCost(sku, region, cudTerm) * hoursPerMonth;
    } else {
      if (isPreemptible) {
        sku = sku + PB_SKU;
      }
      sustainedPriceItem = this.calculateSustainedUseDiscountPrice(
          sku, hoursPerMonth, region, quantity);

      perHostPrice = sustainedPriceItem.totalPrice;
      sustainedUseDiscount = sustainedPriceItem.cumulativeDiscount;
      if ((hoursPerMonth >
           this.getSustainedUseBase() * this.TOTAL_BILLING_HOURS) &&
          !isPreemptible && sustainedUseDiscount > 0) {
        sustainedUse = true;
      }
    }
    const totalHoursPerMonth = quantity * hoursPerMonth;

    // Calculate Os price and cost
    let os = newItem.items.editHook.initialInputs.os || '';
    const osPrice = os === 'free' ? 0 : this.getOsPrice(os, sku);
    const osCost = osPrice * totalHoursPerMonth;
    newItem.items.osCost = osCost;

    // Calculate GPU cost
    let gpuCost = 0;
    let nvidiaGridCost = 0;
    /** @const {string} */
    const gpuType = newItem.items.editHook.initialInputs.gpuType || '';
    const gpuCount = newItem.items.gpuCountVailCount;
    let isGpuCommitted = false;
    if (newItem.items.editHook.initialInputs.addGPUs &&
        !(newItem.items.lockGpu || newItem.items.isSharedInstance) &&
        !newItem.items.isGpuAvailableForRegion) {
      let gpuSKU = this.BASE_GPU_SKU + gpuType;
      if (isPreemptible) {
        gpuSKU = gpuSKU + PB_SKU;
      }
      if (isCud && this.checkForCommitment(gpuSKU, cudTerm)) {
        isGpuCommitted = true;
        gpuSKU = gpuSKU + '-CUD-' + cudTerm + '-YEAR';
      }
      gpuCost = this.calculateItemPrice(gpuSKU, gpuCount, region, 0);
      if (sustainedUse) {
        gpuCost = gpuCost * (1 - sustainedUseDiscount);
      } else if (isCud && !isGpuCommitted) {
        gpuCost = gpuCost * 0.7;
      }
      // calculate grid costs
      if (newItem.items.editHook.initialInputs.enableGrid &&
          gpuType != 'NVIDIA_TESLA_K80' && gpuType != 'NVIDIA_TESLA_V100') {
        nvidiaGridCost = this.calculateItemPrice(
            'GPU_NVIDIA_GRID_LICENSE', gpuCount, region, 0);
      }
    }
    // Calculate the total price
    let gceCost = quantity * perHostPrice;
    /** @type {number} */
    const zonalClusters = Math.max(
        0, (newItem.items.editHook.initialInputs.zonalClusterCount || 0) - 1);
    const regionalClusters =
        newItem.items.editHook.initialInputs.regionalClusterCount || 0;
    const containerPrice = this.calculateItemPrice(
        'CP-GKE-CONTAINER-MANAGMENT-COST', zonalClusters + regionalClusters,
        'us', 0);
    const containerCost = containerPrice * hoursPerMonth;
    /** @type {number} */
    const ssd = newItem.items.editHook.initialInputs.ssd;
    const ssdPrice = this.getSsdPrice(region, isPreemptible, cudTerm);
    // each ssd solid disk has 375 gb
    const ssdCost = ssdPrice * totalHoursPerMonth * ssd * 375;
    // Calculate the Extended Memory cost.
    let extendedMemoryCost = 0;
    if ((['n1', 'n2', 'n2d'].includes(
            newItem.items.editHook.initialInputs.series)) &&
        newItem.items.isMemoryExtended) {
      extendedMemoryCost =
          (this.getExtendedCost(sku, region, family) * totalHoursPerMonth);
      if (sustainedUse) {
        extendedMemoryCost = extendedMemoryCost * (1 - sustainedUseDiscount);
      }
      if (isCud) {
        let maxSud = this.getMaxSudForSeries(family);
        extendedMemoryCost = extendedMemoryCost * maxSud;
        gceCost += extendedMemoryCost;
      }
    }
    // Calculate the total price
    const totalPrice =
        gceCost + ssdCost + containerCost + gpuCost + nvidiaGridCost + osCost;
    newItem.price = totalPrice;
  }

  if (newItem.sku.indexOf('CP-CLOUDSQL') != -1 && recalc) {
    var billingType = newItem.items.editHook.initialInputs.billing;

    // If they go over 15 hours, default to the package plan
    if (billingType == 'peruse' &&
        newItem.items.editHook.initialInputs.hours >= 15) {
      billingType = 'package';
    }

    var sku = newItem.sku;

    // Calculate the days / month based on average 4.3 weeks in a month
    var quantity = 0;
    if (billingType == 'peruse') {
      quantity = newItem.items.editHook.initialInputs.hours *
          (newItem.items.editHook.initialInputs.days * this.WEEKS);
    } else {
      quantity = newItem.items.editHook.initialInputs.days * this.WEEKS;
    }

    // Calculate the sku cost
    var skuData = this.cloudSkuData[sku];
    var price = quantity * skuData['us'];

    // Add the storage cost
    skuData = this.cloudSkuData['CP-CLOUDSQL-STORAGE'];
    var sqlStorage = newItem.items.editHook.initialInputs.storage.value ||
        newItem.items.editHook.initialInputs.storage;
    price += sqlStorage * skuData['us'];

    // Add I/O estimates : light: 1%, heavy: 10% of the bill
    /*var io = 0;
    if (newItem.items.editHook.initialInputs.io !== 'light' ||
        newItem.items.editHook.initialInputs.io !== 'heavy') {
      io = newItem.items.editHook.initialInputs.io;
    }
    var ioPrice = this.cloudSkuData['CP-CLOUDSQL-IO']['us'];
    var ioCost = io * (ioPrice / 1000000) * (365 / 12);
    price += ioCost;*/

    var instanceCount = newItem.items.editHook.initialInputs.instanceCount || 1;

    newItem.price = price * instanceCount;
  }

  if (newItem.sku.indexOf('CP-DB-') != -1 && recalc) {
    var haMultiplier = 1;
    var hoursPerMonth = newItem.quantity;
    /** @type {string} */
    var sku = newItem.sku;
    var region = newItem.items.editHook.initialInputs.location || 'us-central1';
    var instanceCount = newItem.items.editHook.initialInputs.instanceCount || 1;
    if (newItem.items.editHook.initialInputs.includeHA) {
      haMultiplier = 2;
    }

    // Calculate instance price first
    /** @type {number}*/
    var instancePrice = this.calculateItemPrice(sku, hoursPerMonth, region);
    let price = instancePrice * haMultiplier;
    // Add the storage cost
    var storage = newItem.items.editHook.initialInputs.storage.value;
    var storageType = newItem.items.editHook.initialInputs.storageType || 'SSD';
    var storageSku = 'CP-CLOUDSQL-STORAGE-' + storageType;
    var skuData = this.cloudSkuData[storageSku];
    price += storage * skuData[region] * haMultiplier;
    // Add backup cost
    var backup = newItem.items.editHook.initialInputs.backup.value;
    skuData = this.cloudSkuData['CP-CLOUDSQL-BACKUP'];
    price += backup * skuData[region];
    newItem.price = price * instanceCount;
  }

  if (newItem.sku.indexOf('CP-BIGQUERY-GENERAL') != -1 && recalc) {
    var price = this.calculateBigQueryPrice(newItem.items, newItem.region);
    newItem.price = price;
  }
  if (newItem.sku.indexOf('CP-SECURITY-COMMAND-CENTER') != -1 && recalc) {
    let price = 0;
    if (newItem.items.tierType == 'PREMIUM') {
      const spend = this.cloudSkuData[newItem.sku]['us'];
      price = Math.max(25000, spend * 0.05) / 12 * newItem.items.dataVolume;
    } else {
      price =
          this.calculateItemPrice(newItem.sku, newItem.items.dataVolume, 'us');
    }
    newItem.price = price;
  }
  if (newItem.sku.indexOf('BIG_QUERY_FLAT_RATE_ANALYSIS') != -1 && recalc) {
    let price = this.calculateBigQueryPrice(newItem.items, newItem.region);
    price +=
        this.calculateItemPrice(newItem.sku, newItem.quantity, newItem.region);
    newItem.price = price;
  }

  if (newItem.sku.indexOf('CP-BIGTABLE') != -1 && recalc) {
    /** @type {number} */
    let hours = 0;
    switch (newItem.items.editHook.initialInputs.timeType) {
      case 'hours':
        hours = newItem.items.editHook.initialInputs.hours;
        break;
      case 'minutes':
        hours = newItem.items.editHook.initialInputs.minutes / 60;
        break;
      case 'days':
        hours = newItem.items.editHook.initialInputs.daysMonthly * 24;
        break;
    }

    /** @type {number} */
    const hoursMultiplier =
        newItem.items.editHook.initialInputs.timeMode == 'day' ?
        newItem.items.editHook.initialInputs.days * this.WEEKS :
        1;
    /**  @type {number} */
    const hoursPerMonth = hours * hoursMultiplier;

    let nodes = newItem.items.editHook.initialInputs.nodes;
    const location = newItem.region;
    let ssd = newItem.items.editHook.initialInputs.ssd.value ||
        newItem.items.editHook.initialInputs.ssd;
    let hdd = newItem.items.editHook.initialInputs.hdd.value ||
        newItem.items.editHook.initialInputs.hdd;
    /** @type {number} */
    let totalPrice = 0;

    if (nodes) {
      // nodes are charged per hour
      nodes *= hoursPerMonth;
      totalPrice +=
          this.calculateItemPrice('CP-BIGTABLE-NODES', nodes, location);
    }

    if (ssd && !angular.isObject(ssd)) {
      ssd *= this.TB_TO_GB;
      totalPrice += this.calculateItemPrice('CP-BIGTABLE-SSD', ssd, location);
    }

    if (hdd && !angular.isObject(hdd)) {
      hdd *= this.TB_TO_GB;
      totalPrice += this.calculateItemPrice('CP-BIGTABLE-HDD', hdd, location);
    }
    newItem.price = totalPrice;
  }

  if (newItem.sku.indexOf('CP-FUNCTIONS') != -1 && recalc) {
    var invocationsCount =
        newItem.items.editHook.initialInputs.invocationsCount;
    var gbSeconds = newItem.items.gbSeconds;
    var ghzSeconds = newItem.items.ghzSeconds;
    var bandwidth = newItem.items.bandwidth;
    /** @type {number} */
    var totalPrice = 0;

    if (gbSeconds) {
      totalPrice +=
          this.calculateItemPrice('CP-FUNCTIONS-GB-SECONDS', gbSeconds, 'us');
    }

    if (ghzSeconds) {
      totalPrice +=
          this.calculateItemPrice('CP-FUNCTIONS-GHZ-SECONDS', ghzSeconds, 'us');
    }

    if (invocationsCount) {
      totalPrice += this.calculateItemPrice(
          'CP-FUNCTIONS-EXECUTIONS', invocationsCount, 'us');
    }

    if (bandwidth) {
      totalPrice +=
          this.calculateItemPrice('CP-FUNCTIONS-BW-O', bandwidth, 'us');
    }
    newItem.price = totalPrice;
  }

  if (newItem.sku.indexOf('CP-DATAFLOW') != -1 && recalc) {
    const jobType = newItem.items.editHook.initialInputs.jobType;
    let sku = newItem.items.editHook.initialInputs.workerType;
    const gpuCount = newItem.items.gpuCount;
    const gpuType = newItem.items.gpuType;
    /** @type {number} */
    const vcpuCount = newItem.items.vcpuHours;
    const memoryCount = newItem.items.ramHours;
    /** @type {number} */
    const storage = newItem.items.storageHours;
    const dataProcessed = newItem.items.dataProcessed;
    // Check for 'region' to be backward compatibile with older saved estimates.
    /** @type {string} */
    let region = newItem.items.editHook.initialInputs.location ||
        newItem.items.editHook.initialInputs.region || 'us';
    if (region.toLowerCase() == 'us') {
      region = 'us-central1';
    } else if (region.toLowerCase() == 'europe') {
      region = 'europe-west1';
    } else if (region.toLowerCase() == 'asia') {
      region = 'asia-east1';
    }
    newItem.items.editHook.initialInputs.location = region;
    newItem.region = region;
    /** @type {string} */
    const storageType = newItem.items.editHook.initialInputs.storageType;
    /** @type {number} */
    let totalPrice = 0;
    /** @type {string} */
    const basicSku = 'CP-DATAFLOW-' + jobType.toUpperCase();
    // Firstly add vCPU's cost.
    /** @type {string} */
    const vcpuSku = basicSku + '-VCPU';
    totalPrice += this.calculateItemPrice(vcpuSku, vcpuCount, region);
    // Than add memory cost.
    /** @type {string} */
    const memorySku = basicSku + '-MEMORY';
    totalPrice += this.calculateItemPrice(memorySku, memoryCount, region);
    // Data processing cost
    const dataProcessedCost = this.calculateItemPrice(
      `${basicSku}-DATA-PROCESSED`, dataProcessed, region);
    totalPrice += dataProcessedCost;
    // After that add storage cost.
    /** @type {string} */
    const storageSku = basicSku + '-STORAGE-' + storageType.toUpperCase();
    totalPrice += this.calculateItemPrice(storageSku, storage, region);
    // Calculate GPU cost
    if (newItem.items.editHook.initialInputs.addGPUs) {
      const gpuSKU = this.BASE_DATAFLOWGPU_SKU + gpuType;
      totalPrice += this.calculateItemPrice(gpuSKU, gpuCount, region, 0);
    }
    newItem.price = totalPrice;
  }

  if (newItem.sku.indexOf('CP-CLOUD-RUN') != -1 && recalc) {
    newItem.price = newItem.oldPrice;
  }

  if (newItem.sku.indexOf('CP-CERTIFICATE-AUTHORITY') != -1 && recalc) {
    const numberOfCaSkuData = this.cloudSkuData[newItem.items.numberOfCaSku];
    const caFeePrice = numberOfCaSkuData['us'] * newItem.items.numberOfCa;
    const certificatePrice = this.calculateItemPrice(
        newItem.items.certificateSku, newItem.items.totalCertificates);
    const totalPrice = caFeePrice + certificatePrice;
    newItem.price = totalPrice;
  }

  if (newItem.sku.indexOf('CP-PREMIUM-SUPPORT') != -1 && recalc) {
    newItem.price = newItem.oldPrice;
  }
  if (newItem.sku.indexOf('CP-ENHANCED-SUPPORT') != -1 && recalc) {
    let gcpUsage = newItem.items.gcpUsage;
    let gSuiteUsage = newItem.items.gSuiteUsage;
    newItem.price =
        this.calculateSupportPrice(newItem.sku, gcpUsage, gSuiteUsage);
  }
  if (newItem.sku.indexOf('CP-STANDARD-SUPPORT') != -1 && recalc) {
    let gcpUsage = newItem.items.gcpUsage;
    newItem.price = this.calculateSupportPrice(newItem.sku, gcpUsage);
  }
  if (newItem.sku.indexOf('CP-CLOUDFORSQLSERVER-JOB') != -1 && recalc) {
    let haMultiplier = 1;
    if (newItem.items.editHook.initialInputs.includeHA) {
      haMultiplier = 2;
    }
    const licence = newItem.items.editHook.initialInputs.dataBaseVersion;
    const region = newItem.items.editHook.initialInputs.location;
    const coreCount = newItem.items.editHook.initialInputs.core;
    const hoursPerMonth = newItem.quantity;
    const licenceSku = 'CP-CLOUDSQLSERVER-LICENCING-' + licence.toUpperCase();
    // Instances with fewer than 4 vCPUs will be charged for SQL Server at 4
    // times the license rate.
    let vcpuQuantity = Math.max(4, coreCount);
    // Calculate the license price
    let cud = newItem.items.editHook.initialInputs.cud;
    let cudSKu = '';
    if (cud > 0) {
      cudSKu = `-CUD-${cud}-YEAR`;
    }
    let licencePrice = this.calculateItemPrice(
        licenceSku, vcpuQuantity * hoursPerMonth, region);
    const vcpuPrice = this.calculateItemPrice(
        'CP-CLOUDSQLSERVER-VCPU' + cudSKu,
        coreCount * hoursPerMonth * haMultiplier, region);
    const memoryPrice = this.calculateItemPrice(
        'CP-CLOUDSQLSERVER-MEMORY' + cudSKu,
        newItem.items.editHook.initialInputs.memory.value * hoursPerMonth *
            haMultiplier,
        region);
    const storagePrice = this.calculateItemPrice(
        'CP-CLOUDSQLSERVER-STORAGE', newItem.items.storage * haMultiplier,
        region);
    const backupPrice = this.calculateItemPrice(
        'CP-CLOUDSQLSERVER-BACKUP', newItem.items.backup * haMultiplier,
        region);
    newItem.price =
        (licencePrice + vcpuPrice + memoryPrice + storagePrice + backupPrice) *
        newItem.items.editHook.initialInputs.instance;
  }

  if (newItem.sku.indexOf('CP-ML') != -1 && recalc) {
    newItem.price = newItem.oldPrice;
  }

  if (newItem.sku.indexOf('-PROF-') != -1 && recalc) {
    newItem.price = newItem.oldPrice;
  }

  if (newItem.sku.indexOf('CP-CUD') != -1 && recalc) {
    newItem.price = newItem.oldPrice;
  }

  if (newItem.sku.indexOf('CP-CLOUD-TPU') != -1 && recalc) {
    newItem.price = this.calculateItemPrice(
        newItem.sku, newItem.quantity, newItem.region, 0);
  }

  if (newItem.sku.indexOf('CP-SPANNER-GENERAL') != -1 && recalc) {
    newItem.price = newItem.oldPrice;
  }

  if (newItem.sku.indexOf('CP-GKE-AUTOPILOT') != -1 && recalc) {
    newItem.price = newItem.oldPrice;
  }

  if (newItem.sku.indexOf('CP-CONTAINER-BUILD-TIME-') != -1 && recalc) {
    newItem.price = newItem.oldPrice;
    // this.calculateItemPrice(newItem.sku, newItem.quantity, newItem.region);
  }

  if (newItem.sku.indexOf('CP-COMPOSER') != -1 && recalc) {
    newItem.price = newItem.oldPrice;
    // this.calculateItemPrice(newItem.sku, newItem.quantity, newItem.region);
  }
  if (newItem.sku.indexOf('CP-ORBITERA') != -1 && recalc) {
    newItem.price = newItem.oldPrice;
    // this.calculateItemPrice(newItem.sku, newItem.quantity, newItem.region);
  }

  if (newItem.sku.indexOf('CP-NETWORK-SERVICES-CLOUD-NAT') != -1 && recalc) {
    let location = 'us';
    let lbCloudGateways = newItem.items.editHook.initialInputs.cloudNatGateways;
    let lbTrafficProcessed = newItem.items.trafficProcessed;
    var cloudGatewayLowVmNumbersku =
        'CP-NETWORK-SERVICES-CLOUD-NAT-GATEWAY-UPTIME-LOW-VM-NUMBER';
    let cloudGatewayHighVmNumbersku =
        'CP-NETWORK-SERVICES-CLOUD-NAT-GATEWAY-UPTIME-HIGH-VM-NUMBER';
    let trafficProcessedPrice = this.calculateItemPrice(
        'CP-NETWORK-SERVICES-CLOUD-NAT-TRAFFIC', lbTrafficProcessed, location);

    let totalPrice = 0;
    let instancePrice = 0;

    if (lbCloudGateways <= 32) {
      instancePrice =
          this.calculateItemPrice(
              cloudGatewayLowVmNumbersku, lbCloudGateways, location) *
          this.TOTAL_BILLING_HOURS;
    } else {
      instancePrice =
          (this.calculateItemPrice(
               cloudGatewayHighVmNumbersku, lbCloudGateways, location) /
           lbCloudGateways) *
          this.TOTAL_BILLING_HOURS;
    }
    totalPrice = instancePrice + trafficProcessedPrice;
    newItem.price = totalPrice;
  }

  if (newItem.sku.indexOf('CP-NETWORK-SERVICES-CLOUD-ARMOR') != -1 && recalc) {
    let policiesVal = Number(newItem.items.editHook.initialInputs.policies);
    let rulesVal = Number(newItem.items.editHook.initialInputs.rules);
    let requests = newItem.items.valueInMillions;
    // converted total number of requests measured per million
    let requestsPerMillion = requests / 1000000;
    let location = 'us';
    let armorPolicyPrice = this.calculateItemPrice(
        'CP-NETWORK-SERVICES-CLOUD-ARMOR-POLICY', policiesVal, location);
    let armorRulePrice = this.calculateItemPrice(
        'CP-NETWORK-SERVICES-CLOUD-ARMOR-RULE', rulesVal, location);
    let armorRequestsPrice = this.calculateItemPrice(
        'CP-NETWORK-SERVICES-CLOUD-ARMOR-REQUESTS', requestsPerMillion,
        location);
    let totalPrice = armorPolicyPrice + armorRulePrice + armorRequestsPrice;
    newItem.price = totalPrice;
  }

  if (newItem.sku.indexOf('CP-DEDICATED-INTERCONNECTVPN') != -1 && recalc) {
    /** @type {number} */
    let tenGbitCost = this.calculateItemPrice(
        'CP-INTERCONNECTVPN-DEDICATED-CIRCUIT-10GB',
        newItem.items.editHook.initialInputs.tenGbitInterconnect,
        newItem.items.editHook.initialInputs.tenGbitInterconnectRegion);
    /** @type {number} */
    let hundredGbitCost = this.calculateItemPrice(
        'CP-INTERCONNECTVPN-DEDICATED-CIRCUIT-100GB',
        newItem.items.editHook.initialInputs.hundredGbitInterconnect,
        newItem.items.editHook.initialInputs.hundredGbitInterconnectRegion);
    /** @type {number} */
    let interconnectAttachmentCost = this.calculateItemPrice(
        'CP-INTERCONNECTVPN-ATTACHMENT',
        newItem.items.editHook.initialInputs.interconnectAttachment *
            this.TOTAL_BILLING_HOURS,
        newItem.items.editHook.initialInputs.interconnectAttachmentRegion);
    newItem.price =
        (tenGbitCost + hundredGbitCost + interconnectAttachmentCost);
  }

  if (newItem.sku.indexOf('CP-PARTNER-INTERCONNECTVPN') != -1 && recalc) {
    let partnerAttachment = Number(
        newItem.items.editHook.initialInputs.partnerInterconnectAttachment);
    let attachments = newItem.items.editHook.initialInputs.numberOfAttachments;
    let totalPrice = attachments * partnerAttachment * this.TOTAL_BILLING_HOURS;
    newItem.price = totalPrice;
  }

  if (newItem.sku.indexOf('CP-RECOMMENDATIONS-AI') != -1 && recalc) {
    const predictionRequests = Number(newItem.items.predictionRequests);
    const trainingNodeHours = Number(newItem.items.trainingNodeHours);
    const tunningNodeHours = Number(newItem.items.tunningNodeHours);
    let totalPrice = null;
    if (predictionRequests > 0) {
      totalPrice += this.calculateTieredSKUPrice(
          'CP-RECOMMENDATIONS-AI-PREDICTIONS', predictionRequests);
    }
    if (trainingNodeHours > 0) {
      totalPrice += this.calculateItemPrice(
          'CP-RECOMMENDATIONS-AI-TRAINING', trainingNodeHours, 'us');
    }
    if (tunningNodeHours > 0) {
      totalPrice += this.calculateItemPrice(
          'CP-RECOMMENDATIONS-AI-TRAINING', tunningNodeHours, 'us');
    }
    newItem.price = totalPrice;
  }


  if (newItem.sku.indexOf('CP-VPN') != -1 && recalc) {
    let vpn = newItem.quantity;
    let location = newItem.region;
    let totalPrice = this.calculateItemPrice('CP-VPN', vpn, location);
    newItem.price = totalPrice;
  }

  if (newItem.sku.indexOf('CP-VMWARE-') != -1 && recalc) {
    const quantity = newItem.quantity;
    const sku = newItem.sku;
    const region = newItem.region;
    const totalPrice = this.calculateItemPrice(sku, quantity, region);
    newItem.price = totalPrice;
  }

  if (newItem.sku.indexOf('CP-SECRET-MANAGER') != -1 && recalc) {
    const location = 'us-central1';
    const activeSecretVersions =
      newItem.items.editHook.initialInputs.activeSecretVersions;
    const accessOperations =
      newItem.items.editHook.initialInputs.accessOperations;
    const rotationNotifications =
      newItem.items.editHook.initialInputs.rotationNotifications;

    const activeSecretVersionsCost = this.calculateItemPrice(
      'CP-SECRET-MANAGER-ACTIVE-SECRET-VERSION', Number(activeSecretVersions),
      location);
    const accessOperationsCost = this.calculateItemPrice(
      'CP-SECRET-MANAGER-ACCESS-OPERATIONS', Number(accessOperations),
      location) / 10000;
    const rotationNotificationsCost = this.calculateItemPrice(
      'CP-SECRET-MANAGER-ROTATION-NOTIFICATIONS', Number(rotationNotifications),
      location);

    const totalPrice = activeSecretVersionsCost + accessOperationsCost +
      rotationNotificationsCost;
    newItem.price = totalPrice;
  }

  if (newItem.sku.indexOf('CP-MEMORYSTORE-REDIS') != -1 && recalc) {
    newItem.price =
        this.calculateItemPrice(newItem.sku, newItem.quantity, newItem.region);
  }

  if (newItem.sku.indexOf('CP-MEMORYSTORE-MEMCACHED') != -1 && recalc) {
    var memcashedSku =
        [newItem.sku, 'VCPU', newItem.items.tier].join('-').toUpperCase();
    var totalPrice = this.calculateItemPrice(
        memcashedSku, newItem.items.vcpuHours, newItem.region, 0);
    memcashedSku =
        [newItem.sku, 'RAM', newItem.items.tier].join('-').toUpperCase();
    totalPrice += this.calculateItemPrice(
        memcashedSku, newItem.items.memoryHours, newItem.region, 0);
    newItem.price = totalPrice;
  }

  if (newItem.sku.indexOf('CP-SPEECH-TO-TEXT') != -1 && recalc) {
    const initialInputs = newItem.items.editHook.initialInputs;
    const location = newItem.region;
    const recognition = initialInputs.recognition;
    const type = initialInputs.model.split('-')[1];
    const dataLogging = initialInputs.dataLogging;
    const sku = dataLogging ?
      `CP-SPEECH-TO-TEXT-${type}-LOGGING` :
      `CP-SPEECH-TO-TEXT-${type}`;

    /*
     * The Speech-to-Text prices are per 15 seconds.
     * Hence we multiply it by 4 (60 sec/15 sec)
     */
    const recognitionCost = this.calculateItemPrice(
      sku, recognition, location) * 4;
    newItem.price = recognitionCost;
  }

  if (newItem.sku.indexOf('CP-BIGSTORE') != -1 && recalc) {
    const location = newItem.region;
    const egressLocation = 'us';
    const storageClass = newItem.items.storageClass;
    const sku = `CP-BIGSTORE-${storageClass.toUpperCase()}`;
    const multiRegionalStorage = newItem.items.multiRegionalStorage;
    const restoreSize = newItem.items.restoreSize;
    const gcsClassAops = newItem.items.gcsClassAops;
    const gcsClassBops = newItem.items.gcsClassBops;
    const egress = newItem.items.egress;
    const addFreeTier = newItem.items.editHook.initialInputs.addFreeTier;
    let storageFreeQuota = 0;
    let gcsClassAopsFreeQuota = 0;
    let gcsClassBopsFreeQuota = 0;
    let multiRegionalStorageCost = 0;
    let gcsClassAopsCost = 0;
    let gcsClassBopsCost = 0;
    let restoreSizeCost = 0;
    let egressCost = 0;
    let totalPrice = 0;

    if (storageClass == 'standard' && addFreeTier &&
        location.indexOf('us-') != -1) {
      storageFreeQuota = 5;
      gcsClassAopsFreeQuota = 5;
      gcsClassBopsFreeQuota = 5;
    }

    multiRegionalStorageCost = this.calculateItemPrice(
      sku, multiRegionalStorage, location, storageFreeQuota);

    if (storageClass != 'standard') {
      restoreSizeCost = this.calculateItemPrice(
      `${sku}-RESTORE-SIZE`, restoreSize, location);
    }

    gcsClassAopsCost = this.calculateItemPrice(
      `${sku}-CLASS-A-REQUEST`, gcsClassAops * 100, location,
      gcsClassAopsFreeQuota);

    gcsClassBopsCost = this.calculateItemPrice(
      `${sku}-CLASS-B-REQUEST`, gcsClassBops * 100, location,
      gcsClassBopsFreeQuota);

    for (const [egressType, egressValue] of Object.entries(egress)) {
      let egressFreeQuota = 0;
      if (storageClass == 'standard' && addFreeTier &&
          egressType != 'AUSTRALIA' && egressType != 'CHINA') {
        egressFreeQuota = 1;
      }

      egressCost += this.calculateItemPrice(
        `CP-STORAGE-EGRESS-${egressType}`, egressValue, egressLocation,
        egressFreeQuota);
    }

    totalPrice = multiRegionalStorageCost + gcsClassAopsCost + gcsClassBopsCost
      + egressCost + restoreSizeCost;
    newItem.price = totalPrice;
  }

  this.totalPrice += newItem.price;
  this.cartData_.add(newItem);

  // check if gold support is included
  if (newItem.sku !== 'CP-SUPPORT-GOLD' || recalc) {
    this.recalculateSupport();
  }

  // If any other item depends on this, recalculate that one
  if (newItem.items.dependedSku) {
    this.recalculateDependedItem(newItem.items.dependedSku);
  }

  return newItem.price;
};

/**
 * Recalculate depended item in the cart. Remove and add it again.
 * @param {string} dependedSku
 */
CloudCalculator.prototype.recalculateDependedItem = function(dependedSku) {
  const cart = this.cartData_.get();
  const dependedItemIndex =
      cart.findIndex(cartItem => cartItem.sku === dependedSku);
  if (dependedItemIndex !== -1) {
    const dependedItem = cart[dependedItemIndex];
    this.cartData_.remove(dependedItemIndex);
    this.addItemToCart(dependedItem);
  }
};

/**
 * Recalculates Gold Support.
 */
CloudCalculator.prototype.recalculateSupport = function() {
  var cart = this.cartData_.get();
  goog.array.forEach(cart, function(item, index) {
    if (item.sku === 'CP-SUPPORT-GOLD') {
      // remove old support item
      this.cartData_.remove(index);
      // add recalculated gold support
      var supportPrice = this.calculateGoldenSupport();
      var supportItem = {
        quantityLabel: '',
        region: 'us',
        displayName: 'Gold',
        sku: 'CP-SUPPORT-GOLD',
        quantity: 1,
        displayDescription: 'Support',
        items: {
          editHook: {
            initialInputs: {type: 'gold'},
            product: 'support',
            tab: 'support'
          }
        }
      };
      this.addItemToCart(supportItem, supportPrice);
    }
  }, this);
};


/**
 * Returns the SKU for a given a machine configuration of cores, and
 * memory.
 * @param {number} cores Number of CPU cores
 * @param {number} memory Amount of memory (RAM)
 * @return {?string} The instance SKU, or null if no SKU found.
 */
CloudCalculator.prototype.getInstanceSKU = function(cores, memory) {
  var instanceSku = null;
  goog.object.forEach(this.cloudSkuData, function(val, sku) {
    if (cores == val.cores && memory == val.memory &&
        sku.indexOf('-PREEMPTIBLE') == -1) {
      instanceSku = sku;
    }
  });
  return instanceSku;
};


/**
 * Gets the supported memory configurations for this cpu.
 * @param {number} selectedCore
 * @return {Array} An array of supported memory configurations.
 */
CloudCalculator.prototype.getSupportedMemory = function(selectedCore) {
  var supportedMemoryArray = [];
  goog.object.forEach(this.cloudSkuData, function(val, sku) {
    if (val.hasOwnProperty('cores') && val.cores == selectedCore) {
      if (supportedMemoryArray.indexOf(val.memory) == -1) {
        supportedMemoryArray.push(val.memory);
      }
    }
  });

  // Sort them numerically ascending
  supportedMemoryArray.sort(function(a, b) {
    return a - b;
  });

  return supportedMemoryArray;
};


/**
 * Gets the cores and memory configurations for this instance.
 * @param {string} sku
 * @return {Object.<string, number>} Cores and memory.
 */
CloudCalculator.prototype.getInstanceParams = function(sku) {
  return {memory: this.getRAMValue(sku), cores: this.getCoresNumber(sku)};
};


/**
 * Gets the supported amount of local SSD devices for this instance.
 * @param {string} sku
 * @return {!Array<number>} Numbers of attached local SSD devices.
 */
CloudCalculator.prototype.getSsds = function(sku) {
  if (!this.cloudSkuData[sku] || !this.cloudSkuData[sku]['ssd']) {
    return [0];
  }

  return this.cloudSkuData[sku]['ssd'];
};


/**
 * Calculates the pricing for BigQuery.
 * @param {Object} items to calculate entered by user
 * @param {string} region Region of the compute resources
 * @return {number} Total monthly price.
 */
CloudCalculator.prototype.calculateBigQueryPrice = function(items, region) {
  var sku = 'CP-BIGQUERY-GENERAL';
  var totalPrice = 0;
  var bqItem = this.cloudSkuData[sku];

  if (bqItem) {
    goog.object.forEach(items, function(val, key) {
      if (bqItem[key]) {
        var quota = bqItem[key]['freequota'];
        var quantity = quota !== undefined ? val - quota['quantity'] : val;

        quantity = quantity > 0 ? quantity : 0;

        if (bqItem[key][region]) {
          totalPrice += bqItem[key][region] * quantity;
        }
      }
    });
  }

  return totalPrice;
};


/**
 * Calculates the pricing for OS.
 * @param {string} os that was chosen
 * @param {string} sku instance that OS would be installed
 * @param {number=} gpuCount number of GPUs
 * @return {number} OS price.
 */
CloudCalculator.prototype.getOsPrice = function(os, sku, gpuCount) {
  let osPrice = 0;
  if (os.startsWith('suse-sap') || os.startsWith('sles-sap')) {
    return this.getFuzzyOsPrice(os, sku);
  }
  if (os === 'ubuntu-pro') {
    return this.getUbuntuProOsPrice(os, sku, gpuCount || 0);
  }
  if (this.cloudSkuData['CP-COMPUTEENGINE-OS']) {
    if (this.cloudSkuData['CP-COMPUTEENGINE-OS'][os]) {
      var osPricing = this.cloudSkuData['CP-COMPUTEENGINE-OS'][os];
      var osCores = osPricing.cores;
      var level = 'high';
      var rate = 1;
      let cores = Math.max(this.getCoresNumber(sku), 1);
      if (sku.match(/F1-micro|G1-small/i)) {
        cores = 'shared';
      }
      if (sku.match(/E2-micro|E2-small|e2-medium/i)) {
        cores = this.cloudSkuData[sku]['cores'];
      }
      var isMinCoresRequested = os.indexOf('sql') > -1;

      if (osCores !== 'shared' && cores !== 'shared') {
        level = parseInt(cores) <= parseInt(osCores) ? 'low' : 'high';
      } else if (cores === 'shared') {
        level = 'low';
      } else {
        level = 'high';
      }
      // add additional windows charge for sql images.
      if (isMinCoresRequested) {
        osPrice += this.getOsPrice('win', sku);
      }

      // Prise could be calculated per core
      if (osPricing.percore) {
        rate = isMinCoresRequested ?
            (parseInt(cores, 10) < parseInt(osCores, 10) || cores == 'shared') ?
            osCores :
            cores :
            cores == 'shared' ? 1 :
                                cores;
      }
      osPrice += osPricing[level] * rate;
    }
  }

  return osPrice;
};


/**
 * Calculates the pricing for OS with more than 2 tiers.
 * @param {string} os that was chosen
 * @param {string} sku that affect os price
 * @return {number} OS price.
 */
CloudCalculator.prototype.getFuzzyOsPrice = function(os, sku) {
  var cores =
      sku.match(/F1-micro|G1-small/i) ? 'shared' : this.getCoresNumber(sku);
  var data = this.cloudSkuData['CP-COMPUTEENGINE-OS'][os];
  var osPrice = 0;
  if (cores === 'shared' || cores <= 2) {
    osPrice = data['low'];
  } else if (cores > 2 && cores < 5) {
    osPrice = data['high'];
  } else {
    osPrice = data['highest'];
  }
  return osPrice;
};


/**
 * Calculates the pricing for Ubuntu Pro OS.
 * @param {string} os that was chosen
 * @param {string} sku that affect os price
 * @param {number} gpuCount number of GPUs
 * @return {number} OS price.
 */
CloudCalculator.prototype.getUbuntuProOsPrice = function(os, sku, gpuCount) {
  let osPrice = 0;
  const cpuCount = this.getCoresNumber(sku);
  const ram = this.getRAMValue(sku);
  const osPricing = this.cloudSkuData['CP-COMPUTEENGINE-OS'][os];

  let isFound = false;
  goog.object.forEach(osPricing['cpu'], function(value, key) {
    const numberOfCpus = Number(key);
    if (cpuCount <= numberOfCpus && !isFound) {
      osPrice += parseFloat(value);
      isFound = true;
    }
  });

  osPrice += ram * parseFloat(osPricing['ram']);

  if (gpuCount > 0) {
    isFound = false;
    goog.object.forEach(osPricing['gpu'], function(value, key) {
      const numberOfGpus = Number(key);
      if (gpuCount <= numberOfGpus && !isFound) {
        osPrice += parseFloat(value);
        isFound = true;
      }
    });
  }

  return osPrice;
};


/**
 * Gets the pricing for Container Engine from pricing JSON.
 * @param {string} mode whether standard or basic.
 * @param {string} region cluster is running.
 * @return {number} Container Engine price.
 */
CloudCalculator.prototype.getContainerPrice = function(mode, region) {
  /** @type {string} */
  var sku = 'CP-CONTAINER-ENGINE-' + mode.toUpperCase();
  /** @type {number} */
  var price = 0;
  if (this.cloudSkuData[sku]) {
    price = this.cloudSkuData[sku][region];
  }
  return price;
};


/**
 * Calculates the pricing for Golden Support.
 * @return {number} Total monthly support price.
 */
CloudCalculator.prototype.calculateGoldenSupport = function() {
  var sku = 'CP-SUPPORT-GOLD';
  var supportPrice = 0;
  var min = this.cloudSkuData[sku]['us'];
  var quantity = this.cartData_.calculateTotalPrice();

  supportPrice = this.calculateTieredSKUPrice(sku, quantity);
  supportPrice = supportPrice > min ? supportPrice : min;

  return supportPrice;
};


/**
 * Calculates the pricing for Premium or Enhanced Support.
 * @param {string} sku support sku name.
 * @param {?number=} gcpUsage monthly gcp usage.
 * @param {?number=} gSuiteUsage monthly gsuit usage.
 * @return {number} Total monthly support price.
 */
CloudCalculator.prototype.calculateSupportPrice = function(
    sku, gcpUsage, gSuiteUsage) {
  let SupportPrice = 0;
  let min = this.cloudSkuData[sku]['us'];
  if (gcpUsage) {
    SupportPrice = this.calculateTieredSKUPrice(sku, gcpUsage);
  }
  if (gSuiteUsage) {
    SupportPrice += this.calculateTieredSKUPrice(sku, gSuiteUsage);
  }
  SupportPrice = SupportPrice + min;
  return SupportPrice;
};

/**
 * Gets number of cores from the SKU.
 * @param {string} sku SKU of current instance.
 * @return {number} Cores quantity.
 */
CloudCalculator.prototype.getCoresNumber = function(sku) {
  /** @type {string} */
  let cores = '';
  if (sku.toUpperCase().indexOf('CUSTOM') == -1) {
    cores = this.cloudSkuData ?
        this.cloudSkuData[sku] && this.cloudSkuData[sku]['cores'] ?
        this.cloudSkuData[sku]['cores'] :
        this.parseSkuWithFamily(sku)['cores'] :
        1;
    return cores === 'shared' ? 1 : parseFloat(cores, 10);
  } else {
    return this.parseCustomSKU(sku)['cores'];
  }
};


/**
 * Gets volume of RAM from the SKU.
 * @param {string} sku SKU of current instance.
 * @return {number} RAM volume.
 */
CloudCalculator.prototype.getRAMValue = function(sku) {
  if (sku.toUpperCase().indexOf('CUSTOM') == -1) {
    return this.cloudSkuData ?
        this.cloudSkuData[sku] && this.cloudSkuData[sku]['memory'] ?
        this.cloudSkuData[sku]['memory'] :
        this.parseSkuWithFamily(sku)['ram'] :
        1;
  } else {
    return this.parseCustomSKU(sku)['ram'];
  }
};


/**
 * Gets cost per vm per hour considering chosen CUD.
 * @param {string} sku SKU of current instance.
 * @param {string} region region where vm is located.
 * @param {string} commitmentTerm term for commitment.
 // TODO figure out better way to achive product Premium functionality
 * @param {?object} product  product to apply specific premium cost
 * @return {number} hourly CUD cost.
 */
CloudCalculator.prototype.getCUDCost = function(
    sku, region, commitmentTerm, product) {
  const cores = this.getCoresNumber(sku);
  const ram = this.getRAMValue(sku);
  let cost = 0;
  const baseSku = 'CP-COMPUTEENGINE-';
  let family = this.getFamilyFromSku(sku);
  family = (family == 'G1' || family == 'F1') ? 'N1' : family;
  if ((sku.indexOf('E2-MICRO') != -1 || sku.indexOf('E2-SMALL') != -1 ||
       sku.indexOf('E2-MEDIUM') != -1)) {
    family = sku.replace('CP-COMPUTEENGINE-VMIMAGE-', '');
    // calculate Shared-core machine cost.
    let newSku = `${baseSku}${family}-CUD-${commitmentTerm}-YEAR`;
    cost = this.calculateItemPrice(newSku, 1, region);
  } else if (sku.indexOf('M2') > 0) {
    let newSku = `${baseSku}${family}-CUD-${commitmentTerm}-YEAR-`;
    cost = this.getMemoryOptimizedCudPrice(sku, newSku, region);
  } else {
    // calculate cores cost.
    let newSku = `${baseSku}${family}-CUD-${commitmentTerm}-YEAR-CPU`;
    cost += this.calculateItemPrice(newSku, cores, region);

    let extendedMemoryVolume = 0;
    if (sku.toLowerCase().indexOf('extended') != -1) {
      extendedMemoryVolume = this.getExtendedMemoryVolume(cores, ram, family);
    }

    // calculate ram cost.
    newSku = `${baseSku}${family}-CUD-${commitmentTerm}-YEAR-RAM`;
    cost += this.calculateItemPrice(newSku, ram - extendedMemoryVolume, region);
  }
  // add Sole Tenancy premium
  let soleTenancyPremium = 0;
  const regex = /N1|N2|M1|M2|C2|N2D/i;
  if (sku.indexOf('VMIMAGE') != -1 && sku.indexOf('NODE') != -1 &&
      sku.match(regex).length != 0) {
    // calculate the Max SUD for sole tenant.
    const maxSud = this.getMaxSudForSeries(family);
    const soleCost = this.getPremiumCost(sku, region, 'SOLE_TENANCY_PREMIUM');
    soleTenancyPremium = soleCost;
    const isCpuOvercommit = product ?
        (product.cpuOvercommit && ['N1', 'N2'].includes(family)) ? true :
                                                                   false :
        false;
    // add cpu-overcommit premium cost.
    soleTenancyPremium += isCpuOvercommit ?
        this.getPremiumCost(
            sku, region, 'SOLE_TENANCY_CPU_OVERCOMMIT_PREMIUM') :
        0;
    soleTenancyPremium = soleTenancyPremium * maxSud;
  }

  return cost + soleTenancyPremium;
};


/**
 * Gets Skylake premium cost for chosen vm per hour.
 * @param {string} sku SKU of current instance.
 * @param {string} region region where vm is located.
 * @return {number} hourly premium cost.
 */
CloudCalculator.prototype.getSkylakePremium = function(sku, region) {
  var cores = this.getCoresNumber(sku);
  var ram = this.getRAMValue(sku);
  var cost = 0;
  var SKYLAKE_SKU = 'CP-COMPUTEENGINE-CPU-PREMIUM-SKYLAKE-PERCENTAGE';
  var EXTENDED_MEM_SKU = 'CP-COMPUTEENGINE-CUSTOM-VM-EXTENDED-RAM';
  var isPredifined = this.cloudSkuData[sku] !== undefined;
  var premium = this.cloudSkuData[SKYLAKE_SKU];
  var skuPrefix = 'CP-COMPUTEENGINE-';
  var corePrice = 0;
  var ramPrice = 0;
  var family = this.getFamilyFromSku(sku);
  var extRamPrice = 0;
  var extendedMemoryVolume = 0;
  if (isPredifined) {
    skuPrefix = skuPrefix + 'PREDEFINED-VM-';
  } else {
    skuPrefix = skuPrefix + 'CUSTOM-VM-';
  }
  if (sku.toLowerCase().indexOf('extended') != -1) {
    extendedMemoryVolume = this.getExtendedMemoryVolume(cores, ram, family);
  }
  if (sku.indexOf('PREEMPTIBLE') == -1) {
    corePrice = this.cloudSkuData[skuPrefix + 'CORE'][region];
    ramPrice = this.cloudSkuData[skuPrefix + 'RAM'][region];
    extRamPrice = this.cloudSkuData[EXTENDED_MEM_SKU][region];
  } else {
    corePrice = this.cloudSkuData[skuPrefix + 'CORE-PREEMPTIBLE'][region];
    ramPrice = this.cloudSkuData[skuPrefix + 'RAM-PREEMPTIBLE'][region];
    extRamPrice = this.cloudSkuData[EXTENDED_MEM_SKU + '-PREEMPTIBLE'][region];
  }

  cost = cores * corePrice * premium['cpu'] +
      (ram - extendedMemoryVolume) * ramPrice * premium['ram'] +
      extendedMemoryVolume * extRamPrice * premium['ram'];

  return cost;
};


/**
 * Checks if item has legacy region and fixes it to new one.
 * @param {!cloudpricingcalculator.SkuData} item an item to be checked.
 * @private
 */
CloudCalculator.prototype.checkLegasyRegion_ = function(item) {
  var skuData = this.cloudSkuData[item.sku];
  var region = item.region;
  if (skuData && (region === 'us' || region == 'europe' || region == 'asia') &&
      skuData['europe-west1'] && item.sku.indexOf('BIGSTORE') == -1 &&
      item.sku.indexOf('BIG_QUERY_FLAT_RATE_ANALYSIS') == -1) {
    // TODO remove this bs and create normal method;
    switch (region) {
      case 'us':
        skuData['us'] == skuData['us-central1'] ? item.region = 'us-central1' :
                                                  item.region = 'us';
        break;
      case 'europe':
        skuData['europe'] == skuData['europe-west1'] ?
            item.region = 'europe-west1' :
            item.region = 'europe';
        break;
      case 'asia':
        skuData['asia'] == skuData['asia-east1'] ? item.region = 'asia-east1' :
                                                   item.region = 'asia';
        break;
    }
  }
};


/**
 * Checks gce item for being legacy and updates it to up to date state if
 * needed.
 * @param {!cloudpricingcalculator.SkuData} item gce sku item
 * @private
 */
CloudCalculator.prototype.sanitizeLegacyObject_ = function(item) {
  var sku = item.sku;
  if (sku.indexOf('CP-COMPUTEENGINE-VMIMAGE-CUSTOM') != -1) {
    // Old-school custom SKUs do not contain instance family in it. This
    // function checks if it is old one and adds N1 default family.
    var parsedSku =
        sku.replace('CP-COMPUTEENGINE-VMIMAGE-CUSTOM-', '').split('-');
    sku = `CP-COMPUTEENGINE-VMIMAGE-N1-CUSTOM-${parsedSku[0]}-${
        parsedSku[1] * this.TB_TO_GB}`;
    var additions = parsedSku.slice(2);
    if (additions.length) {
      additions.unshift(sku);
      sku = additions.join('-');
    }
    item.sku = sku;
    item.items.editHook.initialInputs.family = 'gp';
    item.items.editHook.initialInputs.series = 'n1';
    item.items.editHook.initialInputs.instance = sku;
  } else if (
      sku.indexOf('N1-MEGAMEM') != -1 || sku.indexOf('N1-ULTRAMEM') != -1) {
    // Changes Megamem and Ultramem family to M1.
    sku = sku.replace('N1', 'M1');
    item.sku = sku;
    item.items.editHook.initialInputs.family = 'memory';
    item.items.editHook.initialInputs.series = 'm1';
    item.items.editHook.initialInputs.instance = sku;
  }
};


/**
 * Gets type from instance SKU.
 * @param {string} sku SKU of current instance.
 * @return {string} instance type.
 * @export
 */
CloudCalculator.prototype.getInstanceType = function(sku) {
  var type = sku.replace('CP-COMPUTEENGINE-VMIMAGE-N1-', '')
                 .split('-')[0]
                 .toLowerCase();
  return type;
};


/**
 * Gets list of supported regions for chosen GPU type.
 * @param {string} gpu GPU type.
 * @param {string} baseGpuSku base GPU SKU.
 * @return {!Array<string>} list of supported regions.
 * @export
 */
CloudCalculator.prototype.getGpuRegionList = function(gpu, baseGpuSku) {
  const sku = baseGpuSku + gpu;
  const skuData = this.cloudSkuData[sku];
  let result = [];
  goog.object.forEach(skuData, function(val, key) {
    if (val > 0) {
      result.push(key);
    }
  });
  return result;
};

/**
 * Gets list of supported regions for Cud instance.
 * @param {string} instance instance type.
 * @return {!Array<string>} list of supported regions.
 * @export
 */
CloudCalculator.prototype.getCudRegionList = function(instance) {
  const sku = 'CP-' + instance.toUpperCase() + '-CUD-1-YEAR';
  const skuData = this.cloudSkuData[sku];
  let result = [];
  goog.object.forEach(skuData, function(val, key) {
    if (val > 0) {
      result.push(key);
    }
  });
  return result;
};

/**
 * Gets list of supported regions for a generic instance.
 * @param {string} instance instance type.
 * @return {!Array<string>} list of supported regions.
 * @export
 */
CloudCalculator.prototype.getSupportedRegionList = function(instance) {
  const sku = instance.toUpperCase();
  const skuData = this.cloudSkuData[sku];
  let result = [];
  goog.object.forEach(skuData, function(val, key) {
    if (val > 0) {
      result.push(key);
    }
  });
  return result;
};

/**
 * Gets list of supported regions for GCE family machines.
 * @param {string} series instance series.
 * @param {region} region instance region.
 * @return {boolean} list of supported regions.
 * @export
 */
CloudCalculator.prototype.isSkuAvailableInRegion = function(series, region) {
  var sku = `CP-COMPUTEENGINE-${series.toUpperCase()}-PREDEFINED-VM-CORE`;
  var skuData = this.cloudSkuData[sku];
  if (!skuData) {
    return false;
  }
  return skuData[region] > 0;
};


/**
 * Gets list of supported regions for chosen High CPU vms.
 * @return {!Array<string>} list of supported regions.
 * @export
 */
CloudCalculator.prototype.getHighCpuRegionList = function() {
  var sku = 'CP-COMPUTEENGINE-VMIMAGE-N1-MEGAMEM-96';
  var skuData = this.cloudSkuData[sku];
  var result = [];
  goog.object.forEach(skuData, function(val, key) {
    if (val > 0) {
      result.push(key)
    }
  });
  return result;
};


/**
 * Gets list of supported regions for chosen Ultra Mem vms.
 * @return {!Array<string>} list of supported regions.
 * @export
 */
CloudCalculator.prototype.getUltraMemRegionList = function() {
  var sku = 'CP-COMPUTEENGINE-VMIMAGE-N1-ULTRAMEM-40';
  var skuData = this.cloudSkuData[sku];
  var result = [];
  goog.object.forEach(skuData, function(val, key) {
    if (val > 0) {
      result.push(key)
    }
  });
  return result;
};


/**
 * Gets list of supported regions for chosen High CPU vms.
 * @param {!object.<string, number>} config ML Model config
 * @return {number} list of supported regions.
 * @export
 */
CloudCalculator.prototype.getMlUnitsCount = function(config) {
  let units = 0;
  if (config.trainingTier && config.trainingTier !== 'custom') {
    units = this.ML_UNITS_MAP[config.location][config.trainingTier];
  } else {
    goog.object.forEach(
        this.ML_UNITS_MAP.custom[config.location], function(val, key) {
          if (config[key]) {
            units += val * config[key];
          }
        }, this);
  }
  return units;
};


/**
 * Checks redis tier based on instance size.
 * @param {number} size size of the redis instance.
 * @return {string} tier that instance get into.
 * @export
 */
CloudCalculator.prototype.checkRedisTier = function(size) {
  var isInRange = false;
  var tierName = 'M1';
  goog.object.forEach(this.REDIS_TIERS, function(range, tier) {
    isInRange = this.cartData_.checkRange(size, range[0], range[1]);
    if (isInRange) {
      tierName = tier;
    }
  }, this);
  return tierName;
};


/**
 * Calculates max available SUD discount for instance Series.
 * @param {string} series the series of used VM.
 * @return {number} discounted value (1 - discount).
 * @export
 */
CloudCalculator.prototype.getMaxSudForSeries = function(series) {
  const tiers = this.sustainedUseTiers[series.toLowerCase()] ||
      this.sustainedUseTiers['n1'];
  let discount = 0;
  goog.object.forEach(tiers, function(value, tier) {
    discount += value;
  }, this);
  return discount * this.sustainedUseBase;
};


/**
 * Angular module.
 * @export {angular.Module}
 */
cloudpricingcalculator.components.cloudcalculator.CloudCalculator.module =
    angular
        .module(
            'cloudpricingcalculator.components.cloudcalculator.CloudCalculator',
            [])
        .service('CloudCalculator', CloudCalculator);
});  // goog.scope