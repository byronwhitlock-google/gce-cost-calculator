/**
 * @fileoverview Listing controller to build the product listing page.
 */

'use strict';

goog.provide('cloudpricingcalculator.CpuValidatorDirective');
goog.provide('cloudpricingcalculator.DataWithUnit');
goog.provide('cloudpricingcalculator.DragEndDirective');
goog.provide('cloudpricingcalculator.StepValidatorDirective');
goog.provide('cloudpricingcalculator.RegionInputDirective');
goog.provide('cloudpricingcalculator.RegionOptionDirective');
goog.provide('cloudpricingcalculator.views.listing.ListingCtrl');

goog.require('cloudpricingcalculator.SkuData');
goog.require('cloudpricingcalculator.components.analytics.Analytics');
goog.require('cloudpricingcalculator.components.cartdata.CartData');
goog.require('cloudpricingcalculator.components.cloudcalculator.CloudCalculator');
goog.require('cloudpricingcalculator.components.feedbackquote.FeedbackQuote');
goog.require('cloudpricingcalculator.ComputePriceItem');
goog.require('goog.array');
goog.require('goog.object');

goog.scope(function() {


/**
 * @typedef {{
 *    value: ?number,
 *    unit: number
 * }}
 */
cloudpricingcalculator.DataWithUnit;



/**
 * Listing controller.
 *
 * @param {!angular.AnchorScroll} $anchorScroll
 * @param {!angular.Location} $location
 * @param {!cloudpricingcalculator.component.analytics.Analytics} Analytics
 * @param {!cloudpricingcalculator.component.cartdata.CartData} CartData
 * @param {!cloudpricingcalculator.components.cloudcalculator.CloudCalculator}
 * CloudCalculator
 * @param {!cloudpricingcalculator.components.tooltip.Tooltip} Tooltip
 * @param {!angular.Scope} $scope
 * @param {!angular.mdDialog} $mdDialog
 * @param {!angular.$timeout} $timeout the Angular timeout service
 * @constructor
 * @ngInject
 * @export
 */
cloudpricingcalculator.views.listing.ListingCtrl = function(
    $anchorScroll, $location, Analytics, CartData, CloudCalculator, Tooltip,
    $scope, $mdDialog, $timeout) {
  /** @private {!angular.AnchorScroll} */
  this.anchorScroll_ = $anchorScroll;
  /** @private {!angular.Location} */
  this.location_ = $location;
  /** @private {!angular.Scope} */
  this.scope_ = $scope;
  /** @export {!cloudpricingcalculator.component.analytics.Analytics} */
  this.Analytics = Analytics;
  /**
   * @export {!cloudpricingcalculator.component.cartdata.CartData}
   */
  this.CartData = CartData;
  /**
   * @export {!cloudpricingcalculator.components.cloudcalculator.CloudCalculator}
   */
  this.CloudCalculator = CloudCalculator;

  /**
   * @export {!cloudpricingcalculator.components.tooltip.Tooltip}
   */
  this.Tooltip = Tooltip;
  /** @export {!angular.mdDialog} */
  this.mdDialog = $mdDialog;
  /** @private {!angular.$timeout} */
  this.timeout_ = $timeout;
  /**
   * Number of weeks in a month
   * @const {number}
   */
  this.WEEKS = 365 / (7 * 12);
  /**
   * Number of days in a month
   * @const {number}
   */
  this.DAYS = 365 / 12;
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
   * Number of hours in a month
   * @const {number}
   */
  this.TOTAL_BILLING_HOURS = 730;
  /**
   * Firestire daily free quota for reads
   * @const {number}
   */
  this.FIRESTORE_DAILY_QUOTA_READS = 50000;
  /**
   * Firestire daily free quota for writes
   * @const {number}
   */
  this.FIRESTORE_DAILY_QUOTA_WRITES = 20000;
  /**
   * Firestire daily free quota for deletes
   * @const {number}
   */
  this.FIRESTORE_DAILY_QUOTA_DELETES = 20000;
  /**
   * Video Intelligence API maximum video/streaming length
   * @const {number}
   */
  this.VIDEOAPI_MAX_MINUTES = 100000;
  /**
   * Cloud Translation max characters
   * @const {number}
   */
  this.TRANSLATION_MAX_CHARACTERS = 1000000000;
  /**
   * Logs Volume Max limit for Networking Telemetry
   * @const {number}
   */
  this.MAX_VPCLOGS_VOLUME = 64000;
  /**
   * Min number of GKE GPU
   * @export
   */
  this.minGkeGPU = 0;
  /**
   * Whether GCE instance is supported in this region
   * @export
   */
  this.unsuportedVmType = false;
  /**
   * Amount of gb in tb
   * @const {number}
   */
  this.TB_TO_GB = 1024;
  /**
   * Minimum available RAM per core.
   * @const {number}
   */
  this.MIN_CUSTOM_RAM = 0.9;
  /**
   * Maximum available RAM per core.
   * @const {number}
   */
  this.MAX_CUSTOM_RAM = 6.5;
  /**
   * Custom VM RAM increment.
   * @const {number}
   */
  this.CUSTOM_VM_RAM_STEP = 0.25;
  /**
   * Standard memory in GB.
   * @const {number}
   */
  this.STANDARD_RATIO = 3.75;
  /**
   * Standard memory in GB.
   * @const {number}
   */
  this.MAX_EXTENDED_MEMORY_N = 624;
  /**
   * Filestore Limits in GB.
   * @const {!Object<number>}
   */
  this.filestoreValidationLimits = {
    standardMin: 1024,
    standardMax: 65433.6,
    standardStep: 1,
    premiumMin: 2560,
    premiumMax: 65433.6,
    premiumStep: 1,
    highScaleMin: 10240,
    highScaleMax: 102400,
    highScaleStep: 2560,
    enterpriseMin: 1024,
    enterpriseMax: 10240,
    enterpriseStep: 256
  };
  /**
   * Object to store Filestore validation results.
   * @const {!Object<string>}
   */
  this.filestoreValidationMessage =
      {standard: '', premium: '', highScale: '', enterprise: ''};
  /**
   * Current text in the region dropdown's input (for each product).
   * @export {!Object<string, string>}
   */
  this.inputRegionText = {compute: ''};
  /**
   * Compute boot disk types
   * @const {!Object<!Object<string, (string|number)>>}
   */
  this.computeBootDiskTypes = {
    'STORAGE-PD-CAPACITY':
        {label: 'Standard persistent disk', pd: 'storage', min: 10, max: 65536},
    'STORAGE-PD-SSD':
        {label: 'SSD persistent disk', pd: 'ssdStorage', min: 10, max: 65536},
    'ZONAL-BALANCED-PD': {
      label: 'Balanced persistent disk',
      pd: 'zonalBalancedPd',
      min: 10,
      max: 65536
    },
    /* 'STORAGE-PD-EXTREME': {
      label: 'Extreme persistent disk',
      pd: 'extremePd',
      min: 500,
      max: 65536
    } */
  };
  /**
   * GKE boot disk types
   * @const {!Object<!Object<string, string>>}
   */
  this.gkeBootDiskTypes = {
    'STORAGE-PD-CAPACITY': {label: 'Standard persistent disk', pd: 'storage'},
    'STORAGE-PD-SSD': {label: 'SSD persistent disk', pd: 'ssdStorage'},
    'ZONAL-BALANCED-PD':
        {label: 'Balanced persistent disk', pd: 'zonalBalancedPd'}
  };
  /**
   * GKE boot disk validation limits
   * @const {!Object<number>}
   */
  this.gkeBootDiskLimits = {min: 10, max: 65536};
  /**
   * GKE custom machine RAM limit in GB.
   * @export
   */
  this.gkeCustom = {ramMin: null, ramMax: null};
  /**
   * GKE Autopilot validation limits in MB.
   * @const {!Object<string, number>}
   */
  this.gkeAutopilotValidationLimits = {memoryMin: 512};
  /**
   * Cloud SQl Validation Constants in GB.
   * @const {!object}
   */
  this.cloudSqlValidationLimits = {
    cpuMin: 1,
    cpuMax: 96,
    memoryMin: 3.75,
    memoryMax: 624,
    storageMin: 10,
    storageMax: 65536,
    cpuRamMinRatio: 0.9,
    cpuRamMaxRatio: 6.5
  };

  /**
   * Lock GPU's trigger.
   * @export {!Object<string,boolean>}
   */
  this.lockGpu = {
    computeServer: false,
    containerEngine: false,
    soleTenant: false,
    dataflow: false
  };
  this.isSharedInstance = {computeServer: false, containerEngine: false};
  /**
   * Set of default units.
   * @const {!Object<string, number>}
   */
  this.DEFAULT_UNITS = {
    ssdStorage: 2,
    pdStorage: 2,
    snapshotStorage: 2,
    lbIngress: 2,
    outgoingTraffic: 2,
    cloudStorage: 2,
    memcache: 2,
    indexing: 2,
    logs: 2,
    task: 2,
    logsStorage: 2,
    multiRegionalStorage: 2,
    regionalStorage: 2,
    vpcLogsVolume: 2,
    storageEgress: 2,
    restoreSize: 2,
    bqStorage: 2,
    streamingInserts: 1,
    interactiveQueries: 3,
    streamingReads: 3,
    dsStorage: 2,
    sql2Storage: 2,
    sql2Backup: 2,
    btSsd: 3,
    btHdd: 3,
    spannerStorage: 3,
    spannerBackup: 3,
    bulk: 1,
    gsStorage: 2,
    dataprocPd: 2,
    dataflowPd: 2,
    dataflowDataProcessed: 2,
    sdLogs: 2,
    cacheEgressApac: 2,
    cacheEgressCn: 2,
    cacheEgressEu: 2,
    cacheEgressNa: 2,
    cacheEgressOce: 2,
    cacheEgressSa: 2,
    cacheEgressOther: 2,
    cacheFillIntraEu: 2,
    cacheFillIntraNaEu: 2,
    cacheFillIntraOther: 2,
    cacheFillIntraOce: 2,
    cacheFillIntraSa: 2,
    cacheFillInterOce: 2,
    cacheFillInterOther: 2,
    cacheFillInterRegion: 2,
    aeMemory: 2,
    aePD: 2,
    pubsubData: 2,
    dlpData: 2,
    iotDataVolume: 1,
    sdMetricsVolume: 1,
    bqmlCreation: 3,
    bqmlOperations: 3,
    premiumWorldwide: 2,
    premiumApac: 2,
    premiumWesternEurope: 2,
    premiumSouthAmerica: 2,
    premiumAmericas: 2,
    premiumMiddleEast: 2,
    premiumCentralAmerica: 2,
    premiumEasternEurope: 2,
    premiumEmea: 2,
    premiumAfrica: 2,
    premiumIndia: 2,
    premiumNa: 2,
    premiumEu: 2,
    premiumChina: 2,
    premiumAu: 2,
    standardWorldwide: 2,
    egressZoneSameRegion: 2,
    egressEurope: 2,
    egressUs: 2,
    egressAsia: 2,
    egressSouthAmerica: 2,
    egressAustralia: 2,
    dedicatedInterconnect: 2,
    directPeering: 2,
    natTrafficProcessed: 2,
    metadataStorage: 1,
    catalogApiCallCount: 6,
    gkeMemoryVolume: 1,
    bqBiEngineMemoryCapacity: 2,
    sourceRepStorage: 2,
    sourceRepEgress: 2,
    messageSize: 1
  };
  /**
   * @enum {number}
   */
  this.UNITS_MAP = {'Bi': -1, 'KiB': 0, 'MiB': 1, 'GiB': 2, 'TiB': 3, 'PiB': 4};
  /**
   * Units select list content.
   * @export {!Array<!Object<string, (number|string)>>}
   */
  this.units_select = [];
  goog.object.forEach(this.UNITS_MAP, function(val, key) {
    this.units_select.push({'name': key, 'value': val});
  }, this);
  /**
   * @const {!Object.<string, number>}
   */
  this.UNIT_NUMBER_MAP = {'thousand': 3, 'million': 6};
  /**
   * Units select list content.
   * @export {!Array<!Object<string, (number|string)>>}
   */
  this.unit_numbers_select = [];
  goog.object.forEach(this.UNIT_NUMBER_MAP, function(val, key) {
    this.unit_numbers_select.push({'name': key, 'value': val});
  }, this);

  /**
   * @export {!Array.<!Object.<string, string>>}
   */
  this.computeServerCpuOptions = [
    {name: 'shared', value: 'shared'}, {name: '1', value: '1'},
    {name: '2', value: '2'}, {name: '4', value: '4'}, {name: '8', value: '8'},
    {name: '16', value: '16'}, {name: '32', value: '32'}
  ];

  /**
   * @export {!Array.<!Object.<string, string>>}
   */
  this.instanceTypes = [
    {name: 'f1-micro', value: 'CP-COMPUTEENGINE-VMIMAGE-F1-MICRO'},
    {name: 'g1-small', value: 'CP-COMPUTEENGINE-VMIMAGE-G1-SMALL'},
    {name: 'n1-standard-1', value: 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-1'},
    {name: 'n1-standard-2', value: 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-2'},
    {name: 'n1-standard-4', value: 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-4'},
    {name: 'n1-standard-8', value: 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-8'},
    {name: 'n1-standard-16', value: 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-16'},
    {name: 'n1-highmem-2', value: 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-2'},
    {name: 'n1-highmem-4', value: 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-4'},
    {name: 'n1-highmem-8', value: 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-8'},
    {name: 'n1-highmem-16', value: 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-16'},
    {name: 'n1-highcpu-2', value: 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-2'},
    {name: 'n1-highcpu-4', value: 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-4'},
    {name: 'n1-highcpu-8', value: 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-8'},
    {name: 'n1-highcpu-16', value: 'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-16'}
  ];


  /**
   * @export {!Object.<string,!Array.<!Object.<string, number>>>}
   */

  this.computeServerGenerationOptions = {
    'gp': [
      {name: 'N1', value: 'n1'}, {name: 'N2', value: 'n2'},
      {name: 'E2', value: 'e2'}, {name: 'N2D', value: 'n2d'},
      {name: 'T2D', value: 't2d'}
    ],
    'compute': [{name: 'C2', value: 'c2'}],
    'memory': [{name: 'M1', value: 'm1'}, {name: 'M2', value: 'm2'}],
    'accelerator': [{name: 'A2', value: 'a2'}]
  };

  this.gceMachineFamilyConfig = {
    'gp': {
      'n1': {
        'isCustomAvailable': true,
        'isPreemptibleAvailable': true,
        'isGpuAvailable': true,
        'isLocalSsdAvailable': true,
        'minCustomCore': 1,
        'maxCustomCore': 96,
        'minCustomRamRatio': 0.9,
        'maxCustomRamRatio': 6.5,
        'isExtendedMemoryAvailable': true,
        'maxExtendedMemory': this.MAX_EXTENDED_MEMORY_N,
        'supportedTypes': {
          'standard': {
            'ramRatio': 3.75,
            'coreRatio': 1,
            'supportedCores': [1, 2, 4, 8, 16, 32, 64, 96]
          },
          'highmem': {
            'ramRatio': 6.5,
            'coreRatio': 1,
            'supportedCores': [2, 4, 8, 16, 32, 64, 96]
          },
          'highcpu': {
            'ramRatio': 0.9,
            'coreRatio': 1,
            'supportedCores': [2, 4, 8, 16, 32, 64, 96]
          }
        }
      },
      'n2': {
        'isCustomAvailable': true,
        'isPreemptibleAvailable': true,
        'isGpuAvailable': false,
        'isLocalSsdAvailable': true,
        'minCustomCore': 2,
        'maxCustomCore': 128,
        'minCustomRamRatio': 1,
        'maxCustomRamRatio': 8,
        'isExtendedMemoryAvailable': true,
        'maxExtendedMemory': this.MAX_EXTENDED_MEMORY_N,
        'supportedTypes': {
          'standard': {
            'ramRatio': 4,
            'coreRatio': 1,
            'supportedCores': [2, 4, 8, 16, 32, 48, 64, 80, 96, 128]
          },
          'highmem': {
            'ramRatio': 8,
            'coreRatio': 1,
            'alternateRamRatio': 6.75,
            'supportedCores': [2, 4, 8, 16, 32, 48, 64, 80, 96, 128],
            'alternateRamRatioCores': [128]
          },
          'highcpu': {
            'ramRatio': 1,
            'coreRatio': 1,
            'supportedCores': [2, 4, 8, 16, 32, 48, 64, 80, 96]
          }
        },
        'localSsd': [
          {vCpu: {min: 2, max: 10}, ssd: [1, 2, 4, 8, 16, 24]},
          {vCpu: {min: 12, max: 20}, ssd: [2, 4, 8, 16, 24]},
          {vCpu: {min: 22, max: 40}, ssd: [4, 8, 16, 24]},
          {vCpu: {min: 42, max: 80}, ssd: [8, 16, 24]},
          {vCpu: {min: 96, max: 128}, ssd: [16, 24]}
        ]
      },
      'e2': {
        'isCustomAvailable': true,
        'isPreemptibleAvailable': true,
        'isGpuAvailable': false,
        'isLocalSsdAvailable': false,
        'minCustomCore': 2,
        'maxCustomCore': 32,
        'minCustomRamRatio': 0.5,
        'maxCustomRamRatio': 8,
        'hardMaxCustomRamRation': 128,
        'isExtendedMemoryAvailable': false,
        'maxExtendedMemory': 0,
        'supportedTypes': {
          'standard': {
            'ramRatio': 4,
            'coreRatio': 1,
            'supportedCores': [2, 4, 8, 16, 32]
          },
          'highmem':
              {'ramRatio': 8, 'coreRatio': 1, 'supportedCores': [2, 4, 8, 16]},
          'highcpu': {
            'ramRatio': 1,
            'coreRatio': 1,
            'supportedCores': [2, 4, 8, 16, 32]
          },
        },
      },
      'n2d': {
        'isCustomAvailable': true,
        'isPreemptibleAvailable': true,
        'isGpuAvailable': false,
        'isLocalSsdAvailable': true,
        'minCustomCore': 2,
        'maxCustomCore': 96,
        'minCustomRamRatio': 0.5,
        'maxCustomRamRatio': 8,
        'isExtendedMemoryAvailable': true,
        'maxExtendedMemory': 786,
        'supportedTypes': {
          'standard': {
            'ramRatio': 4,
            'coreRatio': 1,
            'supportedCores': [2, 4, 8, 16, 32, 48, 64, 80, 96, 128, 224],
          },
          'highmem': {
            'ramRatio': 8,
            'coreRatio': 1,
            'supportedCores': [2, 4, 8, 16, 32, 48, 64, 80, 96],
          },
          'highcpu': {
            'ramRatio': 1,
            'coreRatio': 1,
            'supportedCores': [2, 4, 8, 16, 32, 48, 64, 80, 96, 128, 224],
          },
        },
        'localSsd': [
          {vCpu: {min: 2, max: 16}, ssd: [1, 2, 4, 8, 16, 24]},
          {vCpu: {min: 32, max: 48}, ssd: [2, 4, 8, 16, 24]},
          {vCpu: {min: 64, max: 80}, ssd: [4, 8, 16, 24]},
          {vCpu: {min: 96, max: 224}, ssd: [8, 16, 24]}
        ]
      },
      't2d': {
        'isCustomAvailable': false,
        'isPreemptibleAvailable': true,
        'isGpuAvailable': false,
        'isLocalSsdAvailable': false,
        'minCustomCore': 0,
        'maxCustomCore': 0,
        'minCustomRamRatio': 0,
        'maxCustomRamRatio': 0,
        'isExtendedMemoryAvailable': false,
        'maxExtendedMemory': 0,
        'supportedTypes': {
          'standard': {
            'ramRatio': 4,
            'coreRatio': 1,
            'supportedCores': [1, 2, 4, 8, 16, 32, 48, 60],
          },
        },
      },
    },
    'compute': {
      'c2': {
        'isCustomAvailable': false,
        'isPreemptibleAvailable': true,
        'isGpuAvailable': false,
        'isLocalSsdAvailable': true,
        'minCustomCore': 0,
        'maxCustomCore': 0,
        'minCustomRamRatio': 0,
        'maxCustomRamRatio': 0,
        'isExtendedMemoryAvailable': false,
        'maxExtendedMemory': 0,
        'supportedTypes': {
          'standard': {
            'ramRatio': 4,
            'coreRatio': 1,
            'supportedCores': [4, 8, 16, 30, 60]
          }
        },
        'localSsd': [
          {vCpu: {min: 4, max: 8}, ssd: [1, 2, 4, 8]},
          {vCpu: {min: 16, max: 16}, ssd: [2, 4, 8]},
          {vCpu: {min: 30, max: 30}, ssd: [4, 8]},
          {vCpu: {min: 60, max: 60}, ssd: [8]}
        ]
      }
    },
    'memory': {
      'm1': {
        'isCustomAvailable': false,
        'isPreemptibleAvailable': true,
        'minCustomCore': 4,
        'maxCustomCore': 60,
        'isGpuAvailable': false,
        'isLocalSsdAvailable': false,
        'minCustomRamRatio': 2,
        'maxCustomRamRatio': 4,
        'supportedTypes': {
          'megamem':
              {'ramRatio': 1433.6 / 96, 'coreRatio': 1, 'supportedCores': [96]},
          'ultramem': {
            'ramRatio': 961 / 40,
            'coreRatio': 1,
            'supportedCores': [40, 80, 160]
          }
        }
      },
      'm2': {
        'isCustomAvailable': false,
        'isPreemptibleAvailable': false,
        'isGpuAvailable': false,
        'isLocalSsdAvailable': false,
        'minCustomCore': 4,
        'maxCustomCore': 60,
        'minCustomRamRatio': 2,
        'maxCustomRamRatio': 4,
        'supportedTypes': {
          'megamem':
              {'ramRatio': 5888 / 416, 'coreRatio': 1, 'supportedCores': [416]},
          'ultramem': {
            'ramRatio': 5888 / 208,
            'coreRatio': 1,
            'supportedCores': [208, 416]
          },
        }
      },
    },
    'accelerator': {
      'a2': {
        'isCustomAvailable': false,
        'isPreemptibleAvailable': true,
        'isGpuAvailable': false,
        'isLocalSsdAvailable': true,
        'minCustomCore': 0,
        'maxCustomCore': 0,
        'minCustomRamRatio': 0,
        'maxCustomRamRatio': 0,
        'isExtendedMemoryAvailable': false,
        'maxExtendedMemory': 0,
        'supportedTypes': {
          'highgpu': {
            'ramRatio': 85,
            'coreRatio': 12,
            'gpuRatio': 1,
            'supportedCores': [1, 2, 4, 8]
          },
          'megagpu': {
            'ramRatio': 85,
            'coreRatio': 6,
            'gpuRatio': 1,
            'supportedCores': [16]
          },
        },
        'localSsd': [
          {vCpu: {min: 12, max: 12}, ssd: [1, 2, 4, 8]},
          {vCpu: {min: 24, max: 24}, ssd: [2, 4, 8]},
          {vCpu: {min: 48, max: 48}, ssd: [4, 8]},
          {vCpu: {min: 96, max: 96}, ssd: [8]}
        ]
      }
    },
  };

  /**
   * Flag to check if edit flow is ongoing.
   * @export {boolean}
   */
  this.isEditFlow = false;

  /**
   * @export {!Array.<!Object.<string, string>>}
   */
  this.supportedSsd = [
    {name: 0, value: 0}, {name: '1x375 GB', value: 1},
    {name: '2x375 GB', value: 2}, {name: '3x375 GB', value: 3},
    {name: '4x375 GB', value: 4}, {name: '5x375 GB', value: 5},
    {name: '6x375 GB', value: 6}, {name: '7x375 GB', value: 7},
    {name: '8x375 GB', value: 8}, {name: '16x375 GB', value: 16},
    {name: '24x375 GB', value: 24}
  ];

  /**
   * Assign default local SSD options initially for required products.
   * @export {!Object<!Array.<!Object.<string, string>>>}
   */
  this.dynamicSsd = {
    computeServer: goog.array.clone(this.supportedSsd),
    containerEngine: goog.array.clone(this.supportedSsd)
  };

  this.computeInstanceList = {};
  this.machineType = {
    computeServer: true,
    containerEngine: true,
    composer: true
  };

  /**
   * @export {!Array.<!Object.<string, string>>}
   */
  this.computeServerMemoryOptions =
      [{name: '0.6 GB', value: '0.6'}, {name: '1.7 GB', value: '1.7'}];

  /**
   * List of Cloud SQL instance types for mySQL and PostgreSQL.
   * @export {!Object.<!Object.<string, string|!Array>>}
   */
  this.cloudSqlInstanceList = {
    lightweight: {
      label: 'Lightweight',
      instances: [
        {vcpu: 1, ram: 3.75},
        {vcpu: 2, ram: 3.75},
        {vcpu: 4, ram: 3.75},
      ]
    },
    standard: {
      label: 'Standard',
      instances: [
        {vcpu: 1, ram: 3.75},
        {vcpu: 2, ram: 7.5},
        {vcpu: 4, ram: 15},
      ]
    },
    highmem: {
      label: 'High Memory',
      instances: [
        {vcpu: 4, ram: 26},
        {vcpu: 8, ram: 52},
        {vcpu: 16, ram: 104},
      ]
    }
  };

  /**
   * @export {!Array.<!Object.<string, string>>}
   */
  this.psoList = [
    {value: 'CP-PROF-SVC-START', name: 'Cloud Start'},
    {value: 'CP-PROF-SVC-SPRINT', name: 'Cloud Sprint'},
    {value: 'CP-PROF-SVC-PLAN-INF', name: 'Cloud Plan - Infrastructure'},
    {value: 'CP-PROF-SVC-PLAN-DA', name: 'Cloud Plan - Data & Analytics'}, {
      value: 'CP-PROF-SVC-PLAN-ML',
      name: 'Cloud Plan - Machine Learning with MVM'
    },
    {value: 'CP-PROF-SVC-PLAN-APP', name: 'Cloud Plan - App Development'}, {
      value: 'GAPPS-PROF-SVC-ADA',
      name: 'Google Workspace Apps Deployment Advisory'
    },
    {
      value: 'GAPPS-PROF-SVC-CMAS',
      name: 'Google Workspace Change Management Advisory'
    },
    {
      value: 'GAPPS-PROF-SVC-PSC',
      name: 'Google Workspace Rationalize Productivity Suite Cost Advisory'
    },
    {
      value: 'GAPPS-PROF-SVC-SA',
      name: 'Google Workspace Security Assessment Advisory'
    },
    {
      value: 'GAPPS-PROF-SVC-TSP',
      name: 'Google Workspace Transformation Advisory'
    },
    {value: 'CP-PROF-SVC-TAM', name: 'Technical Account Management'}
  ];

  /**
   * @export {!Array.<!Object.<string, string>>}
   */
  this.psoDescriptions = {
    'CP-PROF-SVC-START':
        'Accelerated consulting workshop to create technology advocates for cloud infrastructure',
    'CP-PROF-SVC-SPRINT':
        'Consulting engagement to migrate an application in a week.',
    'CP-PROF-SVC-PLAN-INF':
        'Consulting engagement to capture cloud infrastructure technical requirements, design and approach',
    'CP-PROF-SVC-PLAN-DA':
        'Consulting engagement to capture cloud data and analytics technical requirements, design and approach',
    'CP-PROF-SVC-PLAN-ML':
        'Consulting engagement to help develop a minimum viable model for machine learning',
    'CP-PROF-SVC-PLAN-APP':
        'Consulting engagement to capture cloud application development technical requirements, design and approach',
    'GAPPS-PROF-SVC-ADA':
        'Consulting engagement to implement a Google Workspace domain',
    'GAPPS-PROF-SVC-CMAS':
        'Consulting engagement to help employees adopt new Google Workspace tools and work in new ways',
    'GAPPS-PROF-SVC-PSC':
        'Consulting engagement to provide best practices and support for removing legacy office productivity tools',
    'GAPPS-PROF-SVC-SA':
        'Consulting engagement to assess security processes and procedures',
    'GAPPS-PROF-SVC-TSP':
        'Consulting engagement to engage business users to innovate day-to-day processes',
    'CP-PROF-SVC-TAM':
        'With Technical Account Management, customers receive access to a cloud strategist, equipped to cultivate business and technical transformation through trusted advisory and customer advocacy. Premium Support is required to purchase TAM Services. For pricing details, please visit the Premium Support page.'
  };

  /**
   * @export {!Array.<!Object.<string, string>>}
   */
  this.gkeSupportedOsList = [
    {name: 'Free: Container-optimized', value: 'container'},
    {name: 'Free: Ubuntu', value: 'ubuntu'},
    {name: 'Paid: Windows Server', value: 'win'}
  ];

  /**
   * Cloud Storage classes.
   * @export {!Object.<string, string>}
   */
  this.storageClass = {
    'standard': 'Standard Storage',
    'nearline': 'Nearline Storage',
    'coldline': 'Coldline Storage',
    'archive': 'Archive Storage'
  };

  /**
   * List of BigQuery Omni commitments.
   * @export {!Object.<string, string>}
   */
  this.bigQueryOmniCommitment = {
    'monthly': 'Monthly flat-rate',
    'annual': 'Annual flat-rate',
    'flex': 'Flex slots: short-term'
  };

  /**
   * Cloud Run CPU allocation options.
   * @export {!Object.<string, string>}
   */
  this.cpuAllocationTypeList = {
    'THROTTLED': 'CPU is only allocated during request processing',
    'ALWAYS': 'CPU is always allocated'
  };

  /**
   * Flag to display free tier checkbox
   * @export {boolean}
   */
  this.storageFreeTierAvailable = true;

  /**
   * Types of egress for Cloud Storage
   * @export {!Object}
   */
  this.egressType = {
    'SAME-LOCATION': 'Data moves within the same location',
    'DUAL-REGION-BUCKET':
        'To Google Cloud service located in one of the regions that make up the dual-region of the Cloud Storage bucket',
    'MULTI-REGION-BUCKET':
        'To Google Cloud service located in one of the regions that make up the multi-region of the Cloud Storage bucket',
    'MULTI-REGION-SAME-CONTINENT':
        'Multi-region Cloud Storage bucket to a Google Cloud service located in a region on the same continent',
    'DIFFERENT-LOCATIONS-SAME-CONTINENT':
        'Data moves between different locations on the same continent',
    'WORLDWIDE-EXCEPT-ASIA-AUSTRALIA':
        'Data moves between different continents to/from Worldwide (excluding Asia & Australia)',
    'ASIA-EXCEPT-CHINA':
        'Data moves between different continents to/from Asia (excluding China, but including Hong Kong)',
    'CHINA':
        'Data moves between different continents to/from China (excluding Hong Kong)',
    'AUSTRALIA': 'Data moves between different continents to/from Australia'
  };

  /**
   * Armor commitment types.
   * @export {!Object.<string, string>}
   */
  this.armorCommitmentTypes = {
    'STANDARD': 'Standard (Pay as you go)',
    'PLUS': 'Managed Protection Plus (Subscription)'
  };

  /**
   * Egress type.
   * @export {!Object.<string, string>}
   */
  this.armorEgressTypes = {
    'LOAD-BALANCER': 'Cloud Load Balancing, internet, and Cloud Interconnect',
    'CDN': 'Cloud CDN',
    'DNS': 'Cloud DNS'
  };

  /**
   * Checks whether region is available or not for Sole Tenant
   * @export {boolean}
   */
  this.isSoleTenantRegionSupported = true;

  /**
   * Maps Cloud SQL products to tab indexes.
   * @enum {number}
   */
  this.cloudSqlTabs = {MY_SQL: 0, POSTGRE: 1, SQL_SERVER: 2};

  /**
   * Contains the current Cloud SQL tab index.
   * @export {number}
   */
  this.currentCloudSqlTab = this.cloudSqlTabs.MY_SQL;


  /**
   * Lock CUD trigger.
   * @export {!Object.<string,boolean>}
   */
  this.cloudSqlValidation = {
    cloudSQL2: false,
    cloudSQLPostgre: false,
    cloudSqlServer: false,
    cloudSQL2Cud: false,
    cloudSQLPostgreCud: false,
    cloudSqlServerCud: false
  };
  /**
   * List of supported regions
   * @export {!Object.<string, string>}
   */
  this.fullRegion = {
    'asia-east': 'Taiwan',
    'asia-east1': 'Taiwan',
    'asia-east2': 'Hong Kong',
    'asia-northeast': 'Tokyo',
    'asia-northeast1': 'Tokyo',
    'asia-northeast2': 'Osaka',
    'asia-northeast3': 'Seoul',
    'asia-south1': 'Mumbai',
    'asia-south2': 'Delhi',
    'asia-southeast': 'Singapore',
    'asia-southeast1': 'Singapore',
    'asia-southeast2': 'Jakarta',
    'asia': 'Asia',
    'australia-southeast1': 'Sydney',
    'australia-southeast2': 'Melbourne',
    'europe-central2': 'Warsaw',
    'europe-north1': 'Finland',
    'europe-west1': 'Belgium',
    'europe-west2': 'London',
    'europe-west3': 'Frankfurt',
    'europe-west4': 'Netherlands',
    'europe-west6': 'Zurich',
    'northamerica-northeast1': 'Montreal',
    'northamerica-northeast2': 'Toronto',
    'southamerica-east1': 'Sao Paulo',
    'southamerica-west1': 'Santiago',
    'us-central1': 'Iowa',
    'us-east1': 'South Carolina',
    'us-east4': 'Northern Virginia',
    'us-west1': 'Oregon',
    'us-west2': 'Los Angeles',
    'us-west3': 'Salt Lake City',
    'us-west4': 'Las Vegas',
    'us': 'United States',
    'europe': 'Europe',
    'nam3': 'North America (Northern Virginia/South Carolina/Iowa)',
    'nam4': 'North America (Iowa/South Carolina)',
    'nam6': 'North America (Iowa/South Carolina/Oregon/Los Angeles/Oklahoma)',
    'nam7': 'North America (Iowa/North Virginia/Oklahoma)',
    'nam8': 'North America (Los Angeles/Oregon/Salt Lake City)',
    'nam9': 'North America (North Virginia/Iowa/Oregon/South Carolina)',
    'nam10': 'North America (Iowa/Salt Lake City/Oklahoma)',
    'nam11': 'North America (Iowa/South Carolina/Oklahoma)',
    'nam12': 'North America (Iowa/Northern Virginia/Oregon/Oklahoma)',
    'eur3': 'Europe (Belgium/Netherlands/Finland)',
    'eur4': 'Europe (Finland/Netherlands)',
    'eur5': 'Europe (London/Belgium/Netherlands)',
    'eur6': 'Europe (Netherlands/Frankfurt/Zurich)',
    'asia1': 'Asia (Tokyo, Osaka, Seoul)',
    'nam-eur-asia1':
        'North America, Europe and Asia (Iowa/Oklahoma/Belgium/Taiwan)',
    'automatic': 'Automatic'
  };

  /**
   * Fallback for region list
   * @export {!Object.<string, string>}
   */
  this.regionFallback = {'us': 'us', 'eu': 'europe', 'apac': 'asia'};

  /**
   * Fallback for region list
   * @export {!Object.<string, string>}
   */
  this.GCEUS_MAP = {
    'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-1': 2.75,
    'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-2': 5.5,
    'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-4': 11,
    'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-8': 22,
    'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-16': 44,
    'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-32': 88,
    'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-2': 5.5,
    'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-4': 11,
    'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-8': 22,
    'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-16': 44,
    'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHMEM-32': 88,
    'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-2': 5.5,
    'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-4': 11,
    'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-8': 22,
    'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-16': 44,
    'CP-COMPUTEENGINE-VMIMAGE-N1-HIGHCPU-32': 88
  };

  /**
   * List of supported GPUs types
   * @export {!Array.<!Object.<string, string>>}
   */
  this.gpuList = [
    {name: 'NVIDIA Tesla K80', value: 'NVIDIA_TESLA_K80'},
    {name: 'NVIDIA Tesla P100', value: 'NVIDIA_TESLA_P100'},
    {name: 'NVIDIA Tesla P4', value: 'NVIDIA_TESLA_P4'},
    {name: 'NVIDIA Tesla V100', value: 'NVIDIA_TESLA_V100'},
    {name: 'NVIDIA Tesla T4', value: 'NVIDIA_TESLA_T4'}
  ];

  /**
   * List of supported GPUs types for sole tenant.
   * @export {!Array<!Object<string, string>>}
   */
  this.gpuListForTenant = [
    {name: 'NVIDIA Tesla P100', value: 'NVIDIA_TESLA_P100'},
    {name: 'NVIDIA Tesla P4', value: 'NVIDIA_TESLA_P4'},
    {name: 'NVIDIA Tesla V100', value: 'NVIDIA_TESLA_V100'},
    {name: 'NVIDIA Tesla T4', value: 'NVIDIA_TESLA_T4'}
  ];

  /**
   * List of supported GPUs types
   * @export {!Object.<string, !Array.<!Object.<string, number>>}
   */
  this.supportedGpuNumbers = {
    'NVIDIA_TESLA_K80': [
      {name: 0, value: 0}, {name: 1, value: 1}, {name: 2, value: 2},
      {name: 4, value: 4}, {name: 8, value: 8}
    ],
    'NVIDIA_TESLA_P100': [
      {name: 0, value: 0}, {name: 1, value: 1}, {name: 2, value: 2},
      {name: 4, value: 4}
    ],
    'NVIDIA_TESLA_P4': [
      {name: 0, value: 0}, {name: 1, value: 1}, {name: 2, value: 2},
      {name: 4, value: 4}
    ],
    'NVIDIA_TESLA_T4': [
      {name: 0, value: 0}, {name: 1, value: 1}, {name: 2, value: 2},
      {name: 4, value: 4}
    ],
    'NVIDIA_TESLA_V100': [
      {name: 0, value: 0}, {name: 1, value: 1}, {name: 2, value: 2},
      {name: 4, value: 4}, {name: 8, value: 8}
    ]
  };

  /**
   * List of supported GPUs types
   * @export {!Object.<string, string>}
   */
  this.gpuMinCoreList = {
    'NVIDIA_TESLA_K80': 8,
    'NVIDIA_TESLA_P100': 16,
    'NVIDIA_TESLA_P4': 24,
    'NVIDIA_TESLA_T4': 24,
    'NVIDIA_TESLA_V100': 12
  };

  /**
   * Speech recognition models.
   * @export {!Object.<string, !Object>}
   */
  this.speechModels = {
    'STANDARD':
        {'DEFAULT': 'Default', 'COMMAND_AND_SEARCH': 'Command and search'},
    'ENHANCED': {'PHONE_CALL': 'Phone call', 'VIDEO': 'Video'}
  };
  /**
   * Set up the Anthos form defaults
   * @export {boolean}
   */
  this.showAnthos = true;
  this.setupAnthos();
  /**
   * Locks os select.
   * @export {boolean}
   */
  this.lockOSSelect = false;
  /**
   * List of spanner regions.
   * @export {!Object.<string, <!Array.<!Object.<string, string>>>}
   */
  this.spannerRegionList = {
    'regional': [
      {value: 'us-central1', name: 'Iowa'},
      {value: 'us-east1', name: 'South Carolina'},
      {value: 'us-east4', name: 'Northern Virginia'},
      {value: 'us-west1', name: 'Oregon'},
      {value: 'us-west2', name: 'Los Angeles'},
      {value: 'us-west3', name: 'Salt Lake City'},
      {value: 'us-west4', name: 'Las Vegas'},
      {value: 'europe-west1', name: 'Belgium'},
      {value: 'europe-west2', name: 'London'},
      {value: 'europe-west3', name: 'Frankfurt'},
      {value: 'europe-central2', name: 'Warsaw'},
      {value: 'europe-west4', name: 'Netherlands'},
      {value: 'europe-west6', name: 'Zurich'},
      {value: 'europe-north1', name: 'Finland'},
      {value: 'northamerica-northeast1', name: 'Montreal'},
      {value: 'northamerica-northeast2', name: 'Toronto'},
      {value: 'southamerica-east1', name: 'Sao Paulo'},
      {value: 'southamerica-west1', name: 'Santiago'},
      {value: 'asia-east1', name: 'Taiwan'},
      {value: 'asia-east2', name: 'Hong Kong'},
      {value: 'asia-northeast1', name: 'Tokyo'},
      {value: 'asia-northeast2', name: 'Osaka'},
      {value: 'asia-northeast3', name: 'Seoul'},
      {value: 'asia-southeast1', name: 'Singapore'},
      {value: 'asia-southeast2', name: 'Jakarta'},
      {value: 'asia-south1', name: 'Mumbai'},
      {value: 'asia-south2', name: 'Delhi'},
      {value: 'australia-southeast1', name: 'Sydney'},
      {value: 'australia-southeast2', name: 'Melbourne'}
    ],
    'multi-region': [
      {
        value: 'nam3',
        name: 'North America (Northern Virginia/South Carolina/Iowa)'
      },
      {
        value: 'nam6',
        name: 'North America (Iowa/South Carolina/Oregon/Los Angeles/Oklahoma)'
      },
      {value: 'nam7', name: 'North America (Iowa/North Virginia/Oklahoma)'},
      {
        value: 'nam8',
        name: 'North America (Los Angeles/Oregon/Salt Lake City)'
      },
      {
        value: 'nam9',
        name: 'North America (North Virginia/Iowa/Oregon/South Carolina)'
      },
      {value: 'nam10', name: 'North America (Iowa/Salt Lake City/Oklahoma)'},
      {value: 'nam11', name: 'North America (Iowa/South Carolina/Oklahoma)'},
      {
        value: 'nam12',
        name: 'North America (Iowa/Northern Virginia/Oregon/Oklahoma)'
      },
      {value: 'eur3', name: 'Europe (Belgium/Netherlands/Finland)'},
      {value: 'eur5', name: 'Europe (London/Belgium/Netherlands)'},
      {value: 'eur6', name: 'Europe (Netherlands/Frankfurt/Zurich)'},
      {value: 'asia1', name: 'Asia (Tokyo, Osaka, Seoul)'},
      {
        value: 'nam-eur-asia1',
        name: 'North America, Europe and Asia (Iowa/Oklahoma/Belgium/Taiwan)'
      },
    ]
  };
  /**
   * Full regions list.
   * @export {!Array.<!Object.<string, string>>}
   */
  this.fullRegionList = [
    {value: 'us-central1', name: 'Iowa'},
    {value: 'us-east1', name: 'South Carolina'},
    {value: 'us-east4', name: 'Northern Virginia'},
    {value: 'us-west1', name: 'Oregon'},
    {value: 'us-west2', name: 'Los Angeles'},
    {value: 'us-west3', name: 'Salt Lake City'},
    {value: 'us-west4', name: 'Las Vegas'},
    {value: 'europe-west1', name: 'Belgium'},
    {value: 'europe-west2', name: 'London'},
    {value: 'europe-west3', name: 'Frankfurt'},
    {value: 'europe-central2', name: 'Warsaw'},
    {value: 'asia-east1', name: 'Taiwan'},
    {value: 'asia-east2', name: 'Hong Kong'},
    {value: 'asia-northeast1', name: 'Tokyo'},
    {value: 'asia-northeast2', name: 'Osaka'},
    {value: 'asia-northeast3', name: 'Seoul'},
    {value: 'asia-southeast1', name: 'Singapore'},
    {value: 'asia-southeast2', name: 'Jakarta'},
    {value: 'asia-south1', name: 'Mumbai'},
    {value: 'asia-south2', name: 'Delhi'},
    {value: 'australia-southeast1', name: 'Sydney'},
    {value: 'australia-southeast2', name: 'Melbourne'},
    {value: 'southamerica-east1', name: 'Sao Paulo'},
    {value: 'southamerica-west1', name: 'Santiago'},
    {value: 'europe-west4', name: 'Netherlands'},
    {value: 'europe-west6', name: 'Zurich'},
    {value: 'europe-north1', name: 'Finland'},
    {value: 'northamerica-northeast1', name: 'Montreal'},
    {value: 'northamerica-northeast2', name: 'Toronto'}
  ];

  /**
   * Full regions list.
   * @export {!Object<string, !Array<{value: string, name: string}>>}
   */
  this.storageRegionList = {
    'multi-region': [
      {value: 'us', name: 'United States'},
      {value: 'europe', name: 'European Union'},
      {value: 'asia', name: 'Asia'},
    ],
    'dual-region': [
      {value: 'asia1', name: 'Tokyo and Osaka'},
      {value: 'nam4', name: 'Iowa and South Carolina'},
      {value: 'eur4', name: 'Finland and Netherlands'},
    ],
    'regional': [
      {value: 'us-central1', name: 'Iowa'},
      {value: 'us-east1', name: 'South Carolina'},
      {value: 'us-east4', name: 'Northern Virginia'},
      {value: 'us-west1', name: 'Oregon'},
      {value: 'us-west2', name: 'Los Angeles'},
      {value: 'us-west3', name: 'Salt Lake City'},
      {value: 'us-west4', name: 'Las Vegas'},
      {value: 'europe-west1', name: 'Belgium'},
      {value: 'europe-west2', name: 'London'},
      {value: 'europe-west3', name: 'Frankfurt'},
      {value: 'europe-central2', name: 'Warsaw'},
      {value: 'asia-east1', name: 'Taiwan'},
      {value: 'asia-east2', name: 'Hong Kong'},
      {value: 'asia-northeast1', name: 'Tokyo'},
      {value: 'asia-northeast2', name: 'Osaka'},
      {value: 'asia-northeast3', name: 'Seoul'},
      {value: 'asia-southeast1', name: 'Singapore'},
      {value: 'asia-southeast2', name: 'Jakarta'},
      {value: 'asia-south1', name: 'Mumbai'},
      {value: 'asia-south2', name: 'Delhi'},
      {value: 'australia-southeast1', name: 'Sydney'},
      {value: 'australia-southeast2', name: 'Melbourne'},
      {value: 'southamerica-east1', name: 'Sao Paulo'},
      {value: 'southamerica-west1', name: 'Santiago'},
      {value: 'europe-west4', name: 'Netherlands'},
      {value: 'europe-west6', name: 'Zurich'},
      {value: 'europe-north1', name: 'Finland'},
      {value: 'northamerica-northeast1', name: 'Montreal'},
      {value: 'northamerica-northeast2', name: 'Toronto'}
    ],
  };

  /**
   * Dataflow regions list.
   * @export {!Array.<!Object.<string, string>>}
   */
  this.dataflowRegionList = [
    {value: 'us-central1', name: 'Iowa'},
    {value: 'us-east1', name: 'South Carolina'},
    {value: 'us-east4', name: 'Northern Virginia'},
    {value: 'us-west1', name: 'Oregon'},
    {value: 'us-west2', name: 'Los Angeles'},
    {value: 'us-west3', name: 'Salt Lake City'},
    {value: 'us-west4', name: 'Las Vegas'},
    {value: 'europe-west1', name: 'Belgium'},
    {value: 'europe-west2', name: 'London'},
    {value: 'europe-west3', name: 'Frankfurt'},
    {value: 'europe-central2', name: 'Warsaw'},
    {value: 'asia-east1', name: 'Taiwan'},
    {value: 'asia-east2', name: 'Hong Kong'},
    {value: 'asia-northeast1', name: 'Tokyo'},
    {value: 'asia-northeast2', name: 'Osaka'},
    {value: 'asia-northeast3', name: 'Seoul'},
    {value: 'asia-southeast1', name: 'Singapore'},
    {value: 'asia-southeast2', name: 'Jakarta'},
    {value: 'asia-south1', name: 'Mumbai'},
    {value: 'asia-south2', name: 'Delhi'},
    {value: 'australia-southeast1', name: 'Sydney'},
    {value: 'australia-southeast2', name: 'Melbourne'},
    {value: 'southamerica-east1', name: 'Sao Paulo'},
    {value: 'southamerica-west1', name: 'Santiago'},
    {value: 'europe-west4', name: 'Netherlands'},
    {value: 'europe-west6', name: 'Zurich'},
    {value: 'europe-north1', name: 'Finland'},
    {value: 'northamerica-northeast1', name: 'Montreal'},
    {value: 'northamerica-northeast2', name: 'Toronto'}
  ];


  /**
   * Partner InterconnectVPN regions list.
   * @export {!Array<!Object<string, string>>}
   */
  this.partnerInterconnectVpnAttachmentList = [
    {value: '0.05417', name: '50 Mbps'}, {value: '0.0625', name: '100 Mbps'},
    {value: '0.08333', name: '200 Mbps'}, {value: '0.1111', name: '300 Mbps'},
    {value: '0.1389', name: '400 Mbps'}, {value: '0.1736', name: '500 Mbps'},
    {value: '0.2778', name: '1 Gbps'}, {value: '0.5694', name: '2 Gbps'},
    {value: '1.25', name: '5 Gbps'}, {value: '2.36', name: '10 Gbps'}
  ];


  /**
   * Redis regions list.
   * @export {!Array.<!Object.<string, string>>}
   */
  this.redisRegionList = [
    {value: 'us-central1', name: 'Iowa'},
    {value: 'us-east1', name: 'South Carolina'},
    {value: 'us-west1', name: 'Oregon'},
    {value: 'europe-west1', name: 'Belgium'},
    {value: 'asia-east1', name: 'Taiwan'},
    {value: 'asia-northeast1', name: 'Tokyo'},
    {value: 'asia-northeast2', name: 'Osaka'},
    {value: 'asia-northeast3', name: 'Seoul'},
    {value: 'asia-southeast1', name: 'Singapore'},
    {value: 'asia-southeast2', name: 'Jakarta'},
    {value: 'europe-west4', name: 'Netherlands'},
    {value: 'us-east4', name: 'Northern Virginia'},
    {value: 'europe-west2', name: 'London'},
    {value: 'europe-west3', name: 'Frankfurt'},
    {value: 'europe-central2', name: 'Warsaw'},
    {value: 'australia-southeast1', name: 'Sydney'},
    {value: 'australia-southeast2', name: 'Melbourne'},
    {value: 'asia-south1', name: 'Mumbai'},
    {value: 'asia-south2', name: 'Delhi'},
    {value: 'northamerica-northeast1', name: 'Montreal'},
    {value: 'northamerica-northeast2', name: 'Toronto'},
    {value: 'southamerica-east1', name: 'Sao Paulo'},
    {value: 'southamerica-west1', name: 'Santiago'},
    {value: 'us-west2', name: 'Los Angeles'},
    {value: 'europe-west6', name: 'Zurich'},
    {value: 'europe-north1', name: 'Finland'},
    {value: 'asia-east2', name: 'Hong Kong'},
  ];

  /**
   * Memcached regions list.
   * @export {!Array.<!Object.<string, string>>}
   */
  this.memecashedRegionList = [
    {value: 'asia-east1', name: 'Taiwan'},
    {value: 'asia-northeast1', name: 'Tokyo'},
    {value: 'asia-southeast1', name: 'Singapore'},
    {value: 'asia-southeast2', name: 'Jakarta'},
    {value: 'australia-southeast1', name: 'Sydney'},
    {value: 'australia-southeast2', name: 'Melbourne'},
    {value: 'europe-west1', name: 'Belgium'},
    {value: 'europe-west2', name: 'London'},
    {value: 'europe-west3', name: 'Frankfurt'},
    {value: 'europe-central2', name: 'Warsaw'},
    {value: 'europe-west4', name: 'Netherlands'},
    {value: 'us-central1', name: 'Iowa'},
    {value: 'us-east1', name: 'South Carolina'},
    {value: 'us-east4', name: 'Northern Virginia'},
    {value: 'us-west1', name: 'Oregon'},
    {value: 'us-west2', name: 'Los Angeles'},
  ];


  /**
   * Full regions list.
   * @export {!Array<!Object<string, string>>}
   */
  this.gaeRegionList = [
    {value: 'us-central1', name: 'Iowa'},
    {value: 'us-east1', name: 'South Carolina'},
    {value: 'us-east4', name: 'Northern Virginia'},
    {value: 'us-west1', name: 'Oregon'},
    {value: 'us-west2', name: 'Los Angeles'},
    {value: 'us-west3', name: 'Salt Lake City'},
    {value: 'us-west4', name: 'Las Vegas'},
    {value: 'europe-west1', name: 'Belgium'},
    {value: 'europe-west2', name: 'London'},
    {value: 'europe-west3', name: 'Frankfurt'},
    {value: 'europe-central2', name: 'Warsaw'},
    {value: 'europe-west6', name: 'Zurich'},
    {value: 'australia-southeast1', name: 'Sydney'},
    {value: 'australia-southeast2', name: 'Melbourne'},
    {value: 'asia-east1', name: 'Taiwan'},
    {value: 'asia-east2', name: 'Hong Kong'},
    {value: 'asia-northeast1', name: 'Tokyo'},
    {value: 'asia-northeast2', name: 'Osaka'},
    {value: 'asia-northeast3', name: 'Seoul'},
    {value: 'asia-southeast1', name: 'Singapore'},
    {value: 'asia-southeast2', name: 'Jakarta'},
    {value: 'asia-south1', name: 'Mumbai'},
    {value: 'asia-south2', name: 'Delhi'},
    {value: 'southamerica-east1', name: 'Sao Paulo'},
    {value: 'southamerica-west1', name: 'Santiago'},
    {value: 'northamerica-northeast1', name: 'Montreal'},
    {value: 'northamerica-northeast2', name: 'Toronto'},
  ];

  /**
   * Secret Manager regions list.
   * @export {!Array<!Object<string, string>>}
   */
  this.secretManagerRegionList = [
    {value: 'automatic', name: 'Automatic'},
    {value: 'asia-east1', name: 'Taiwan'},
    {value: 'asia-southeast1', name: 'Singapore'},
    {value: 'europe-north1', name: 'Finland'},
    {value: 'europe-west1', name: 'Belgium'},
    {value: 'europe-west4', name: 'Netherlands'},
    {value: 'us-central1', name: 'Iowa'},
    {value: 'us-east1', name: 'South Carolina'},
    {value: 'us-east4', name: 'Northern Virginia'},
    {value: 'us-west1', name: 'Oregon'},
    {value: 'us-west2', name: 'Los Angeles'}
  ];


  /**
   * App Engine standard instance list.
   * @export {!Object<string, string>}
   */
  this.appEngineInstanceTypeList = {
    'B1': 1,
    'B2': 2,
    'B4': 4,
    'B4_1G': 6,
    'B8': 8,
    'F1': 1,
    'F2': 2,
    'F4': 4,
    'F4_1G': 6
  };

  /**
   * Sole tenant regions list.
   * @export {!Array.<!Object.<string, string>>}
   */
  this.soleTenantRegionList = [
    {value: 'us-central1', name: 'Iowa'},
    {value: 'us-east1', name: 'South Carolina'},
    {value: 'us-east4', name: 'Northern Virginia'},
    {value: 'us-west1', name: 'Oregon'},
    {value: 'us-west2', name: 'Los Angeles'},
    {value: 'us-west3', name: 'Salt Lake City'},
    {value: 'us-west4', name: 'Las Vegas'},
    {value: 'europe-west1', name: 'Belgium'},
    {value: 'europe-west2', name: 'London'},
    {value: 'europe-west3', name: 'Frankfurt'},
    {value: 'europe-central2', name: 'Warsaw'},
    {value: 'asia-east1', name: 'Taiwan'},
    {value: 'asia-east2', name: 'Hong Kong'},
    {value: 'asia-northeast1', name: 'Tokyo'},
    {value: 'asia-northeast2', name: 'Osaka'},
    {value: 'asia-northeast3', name: 'Seoul'},
    {value: 'asia-southeast1', name: 'Singapore'},
    {value: 'asia-southeast2', name: 'Jakarta'},
    {value: 'asia-south1', name: 'Mumbai'},
    {value: 'asia-south2', name: 'Delhi'},
    {value: 'australia-southeast1', name: 'Sydney'},
    {value: 'australia-southeast2', name: 'Melbourne'},
    {value: 'southamerica-east1', name: 'Sao Paulo'},
    {value: 'southamerica-west1', name: 'Santiago'},
    {value: 'europe-west4', name: 'Netherlands'},
    {value: 'europe-west6', name: 'Zurich'},
    {value: 'europe-north1', name: 'Finland'},
    {value: 'northamerica-northeast1', name: 'Montreal'},
    {value: 'northamerica-northeast2', name: 'Toronto'},
  ];
  /**
   * VMware regions list.
   * @export {!Array.<!Object.<string, string>>}
   */
  this.vmWareRegionList = [
    {value: 'us-central1', name: 'Iowa'},
    {value: 'us-east4', name: 'Northern Virginia'},
    {value: 'us-west2', name: 'Los Angeles'},
    {value: 'europe-west3', name: 'Frankfurt'},
    {value: 'europe-west4', name: 'Netherlands'},
    {value: 'asia-southeast1', name: 'Singapore'},
    {value: 'asia-northeast1', name: 'Tokyo'},
    {value: 'europe-west2', name: 'London'},
    {value: 'australia-southeast1', name: 'Sydney'},
    {value: 'southamerica-east1', name: 'Sao Paulo'},
    {value: 'southamerica-west1', name: 'Santiago'},
    {value: 'northamerica-northeast1', name: 'Montreal'},
    {value: 'northamerica-northeast2', name: 'Toronto'},
    {value: 'asia-south1', name: 'Mumbai'},
  ];
  /**
   * Cloud Composer supported regions list.
   * @export {!Array<!Object<string, string>>}
   */
  this.composerRegionList = [
    {value: 'us-central1', name: 'Iowa'},
    {value: 'us-east1', name: 'South Carolina'},
    {value: 'us-east4', name: 'Northern Virginia'},
    {value: 'us-west2', name: 'Los Angeles'},
    {value: 'us-west3', name: 'Salt Lake City'},
    {value: 'us-west4', name: 'Las Vegas'},
    {value: 'northamerica-northeast1', name: 'Montreal'},
    {value: 'northamerica-northeast2', name: 'Toronto'},
    {value: 'southamerica-east1', name: 'Sao Paulo'},
    {value: 'southamerica-west1', name: 'Santiago'},
    {value: 'europe-west1', name: 'Belgium'},
    {value: 'europe-west2', name: 'London'},
    {value: 'europe-west3', name: 'Frankfurt'},
    {value: 'europe-west6', name: 'Zurich'},
    {value: 'europe-central2', name: 'Warsaw'},
    {value: 'asia-northeast1', name: 'Tokyo'},
    {value: 'asia-northeast2', name: 'Osaka'},
    {value: 'asia-northeast3', name: 'Seoul'},
    {value: 'asia-east2', name: 'Hong Kong'},
    {value: 'asia-south1', name: 'Mumbai'},
    {value: 'asia-south2', name: 'Delhi'},
    {value: 'australia-southeast1', name: 'Sydney'},
    {value: 'australia-southeast2', name: 'Melbourne'}
  ];
  /**
   * Cloud Healthcare API supported regions list.
   * @export {!Array.<!Object.<string, string>>}
   */
  this.healthcareApiRegionList = [
    {value: 'us', name: 'US (multi-regional)'},
    {value: 'us-central1', name: 'Iowa'},
    {value: 'northamerica-northeast1', name: 'Montreal'},
    {value: 'northamerica-northeast2', name: 'Toronto'},
    {value: 'europe-west2', name: 'London'},
    {value: 'asia-northeast1', name: 'Tokyo'},
    {value: 'asia-east2', name: 'Hong Kong'},
    {value: 'europe-west4', name: 'Netherlands'},
    {value: 'europe-west3', name: 'Frankfurt'},
    {value: 'europe-west6', name: 'Zurich'},
    {value: 'asia-south1', name: 'Mumbai'},
    {value: 'asia-southeast1', name: 'Singapore'},
    {value: 'us-west2', name: 'Los Angeles'},
    {value: 'southamerica-east1', name: 'Sao Paulo'},
    {value: 'asia-northeast3', name: 'Seoul'},
    {value: 'australia-southeast1', name: 'Sydney'},
    {value: 'us-east4', name: 'Northern Virginia'},
  ];
  /**
   * BQML supported regions list.
   * @export {!Array.<!Object.<string, string>>}
   */
  this.bqmlRegionList = [
    {value: 'us', name: 'US (multi-regional)'},
    {value: 'europe', name: 'EU (multi-region)'},
    {value: 'asia-northeast1', name: 'Tokyo'},
    {value: 'asia-northeast2', name: 'Osaka'},
    {value: 'asia-northeast3', name: 'Seoul'},
    {value: 'europe-west1', name: 'Belgium'},
    {value: 'europe-west2', name: 'London'},
    {value: 'europe-west4', name: 'Netherlands'},
    {value: 'australia-southeast1', name: 'Sydney'},
    {value: 'australia-southeast2', name: 'Melbourne'},
    {value: 'asia-southeast1', name: 'Singapore'},
    {value: 'asia-southeast2', name: 'Jakarta'},
    {value: 'asia-east1', name: 'Taiwan'},
    {value: 'europe-north1', name: 'Finland'},
    {value: 'us-east4', name: 'Northern Virginia'},
    {value: 'asia-south1', name: 'Mumbai'},
    {value: 'asia-south2', name: 'Delhi'},
    {value: 'northamerica-northeast1', name: 'Montreal'},
    {value: 'northamerica-northeast2', name: 'Toronto'},
    {value: 'asia-east2', name: 'Hong Kong'},
    {value: 'europe-west3', name: 'Frankfurt'},
    {value: 'europe-central2', name: 'Warsaw'},
    {value: 'europe-west6', name: 'Zurich'},
    {value: 'southamerica-east1', name: 'Sao Paulo'},
    {value: 'southamerica-west1', name: 'Santiago'},
    {value: 'us-central1', name: 'Iowa'},
    {value: 'us-east1', name: 'South Carolina'},
    {value: 'us-west1', name: 'Oregon'},
    {value: 'us-west2', name: 'Los Angeles'},
    {value: 'us-west3', name: 'Salt Lake City'},
    {value: 'us-west4', name: 'Las Vegas'},
  ];
  /**
   * BigQuery BI Engine supported regions list.
   * @export {!Array.<!Object.<string, string>>}
   */
  this.bqBiEngineRegionList = [
    {value: 'us', name: 'US (multi-regional)'},
    {value: 'europe', name: 'EU (multi-region)'},
    {value: 'asia-northeast1', name: 'Tokyo'},
    {value: 'asia-northeast2', name: 'Osaka'},
    {value: 'asia-northeast3', name: 'Seoul'},
    {value: 'europe-west1', name: 'Belgium'},
    {value: 'europe-west2', name: 'London'},
    {value: 'europe-west4', name: 'Netherlands'},
    {value: 'australia-southeast1', name: 'Sydney'},
    {value: 'australia-southeast2', name: 'Melbourne'},
    {value: 'asia-southeast1', name: 'Singapore'},
    {value: 'asia-southeast2', name: 'Jakarta'},
    {value: 'asia-east1', name: 'Taiwan'},
    {value: 'europe-north1', name: 'Finland'},
    {value: 'us-east4', name: 'Northern Virginia'},
    {value: 'asia-south1', name: 'Mumbai'},
    {value: 'asia-south2', name: 'Delhi'},
    {value: 'northamerica-northeast1', name: 'Montréal'},
    {value: 'northamerica-northeast2', name: 'Toronto'},
    {value: 'asia-east2', name: 'Hong Kong'},
    {value: 'europe-west3', name: 'Frankfurt'},
    {value: 'europe-central2', name: 'Warsaw'},
    {value: 'europe-west6', name: 'Zurich'},
    {value: 'southamerica-east1', name: 'Sao Paulo'},
    {value: 'southamerica-west1', name: 'Santiago'},
    {value: 'us-central1', name: 'Iowa'},
    {value: 'us-east1', name: 'South Carolina'},
    {value: 'us-west1', name: 'Oregon'},
    {value: 'us-west2', name: 'Los Angeles'},
    {value: 'us-west3', name: 'Salt Lake City'},
    {value: 'us-west4', name: 'Las Vegas'},
  ];
  /**
   * BigQuery Omni supported regions list.
   * @export {!Array.<!Object.<string, string>>}
   */
  this.bigQueryOmniRegionList = [
    {value: 'aws-us-east1', name: 'AWS US-East-1 (N. Virginia)'},
    {value: 'azure-us-east2', name: 'Azure-East US 2'}
  ];
  /**
   * Firestore supported regions list.
   * @export {!Array.<!Object.<string, string>>}
   */
  this.firestoreRegionList = [
    {value: 'us', name: 'US (multi-regional)'},
    {value: 'us-west2', name: 'Los Angeles'},
    {value: 'northamerica-northeast1', name: 'Montreal'},
    {value: 'northamerica-northeast2', name: 'Toronto'},
    {value: 'us-east1', name: 'South Carolina'},
    {value: 'us-east4', name: 'Northern Virginia'},
    {value: 'us-west1', name: 'Oregon'},
    {value: 'southamerica-east1', name: 'Sao Paulo'},
    {value: 'southamerica-west1', name: 'Santiago'},
    {value: 'europe', name: 'EU (multi-region)'},
    {value: 'europe-west2', name: 'London'},
    {value: 'europe-west3', name: 'Frankfurt'},
    {value: 'europe-central2', name: 'Warsaw'},
    {value: 'europe-west6', name: 'Zurich'},
    {value: 'asia-southeast2', name: 'Jakarta'},
    {value: 'asia-south1', name: 'Mumbai'},
    {value: 'asia-south2', name: 'Delhi'},
    {value: 'asia-east1', name: 'Taiwan'},
    {value: 'asia-east2', name: 'Hong Kong'},
    {value: 'asia-southeast1', name: 'Singapore'},
    {value: 'asia-northeast1', name: 'Tokyo'},
    {value: 'australia-southeast1', name: 'Sydney'},
    {value: 'australia-southeast2', name: 'Melbourne'}
  ];
  /**
   * Full regions list.
   * @export {!Array.<!Object.<string, string>>}
   */
  this.bigtableRegionList = [
    {value: 'us-central1', name: 'Iowa'},
    {value: 'us-east1', name: 'South Carolina'},
    {value: 'us-east4', name: 'Northern Virginia'},
    {value: 'us-west1', name: 'Oregon'},
    {value: 'us-west2', name: 'Los Angeles'},
    {value: 'us-west3', name: 'Salt Lake City'},
    {value: 'europe-west1', name: 'Belgium'},
    {value: 'europe-west2', name: 'London'},
    {value: 'europe-west3', name: 'Frankfurt'},
    {value: 'europe-central2', name: 'Warsaw'},
    {value: 'asia-east1', name: 'Taiwan'},
    {value: 'asia-east2', name: 'Hong Kong'},
    {value: 'asia-northeast1', name: 'Tokyo'},
    {value: 'asia-northeast2', name: 'Osaka'},
    {value: 'asia-northeast3', name: 'Seoul'},
    {value: 'asia-southeast1', name: 'Singapore'},
    {value: 'asia-southeast2', name: 'Jakarta'},
    {value: 'asia-south1', name: 'Mumbai'},
    {value: 'asia-south2', name: 'Delhi'},
    {value: 'australia-southeast1', name: 'Sydney'},
    {value: 'australia-southeast2', name: 'Melbourne'},
    {value: 'europe-west4', name: 'Netherlands'},
    {value: 'europe-west6', name: 'Zurich'},
    {value: 'europe-north1', name: 'Finland'},
    {value: 'northamerica-northeast1', name: 'Montreal'},
    {value: 'northamerica-northeast2', name: 'Toronto'},
    {value: 'southamerica-east1', name: 'Sao Paulo'},
    {value: 'southamerica-west1', name: 'Santiago'},
  ];
  /**
   * Cloud Run regions list.
   * @export {!Array.<!Object.<string, string>>}
   */
  this.cloudRunRegionList = [
    {value: 'asia-east1', name: 'Taiwan'},
    {value: 'asia-northeast1', name: 'Tokyo'},
    {value: 'asia-northeast2', name: 'Osaka'},
    {value: 'europe-north1', name: 'Finland'},
    {value: 'europe-west1', name: 'Belgium'},
    {value: 'europe-west4', name: 'Netherlands'},
    {value: 'us-central1', name: 'Iowa'},
    {value: 'us-east1', name: 'South Carolina'},
    {value: 'us-east4', name: 'Northern Virginia'},
    {value: 'us-west1', name: 'Oregon'},
    {value: 'us-west2', name: 'Los Angeles'},
    {value: 'us-west3', name: 'Salt Lake City'},
    {value: 'us-west4', name: 'Las Vegas'},
    {value: 'asia-east2', name: 'Hong Kong'},
    {value: 'asia-northeast3', name: 'Seoul'},
    {value: 'asia-southeast1', name: 'Singapore'},
    {value: 'asia-southeast2', name: 'Jakarta'},
    {value: 'asia-south1', name: 'Mumbai'},
    {value: 'asia-south2', name: 'Delhi'},
    {value: 'australia-southeast1', name: 'Sydney'},
    {value: 'australia-southeast2', name: 'Melbourne'},
    {value: 'europe-west2', name: 'London'},
    {value: 'europe-west3', name: 'Frankfurt'},
    {value: 'europe-central2', name: 'Warsaw'},
    {value: 'europe-west6', name: 'Zurich'},
    {value: 'northamerica-northeast1', name: 'Montreal'},
    {value: 'northamerica-northeast2', name: 'Toronto'},
    {value: 'southamerica-east1', name: 'Sao Paulo'},
    {value: 'southamerica-west1', name: 'Santiago'},
  ];
  /**
   * Cloud Run Tier regions list.
   * @export {!Object .<!Array.<string>>}
   */
  this.cloudRunTierRegionList = {
    tier1: [
      'asia-east1', 'asia-northeast1', 'asia-northeast2', 'europe-north1',
      'europe-west1', 'europe-west4', 'us-central1', 'us-east1', 'us-east4',
      'us-west1'
    ],
    tier2: [
      'asia-east2', 'asia-northeast3', 'asia-southeast1', 'asia-southeast2',
      'asia-south1', 'asia-south2', 'australia-southeast1',
      'australia-southeast2', 'europe-west2', 'europe-west3', 'europe-central2',
      'europe-west6', 'northamerica-northeast1', 'northamerica-northeast2',
      'southamerica-east1', 'southamerica-west1', 'us-west2', 'us-west3',
      'us-west4'
    ]
  };
  /**
   * Filestore supported regions list.
   * @export {!Array<!Object<string, string>>}
   */
  this.filestoreRegionList = [
    {value: 'us-central1', name: 'Iowa'},
    {value: 'us-east1', name: 'South Carolina'},
    {value: 'us-east4', name: 'Northern Virginia'},
    {value: 'us-west1', name: 'Oregon'},
    {value: 'us-west2', name: 'Los Angeles'},
    {value: 'us-west3', name: 'Salt Lake City'},
    {value: 'us-west4', name: 'Las Vegas'},
    {value: 'asia-east1', name: 'Taiwan'},
    {value: 'asia-east2', name: 'Hong Kong'},
    {value: 'asia-northeast1', name: 'Tokyo'},
    {value: 'asia-northeast2', name: 'Osaka'},
    {value: 'asia-northeast3', name: 'Seoul'},
    {value: 'asia-south1', name: 'Mumbai'},
    {value: 'asia-south2', name: 'Delhi'},
    {value: 'asia-southeast1', name: 'Singapore'},
    {value: 'asia-southeast2', name: 'Jakarta'},
    {value: 'australia-southeast1', name: 'Sydney'},
    {value: 'australia-southeast2', name: 'Melbourne'},
    {value: 'europe-central2', name: 'Warsaw'},
    {value: 'europe-north1', name: 'Finland'},
    {value: 'europe-west1', name: 'Belgium'},
    {value: 'europe-west2', name: 'London'},
    {value: 'europe-west3', name: 'Frankfurt'},
    {value: 'europe-west4', name: 'Netherlands'},
    {value: 'europe-west6', name: 'Zurich'},
    {value: 'northamerica-northeast1', name: 'Montreal'},
    {value: 'northamerica-northeast2', name: 'Toronto'},
    {value: 'southamerica-east1', name: 'Sao Paulo'},
    {value: 'southamerica-west1', name: 'Santiago'},
  ];
  /**
   * Anthos environments list.
   * @export {!Array<!Object<string, string>>}
   */
  this.anthosEnvironmentList = [
    {value: 'cloud-gc', name: 'Google Cloud'},
    {value: 'cloud-aws', name: 'AWS'},
    {value: 'cloud-multi', name: 'Attached Clusters'},
    {value: 'onprem-vmware', name: 'On-premises - VMware'},
    {value: 'onprem-bm', name: 'On-premises - Bare metal'},
  ];
  /**
   * Anthos pricing types list.
   * @export {!Array<!Object<string, string>>}
   */
  this.anthosPricingTypeList = [
    {value: 'payg', name: 'Pay-as-you-go'},
    {value: 'subscription', name: 'Subscription'}
  ];
  /**
   * Cloud Run memory allocation list.
   * @export {!Array.<!Object.<string, string|number>>}
   */
  this.cloudRunMemoryAllocationList = [
    {value: 0.125, name: '128MB'}, {value: 0.25, name: '256MB'},
    {value: 0.5, name: '512MB'}, {value: 1, name: '1GB'},
    {value: 2, name: '2GB'}, {value: 4, name: '4GB'}, {value: 8, name: '8GB'}
  ];
  /**
   * Cloud Run cpu allocation list.
   * @export {!Array.<!Object.<string, string|number>>}
   */
  this.cloudRunCpuAllocationList =
      [{value: 1, name: '1'}, {value: 2, name: '2'}, {value: 4, name: '4'}];
  /**
   * Cloud Data Base version allocation list.
   * @export {!Array<!Object<string, string|number>>}
   */
  this.dataBaseVersionList = [
    {value: 'STANDARD', name: 'SQL Server 2017 / 2019 Standard'},
    {value: 'ENTERPRISE', name: 'SQL Server 2017 / 2019 Enterprise'},
    {value: 'EXPRESS', name: 'SQL Server 2017 / 2019 Express'},
    {value: 'WEB', name: 'SQL Server 2017 / 2019 Web'}
  ];

  this.dataPrepEditionList = [
    {value: 'starter', name: 'Starter'},
    {value: 'professional', name: 'Professional'},
    {value: 'enterprise', name: 'Enterprise'},
  ];

  // tabs
  this.tabs = [
    {
      title: 'Compute Engine',
      block: 'compute',
      estimatedLabel: 'showComputeItems',
      sign: 'Compute Engine',
      tabBody: 'computeengineblock'
    },
    {
      title: 'GKE Standard Node Pool (Kubernetes Engine)',
      block: 'gke-standard',
      estimatedLabel: 'showGkeStandardItems',
      sign: 'GKE Standard',
      tabBody: 'gkestandartblock'
    },
    {
      title: 'GKE Autopilot (Kubernetes Engine)',
      block: 'gke-autopilot',
      estimatedLabel: 'showGkeAutopilotItems',
      sign: 'GKE Autopilot',
      tabBody: 'gkeautopilotblock'
    },
    {
      title: 'Cloud Run',
      block: 'cloud-run',
      estimatedLabel: 'showRunItems',
      sign: 'Cloud Run',
      tabBody: 'runblock'
    },
    {
      title: 'Anthos',
      block: 'anthos',
      estimatedLabel: 'showAnthosItems',
      sign: 'Anthos',
      tabBody: 'anthosblock'
    },
    {
      title: 'VMware Engine',
      block: 'vmware',
      estimatedLabel: 'showVMware',
      sign: 'VMware Engine',
      tabBody: 'vmwareblock'
    },
    {
      title: 'App Engine',
      block: 'app-engine',
      estimatedLabel: 'showAppEngine',
      sign: 'App Engine',
      tabBody: 'appengineblock'
    },
    {
      title: 'Cloud Storage',
      block: 'storage',
      estimatedLabel: 'showCloudStorage',
      sign: 'Cloud Storage',
      tabBody: 'cloudstorageblock'
    },
    {
      title: 'Networking Egress',
      block: 'networking-egress',
      estimatedLabel: 'showNetworkingEgressItems',
      sign: 'Networking Egress',
      tabBody: 'egressblock'
    },
    {
      title: 'Cloud Load Balancing and Network Services',
      block: 'lb-network-services',
      estimatedLabel: 'showLBNetworkServicesItems',
      sign: 'Cloud Load Balancing',
      tabBody: 'lbnetworkservicesblock'
    },
    {
      title: 'Interconnect & Cloud VPN',
      block: 'interconnect-vpn',
      estimatedLabel: 'showInterconnectVpnItems',
      sign: 'Interconnect & Cloud VPN',
      tabBody: 'interconnectvpnblock'
    },
    {
      title: 'BigQuery',
      block: 'bigquery',
      estimatedLabel: 'showBigQueryItems',
      sign: 'BigQuery',
      tabBody: 'cloudbigdatablock'
    },
    {
      title: 'BigQuery Omni',
      block: 'bigquery-omni',
      estimatedLabel: 'showBigQueryOmniItems',
      sign: 'BigQuery Omni',
      tabBody: 'bigqueryomniblock'
    },
    {
      title: 'BigQuery ML',
      block: 'bigquery-ml',
      estimatedLabel: 'showBqmlItems',
      sign: 'BigQuery ML',
      tabBody: 'bqmlblock'
    },
    {
      title: 'BigQuery BI Engine',
      block: 'bq-bi-engine',
      estimatedLabel: 'showBqBiEngineItems',
      sign: 'BigQuery BI Engine',
      tabBody: 'bqbiengineblock'
    },
    {
      title: 'Datastore',
      block: 'datastore',
      estimatedLabel: 'showDatastore',
      sign: 'Datastore',
      tabBody: 'clouddatastoreblock'
    },
    {
      title: 'Firestore',
      block: 'cloud-firestore',
      estimatedLabel: 'showFirestore',
      sign: 'Firestore',
      tabBody: 'firestoreblock'
    },
    {
      title: 'Dataproc',
      block: 'dataproc',
      estimatedLabel: 'showDataprocItems',
      sign: 'Dataproc',
      tabBody: 'dataprocblock'
    },
    {
      title: 'Dataflow',
      block: 'cloud-dataflow',
      estimatedLabel: 'showDataflowItems',
      sign: 'Dataflow',
      tabBody: 'dataflowblock'
    },
    {
      title: 'Cloud SQL',
      block: 'sql',
      estimatedLabel: 'showCloudSQLItems',
      sign: 'Cloud SQL',
      tabBody: 'cloudsqlblock'
    },
    {
      title: 'Cloud Bigtable',
      block: 'bigtable',
      estimatedLabel: 'showBigtableItems',
      sign: 'Cloud Bigtable',
      tabBody: 'bigtableblock'
    },
    {
      title: 'Pub/Sub',
      block: 'pub-sub',
      estimatedLabel: 'showPubSubItems',
      sign: 'Pub/Sub',
      tabBody: 'pubsubblock'
    },
    {
      title: 'Cloud Operations (Logging, Monitoring, Trace)',
      block: 'operations-suite',
      estimatedLabel: 'showOperationsItems',
      sign: 'Cloud Operations',
      tabBody: 'operationsblock'
    },
    {
      title: 'Cloud DNS',
      block: 'dns',
      estimatedLabel: 'showCloudDns',
      sign: 'Cloud DNS',
      tabBody: 'clouddnsblock'
    },
    {
      title: 'Microsoft AD',
      block: 'microsoft-ad',
      estimatedLabel: 'showMicrosoftAd',
      sign: 'Microsoft AD',
      tabBody: 'microsoftad'
    },
    {
      title: 'Cloud Translation',
      block: 'translate',
      estimatedLabel: 'showTranslateApiItems',
      sign: 'Cloud Translation',
      tabBody: 'translateapiblock'
    },
    {
      title: 'Cloud Vision',
      block: 'vision-api',
      estimatedLabel: 'showVisionApiItems',
      sign: 'Cloud Vision',
      tabBody: 'visionapiblock'
    },
    {
      title: 'Cloud CDN',
      block: 'cloud-cdn',
      estimatedLabel: 'showCloudCdnItems',
      sign: 'Cloud CDN',
      tabBody: 'cloudcdnblock'
    },
    {
      title: 'Speech-to-Text',
      block: 'speech-api',
      estimatedLabel: 'showSpeechApiItems',
      sign: 'Speech-to-Text',
      tabBody: 'speechapiblock'
    },
    {
      title: 'Text-to-Speech',
      block: 'text-to-speech',
      estimatedLabel: 'showTextToSpeechItems',
      sign: 'Text-to-Speech',
      tabBody: 'texttospeechblock'
    },
    {
      title: 'Cloud Natural Language API',
      block: 'nl-api',
      estimatedLabel: 'showNLApiItems',
      sign: 'NL API',
      tabBody: 'naturallanguageapiblock'
    },
    {
      title: 'AI Platform',
      block: 'ml',
      estimatedLabel: 'showMLItems',
      sign: 'AI Platform',
      tabBody: 'machinelearningblock'
    },
    {
      title: 'Cloud Key Management Service',
      block: 'cloud-kms',
      estimatedLabel: 'showKMSItems',
      sign: 'Cloud KMS',
      tabBody: 'kmsblock'
    },
    {
      title: 'Cloud Spanner',
      block: 'spanner',
      estimatedLabel: 'showSpannerItems',
      sign: 'Cloud Spanner',
      tabBody: 'spannerblock'
    },
    {
      title: 'Cloud Functions',
      block: 'functions',
      estimatedLabel: 'showFunctionsItems',
      sign: 'Cloud Functions',
      tabBody: 'functionsblock'
    },
    {
      title: 'Cloud Endpoints',
      block: 'cloud-endpoints',
      estimatedLabel: 'showEndpointsItems',
      sign: 'Cloud Endpoints',
      tabBody: 'cloudendpointsblock'
    },
    {
      title: 'Cloud Data Loss Prevention (DLP)',
      block: 'data-loss-prevention',
      estimatedLabel: 'showDlpApiItems',
      sign: 'Cloud DLP',
      tabBody: 'dlpblock'
    },
    {
      title: 'Dataprep by Trifacta',
      block: 'dataprep',
      estimatedLabel: 'showDataprepItems',
      sign: 'Dataprep',
      tabBody: 'dataprepblock'
    },
    {
      title: 'IoT Core',
      block: 'iot-core',
      estimatedLabel: 'showIotCoreItems',
      sign: 'IoT Core',
      tabBody: 'iotcoreblock'
    },
    {
      title: 'Video Intelligence API',
      block: 'video-api',
      estimatedLabel: 'showVideoApiItems',
      sign: 'Video Intelligence',
      tabBody: 'videoapiblock'
    },
    {
      title: 'Memorystore for Redis',
      block: 'memorystore',
      estimatedLabel: 'showMemorystoreItems',
      sign: 'Memory store',
      tabBody: 'memorystoreblock'
    },
    {
      title: 'Memorystore for Memcached',
      block: 'memcached',
      estimatedLabel: 'showMemcachedItems',
      sign: 'Memory store',
      tabBody: 'memcachedblock'
    },
    {
      title: 'Dialogflow',
      block: 'dialogflow',
      estimatedLabel: 'showDialogflowItems',
      sign: 'Dialogflow',
      tabBody: 'dialogflowblock'
    },
    {
      title: 'Cloud Composer',
      block: 'composer',
      estimatedLabel: 'showComposerItems',
      sign: 'Cloud Composer',
      tabBody: 'composerblock'
    },
    {
      title: 'Cloud Healthcare API',
      block: 'healthcare-api',
      estimatedLabel: 'showHealthcareApiItems',
      sign: 'Healthcare API',
      tabBody: 'healthcareapiblock'
    },
    {
      title: 'Identity Platform',
      block: 'identity-platform',
      estimatedLabel: 'showIdentityPlatformItems',
      sign: 'Identity Platform',
      tabBody: 'identityplatformblock'
    },
    {
      title: 'Security Command Center (Cloud SCC)',
      block: 'scc',
      estimatedLabel: 'showSccItems',
      sign: 'scc',
      tabBody: 'sccblock'
    },
    {
      title: 'Cloud Scheduler',
      block: 'cloud-scheduler',
      estimatedLabel: 'showSchedulerItems',
      sign: 'Cloud Scheduler',
      tabBody: 'schedulerblock'
    },
    {
      title: 'Filestore',
      block: 'cloud-filestore',
      estimatedLabel: 'showFilestoreItems',
      sign: 'Filestore',
      tabBody: 'filestoreblock'
    },
    {
      title: 'Artifact Registry',
      block: 'artifact-registry',
      estimatedLabel: 'showArtifactRegistry',
      sign: 'Artifact Registry',
      tabBody: 'artifactregistryblock'
    },
    {
      title: 'Secret Manager',
      block: 'secret-manager',
      estimatedLabel: 'showSecretManagerItems',
      sign: 'Secret Manager',
      tabBody: 'secretmanagerblock'
    },
    {
      title: 'reCAPTCHA',
      block: 'recaptcha',
      estimatedLabel: 'showRecaptchaItems',
      sign: 'reCAPTCHA',
      tabBody: 'recaptchablock'
    },
    {
      title: 'Certificate Authority Service',
      block: 'ca-service',
      estimatedLabel: 'showCaService',
      sign: 'CA Service',
      tabBody: 'caserviceblock'
    },
    {
      title: 'Data Catalog',
      block: 'data-catalog',
      estimatedLabel: 'showDataCatalogItems',
      sign: 'Data Catalog',
      tabBody: 'datacatalogblock'
    },
    {
      title: 'Cloud Data Fusion',
      block: 'data-fusion',
      estimatedLabel: 'showDataFusionItems',
      sign: 'Cloud Data Fusion',
      tabBody: 'datafusionblock'
    },
    {
      title: 'Workflows',
      block: 'workflows',
      estimatedLabel: 'showWorkflowsItems',
      sign: 'Workflows',
      tabBody: 'workflowsblock'
    },
    {
      title: 'Recommendations AI',
      block: 'recommendationsAi',
      estimatedLabel: 'showRecommendationsAi',
      sign: 'Recommendations AI',
      tabBody: 'recommendationsaiblock'
    },
    {
      title: 'Transcoder API',
      block: 'transcoder-api',
      estimatedLabel: 'showTranscoderApiItems',
      sign: 'Transcoder API',
      tabBody: 'transcoderapiblock'
    },
    {
      title: 'Orbitera',
      block: 'orbitera',
      estimatedLabel: 'showOrbiteraItems',
      sign: 'Orbitera',
      tabBody: 'orbiterablock'
    },
    {
      title: 'Cloud Source Repositories',
      block: 'cloudSourceRepo',
      estimatedLabel: 'showCloudSourceRepo',
      sign: 'Cloud Source Repositories',
      tabBody: 'cloudsourcerepoblock'
    },
    {
      title: 'Talent Solution',
      block: 'talent-solution',
      estimatedLabel: 'showJobDiscoveryItems',
      sign: 'Talent Solution',
      tabBody: 'jobdiscoveryblock'
    },
    {
      title: 'Premium Support',
      block: 'premium-support',
      estimatedLabel: 'showPremiumSupportItems',
      sign: 'Premium Support',
      tabBody: 'premiumsupportblock'
    },
    {
      title: 'Enhanced Support',
      block: 'enhanced-support',
      estimatedLabel: 'showEnhancedSupportItems',
      sign: 'Enhanced Support',
      tabBody: 'enhancedsupportblock'
    },
    {
      title: 'Standard Support',
      block: 'standard-support',
      estimatedLabel: 'showStandardSupportItems',
      sign: 'Standard Support',
      tabBody: 'standardsupportblock'
    },
    {
      title: 'PSO',
      block: 'pso',
      estimatedLabel: 'showPSOItems',
      sign: 'PSO',
      tabBody: 'psoblock'
    }
  ];
  /**
   * Current tab to show
   * @type {number}
   */
  this.activeTab = 0;
  /**
   * Current bq tab to show
   * @type {number}
   */
  this.bqTab = 0;
  /**
   * Current operations tab to show
   * @type {number}
   */
  this.sdTab = 0;
  // this.setActiveTab('data-loss-prevention');
  /* this.scope_.$watch(goog.bind(function() {
    return this.CartData.tabId;
  }, this), goog.bind(function(newVal) {
    var invalid = true;
    if (newVal) {
      invalid = goog.array.every(this.tabs, function(item) {
        return newVal != item.block;
      });
      !invalid && this.setActiveTab(this.CartData.tabId);
    }
  }, this)); */
  var listener = goog.bind(function(event) {
    // splitted id from main window hash
    this.parseUrlHash(event.data);
    // this.setActiveTab(tabId);
  }, this);

  if (window.addEventListener) {
    addEventListener('message', listener, false);
  } else {
    attachEvent('onmessage', listener);
  }
  // this.setActiveTab('enhanced-support');


  /**
   * @export {number} The number of points on the CPU slider equal to
   * maxCpus/2+1 because we only accept even CPU numbers.
   */
  this.maxSliderCpus = 49;
  /** @export {number} */
  this.maxCpus = 96;
  /** @export {number} */
  this.minSliderMemory = 0.9;
  /** @export {number} */
  this.minMemory = 0.9;
  /** @export {number} */
  this.maxMemory = 6.5;
  /** @export {boolean} */
  this.hasTouchedMemorySlider = false;
  /** @export {number} */
  this.maxHours = 24;
  /** @export {number} */
  this.maxMinutes = 1440;

  this.scope_.$watch(goog.bind(function() {
    return document.querySelector('.main-content').offsetHeight;
  }, this), goog.bind(function(newVal, oldVal) {
    this.CartData.updateOriginHeight(1);
  }, this));

  // listeners for pgpu page
  PGPU_PAGE && this.setupPgpuListeners_();

  /**
   * Set up the App Engine form
   * @export {boolean}
   */
  this.showAppEngine = true;
  this.setupAppEngineServicesData();
  this.setupAppEngineStandardData();
  this.setupAppEngineFlexibleData();

  /**
   * Set up the Compute Engine form defaults
   * @export {boolean}
   */
  this.showComputeEngine = true;

  /**
   * Set up the Cloud Datastore form
   * @export {boolean}
   */
  this.showDatastore = true;
  this.setupDatastore();

  /**
   * Set up the Cloud Firestore form
   * @export {boolean}
   */
  this.showFirestore = true;
  this.setupFirestore();

  /**
   * Set up the Identity Platform form
   * @export {boolean}
   */
  this.showIdentityPlatform = true;
  this.setupIdentityPlatform();

  this.generateComputeInstanceList();
  this.setupComputeServerData();

  /**
   * Set up the Persistent Disk form defaults
   * @export {boolean}
   */
  this.showPersistentDisk = true;
  this.setupPersistentDiskData();

  /**
   * Set up the Load Balancer and Network Services form defaults
   * @export {boolean}
   */
  this.showLoadBalancer = true;
  this.setupLoadBalancerData();
  this.showLbNetworkServices = true;
  this.setupLbnsCloudNatData();
  this.showLbnsCloudArmor = true;
  this.setupLbnsCloudArmorData();
  this.showLbnsIpAddresses = true;
  this.setupLbnsIpAddressData();
  this.showNetworkTelemetry = true;
  this.setupNetworkTelemetryData();

  /**
   * Set up the Cloud Storage form defaults
   * @export {boolean}
   */
  this.showCloudStorage = true;
  this.setupCloudStorageData();

  /**
   * Set up the GCS Egress form defaults
   * @export {boolean}
   */
  this.showGcsEgress = true;

  /**
   * Set up the Internet Egress form defaults
   * @export {boolean}
   */
  this.showInternetEgress = true;
  this.setupInternetEgressData();

  /**
   * Set up the vm to vm egress form defaults
   * @export {boolean}
   */
  this.vmFormButton = true;
  this.showVmEgress = true;
  this.setupVmEgressData();

  /**
   * Set up the interconnect egress form defaults
   * @export {boolean}
   */
  this.showInterconnectEgress = true;
  this.setupInterconnectEgressData();

  /**
   * Set up the TPU form defaults
   * @export {boolean}
   */
  this.showTpu = true;
  this.setupTpuData();

  /**
   * Set up the TPU form defaults
   * @export {boolean}
   */
  this.showSoleTenant = true;
  this.setupSoleTenantData();

  /**
   * Set up the Cloud Sql server form defaults
   * @export {boolean}
   */
  this.showCloudSqlServer = true;

  this.setupCloudSQL2Data();
  this.setupCloudSQLPostgreData();
  this.setupCloudSqlServerData();

  /**
   * Set up the VMware Engine.
   * @export {boolean}
   */
  this.showVMware = true;
  this.setupVMwareeData();

  /**
   * Set up the BigQuery form defaults
   * @export {boolean}
   */
  this.showBigQuery = true;
  this.setupBigQuery();
  this.setupBigQueryFlatRate();

  /**
   * Set up the BigQuery ML form defaults
   * @export {boolean}
   */
  this.showBqml = true;
  this.setupBqml();
  /**
   * Set up the Cloud DNS form defaults
   * @export {boolean}
   */
  this.showCloudDns = true;
  this.setupCloudDns();

  /**
   * Set up the Translate API form defaults
   * @export {boolean}
   */
  this.showTranslateApi = true;
  this.setupTranslateApi();

  /**
   * Set up the Secret Manager form defaults
   * @export {boolean}
   */
  this.showSecretManager = true;
  this.setupSecretManager();

  /**
   * Set up the Prediction API form defaults
   * @export {boolean}
   */
  this.showPredictionApi = true;
  this.setupPredictionApi();

  /**
   * Set up the Pub Sub form defaults
   * @export {boolean}
   */
  this.showPubSub = true;
  this.setupPubSub();

  /**
   * Set up the Dataproc form defaults
   * @export {boolean}
   */
  this.showDataproc = true;
  this.DataprocFormValid = false;
  this.setupDataproc();

  /**
   * Set up the Dataflow form defaults
   * @export {boolean}
   */
  this.showDataflow = true;
  this.setupDataflow();

  /**
   * Set up the workflows form defaults
   * @export {boolean}
   */
  this.showWorkflows = true;
  this.setupWorkflows();

  /**
   * Set up the Recommendations AI form defaults
   * @export {boolean}
   */
  this.showRecommendationsAi = true;
  this.setupRecommendationsAi();

  /**
   * Set up the Interconnect & VPN form defaults
   * @export {boolean}
   */
  this.showPartnerInterconnectVpn = true;
  this.setupPartnerInterconnectVpn();
  this.showDecicatedInterconnectVpn = true;
  this.setupDedicatedInterconnectVpn();
  this.showCloudVpn = true;
  this.setupCloudVpn();

  /**
   * Set up the Bigtable form defaults
   * @export {boolean}
   */
  this.showBigtable = true;
  this.setupBigtable();

  /**
   * Set up the Container Engine form defaults
   * @export {boolean}
   */
  this.containerEngineFormValid = false;
  this.showContainerEngine = true;
  this.setupContainerEngine();
  this.setupGkeAutopilot();
  this.setupGkeCluster();
  /**
   * Set up the GKE Egress form defaults
   * @export {boolean}
   */
  this.showGkeEgress = true;
  /**
   * Set up the support form defaults
   * @export {boolean}
   */
  this.showSupport = true;
  this.setupPremiumSupport();
  this.setupEnhancedSupport();
  this.setupStandardSupport();
  /**
   * Set up the reCAPTCHA form defaults
   * @export {boolean}
   */
  this.showRecaptcha = true;
  this.setupRecaptcha();
  /**
   * Set up the support form defaults
   * @export {boolean}
   */
  this.showPSO = true;
  this.setupPSOData();
  /**
   * Set up the vision api form defaults
   * @export {boolean}
   */
  this.showVisionApi = true;
  this.setupVisionApiData();
  /**
   * Set up the job discovery form defaults
   * @export {boolean}
   */
  this.showJobDiscovery = true;
  this.setupJobDiscoveryData();
  /**
   * Set up the operations form defaults
   * @export {boolean}
   */
  this.showOperations = true;
  this.setupOperationsData();
  this.setupOperationsData2metrics();
  this.setupOperationsData2logs();
  this.setupOperationsData2traces();
  /**
   * Set up the operations form defaults
   * @export {boolean}
   */
  this.showCloudCdn = true;
  this.setupCloudCdnData();
  /**
   * Set up the Speech API form defaults
   * @export {boolean}
   */
  this.showSpeechApi = true;
  this.setupSpeechApi();
  /**
   * Set up the Text-to-Speech form defaults
   * @export {boolean}
   */
  this.showTextToSpeech = true;
  this.setupTextToSpeech();
  /**
   * Set up the NL API form defaults
   * @export {boolean}
   */
  this.showNLApi = true;
  this.setupNLApiData();
  /**
   * Set up the ML form defaults
   * @export {boolean}
   */
  this.showML = true;
  this.setupMLData();
  /**
   * Set up the KMS form defaults
   * @export {boolean}
   */
  this.showKMS = true;
  this.setupKMSData();
  /**
   * Set up the Spanner form defaults
   * @export {boolean}
   */
  this.showSpanner = true;
  this.setupSpanner();
  /**
   * Set up the Functions form defaults
   * @export {boolean}
   */
  this.showFunctions = true;
  this.setupFunctions();
  /**
   * Set up the Endpoints form defaults
   * @export {boolean}
   */
  this.showEndpoints = true;
  this.setupEndpoints();
  /**
   * Set up the DLP API form defaults
   * @export {boolean}
   */
  this.showDlpApi = true;
  this.setupDlpApi();
  this.setupDlpApiStorage();
  this.activeDlpTab = 0;
  /**
   * Set up the Dataprep form defaults
   * @export {boolean}
   */
  this.showDataprep = true;
  this.setupDataprep();
  /**
   * Set up the IoT Core form defaults
   * @export {boolean}
   */
  this.showIotCore = true;
  this.setupIotCoreData();
  /**
   * Set up the Container Builder form defaults
   * @export {boolean}
   */
  this.showContainerBuilder = true;
  this.setupContainerBuilderData();
  /**
   * Set up the video intelligence api form defaults
   * @export {boolean}
   */
  this.showVideoApi = true;
  this.setupVideoApiData();
  /**
   * Set up the memorystore for redis form defaults
   * @export {boolean}
   */
  this.showMemorystore = true;
  this.setupMemorystoreData();
  /**
   * Set up the datafusion form defaults
   * @export {boolean}
   */
  this.showDataFusion = true;
  this.setupDataFusionData();
  /**
   * Set up the memorystore for Memcached form defaults
   * @export {boolean}
   */
  this.showMemcached = true;
  this.setupMemcachedData();
  /**
  /**
   * Set up the dialogflow ES and CX logs form defaults
   * @export {boolean}
   */
  this.showDialogflowEs = true;
  this.showDialogflowCx = true;
  this.setupDialogflowEsData();
  this.setupDialogflowCxData();
  /**
  /**
   * Set up the composer form defaults
   * @export {boolean}
   */
  this.showComposer = true;
  this.setupComposerData();
  /**
   * Set up the Healthcare api form defaults
   * @export {boolean}
   */
  this.showHealthcareApi = true;
  this.setupHealthcareApiData();
  /**
   * Set up the Orbitera form defaults
   * @export {boolean}
   */
  this.showOrbitera = true;
  this.setupOrbiteraData();
  /**
   * Set up the Scc form defaults
   * @export {boolean}
   */
  this.showScc = true;
  this.setupSccData();
  /**
   * Set up the Cloud Scheduler form defaults
   * @export {boolean}
   */
  this.showScheduler = true;
  this.setupSchedulerData();

  /**
   * Set up the Cloud Filestore form defaults
   * @export {boolean}
   */
  this.filestoreButton = true;
  this.showFilestoreItems = true;
  this.setupFilestoreData();
  /**
   * Set up the Certificate Authority Service form defaults
   * @export {boolean}
   */
  this.showCaServiceItems = true;
  this.setupCaServiceData();
  /**
   * Set up the Artifact Registry form defaults
   * @export {boolean}
   */
  this.showArtifactRegistryItems = true;
  this.setupArtifactRegistryData();
  /**
   * Set up the Dataflow form defaults
   * @export {boolean}
   */
  this.showRun = true;
  this.setupRun();
  /**
   * Set up the Microsoft Active Directory form defaults
   * @export {boolean}
   */
  this.showMicrosoftAd = true;
  this.setupMicrosoftAd();
  /**
   * Set up the Data Catalog form defaults
   * @export {boolean}
   */
  this.showDataCatalog = true;
  this.setupDataCatalog();
  /**
   * Set up the Cloud SQL form defaults
   * @export {boolean}
   */
  this.showCloudSQL = true;

  /**
   * Set up the Cloud Source Repo form defaults
   * @export {boolean}
   */
  this.showCloudSourceRepo = true;
  this.setupCloudSourceRepo();

  /**
   * Set up the BigQuery Omni form defaults
   * @export {boolean}
   */
  this.showBigQueryOmniItems = true;
  this.setupBigQueryOmni();

  /**
   * Set up the Transcoder API defaults
   * @export {boolean}
   */
  this.showTranscoderApiItems = true;
  this.setupTranscoderApi();

  /**
   * Maps BI Engine products to tab indexes.
   * @enum {number}
   */
  this.bqBiEngineTab = {ON_DEMAND: 0, FLAT_RATE: 1};

  /**
   * Maps BI Engine products to tab indexes.
   * @export {!Object.<number, number>}
   */
  this.bqBiSlotsMemoryMapping = {500: 25, 1000: 50, 1500: 75, 2000: 100};

  /**
   * Contains the current Cloud SQL tab index.
   * @export {number}
   */
  this.currentBqBiEngineTab = this.bqBiEngineTab.ON_DEMAND;

  /**
   * Set up the BigQuery BI Engine form defaults
   * @export {boolean}
   */
  this.showBqBiEngine = true;
  this.setupBqBiEngineOnDemand();
  this.setupBqBiEngineFlatRate();
};

var ListingCtrl = cloudpricingcalculator.views.listing.ListingCtrl;


/**
 * Attaches listeners for pgpu pages
 * @private
 */
ListingCtrl.prototype.setupPgpuListeners_ = function() {
  this.pgpu =
      {blockStorage: 0, gpuCount: 1, gpuType: 'NVIDIA_TESLA_K80', ssd: 0};
  this.pgpuPrice = 0;

  this.scope_.$watch(goog.bind(function() {
    return this.computeServer.inputMemoryGb;
  }, this), goog.bind(function(newVal, oldVal) {
    this.calculatePgpu_();
  }, this));
  this.scope_.$watch(goog.bind(function() {
    return this.pgpu;
  }, this), goog.bind(function(newVal, oldVal) {
    this.calculatePgpu_();
  }, this), true);
};



/**
 * Sets active tab from parent page URL.
 * @param {string} hash
 */
ListingCtrl.prototype.parseUrlHash = function(hash) {
  if (!hash || typeof hash !== 'string') {
    return;
  }
  if (hash.indexOf('tab=') !== -1) {
    let tab = hash.split('?')[0].split('=')[1];
    invalid = goog.array.every(this.tabs, function(item) {
      return tab != item.block;
    });
    this.timeout_(function() {
      !invalid && this.setActiveTab(tab);
    }.bind(this), 2);
  }
};



/**
 * Searches for product in product list
 * @param {string} query item to verify
 * @return {!Array.<!Object<string, string>>} list of products
 * @export
 */
ListingCtrl.prototype.productSearch = function(query) {
  var results =
      query ? this.tabs.filter(this.createFilterFor_(query)) : this.tabs;
  return results;
};


/**
 * Searches for product in product list
 * @param {!Object<string, string>} item selected item
 * @export
 */
ListingCtrl.prototype.selectedProductChange = function(item) {
  item && this.setActiveTab(item.block);
};


/**
 * Performs actions on tab selection
 * @param {string} tab selected tab
 * @export
 */
ListingCtrl.prototype.onTabSelected = function(tab) {
  this.activeTabs = tab.block;
  /*if (this.searchProduct != tab.title) {
    this.searchProduct = tab.title;
  }*/
};


/**
 * Creates filter function for a query string
 * @param {string} query item to verify
 * @return {boolean}
 * @private
 */
ListingCtrl.prototype.createFilterFor_ = function(query) {
  var lowercaseQuery = query.toLowerCase();

  return function filterFn(state) {
    return (state.title.toLowerCase().indexOf(lowercaseQuery) > -1);
  };
};


/**
 * Attaches listeners for pgpu pages
 * @private
 */
ListingCtrl.prototype.calculatePgpu_ = function() {
  if (this.computeServer.customGuestCpus && this.computeServer.inputMemoryGb) {
    if (this.CloudCalculator.updated) {
      var hoursPerMonth = 1;
      var totalHoursPerMonth = 1;
      var region = 'us-central1';
      var quantity = 1;
      var PB_SKU = '-PREEMPTIBLE';
      var isPreemptible = true;
      var sku = 'CP-COMPUTEENGINE-VMIMAGE-CUSTOM-' +
          this.computeServer.customGuestCpus + '-' +
          this.computeServer.inputMemoryGb + PB_SKU;
      var sustainedPriceItem =
          this.CloudCalculator.calculateSustainedUseDiscountPrice(
              sku, hoursPerMonth, region, quantity);

      var perHostPrice = sustainedPriceItem.totalPrice;
      this.pgpuPrice = perHostPrice;
      /*var ssd = this.pgpu.ssd;
      var ssdPrice = this.CloudCalculator.getSsdPrice(region, isPreemptible);
      // each ssd solid disk has 375 gb
      var ssdCost = ssdPrice * totalHoursPerMonth * ssd * 375;
      this.pgpuPrice += ssdCost;*/

      // Calculate GPU cost
      var gpuCost = 0;
      var gpuType = this.pgpu.gpuType;
      var gpuSKU = this.BASE_GPU_SKU + gpuType + PB_SKU;
      var gpuCount = this.pgpu.gpuCount;
      gpuCost =
          this.CloudCalculator.calculateItemPrice(gpuSKU, gpuCount, region, 0);
      this.pgpuPrice += gpuCost;
      // Calculate block storage
      /*var storage = this.pgpu.blockStorage;
      sku = 'CP-COMPUTEENGINE-STORAGE-PD-CAPACITY';
      var storageCost =
          this.CloudCalculator.calculateItemPrice(sku, storage, region, 0) /
          730;
      this.pgpuPrice += storageCost;*/
    } else {
      this.timeout_(function() {
        this.calculatePgpu_();
      }.bind(this), 200)
    }
  }
};



/**
 * Verify the item is a number
 * @param {number} n item to verify
 * @return {boolean} The input is a number.
 * @export
 */
ListingCtrl.prototype.isNumber = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};


/**
 * Set active tab and post message to update iframe height
 * @param {string} tab thet should be activated
 * @export
 */
ListingCtrl.prototype.setActiveTab = function(tab) {
  this.activeTab = this.getTabIndex(tab);
  /*this.location_.search('tab', tab)*/
  this.CartData.updateOriginHeight();
};


/**
 * Gets index of selected tab.
 * @param {string} tabId thet should be activated
 * @return {number} index of tab.
 * @export
 */
ListingCtrl.prototype.getTabIndex = function(tabId) {
  /** @type {number}*/
  var tabIndex = 0;
  goog.array.forEach(this.tabs, function(tab, i) {
    if (tab.block == tabId) {
      tabIndex = i;
    }
  });
  return tabIndex;
};


/**
 * Find editable entry, set active tab and prepopulate form
 * @param {!Object} product to remove
 * @param {?boolean} isDeletionNeeded flag if it needs to be deleted from cart
 * @export
 */
ListingCtrl.prototype.edit = function(product, isDeletionNeeded) {
  this.isEditFlow = true;
  var cart = this.CartData.get();
  /** @type {!Array<string>}*/
  var items = this.CartData.getRemovableIds(product).reverse();
  /** @type {!Object<string, (number|string)>}*/
  var item;
  /** @type {!Object<string, (number|string)>}*/
  var initial_items;
  for (var i = 0; i < items.length; i++) {
    for (var j = 0; j < cart.length; j++) {
      if (items[i] == cart[j].uniqueId) {
        /* Decrement the cart contents */
        this.CloudCalculator.totalPrice -= cart[j].price;
        item = goog.object.clone(cart[j].items.editHook);
        initial_items = goog.object.clone(cart[j].items);
        /* Remove the item */
        if (isDeletionNeeded == undefined || isDeletionNeeded == true) {
          this.CartData.remove(j);
        }
        break;
      }
    } /* end for j loop */

  } /* end for i loop */

  if (!item || !item.tab || !item.initialInputs || !item.product) {
    return;
  }
  /** Populates form with editable values. Supports new and old contracts. */
  switch (item.product) {
    case 'computeServer':
      /** @type {string}*/
      var location = item.initialInputs.location;
      if (!this.fullRegion[location]) {
        location = this.regionFallback[location];
      }
      switch (location) {
        case 'us':
          location = 'us-central1';
          break;
        case 'europe':
          location = 'europe-west1';
          break;
      }
      /** @type {string}*/
      let sku = item.initialInputs.instance.replace('-PREEMPTIBLE', '');
      item.initialInputs.instance = sku;
      // Replacing old generations with series
      if (item.initialInputs.generation && !item.initialInputs.series) {
        item.initialInputs.series =
            item.initialInputs.family + item.initialInputs.generation;
        switch (item.initialInputs.family) {
          case 'n':
            item.initialInputs.family = 'gp'
            break;
          case 'c':
            item.initialInputs.family = 'compute'
            break;
          case 'm':
            item.initialInputs.family = 'memory'
            break;
        }
      }
      goog.object.extend(this.computeServer, item.initialInputs);
      if (sku.indexOf('CUSTOM') > -1) {
        this.computeServer.instance = 'custom';
        var cpu = this.CloudCalculator.getCoresNumber(sku);
        var ram = this.CloudCalculator.getRAMValue(sku);
        this.computeServer.customGuestCpus = cpu;
        this.setSliderCpus_();
        this.setCpuSlider();
        this.timeout_(function() {
          this.computeServer.inputMemoryGb = ram;
          this.checkInputMemory();
        }.bind(this), 2);
      } else {
        this.computeServer.customGuestCpus = 1;
        if (item.initialInputs.label.includes('Dataproc')) {
          this.computeServer.series =
              this.CloudCalculator.getFamilyFromSku(item.initialInputs.instance)
                  .toLowerCase();
          for (const [key, value] of Object.entries(
                   this.computeServerGenerationOptions)) {
            for (const [key1, value1] of Object.entries(value)) {
              const valuesArray = Object.values(value1);
              if (valuesArray.includes(
                      this.computeServer.series.toUpperCase())) {
                this.computeServer.family = key;
              }
            }
          }
        }
        this.setSliderCpus_();
        this.setCpuSlider();
      }
      this.toggleMemoryExtension();
      item.tab = 'compute';
      this.onInstanceChange(item.product);
      this.onLocationChange();
      this.resetTimeMode('computeServer');
      break;
    case 'spanner':
      Object.assign(this[item.product], item.initialInputs);
      this.spannerStorageValidation();
      break;
    case 'soleTenant':
      Object.assign(this[item.product], item.initialInputs);
      this.resetTimeMode('soleTenant');
      break;
    case 'composer':
      Object.assign(this[item.product], item.initialInputs);
      this.resetTimeMode('composer');
      break;
    case 'vmwareData':
      Object.assign(this[item.product], item.initialInputs);
      this.resetTimeMode('vmwareData');
      break;
    case 'tpu':
      Object.assign(this[item.product], item.initialInputs);
      this.resetTimeMode('tpu');
      break;
    case 'persistentDisk':
      var location = item.initialInputs.location || 'us-central1';
      switch (location) {
        case 'us':
          location = 'us-central1';
          break;
        case 'europe':
          location = 'europe-west1';
          break;
      }
      this.persistentDisk = {
        'location': location,
        'ssdStorage': {
          value: product.pdSsdStorage || null,
          unit:
              this.pickCorrectUnit_('ssdStorage', item.initialInputs.ssdStorage)
        },
        'storage': {
          value: product.pdStorage || null,
          unit: this.pickCorrectUnit_('pdStorage', item.initialInputs.storage)
        },
        'ssdStorageRegional': {
          value: product.pdSsdStorageRegional || null,
          unit: this.pickCorrectUnit_(
              'ssdStorageRegional', item.initialInputs.ssdStorageRegional)
        },
        'zonalBalancedPd': {
          value: product.pdZonalBalancedPd || null,
          unit: this.pickCorrectUnit_(
              'zonalBalancedPd', item.initialInputs.zonalBalancedPd)
        },
        'regionalBalancedPd': {
          value: product.pdRegionalBalancedPd || null,
          unit: this.pickCorrectUnit_(
              'regionalBalancedPd', item.initialInputs.regionalBalancedPd)
        },
        'storageRegional': {
          value: product.pdStorageRegional || null,
          unit: this.pickCorrectUnit_(
              'pdStorageRegional', item.initialInputs.storageRegional)
        },
        'extremePd': {
          value: product.extremePd || null,
          unit: this.pickCorrectUnit_('extremePd', item.initialInputs.extremePd)
        },
        'extremePdIopsCount': product.extremePdIopsCount || null,
        'snapshotStorage': {
          value: product.pdSnapshot || null,
          unit: this.pickCorrectUnit_(
              'snapshotStorage', item.initialInputs.snapshotStorage)
        },
        'snapshotStorageMultiRegional': {
          value: product.pdSnapshotMultiRegional || null,
          unit: this.pickCorrectUnit_(
              'snapshotStorageMultiRegional',
              item.initialInputs.snapshotStorageMultiRegional)
        },
        addFreeTier: item.initialInputs.addFreeTier || false
      };
      break;
    case 'loadBalancer':
      var location = item.initialInputs.location || 'us';
      this.loadBalancer = {
        'location': location,
        'forwardingRules': product.forwardingRules,
        'ingress': {
          value: product.ingress,
          unit: this.pickCorrectUnit_('lbIngress', item.initialInputs.ingress)
        }
      };
      item.tab = 'lb-network-services';
      break;
    case 'internetEgress':
      var region = item.initialInputs.region || 'us';
      this.internetEgress = {
        'region': region,
        'submitted': item.initialInputs.submitted,
        'premiumChina': {
          value: product.premiumChina,
          unit: this.pickCorrectUnit_(
              'premiumChina', item.initialInputs.premiumChina)
        },
        'premiumAu': {
          value: product.premiumAu,
          unit: this.pickCorrectUnit_('premiumAu', item.initialInputs.premiumAu)
        },
        'standardWorldwide': {
          value: product.standardWorldwide,
          unit: this.pickCorrectUnit_(
              'standardWorldwide', item.initialInputs.standardWorldwide)
        },
        'premiumApac': {
          value: product.premiumApac,
          unit: this.pickCorrectUnit_(
              'premiumApac', item.initialInputs.premiumApac)
        },
        'premiumWesternEurope': {
          value: product.premiumWesternEurope,
          unit: this.pickCorrectUnit_(
              'premiumWesternEurope', item.initialInputs.premiumWesternEurope)
        },
        'premiumSouthAmerica': {
          value: product.premiumSouthAmerica,
          unit: this.pickCorrectUnit_(
              'premiumSouthAmerica', item.initialInputs.premiumSouthAmerica)
        },
        'premiumAmericas': {
          value: product.premiumAmericas,
          unit: this.pickCorrectUnit_(
              'premiumAmericas', item.initialInputs.premiumAmericas)
        },
        'premiumMiddleEast': {
          value: product.premiumMiddleEast,
          unit: this.pickCorrectUnit_(
              'premiumMiddleEast', item.initialInputs.premiumMiddleEast)
        },
        'premiumCentralAmerica': {
          value: product.premiumCentralAmerica,
          unit: this.pickCorrectUnit_(
              'premiumCentralAmerica', item.initialInputs.premiumCentralAmerica)
        },
        'premiumEasternEurope': {
          value: product.premiumEasternEurope,
          unit: this.pickCorrectUnit_(
              'premiumEasternEurope', item.initialInputs.premiumEasternEurope)
        },
        'premiumEmea': {
          value: product.premiumEmea,
          unit: this.pickCorrectUnit_(
              'premiumEmea', item.initialInputs.premiumEmea)
        },
        'premiumAfrica': {
          value: product.premiumAfrica,
          unit: this.pickCorrectUnit_(
              'premiumAfrica', item.initialInputs.premiumAfrica)
        },
        'premiumIndia': {
          value: product.premiumIndia,
          unit: this.pickCorrectUnit_(
              'premiumIndia', item.initialInputs.premiumIndia)
        },
      };

      // Backwards compatibility for historical estimates
      if (product.premiumWorldwide > 0) {
        this.internetEgress.premiumAmericas = {
          value: product.premiumWorldwide,
          unit: this.pickCorrectUnit_(
              'premiumAmericas', item.initialInputs.premiumWorldwide)
        };
        product.premiumWorldwide = 0;
      }

      item.tab = 'networking-egress';
      break;
    case 'vmEgress':
      var region = item.initialInputs.location || 'us';
      this.vmEgress = {
        'location': region,
        'submitted': item.initialInputs.submitted,
        'egressZoneSameRegion': {
          value: product.egressZoneSameRegion,
          unit: this.pickCorrectUnit_(
              'egressZoneSameRegion', item.initialInputs.egressZoneSameRegion)
        },
        'egressEurope': {
          value: product.egressEurope,
          unit: this.pickCorrectUnit_(
              'egressEurope', item.initialInputs.egressEurope)
        },
        'egressUs': {
          value: product.egressUs,
          unit: this.pickCorrectUnit_('egressUs', item.initialInputs.egressUs)
        },
        'egressAsia': {
          value: product.egressAsia,
          unit:
              this.pickCorrectUnit_('egressAsia', item.initialInputs.egressAsia)
        },
        'egressSouthAmerica': {
          value: product.egressSouthAmerica,
          unit: this.pickCorrectUnit_(
              'egressSouthAmerica', item.initialInputs.egressSouthAmerica)
        },
        'egressAustralia': {
          value: product.egressAustralia,
          unit: this.pickCorrectUnit_(
              'egressAustralia', item.initialInputs.egressAustralia)
        }
      };
      item.tab = 'networking-egress';
      break;

    case 'interconnectEgress':
      var region = item.initialInputs.region || 'us';
      this.interconnectEgress = {
        'region': region,
        'submitted': item.initialInputs.submitted,
        'dedicatedInterconnect': {
          value: product.dedicatedInterconnect,
          unit: this.pickCorrectUnit_(
              'dedicatedInterconnect', item.initialInputs.dedicatedInterconnect)
        },
        'directPeering': {
          value: product.directPeering,
          unit: this.pickCorrectUnit_(
              'directPeering', item.initialInputs.directPeering)
        }
      };
      item.tab = 'networking-egress';
      break;
    case 'cloudStorage':
      goog.object.extend(this.cloudStorage, item.initialInputs);
      item.tab = 'storage';
      break;
    case 'containerEngine':
      switch (item.initialInputs.location) {
        case 'us':
          item.initialInputs.location = 'us-central1';
          break;
        case 'europe':
          item.initialInputs.location = 'europe-west1';
          break;
      }
      goog.object.extend(this[item.product], item.initialInputs);
      sku = item.initialInputs.instance.replace('-PREEMPTIBLE', '');
      item.initialInputs.instance = sku;
      if (sku == 'custom') {
        this.containerEngine.instance = 'custom';
        this.containerEngine.custom.cpu = item.initialInputs.custom.cpu;
        this.containerEngine.custom.ram = item.initialInputs.custom.ram;
        this.containerEngine.extendedMemory = item.initialInputs.extendedMemory;
        this.gkeCustomLimit(this.containerEngine.custom.cpu);
        this.validateContainerForm(item.initialInputs);
      }
      this.applyMemoryOptimizedVMCUDRestriction('containerEngine');
      this.validateContainerForm(item.initialInputs);
      this.applyGpuRestriction('containerEngine');
      this.apllySharedInstancesRestriction('containerEngine');
      this.generateLocalSsdOptions('containerEngine');
      this.resetTimeMode('containerEngine');
      item.tab = 'gke-standard';
      break;
    case 'cloudSQL2':
      goog.object.extend(this[item.product], item.initialInputs);
      if (item.initialInputs.instance.indexOf('CUSTOM') != -1) {
        this.cloudSQL2.instance = 'custom';
      }
      this.resetTimeMode('cloudSQL2');
      this.onCloudSqlInstanceChange('cloudSQL2');
      item.tab = 'sql';
      this.currentCloudSqlTab = this.cloudSqlTabs.MY_SQL;
      break;
    case 'cloudSQLPostgre':
      goog.object.extend(this[item.product], item.initialInputs);
      if (item.initialInputs.instance.indexOf('CUSTOM') != -1) {
        this.cloudSQLPostgre.instance = 'custom';
      }
      this.resetTimeMode('cloudSQLPostgre');
      this.onCloudSqlInstanceChange('cloudSQLPostgre');
      item.tab = 'sql';
      this.currentCloudSqlTab = this.cloudSqlTabs.POSTGRE;
      break;
    case 'cloudSqlServer':
      Object.assign(this[item.product], item.initialInputs);
      this.resetTimeMode('cloudSqlServer');
      item.tab = 'sql';
      this.currentCloudSqlTab = this.cloudSqlTabs.SQL_SERVER;
      break;
    case 'translateApi':
      goog.object.extend(this.translateApi, product);
      item.tab = 'translate';
      break;
    case 'appEngine':
      this.appEngineStandard = {
        'instances': this.isNumber(product.aeInstances) ?
            product.aeInstances / this.TOTAL_BILLING_HOURS :
            0

      };
      this.appEngineServices = {
        'outgoingTraffic': {
          value: product.aeOutgoingTraffic,
          unit: this.pickCorrectUnit_(
              'outgoingTraffic', item.initialInputs.outgoingTraffic)
        },
        'cloudStorage': {
          value: product.aeCloudStorage,
          unit: this.pickCorrectUnit_(
              'cloudStorage', item.initialInputs.cloudStorage)
        },
        'memcache': {
          value: this.isNumber(product.aeMemcache) ?
              product.aeMemcache / this.TOTAL_BILLING_HOURS :
              0,
          unit: this.pickCorrectUnit_('memcache', item.initialInputs.memcache)
        },
        'search': product.aeSearch,
        'indexing': {
          value: product.aeIndexing,
          unit: this.pickCorrectUnit_('indexing', item.initialInputs.indexing)
        },
        'logs': {
          value: product.aeLogs,
          unit: this.pickCorrectUnit_('logs', item.initialInputs.logs)
        },
        'task': {
          value: product.aeTask,
          unit: this.pickCorrectUnit_('task', item.initialInputs.task)
        },
        'logsStorage': {
          value: product.aeLogsStorage,
          unit: this.pickCorrectUnit_(
              'logsStorage', item.initialInputs.logsStorage)
        },
        'virtualIp': product.aeVirtualIp,
        'location': item.initialInputs.location || 'us-central1'
      };
      item.tab = 'app-engine';
      break;
    case 'appEngineServices':
      this.appEngineServices = {
        'outgoingTraffic': {
          value: product.aeOutgoingTraffic,
          unit: this.pickCorrectUnit_(
              'outgoingTraffic', item.initialInputs.outgoingTraffic)
        },
        'cloudStorage': {
          value: product.aeCloudStorage,
          unit: this.pickCorrectUnit_(
              'cloudStorage', item.initialInputs.cloudStorage)
        },
        'memcache': {
          value: this.isNumber(product.aeMemcache) ?
              product.aeMemcache / this.TOTAL_BILLING_HOURS :
              0,
          unit: this.pickCorrectUnit_('memcache', item.initialInputs.memcache)
        },
        'search': product.aeSearch,
        'indexing': {
          value: product.aeIndexing,
          unit: this.pickCorrectUnit_('indexing', item.initialInputs.indexing)
        },
        'logs': {
          value: product.aeLogs,
          unit: this.pickCorrectUnit_('logs', item.initialInputs.logs)
        },
        'task': {
          value: product.aeTask,
          unit: this.pickCorrectUnit_('task', item.initialInputs.task)
        },
        'logsStorage': {
          value: product.aeLogsStorage,
          unit: this.pickCorrectUnit_(
              'logsStorage', item.initialInputs.logsStorage)
        },
        'virtualIp': product.aeVirtualIp,
        'location': item.initialInputs.location || 'us-central1'
      };
      item.tab = 'app-engine';
      break;
    case 'filestore':
      var location = item.initialInputs.location || 'us-central1';
      this.filestore = {
        location: location,
        standardTier: {
          value: product.standardTier ? product.standardTier : null,
          unit: this.pickCorrectUnit_(
              'dsStorage', item.initialInputs.standardTier)
        },
        premiumTier: {
          value: product.premiumTier ? product.premiumTier : null,
          unit:
              this.pickCorrectUnit_('dsStorage', item.initialInputs.premiumTier)
        },
        highScaleTier: {
          value: product.highScaleTier ? product.highScaleTier : null,
          unit:
              this.pickCorrectUnit_('dsStorage', item.initialInputs.highScaleTier)
        },
        enterpriseTier: {
          value: product.enterpriseTier ? product.enterpriseTier : null,
          unit:
              this.pickCorrectUnit_('dsStorage', item.initialInputs.enterpriseTier)
        },
        submitted: false
      };
      this.filestoreButton = false;
      item.tab = 'cloud-filestore';
      break;
    case 'firestore':
      let location = item.initialInputs.location || 'us-central1';

      this.firestore = {
        submitted: false,
        location: location,
        documentReadsCount: product.documentReadsCount ?
            product.documentReadsCount / this.DAYS :
            null,
        documentWritesCount: product.documentWritesCount ?
            product.documentWritesCount / this.DAYS :
            null,
        documentDeletesCount: product.documentDeletesCount ?
            product.documentDeletesCount / this.DAYS :
            null,
        storedDataVolume: {
          value: product.storedDataVolume ? product.storedDataVolume : null,
          unit: this.DEFAULT_UNITS.dsStorage ? this.DEFAULT_UNITS.dsStorage :
                                               null
        },
        networkEgressVolume: {
          value: product.networkEgressVolume ? product.networkEgressVolume :
                                               null,
          unit: this.DEFAULT_UNITS.dsStorage ? this.DEFAULT_UNITS.dsStorage :
                                               null
        }
      };
      break;
    case 'dataCatalogApi':
      this.dataCatalog = {
        metadataStorage: {
          value: product.metadataStorage ? product.metadataStorage : null,
          unit: this.pickCorrectUnit_(
              'metadataStorage', item.initialInputs.metadataStorage)
        },
        catalogApiCallCount: {
          value: product.catalogApiCallCount ?
              product.catalogApiCallCount / 1000000 :
              null,
          unit: this.pickCorrectUnit_(
              'catalogApiCallCount', item.initialInputs.catalogApiCallCount)
        },
        submitted: false
      };
      item.tab = 'data-catalog';
      break;

    case 'dedicatedInterconnectVpn':
      this.dedicatedInterconnectVpn = {
        tenGbitInterconnect: item.initialInputs.tenGbitInterconnect,
        tenGbitInterconnectRegion: item.initialInputs.tenGbitInterconnectRegion,
        hundredGbitInterconnect: item.initialInputs.hundredGbitInterconnect,
        hundredGbitInterconnectRegion:
            item.initialInputs.hundredGbitInterconnectRegion,
        interconnectAttachment: item.initialInputs.interconnectAttachment,
        interconnectAttachmentRegion:
            item.initialInputs.interconnectAttachmentRegion,
        submitted: false
      };
      item.tab = 'interconnect-vpn';
      break;
    case 'partnerInterconnectVpn':
      this.partnerInterconnectVpn = {
        partnerInterconnectAttachment:
            item.initialInputs.partnerInterconnectAttachment,
        numberOfAttachments: item.initialInputs.numberOfAttachments,
        submitted: false
      };
      item.tab = 'interconnect-vpn';
      break;
    case 'appEngineFlexible':
      this.appEngineFlexible = {
        'cores': this.isNumber(product.cores) ?
            product.cores / this.TOTAL_BILLING_HOURS :
            0,
        'memory': {
          value: this.isNumber(product.memory) ?
              product.memory / this.TOTAL_BILLING_HOURS :
              0,
          unit: this.DEFAULT_UNITS.aeMemory
        },
        'persistentDisk':
            {value: product.persistentDisk, unit: this.DEFAULT_UNITS.aePD},
        'location': item.initialInputs.location || 'us-central1'
      };
      item.tab = 'app-engine';
      break;
    case 'datastore':
      this.datastore = {
        'instances': {
          value: product.dsInstances,
          unit: this.pickCorrectUnit_('dsStorage', item.initialInputs.instances)
        },
        'writeOp': product.dsWriteOp,
        'readOp': product.dsReadOp,
        'entityReadsCount': product.entityReadsCount,
        'entityWritesCount': product.entityWritesCount,
        'entityDeletesCount': product.entityDeletesCount
      };
      item.tab = 'datastore';
      break;
    case 'cloudDns':
      this.cloudDns = {
        'zone': product.cloudDnsZone,
        'queries': product.cloudDnsQueries
      };
      item.tab = 'dns';
      break;
    case 'caService':
      this.caservice = {
        'caTier': product.quantityLabel,
        'numberOfCa': product.items.numberOfCa,
        'totalCertificates': product.items.totalCertificates,
        submitted: false
      };
      item.tab = 'ca-service';
      break;
    case 'microsoftAd':
      this.microsoftAd = {
        'numberOfInstance': product.items.numberOfInstance,
        'domainType': product.items.domainType,
        submitted: false
      };
      item.tab = 'microsoft-ad';
      break;
    case 'predictionApi':
      this.predictionApi = {
        'prediction': product.prediction,
        'bulk': {
          value: product.bulk,
          unit: this.pickCorrectUnit_('bulk', item.initialInputs.bulk)
        },
        'streaming': product.streaming
      };
      item.tab = 'prediction';
      break;
    case 'visionApi':
      this.visionApi = {
        labelDetection: {
          value: this.isNumber(product.labelDetection) ?
              product.labelDetection / 1000 :
              0,
          unit: 3
        },
        ocr: {
          value: this.isNumber(product.ocr) ? product.ocr / 1000 : 0,
          unit: 3
        },
        explicitDetection: {
          value: this.isNumber(product.explicitDetection) ?
              product.explicitDetection / 1000 :
              0,
          unit: 3
        },
        facialDetection: {
          value: this.isNumber(product.facialDetection) ?
              product.facialDetection / 1000 :
              0,
          unit: 3
        },
        landmarkDetection: {
          value: this.isNumber(product.landmarkDetection) ?
              product.landmarkDetection / 1000 :
              0,
          unit: 3
        },
        logoDetection: {
          value: this.isNumber(product.logoDetection) ?
              product.logoDetection / 1000 :
              0,
          unit: 3
        },
        imageProperties: {
          value: this.isNumber(product.imageProperties) ?
              product.imageProperties / 1000 :
              0,
          unit: 3
        },
        webDetection: {
          value: this.isNumber(product.webDetection) ?
              product.webDetection / 1000 :
              0,
          unit: 3
        },
        documentDetection: {
          value: this.isNumber(product.documentDetection) ?
              product.documentDetection / 1000 :
              0,
          unit: 3
        },
        cropHints: {
          value: this.isNumber(product.cropHints) ? product.cropHints / 1000 :
                                                    0,
          unit: 3
        },
        objectLocalization: {
          value: this.isNumber(product.objectLocalization) ?
              product.objectLocalization / 1000 :
              0,
          unit: 3
        }
      };
    case 'nLApi':
      this.nLApi = {
        entityRecognition: {
          value: this.isNumber(product.entityRecognition) ?
              product.entityRecognition / 1000 :
              0,
          unit: 3
        },
        sentimentAnalysis: {
          value: this.isNumber(product.sentimentAnalysis) ?
              product.sentimentAnalysis / 1000 :
              0,
          unit: 3
        },
        syntaxAnalysis: {
          value: this.isNumber(product.syntaxAnalysis) ?
              product.syntaxAnalysis / 1000 :
              0,
          unit: 3
        },
        contentClassification: {
          value: this.isNumber(product.contentClassification) ?
              product.contentClassification / 1000 :
              0,
          unit: 3
        }
      };
      break;
    case 'workflows':
      this.workflows = {
        submitted: false,
        internalSteps: {
          value: this.isNumber(product.internalSteps) ?
              product.internalSteps / 1000 :
              null,
          unit: 3
        },
        externalSteps: {
          value: this.isNumber(product.externalSteps) ?
              product.externalSteps / 1000 :
              null,
          unit: 3
        }
      };
      item.tab = 'workflows';
      break;
    case 'operations':
      this.operations = {
        gcpResourceCount: this.isNumber(product.gcpResourceCount) ?
            product.gcpResourceCount :
            0,
        awsResourceCount: this.isNumber(product.awsResourceCount) ?
            product.awsResourceCount :
            0,
        logsVolume: {
          value: this.isNumber(product.logsVolume) ? product.logsVolume : 0,
          unit: this.DEFAULT_UNITS.sdLogs
        },
        descriptorsCount: this.isNumber(product.descriptorsCount) ?
            product.descriptorsCount :
            0,
        timeSeriesCount:
            this.isNumber(product.timeSeriesCount) ? product.timeSeriesCount : 0
      };
      this.sdTab = 0;
      break;
    case 'operations2metrics':
    case 'operations2logs':
    case 'operations2traces':
      goog.object.extend(this[item.product], item.initialInputs);
      this.sdTab = 1;
      break;
    case 'speechApi':
      goog.object.extend(this[item.product], item.initialInputs);
      item.tab = 'speech-api';
      break;
    case 'textToSpeech':
      this.textToSpeech = {
        characters: product.quantity,
        feature: item.initialInputs.feature,
        submitted: false,
      };
      item.tab = 'text-to-speech';
      break;
    case 'bigtable':
      Object.assign(this[item.product], item.initialInputs);
      this.resetTimeMode('bigtable');
      item.tab = 'bigtable';
      break;
    case 'bqBiEngineOnDemand':
      goog.object.extend(this.bqBiEngineOnDemand, item.initialInputs);
      item.tab = 'bq-bi-engine';
      this.currentBqBiEngineTab = this.bqBiEngineTab.ON_DEMAND;
      break;
    case 'bqBiEngineFlatRate':
      goog.object.extend(this.bqBiEngineFlatRate, item.initialInputs);
      item.tab = 'bq-bi-engine';
      this.currentBqBiEngineTab = this.bqBiEngineTab.FLAT_RATE;
      break;
    case 'cloudCdn':
      this.cloudCdn = {
        cacheEgressApac: {
          value: this.isNumber(product.cacheEgressApac) ?
              product.cacheEgressApac :
              0,
          unit: this.DEFAULT_UNITS.cacheEgressApac
        },
        cacheEgressCn: {
          value: this.isNumber(product.cacheEgressCn) ? product.cacheEgressCn :
                                                        0,
          unit: this.DEFAULT_UNITS.cacheEgressCn
        },
        cacheEgressEu: {
          value: this.isNumber(product.cacheEgressEu) ? product.cacheEgressEu :
                                                        0,
          unit: this.DEFAULT_UNITS.cacheEgressEu
        },
        cacheEgressNa: {
          value: this.isNumber(product.cacheEgressNa) ? product.cacheEgressNa :
                                                        0,
          unit: this.DEFAULT_UNITS.cacheEgressNa
        },
        cacheEgressOce: {
          value: this.isNumber(product.cacheEgressOce) ?
              product.cacheEgressOce :
              0,
          unit: this.DEFAULT_UNITS.cacheEgressOce
        },
        cacheEgressSa: {
          value: this.isNumber(product.cacheEgressSa) ? product.cacheEgressSa :
                                                        0,
          unit: this.DEFAULT_UNITS.cacheEgressSa
        },
        cacheEgressOther: {
          value: this.isNumber(product.cacheEgressOther) ?
              product.cacheEgressOther :
              0,
          unit: this.DEFAULT_UNITS.cacheEgressOther
        },
        cacheFillIntraEu: {
          value: this.isNumber(product.cacheFillIntraEu) ?
              product.cacheFillIntraEu :
              0,
          unit: this.DEFAULT_UNITS.cacheFillIntraEu
        },
        cacheFillIntraNaEu: {
          value: this.isNumber(product.cacheFillIntraNaEu) ?
              product.cacheFillIntraNaEu :
              0,
          unit: this.DEFAULT_UNITS.cacheFillIntraNaEu
        },
        cacheFillIntraOther: {
          value: this.isNumber(product.cacheFillIntraOther) ?
              product.cacheFillIntraOther :
              0,
          unit: this.DEFAULT_UNITS.cacheFillIntraOther
        },
        cacheFillIntraOce: {
          value: this.isNumber(product.cacheFillIntraOce) ?
              product.cacheFillIntraOce :
              0,
          unit: this.DEFAULT_UNITS.cacheFillIntraOce
        },
        cacheFillIntraSa: {
          value: this.isNumber(product.cacheFillIntraSa) ?
              product.cacheFillIntraSa :
              0,
          unit: this.DEFAULT_UNITS.cacheFillIntraSa
        },
        cacheFillInterOce: {
          value: this.isNumber(product.cacheFillInterOce) ?
              product.cacheFillInterOce :
              0,
          unit: this.DEFAULT_UNITS.cacheFillInterOce
        },
        cacheFillInterOther: {
          value: this.isNumber(product.cacheFillInterOther) ?
              product.cacheFillInterOther :
              0,
          unit: this.DEFAULT_UNITS.cacheFillInterOther
        },
        cacheFillInterRegion: {
          value: this.isNumber(product.cacheFillInterRegion) ?
              product.cacheFillInterRegion :
              0,
          unit: this.DEFAULT_UNITS.cacheFillInterRegion
        },
        cacheLookupCount: this.isNumber(product.cacheLookupCount) ?
            product.cacheLookupCount :
            0,
        cacheInvalidationCount: this.isNumber(product.cacheInvalidationCount) ?
            product.cacheInvalidationCount :
            0
      };
      item.tab = 'cloud-cdn';
      break;
    case 'endpoints':
      this.endpoints = {'requestCount': product.requestCount};
      break;
    case 'dlpApi':
      goog.object.extend(this[item.product], item.initialInputs);
      this.activeDlpTab = 1;
      break;
    case 'dlpApiStorage':
      goog.object.extend(this[item.product], item.initialInputs);
      this.activeDlpTab = 0;
      break;
    case 'dataprep':
      this.dataprep = {
        edition: product.edition,
        userCount: product.userCount,
        unitCount: product.unitCount,
        submitted: false
      };
      break;
    case 'dialogflowEs':
      this.dialogflowEs = {
        'usersCount': item.initialInputs.usersCount,
        'sessionsCount': item.initialInputs.sessionsCount,
        'audioQueriesCount': product.audioQueriesCount /
            (item.initialInputs.usersCount * item.initialInputs.sessionsCount),
        'textQueriesCount': product.textQueriesCount /
            (item.initialInputs.usersCount * item.initialInputs.sessionsCount),
         submitted: false
      };
      break;
    case 'dialogflowCx':
      this.dialogflowCx = {
        'submitted': false,
        'usersCount': item.initialInputs.usersCount,
        'sessionsCount': item.initialInputs.sessionsCount,
        'audioQueriesCount': product.audioQueriesCount /
            (item.initialInputs.usersCount * item.initialInputs.sessionsCount),
        'textQueriesCount': product.textQueriesCount /
            (item.initialInputs.usersCount * item.initialInputs.sessionsCount)
      };
      break;
    case 'recommendationsAi':
      this.recommendationsAi = {
        'submitted': false,
        'predictionRequests': product.items.predictionRequests ?
            product.items.predictionRequests * 1000 :
            null,
        'trainingNodeHours': product.items.trainingNodeHours ?
            product.items.trainingNodeHours :
            null,
        'tunningNodeHours': product.items.tunningNodeHours ?
            product.items.tunningNodeHours :
            null
      };
      break;
    case 'iotCore':
      goog.object.extend(this[item.product], item.initialInputs);
      break;
      break;
    case 'healthcareApi':
      this.healthcareApi = {
        location: item.initialInputs.location || 'us',
        datastoreCount: product.datastoreCount,
        standardNotificationCount: {
          value: product.standardNotificationCount == 0 ?
              '' :
              product.standardNotificationCount / 1000,
          unit: 3
        },
        standardRequestsCount: {
          value: product.standardRequestsCount == 0 ?
              '' :
              product.standardRequestsCount / 1000,
          unit: 3
        },
        complexRequestsCount: {
          value: product.complexRequestsCount == 0 ?
              '' :
              product.complexRequestsCount / 1000,
          unit: 3
        },
        multiRequestsCount: {
          value: product.multiRequestsCount == 0 ?
              '' :
              product.multiRequestsCount / 1000,
          unit: 3
        },
        storageStructured: {
          value: product.storageStructured == 0 ? '' :
                                                  product.storageStructured / 4,
          unit: 2
        },
        storageBlob: {
          value: product.storageBlob == 0 ? '' : product.storageBlob,
          unit: 2
        },
        storageBlobNearline: {
          value: product.storageBlobNearline == 0 ? '' :
                                                    product.storageBlobNearline,
          unit: 2
        },
        storageBlobColdline: {
          value: product.storageBlobColdline == 0 ? '' :
                                                    product.storageBlobColdline,
          unit: 2
        },
        etlBatchVolume: {
          value: product.etlBatchVolume == 0 ? '' : product.etlBatchVolume,
          unit: 2
        },
        etlStreamingVolume: {
          value: product.etlStreamingVolume == 0 ? '' :
                                                   product.etlStreamingVolume,
          unit: 2
        },
        dicomVolume: {
          value: product.dicomVolume == 0 ? '' : product.dicomVolume,
          unit: 2
        },
        consentCount: {
          value: product.consentCount == 0 ? '' : product.consentCount / 1000,
          unit: 3
        },
        accessDeterminationCount: {
          value: product.accessDeterminationCount == 0 ?
              '' :
              product.accessDeterminationCount / 1000000,
          unit: 6
        },
      };
      break;
    case 'videoApi':
      goog.object.extend(this.videoApi, product);
      break;
    case 'lbnsCloudNAT':
      this.lbnsCloudNat = {
        cloudNatGateways:
            this.isNumber(
                product.items.editHook.initialInputs.cloudNatGateways) ?
            product.items.editHook.initialInputs.cloudNatGateways :
            null,
        trafficProcessed: {
          value: product.items.trafficProcessed ?
              product.items.trafficProcessed :
              null,
          unit: this.pickCorrectUnit_(
              'natTrafficProcessed', product.items.trafficProcessed)
        },
        submitted: false
      };
      item.tab = 'lb-network-services';
      break;
     case 'lbnsIpAddresses':
      this.lbnsIpAddresses = {
        submitted: false,
        location: item.initialInputs.location || 'us',
        unusedIps: product.unusedIps ? product.unusedIps : null,
        standardVmIps: product.standardVmIps ? product.standardVmIps : null,
        preemptibleVmIps: product.preemptibleVmIps ? product.preemptibleVmIps :
                                                     null,
        forwardingRulesIps:
            product.forwardingRulesIps ? product.forwardingRulesIps : null
      };
      item.tab = 'lb-network-services';
      break;
    case 'vpn':
      var location = item.initialInputs.location || 'us-central1';
      this.cloudVpn = {
        vpn: item.initialInputs.vpn ? item.initialInputs.vpn : null,
        location: location,
        submitted: false
      };
      item.tab = 'interconnect-vpn';
      break;
    case 'recaptcha':
      this.recaptcha = {
        assessments: item.initialInputs.assessments ?
            item.initialInputs.assessments :
            null,
        submitted: false
      };
      item.tab = 'recaptcha';
      break;
    case 'secretmanager':
      this.secretManager = {
        activeSecretVersions:
            product.items.editHook.initialInputs.activeSecretVersions,
        accessOperations: product.items.editHook.initialInputs.accessOperations,
        rotationNotifications:
            product.items.editHook.initialInputs.rotationNotifications,
        addFreeTier: product.items.editHook.initialInputs.addFreeTier,
        location: product.region || 'us-central1',
        submitted: false
      };
      item.tab = 'secret-manager';
      break;
    case 'transcoderApi':
      this.transcoderApi = {
        submitted: false,
        sdMinuteCount: product.sdMinutes,
        hdMinuteCount: product.hdMinutes,
        uhdMinuteCount: product.uhdMinutes
      };
      item.tab = 'transcoder-api';
      break;
    case 'dataproc':
      // Initial DataProc form after editing is always true (valid)
      this.DataprocFormValid = true;
      goog.object.extend(this.dataproc, item.initialInputs);
      break;
    case 'bqml':
      this.bqml = {
        submitted: false,
        location: item.initialInputs.location || 'us-central1',
        creationVolume: {value: product.creationVolume, unit: this.DEFAULT_UNITS.bqmlCreation},
        predictionVolume: {value: product.predictionVolume, unit: this.DEFAULT_UNITS.bqmlOperations},
        evaluationVolume: {value: product.evaluationVolume, unit: this.DEFAULT_UNITS.bqmlOperations},
      };
      item.tab = 'bigquery-ml';
      break;
    case 'vpcLogs':
      this.vpcLogs = {
        submitted: false,
        logsVolume: {value: product.logsVolume, unit: this.DEFAULT_UNITS.vpcLogsVolume}
      };
      item.tab = 'lb-network-services';
      break;
    default:
      goog.object.extend(this[item.product], item.initialInputs);
  }
  this.setActiveTab(item.tab);

  this.CloudCalculator.recalculateSupport();
  this.isEditFlow = false;
};


/**
 * Picks correct value.
 * @param {(!cloudpricingcalculator.DataWithUnit|number)} val
 * @return {number}
 * @private
 */
ListingCtrl.prototype.pickCorrectValue_ = function(val) {
  return angular.isObject(val) ? val.value : val;
};


/**
 * Picks correct unit. Sets it to default for now.
 * @param {string} defaultName
 * @param {(!cloudpricingcalculator.DataWithUnit|number)} val
 * @return {number} default unit or GB
 * @private
 */
ListingCtrl.prototype.pickCorrectUnit_ = function(defaultName, val) {
  return this.DEFAULT_UNITS[defaultName] || 2;
};


/**
 * Generate supported memory options and populate the class variable
 * @param {string} selectedCpuType
 * @return {!Array<Object>}
 * @export
 */
ListingCtrl.prototype.generateComputeMemoryOptions = function(selectedCpuType) {
  var supportedMemory =
      this.CloudCalculator.getSupportedMemory(selectedCpuType);

  this.computeServerMemoryOptions = [];
  for (var i = 0; i < supportedMemory.length; i++) {
    var mem = supportedMemory[i];
    this.computeServerMemoryOptions.push({'name': mem + ' GB', 'value': mem});
  }

  return this.computeServerMemoryOptions;
};


/**
 * Generates supported memory options and populates the class variable.
 * @return {!Array<Object>} Array of memory options set
 * @export
 */
ListingCtrl.prototype.generateCustomVMMemoryOptions = function() {
  var cpu = this.computeServer.custom.cpu;
  var minCustomRam = this.getCurrentCustomRamRatio('min');
  var maxCustomRam = this.getCurrentCustomRamRatio('max');
  var minValue = cpu * minCustomRam;
  var maxValue = cpu * maxCustomRam;
  // var minValue = cpu * this.MIN_CUSTOM_RAM;
  // var maxValue = cpu * this.MAX_CUSTOM_RAM;
  var step = minValue + this.CUSTOM_VM_RAM_STEP;
  this.customVMMemoryOptions =
      [{'name': 'RAM: ' + minValue + ' GB', 'value': minValue}];
  while (step < maxValue) {
    this.customVMMemoryOptions.push(
        {'name': 'RAM: ' + step + ' GB', 'value': step});
    step += this.CUSTOM_VM_RAM_STEP;
  }
  this.customVMMemoryOptions.push(
      {'name': 'RAM: ' + maxValue + ' GB', 'value': maxValue});
  this.computeServer.custom.ram = minValue;
  return this.computeServerMemoryOptions;
};


/**
 * Check if the entered amount is positive number
 * @param {?number} n item to verify
 * @return {boolean}
 * @private
 */
ListingCtrl.prototype.isPositiveNumber_ = function(n) {
  return this.isNumber(n) && n > 0;
};


/**
 * Setup App Engine Services Model
 * @export
 */

ListingCtrl.prototype.setupAppEngineServicesData = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    location: {string},
   *    outgoingTraffic: {cloudpricingcalculator.DataWithUnit},
   *    cloudStorage: {cloudpricingcalculator.DataWithUnit},
   *    memcache: {cloudpricingcalculator.DataWithUnit},
   *    search: {number},
   *    indexing: {cloudpricingcalculator.DataWithUnit},
   *    logs: {cloudpricingcalculator.DataWithUnit},
   *    task: {cloudpricingcalculator.DataWithUnit},
   *    logsStorage: {cloudpricingcalculator.DataWithUnit},
   *    virtualIp: {number}
   * }}
   */
  this.appEngineServices = {
    submitted: false,
    location: this.retrieveLocation(),
    outgoingTraffic: {value: '', unit: this.DEFAULT_UNITS.outgoingTraffic},
    cloudStorage: {value: '', unit: this.DEFAULT_UNITS.cloudStorage},
    memcache: {value: '', unit: this.DEFAULT_UNITS.memcache},
    search: '',
    indexing: {value: '', unit: this.DEFAULT_UNITS.indexing},
    logs: {value: '', unit: this.DEFAULT_UNITS.logs},
    task: {value: '', unit: this.DEFAULT_UNITS.task},
    virtualIp: ''
  };
};


/**
 * Add App Engine Services items to Cart
 *
 * @param {!angular.Form} appEngineForm
 * @export
 */
ListingCtrl.prototype.addAppEngineServices = function(appEngineForm) {
  if (!appEngineForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'addAppEngineServices');
  var location = this.appEngineServices.location || 'us-central1';
  /** @type {number} */
  var aeOutgoingTraffic = this.toDefaultUnit(
      this.appEngineServices.outgoingTraffic.value,
      this.appEngineServices.outgoingTraffic.unit,
      this.DEFAULT_UNITS.outgoingTraffic);
  var aeCloudStorage = this.toDefaultUnit(
      this.appEngineServices.cloudStorage.value,
      this.appEngineServices.cloudStorage.unit,
      this.DEFAULT_UNITS.cloudStorage);
  var aeMemcache = this.toDefaultUnit(
      this.appEngineServices.memcache.value,
      this.appEngineServices.memcache.unit, this.DEFAULT_UNITS.memcache);
  var aeSearch = parseFloat(this.appEngineServices.search);
  var aeIndexing = this.toDefaultUnit(
      this.appEngineServices.indexing.value,
      this.appEngineServices.indexing.unit, this.DEFAULT_UNITS.indexing);
  var aeLogs = this.toDefaultUnit(
      this.appEngineServices.logs.value, this.appEngineServices.logs.unit,
      this.DEFAULT_UNITS.logs);
  var aeTask = this.toDefaultUnit(
      this.appEngineServices.task.value, this.appEngineServices.task.unit,
      this.DEFAULT_UNITS.task);
  var aeVirtualIp = parseFloat(this.appEngineServices.virtualIp);
  /** @type {!cloudpricingcalculator.SkuData} */
  var aeItem = null;

  if (this.isPositiveNumber_(aeOutgoingTraffic)) {
    aeItem = {
      sku: 'CP-APP-ENGINE-OUTGOING-TRAFFIC',
      quantity: aeOutgoingTraffic,
      quantityLabel: 'GiB',
      region: location,
      displayName: 'App Engine APIs and Services',
      displayDescription: 'Outgoing Network Traffic',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.appEngineServices),
          product: 'appEngineServices',
          tab: 'app-engine'
        }
      }
    };
    this.CloudCalculator.addItemToCart(aeItem);
  }
  if (this.isPositiveNumber_(aeCloudStorage)) {
    aeItem = {
      sku: 'CP-APP-ENGINE-CLOUD-STORAGE',
      quantity: aeCloudStorage,
      quantityLabel: 'GiB',
      region: location,
      displayName: 'App Engine APIs and Services',
      displayDescription: 'Cloud Storage',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.appEngineServices),
          product: 'appEngineServices',
          tab: 'app-engine'
        }
      }
    };
    this.CloudCalculator.addItemToCart(aeItem);
  }
  if (this.isPositiveNumber_(aeMemcache)) {
    aeItem = {
      sku: 'CP-APP-ENGINE-MEMCACHE',
      quantity: aeMemcache * this.TOTAL_BILLING_HOURS,
      quantityLabel: 'GiB',
      region: location,
      displayName: 'App Engine APIs and Services',
      displayDescription: 'Memcache',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.appEngineServices),
          product: 'appEngineServices',
          tab: 'app-engine'
        }
      }
    };
    this.CloudCalculator.addItemToCart(aeItem);
  }
  if (this.isPositiveNumber_(aeSearch)) {
    aeItem = {
      sku: 'CP-APP-ENGINE-SEARCH',
      quantity: aeSearch,
      quantityLabel: 'GiB',
      region: location,
      displayName: 'App Engine APIs and Services',
      displayDescription: 'Search',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.appEngineServices),
          product: 'appEngineServices',
          tab: 'app-engine'
        }
      }
    };
    this.CloudCalculator.addItemToCart(aeItem);
  }
  if (this.isPositiveNumber_(aeIndexing)) {
    aeItem = {
      sku: 'CP-APP-ENGINE-INDEXING-DOCUMENTS',
      quantity: aeIndexing,
      quantityLabel: 'GiB',
      region: location,
      displayName: 'App Engine APIs and Services',
      displayDescription: 'indexing documents',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.appEngineServices),
          product: 'appEngineServices',
          tab: 'app-engine'
        }
      }
    };
    this.CloudCalculator.addItemToCart(aeItem);
  }
  if (this.isPositiveNumber_(aeLogs)) {
    aeItem = {
      sku: 'CP-APP-ENGINE-LOGS-API',
      quantity: aeLogs,
      quantityLabel: 'GiB',
      region: location,
      displayName: 'App Engine APIs and Services',
      displayDescription: 'Logs API',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.appEngineServices),
          product: 'appEngineServices',
          tab: 'app-engine'
        }
      }
    };
    this.CloudCalculator.addItemToCart(aeItem);
  }
  if (this.isPositiveNumber_(aeTask)) {
    aeItem = {
      sku: 'CP-APP-ENGINE-TASK-QUEUE',
      quantity: aeTask,
      quantityLabel: 'GiB',
      region: location,
      displayName: 'App Engine APIs and Services',
      displayDescription: 'Task Queue',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.appEngineServices),
          product: 'appEngineServices',
          tab: 'app-engine'
        }
      }
    };
    this.CloudCalculator.addItemToCart(aeItem);
  }
  if (this.isPositiveNumber_(aeVirtualIp)) {
    aeItem = {
      sku: 'CP-APP-ENGINE-SSL-VIRTUAL-IP',
      quantity: aeVirtualIp,
      quantityLabel: 'GiB',
      region: location,
      displayName: 'App Engine APIs and Services',
      displayDescription: 'SSL Virtual IPs',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.appEngineServices),
          product: 'appEngineServices',
          tab: 'app-engine'
        }
      }
    };
    this.CloudCalculator.addItemToCart(aeItem);
  }

  this.setupAppEngineServicesData();
  this.resetForm(appEngineForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Setup App Engine Services Model
 * @export
 */

ListingCtrl.prototype.setupAppEngineStandardData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    location: string,
   *    instances: number,
   *    instanceType: string,
   * }}
   */
  this.appEngineStandard = {
    submitted: false,
    instances: '',
    location: this.retrieveLocation(),
    instanceType: 'F1',
  };
};


/**
 * Add App Engine Standard items to Cart
 *
 * @param {!angular.Form} appEngineForm
 * @export
 */
ListingCtrl.prototype.addAppEngineStandard = function(appEngineForm) {
  if (!appEngineForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'addAppEngineServices');
  /** @type {number} */
  const aeInstances = parseFloat(this.appEngineStandard.instances);
  const location = this.appEngineStandard.location;
  const instanceType = this.appEngineStandard.instanceType;
  const instanceTyepeFact = this.appEngineInstanceTypeList[instanceType];
  const sku = instanceType.includes('B') ? 'CP-APP-ENGINE-INSTANCES-BACKEND' :
                                           'CP-APP-ENGINE-INSTANCES-FRONTEND';
  // Calculates total hours in a month
  const totalHours = aeInstances * this.TOTAL_BILLING_HOURS * instanceTyepeFact;
  const appEngineFreeTier = this.CloudCalculator.getFreeQuota(sku);
  const isUnderFreeTier = totalHours - appEngineFreeTier > 0 ? false : true;
  /** @type {!cloudpricingcalculator.SkuData} */
  const aeItem = {
    sku: sku,
    quantity: totalHours,
    quantityLabel: 'Instance Hours',
    region: location,
    displayName: 'App Engine standard environment',
    displayDescription: 'Instances',
    price: null,
    uniqueId: null,
    items: {
      instanceType: instanceType,
      isUnderFreeTier: isUnderFreeTier,
      editHook: {
        initialInputs: goog.object.clone(this.appEngineStandard),
        product: 'appEngineStandard',
        tab: 'app-engine'
      }
    }
  };
  this.CloudCalculator.addItemToCart(aeItem);

  this.setupAppEngineStandardData();
  this.resetForm(appEngineForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Setup App Engine Services Model
 * @export
 */

ListingCtrl.prototype.setupAppEngineFlexibleData = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    location: {string},
   *    cores: {number},
   *    memory: {cloudpricingcalculator.DataWithUnit},
   *    persistentDisk: {cloudpricingcalculator.DataWithUnit}
   * }}
   */
  this.appEngineFlexible = {
    submitted: false,
    location: this.retrieveLocation(),
    cores: '',
    memory: {value: '', unit: this.DEFAULT_UNITS.aeMemory},
    persistentDisk: {value: '', unit: this.DEFAULT_UNITS.aePD}
  };
};


/**
 * Add App Engine Standard items to Cart
 *
 * @param {!angular.Form} appEngineForm
 * @export
 */
ListingCtrl.prototype.addAppEngineFlexible = function(appEngineForm) {
  if (!appEngineForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'addAppEngineServices');
  /** @type {string} */
  var location = this.appEngineFlexible.location;
  /** @type {number} */
  var cores = parseFloat(this.appEngineFlexible.cores);
  var memory = this.toDefaultUnit(
      this.appEngineFlexible.memory.value, this.appEngineFlexible.memory.unit,
      this.DEFAULT_UNITS.aeMemory);
  var persistentDisk = this.toDefaultUnit(
      this.appEngineFlexible.persistentDisk.value,
      this.appEngineFlexible.persistentDisk.unit, this.DEFAULT_UNITS.aeMemory);
  /** @type {!cloudpricingcalculator.SkuData} */
  var aeItem = null;

  if (this.isPositiveNumber_(cores)) {
    // Calculates total hours in a month
    var totalHours = cores * this.TOTAL_BILLING_HOURS;
    aeItem = {
      sku: 'CP-GAE-FLEX-INSTANCE-CORE-HOURS',
      quantity: totalHours,
      quantityLabel: 'core/hours',
      region: location,
      displayName: 'App Engine flexible environment',
      displayDescription: 'Cores/vCPUs',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.appEngineFlexible),
          product: 'appEngineFlexible',
          tab: 'app-engine'
        }
      }
    };
    this.CloudCalculator.addItemToCart(aeItem);
  }
  if (this.isPositiveNumber_(memory)) {
    // Calculates total hours in a month
    var totalHours = memory * this.TOTAL_BILLING_HOURS;
    aeItem = {
      sku: 'CP-GAE-FLEX-INSTANCE-RAM',
      quantity: totalHours,
      quantityLabel: 'GiB',
      region: location,
      displayName: 'App Engine flexible environment',
      displayDescription: 'Memory',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.appEngineFlexible),
          product: 'appEngineFlexible',
          tab: 'app-engine'
        }
      }
    };
    this.CloudCalculator.addItemToCart(aeItem);
  }
  if (this.isPositiveNumber_(persistentDisk)) {
    // Calculates total hours in a month
    aeItem = {
      sku: 'CP-GAE-FLEX-STORAGE-PD-CAPACITY',
      quantity: persistentDisk,
      quantityLabel: 'GiB',
      region: location,
      displayName: 'App Engine flexible environment',
      displayDescription: 'Persistent Disk',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.appEngineFlexible),
          product: 'appEngineFlexible',
          tab: 'app-engine'
        }
      }
    };
    this.CloudCalculator.addItemToCart(aeItem);
  }

  this.setupAppEngineFlexibleData();
  this.resetForm(appEngineForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Setup Compute Server Data Model
 * @export
 */
ListingCtrl.prototype.setupComputeServerData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    quantity: number,
   *    os: string,
   *    cores: string,
   *    label: string,
   *    memory: number,
   *    ssd: number,
   *    instance: string,
   *    custom: !Object<string, number>,
   *    extendedMemory: boolean,
   *    addGPUs: boolean,
   *    enableGrid: boolean,
   *    staticIpCount: number,
   *    ephemeralIpCount: number,
   *    gpuCount: number,
   *    gpuType: string,
   *    hours: number,
   *    days: number,
   *    location: string,
   *    cud: number,
   *    activeIpCount: number,
   *    publicIpCount: number,
   *    minutes: number,
   *    timeType: string,
   *    daysMonthly: number,
   *    addFreeTier: boolean,
   *    addSud: boolean,
   *    bootDiskType: string,
   *    bootDiskSize: number
   * }}
   */
  this.computeServer = {
    submitted: false,
    quantity: '',
    os: 'free',
    class: 'regular',
    cores: 'shared',
    family: 'gp',
    series: 'e2',
    label: '',
    memory: '0.6',
    ssd: 0,
    instance: 'CP-COMPUTEENGINE-VMIMAGE-E2-STANDARD-2',
    custom: {cpu: 1, ram: 0.9},
    extendedMemory: false,
    addGPUs: false,
    enableGrid: false,
    staticIpCount: '',
    ephemeralIpCount: '',
    gpuCount: 0,
    gpuType: '',
    hours: 24,
    days: 7,
    location: this.retrieveLocation(),
    cud: 0,
    minutes: 1440,
    timeType: 'hours',
    timeMode: 'day',
    daysMonthly: 30,
    sliderCpus: 1,
    customGuestCpus: 1,
    customMemoryGb: this.minMemory,
    inputMemoryGb: this.minMemory,
    addFreeTier: false,
    addSud: true,
    bootDiskType: 'STORAGE-PD-CAPACITY',
    bootDiskSize: 10
  };

  const product = 'computeServer';
  this.setCpuSlider();
  this.toggleMemoryExtension();
  this.lockOSSelect = false;
  this.applyGpuRestriction(product);
  this.onInstanceChange(product);
  // this.applyHighCpuInstancesRegionalRestriction();
};

/**
 * Resets GPU values
 * @param {string} product
 * @export
 */
ListingCtrl.prototype.resetGPU = function(product) {
  if (!this.isEditFlow) {
    this[product].addGPUs = false;
    this[product].gpuCount = 0;
    this[product].gpuType = null;
  }
};

/**
 * Scroll the cart
 * @export
 */
ListingCtrl.prototype.scrollToCart = function() {
  this.location_.hash('resultBlock');
  this.anchorScroll_();
};


/**
 * Checks if standard vm possible.
 * @private
 */
ListingCtrl.prototype.checkStandardIfPossible_ = function() {
  var sku = this.CloudCalculator.getInstanceSKU(
      this.computeServer.customGuestCpus, this.computeServer.inputMemoryGb);
  if (sku) {
    sku = sku.replace('CP-COMPUTEENGINE-VMIMAGE-', '').toLowerCase();
    this.showStandardNote = true;
    this.standardVm = sku;
  } else {
    this.showStandardNote = false;
    this.standardVm = sku;
  }
  // this.computeServer.instance = sku;
};


/**
 * Choose appropriate number of cores and memory according to selected instance
 *   type.
 * @export
 */
ListingCtrl.prototype.computeServerSelectInstance = function() {
  var conf =
      this.CloudCalculator.getInstanceParams(this.computeServer.instance);

  // Set a new default value
  this.computeServer.cores = conf.cores;
  this.generateComputeMemoryOptions(this.computeServer.cores);
  this.computeServer.memory = conf.memory;
};


/**
 * Converts standard instance to same flavor custom .
 * @export
 */
ListingCtrl.prototype.setCustomEquivalent = function() {
  var sku = this.computeServer.instance;
  var family = this.computeServer.family;
  var series = this.computeServer.series;
  var cores = 1;
  var ram = 1;
  if (sku.indexOf('SMALL') > -1 || sku.indexOf('MICRO') > -1) {
    cores = this.gceMachineFamilyConfig[family][series]['minCustomCore'];
    ram = this.gceMachineFamilyConfig[family][series]['minCustomRamRatio'];
  } else if (sku === 'custom') {
    cores = this.computeServer.customGuestCpus;
    ram = this.computeServer.inputMemoryGb;
  } else {
    cores = this.CloudCalculator.getCoresNumber(sku);
    ram = this.CloudCalculator.getRAMValue(sku);
  }
  this.computeServer.customGuestCpus = cores || 1;
  this.checkInputCpus();
  // this.computeServer.inputMemoryGb = ram;
  this.timeout_(function() {
    this.computeServer.inputMemoryGb = ram;
    this.checkInputMemory();
  }.bind(this), 2);
  this.updateGPUCount();
};


/**
 * Restricts user from choosing not free OS option for custom machine types.
 * @export
 */
ListingCtrl.prototype.applyCustomVMRestriction = function() {
  if (this.computeServer.instance !== 'custom') {
    this.lockOSSelect = false;
    /*this.computeServer.addGPUs = false;
    this.computeServer.gpuCount = 0;
    this.computeServer.gpuType = 'NVIDIA_TESLA_K80';*/
    return;
  }
  if (this.computeServer.os === 'suse') {
    this.computeServer.os = 'free';
  }
  this.lockOSSelect = true;
};


/**
 * Restricts user from choosing not available for shared cores features.
 * @export
 */
ListingCtrl.prototype.apllySharedInstancesRestriction = function(product) {
  if (this[product]['instance'] == 'CP-COMPUTEENGINE-VMIMAGE-F1-MICRO' ||
      this[product]['instance'] == 'CP-COMPUTEENGINE-VMIMAGE-G1-SMALL') {
    this.isSharedInstance[product] = true;
  } else {
    this.isSharedInstance[product] = false;
  }
  this.applyMemoryOptimizedVMCUDRestriction(product);
};

/**
 * Applies some restrictions regarding to instance type.
 * @export
 */
ListingCtrl.prototype.onInstanceChange = function(product) {
  if (product == 'computeServer') {
    this.applyCustomVMRestriction();
    this.applyHighCpuInstancesRegionalRestriction();
    this.applyMemoryOptimizedVMCUDRestriction(product);
    this.setCustomEquivalent();
  }
  this.apllySharedInstancesRestriction(product);
  this.generateLocalSsdOptions(product);
  if (this[product]['series'] == 'a2') {
    this[product].addGPUs = true;
  } else {
    this.resetGPU(product);
  }
};

/**
 * Generates local SSD options dynamically. It checks if `localSsd` config is
 * present for the series and maps the correct local SSD options based on the
 * instance's vCPUs and supported config.
 * @param {string} product product it will be applied to.
 * @export
 */
ListingCtrl.prototype.generateLocalSsdOptions = function(product) {
  let family, series, instance, vCpu;
  if (product == 'containerEngine') {
    if (!this.isEditFlow) {
      this.containerEngine.ssd = 0;
    }
    family = this.containerEngine.family;
    series = this.containerEngine.series;
    instance = this.containerEngine.instance;
    vCpu = instance == 'custom' ? this.containerEngine.custom.cpu :
                                  this.CloudCalculator.getCoresNumber(instance);
  } else {
    if (!this.isEditFlow) {
      this.computeServer.ssd = 0;
    }
    family = this.computeServer.family;
    series = this.computeServer.series;
    instance = this.computeServer.instance;
    vCpu = instance == 'custom' ? this.computeServer.customGuestCpus :
                                  this.CloudCalculator.getCoresNumber(instance);
  }

  const localSsd = this.gceMachineFamilyConfig[family][series]['localSsd'];

  if (localSsd) {
    let ssdOptions = [];
    ssdOptions.push(this.supportedSsd[0]);
    for (const item of localSsd) {
      if (vCpu >= item.vCpu.min && vCpu <= item.vCpu.max) {
        item.ssd.forEach(ssdItem => {
          ssdOptions.push({name: `${ssdItem}x375 GB`, value: ssdItem});
        });
      }
    }
    this.dynamicSsd[product] = ssdOptions;
  } else {
    this.dynamicSsd[product] = goog.array.clone(this.supportedSsd);
  }
};

/**
 * Validate ContainerEngineForm.
 *
 * @param {!angular.Form} ContainerEngineForm
 * @export
 */

ListingCtrl.prototype.validateContainerForm = function(ContainerEngineForm) {
  this.containerEngineFormValid =
      ((this.containerEngine.instance == 'custom' ?
            this.containerEngine.custom.cpu > 1 ?
            this.containerEngine.custom.cpu % 2 == 0 ?
            !ContainerEngineForm.$invalid ? true : false :
            false :
                this.containerEngine.custom.cpu == 1 ?
            !ContainerEngineForm.$invalid ? true : false :
            false :
            !ContainerEngineForm.$invalid) &&
       (this.containerEngine.instance == 'custom' ?
            ((this.containerEngine.custom.ram >= this.gkeCustom.ramMin) &&
             (this.gkeCustom.ramMax >= this.containerEngine.custom.ram)) ?
            !ContainerEngineForm.$invalid == true ? true : false :
            false :
            !ContainerEngineForm.$invalid));
};

/**
 * Applies some restrictions regarding to CUD term.
 * @param {string} product
 * @export
 */
ListingCtrl.prototype.onCudChange = function(product) {
  this.applyMemoryOptimizedVMCUDRestriction(product);
  this.applyGpuRestriction(product);
};


/**
 * Applies some restrictions regarding to instance type.
 * @export
 */
ListingCtrl.prototype.onGkeInstanceChange = function() {
  this.applyGkeDiesRestrictions();
  this.apllySharedInstancesRestriction('containerEngine');
};

/**
 * Applies some restrictions regarding to instance type.
 * @export
 */
ListingCtrl.prototype.onTpuGenerationsChange = function() {
  var version = this.tpu.tpuGeneration;
  var location = this.tpu.location;
  if (version === 'V3' && location === 'asia-east1') {
    this.tpu.location = 'us-central1';
  }
};


/**
 * Applies some restrictions regarding to location for GCE.
 * @export
 */
ListingCtrl.prototype.onLocationChange = function() {
  this.applyGpuRestriction('computeServer');
  this.applyHighCpuInstancesRegionalRestriction();
  this.checkInstanceAvailability('computeServer');
};

/**
 * Persists product location in LocalStorage.
 * @param {string} product product location key.
 * @param {string=} location selected location.
 *     default is: this.[productKey].location.
 * @export
 */
ListingCtrl.prototype.persistLocation = function(product, location) {
  const key = 'location';
  const loc = location || this[product].location || 'us-central1';

  // Only save regional locations that are available for most products
  if (this.fullRegionList.some(s => s.value === loc)) {
    try {
      localStorage.setItem(key, loc);
    } catch {
    }
  }
};

/**
 * Retrieves persisted location from LocalStorage.
 * @param {string=} defaultLocation default location if it is not yet persisted.
 * @param {!Array<{value: string, name: string}>=} availableLocations available
 *     locations for the product.
 * @return {string} persisted or default location.
 * @export
 */
ListingCtrl.prototype.retrieveLocation = function(
    defaultLocation, availableLocations) {
  const key = 'location';
  let persistedLocation = 'us-central1';
  try {
    persistedLocation = localStorage.getItem(key);
  } catch {
  }

  let location = persistedLocation;
  if (availableLocations && persistedLocation) {
    // Check if persisted location is in available locations
    // otherwise use the default location
    if (!availableLocations.some(s => s.value === persistedLocation)) {
      location = defaultLocation;
    }
  }

  return location || 'us-central1';
};

/**
 * Checks if instance is available.
 * @param {string} product product name.
 * @export
 */
ListingCtrl.prototype.checkInstanceAvailability = function(product) {
  if (product == 'computeServer' && this.computeServer.instance == 'custom') {
    const region = this.computeServer.location;
    const sku = this.generateCustomInstanceSkuName(product);
    this.machineType[product] =
        this.CloudCalculator.getCustomVmPrice(sku, region).unitPrice != 0;
  } else {
    this.machineType[product] = this.CloudCalculator.isSkuAvailableInRegion(
        this[product].series,
        product == 'composer' ? this[product].dcLocation :
                                this[product].location);
  }
};


/**
 * Generates SKU name for custom machine instances.
 * @param {string} product product name.
 * @returns {string} SKU name.
 * @export
 */
ListingCtrl.prototype.generateCustomInstanceSkuName = function(product) {
  const series = this[product].series.toUpperCase();
  const cpu = product == 'computeServer' ? this[product].customGuestCpus :
                                           this[product].custom.cpu;
  const memory = product == 'computeServer' ? this[product].inputMemoryGb :
                                              this[product].custom.ram;
  const memoryInMb = memory * this.TB_TO_GB;
  const customRamLimit =
      this.gceMachineFamilyConfig[this[product]
                                      .family][this[product]
                                                   .series]['maxCustomRamRatio'] *
      cpu;
  const isMemoryExtended =
      this[product].extendedMemory && (memory > customRamLimit);
  const sku = `CP-COMPUTEENGINE-VMIMAGE-${series}-CUSTOM-${cpu}-${memoryInMb}`;
  return isMemoryExtended ? sku + '-EXTENDED' : sku;
};

/**
 * Does required changes on gpu type change for GCE.
 * @param {string} family instance family.
 * @param {number} series instance series.
 * @param {string} instanceType type of this instance.
 * @param {number} coreNumber number of cores.
 * @returns {string}
 * @export
 */
ListingCtrl.prototype.generateGceSkuDropDownName = function(
    family, series, instanceType, coreNumber) {
  const instanceName =
      this.generateGceInstanceName(family, series, instanceType, coreNumber);
  const instanceInfo =
      this.gceMachineFamilyConfig[family][series]['supportedTypes'][instanceType];
  const ramRatio = instanceInfo['alternateRamRatio'] &&
    instanceInfo['alternateRamRatioCores'] &&
    instanceInfo['alternateRamRatioCores'].includes(coreNumber) ?
    instanceInfo['alternateRamRatio'] :
    instanceInfo['ramRatio'];
  const coreRatio = instanceInfo['coreRatio'];

  let res = `${instanceName} (vCPUs: ${coreNumber * coreRatio}, RAM: ${
      coreNumber * ramRatio}GB)`;
  if (series == 'a2') {
    res = `${instanceName} (vCPUs: ${coreNumber * coreRatio}, RAM: ${
      coreNumber * ramRatio}GB, GPUs: ${coreNumber})`;
  }
  return res;
};


/**
 * Generates list of values for GCE intsantce type drop down based on
 * gceMachineFamilyConfig config.
 * @export
 */
ListingCtrl.prototype.generateComputeInstanceList = function() {
  // this.computeInstanceList = {};
  let iList = this.computeInstanceList;
  const nameGenrator = this.generateGceSkuDropDownName.bind(this);
  const skuGenrator = this.generateGceSku.bind(this);
  Object.entries(this.gceMachineFamilyConfig).forEach(([
                                                        family, familyInfo
                                                      ]) => {
    iList[family] = {};
    Object.entries(familyInfo).forEach(([series, genInfo]) => {
      iList[family][series] = {};
      Object.entries(genInfo['supportedTypes']).forEach(([
                                                          typeName, typeData
                                                        ]) => {
        iList[family][series][typeName] = [];
        typeData['supportedCores'].forEach(
            (coresCount) => {iList[family][series][typeName].push({
              'name': nameGenrator(family, series, typeName, coresCount),
              'value': skuGenrator(family, series, typeName, coresCount)
            })});
      });
    });
  });
};



/**
 * Swithes SKU to minimal viable SKU and drops the series to 1 based on
 * chosen family andproduct.
 * @param {string} product product it will be applied to.
 * @export
 */
ListingCtrl.prototype.onFamilyChange = function(product) {
  var prod = this[product];
  var minorVersion = Object.keys(this.gceMachineFamilyConfig[prod.family])[0];
  prod['series'] = minorVersion;
  var sku = this.getMinSku(product);
  prod['instance'] = sku;
  this.checkInstanceAvailability(product);
  this.apllySharedInstancesRestriction(product);
  this.applyMemoryOptimizedVMCUDRestriction(product);
  this.onSeriesChange(product);
};



/**
 * Swithes SKU to minimal viable SKU based on chosen series and product.
 * @param {string} product product it will be applied to.
 * @export
 */
ListingCtrl.prototype.onSeriesChange = function(product) {
  if (product == 'containerEngine') {
    if (!['n1', 'n2', 'n2d'].includes(this.containerEngine.series)) {
      this.containerEngine.extendedMemory = false;
    }
    this.containerEngine.custom.cpu = this.checkAvailabilityForThisFamily(
        'minCustomCore', this.containerEngine);
    this.gkeCustomLimit(Number(this.containerEngine.custom.cpu));
  } else {
    this.setMemoryRange_(this.computeServer.customGuestCpus);
  }
  if (this[product]['instance'] === 'custom') {
    this.generateLocalSsdOptions(product);
    this.resetGPU(product);
    this.applyGpuRestriction(product);
    return;
  }
  const sku = this.getMinSku(product);
  this[product]['instance'] = sku;
  this.checkInstanceAvailability(product);
  this.applyMemoryOptimizedVMCUDRestriction(product);
  this.generateLocalSsdOptions(product);
  if (this[product]['series'] == 'a2') {
    this[product].addGPUs = true;
  } else {
    this.resetGPU(product);
  }
  this.applyGpuRestriction(product);
};


/**
 * Does required changes on gpu type change for GCE.
 * @param {string} family instance family.
 * @param {number} series instance series.
 * @param {string} instanceType type of this instance.
 * @param {number} coreNumber number of cores.
 * @export
 */
ListingCtrl.prototype.generateGceSku = function(
    family, series, instanceType, coreNumber) {
  var sku = 'CP-COMPUTEENGINE-VMIMAGE-';
  var instanceName =1400.
      this.generateGceInstanceName(family, series, instanceType, coreNumber);

  return (sku + instanceName).toUpperCase();
};


/**
 * Does required changes on gpu type change for GCE.
 * @param {string} product this sku is going to be assigned.
 * @export
 */
ListingCtrl.prototype.getMinSku = function(product) {
  var prod = this[product];
  var prodConfig = this.gceMachineFamilyConfig[prod.family][prod.series];
  var instanceTypes = prodConfig['supportedTypes'];
  var instanceTypeConfig = Object.entries(instanceTypes)[0];
  var instanceType = instanceTypeConfig[0];
  var minCore = instanceTypeConfig[1]['supportedCores'][0];
  var sku = this.generateGceSku(
      prod['family'], prod['series'], instanceType, minCore);

  return sku;
};


/**
 * Returns min/max Custom Ram Ratio .
 * @param {string} edge whetehr min or max memory is needed.
 * @return {number} ram ratio.
 * @export
 */
ListingCtrl.prototype.getCurrentCustomRamRatio = function(edge) {
  var prod = this['computeServer'];
  var requredKey = edge === 'min' ? 'minCustomRamRatio' : 'maxCustomRamRatio';
  if (!prod || !this.gceMachineFamilyConfig) {
    return 0;
  }
  var prodConfig = this.gceMachineFamilyConfig[prod.family][prod.series];

  return prodConfig[requredKey];
};


/**
 * Combines instance name.
 * @param {string} family instance family.
 * @param {number} series instance series.
 * @param {string} instanceType type of this instance.
 * @param {number} coreNumber number of cores.
 * @return {string} instance name.
 * @export
 */
ListingCtrl.prototype.generateGceInstanceName = function(
    family, series, instanceType, coreNumber) {
  let cores = series == 'a2' ? `${coreNumber}g` : coreNumber;
  return [series, instanceType, cores].join('-').toLowerCase();
};


/**
 * Applies some restrictions regarding to location for GKE.
 * @export
 */
ListingCtrl.prototype.onLocationChangeGke = function() {
  this.applyGpuRestriction('containerEngine');
};


/**
 * Sets default region for regional and multi-region locations.
 * @export
 */
ListingCtrl.prototype.onSpannerCofigChange = function() {
  const location = this.retrieveLocation();
  this.spanner.location = this.spanner.configuration === 'regional' ?
      location || 'us-central1' :
      'nam3';
};


/**
 * Restricts user from choosing GPU in unsupported regions.
 * @param {string} product product it will be applied to.
 * @export
 */
ListingCtrl.prototype.applyGpuRestriction = function(product) {
  const cud = this[product].cud || 0;
  const region = this[product].location;
  let baseGpuSku =
      product == 'dataflow' ? this.BASE_DATAFLOWGPU_SKU : this.BASE_GPU_SKU;
  let allPossibleRegions = [];
  this.gpuList.forEach(gpu => {
    allPossibleRegions = allPossibleRegions.concat(
        this.CloudCalculator.getGpuRegionList(gpu.value, baseGpuSku, cud));
  });
  if (!allPossibleRegions.includes(region)) {
    this.lockGpu[product] = true;
    this[product].addGPUs = false;
    this[product].gpuType = null;
    return;
  }

  const gpuType = this[product].gpuType;
  const supportedRegions =
      this.CloudCalculator.getGpuRegionList(gpuType, baseGpuSku, cud);
  if (!supportedRegions.includes(region)) {
    this[product].gpuType = null;
  }

  this.lockGpu[product] = false;
  this.updateGPUCount(product);
};


/**
 * Checks if this gpu available in current region.
 * @param {string} gpu dice to check.
 * @param {string} product product it will be applied to.
 * @return {boolean} whether it's available.
 * @export
 */
ListingCtrl.prototype.checkGpuAvailability = function(gpu, product) {
  let baseGpuSku =
      product == 'dataflow' ? this.BASE_DATAFLOWGPU_SKU : this.BASE_GPU_SKU;
  const cud = this[product].cud || 0;
  const supportedRegions =
      this.CloudCalculator.getGpuRegionList(gpu, baseGpuSku, cud);
  const region = this[product].location;
  return !goog.array.contains(supportedRegions, region);
};



/**
 * Restricts user from choosing instance in unsupported region.
 * @export
 */
ListingCtrl.prototype.applyHighCpuInstancesRegionalRestriction = function() {
  var region = this.computeServer.location;
  var instance = this.computeServer.instance;
  var supportedMegaRegions = this.CloudCalculator.getHighCpuRegionList();
  var isMegaValid = supportedMegaRegions.length == 0 ||
      goog.array.contains(supportedMegaRegions, region);
  this.isInvalidMegaVm = isMegaValid ? false : true;
  var supportedUltraRegions = this.CloudCalculator.getUltraMemRegionList();
  var isUltraValid = supportedUltraRegions.length == 0 ||
      goog.array.contains(supportedUltraRegions, region);
  this.isInvalidUltraVm = isUltraValid ? false : true;
  if (instance == 'custom') {
    return;
  }
  var instanceFamily = instance.split('-')[4];
  if ((instanceFamily == 'MEGAMEM' && !isMegaValid) ||
      (instanceFamily == 'ULTRAMEM' && !isUltraValid)) {
    this.unsuportedVmType = true;
  } else {
    this.unsuportedVmType = false;
  }
};



/**
 * Restricts user from choosing CUD for unsupported instances.
 * @param {string} product product to check specific family type.
 * @export
 */
ListingCtrl.prototype.applyMemoryOptimizedVMCUDRestriction = function(product) {
  const instance = this[product].instance || this[product].nodeType;
  let cudFlag;
  switch (product) {
    case 'computeServer':
      cudFlag = 'isCudDisabled';
      break;
    case 'containerEngine':
      cudFlag = 'isGkeCudDisabled';
      break;
    case 'soleTenant':
      cudFlag = 'isSoleTenantCudDisabled';
      break;
    default:
      cudFlag = 'isCudDisabled';
  }
  if (instance.indexOf('F1-MICRO') != -1 ||
      instance.indexOf('G1-SMALL') != -1 ||
      this[product].class == 'preemptible') {
    this[product].cud = 0;
    this[cudFlag] = true;
  } else {
    this[cudFlag] = false;
  }
};


/**
 * Resets minutes, hours, days amount on time type change.
 * @param {string} product name of the product to change data.
 * @export
 */
ListingCtrl.prototype.resetTimeType = function(product) {
  /*if (this[product].timeType == 'hours') {
    this[product].minutes = 1440;
    this[product].daysMonthly = 30;
  } else if (this[product].timeType == 'minutes') {
    this[product].hours = 24;
    this[product].daysMonthly = 30;
  } else if (this[product].timeType == 'days') {
    this[product].hours = 24;
    this[product].minutes = 1440;
  }*/
};


/**
 * Resets max hours and minutes per chosen mode
 * @param {string} product name of the product to change data.
 * @export
 */
ListingCtrl.prototype.resetTimeMode = function(product) {
  // this[product].timeType = 'hours';
  if (this[product].timeMode === 'month') {
    this.maxHours = 744;
    this.maxMinutes = 43800;
  } else {
    this.maxHours = 24;
    this.maxMinutes = 1440;
  }
  this.resetTimeType(product);
};


/**
 * Toggles memory extension. Switch max custom VM memory limit.
 * @export
 */
ListingCtrl.prototype.toggleMemoryExtension = function() {
  this.applyMemoryOptimizedVMCUDRestriction('computeServer');
  this.setMemoryRange_(this.computeServer.customGuestCpus);
  if (!this.computeServer.extendedMemory) {
    this.adjustMemorySlider_();
  }
};


/**
 * Toggles GPU dice. Switches between custom/standard VM's.
 * @export
 */
ListingCtrl.prototype.toggleGPUDice = function() {
  if (this.computeServer.addGPUs == true &&
      this.computeServer.instance != 'custom') {
    this.prevVMType = this.computeServer.instance;
  } else if (
      this.computeServer.addGPUs == false && this.prevVMType.length > 0) {
    this.computeServer.instance = this.prevVMType;
  }
};

/**
 * Checks GPU availability.
 * @param {string} product name of the product.
 * @return {boolean}
 * @export
 */
ListingCtrl.prototype.isGpuOptionAvailable = function(product) {
  const isAvailableForFamily = product == 'computeServer' ?
    this.checkAvailabilityForThisFamily('isGpuAvailable') :
    this.checkAvailabilityForThisFamily('isGpuAvailable', this[product]);
  return isAvailableForFamily && !this.lockGpu[product] &&
    !this.isSharedInstance[product];
};

/**
 * Add a Compute Server to Cart
 *
 * @param {!angular.Form} computeForm
 * @export
 */
ListingCtrl.prototype.addComputeServer = function(computeForm) {
  if (computeForm && !computeForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddComputeServer');
  let sustainedPriceItem;
  let sustainedUseDiscount;
  /**
   * @type {number}
   */
  const hours = this.computeServer.timeType == 'hours' ?
      this.computeServer.hours :
      this.computeServer.timeType == 'minutes' ?
      this.computeServer.minutes / 60 :
      this.computeServer.daysMonthly * 24;
  /** @type {number} */
  const hoursMultiplier = this.computeServer.timeMode == 'day' ?
      this.computeServer.days * this.WEEKS :
      1;
  /**
   * Calculate the days / month based on average
   * @type {number}
   */
  let hoursPerMonth = hours * hoursMultiplier;
  const quantity = this.computeServer.quantity;
  let cores = 0;
  const family = this.computeServer.series.toUpperCase();
  /**
   * @type {string}
   */
  let sku = this.computeServer.instance;
  /**
   * @type {string}
   */
  const isMemoryExtended = this.computeServer.extendedMemory &&
      (this.computeServer.inputMemoryGb >
       this.computeServer.customGuestCpus * 6.5);
  /** @type {string} */
  const vmClass = this.computeServer.class;
  /**
   * @type {boolean}
   */
  const isPreemptibleAvailable = this.checkPmvAvailability();
  let isPreemptible =
      vmClass.toLowerCase() === 'preemptible' && isPreemptibleAvailable;
  /** @type {boolean} */
  let sustainedUse = false;
  let addSud = this.computeServer.addSud;
  const maxSud = addSud ? this.CloudCalculator.getMaxSudForSeries(family) : 1;
  const isUnderfreeTier = this.computeServer.addFreeTier;
  /** @const {string} */
  const PB_SKU = '-PREEMPTIBLE';
  /**
   * @type {string}
   */
  let title = quantity + ' x ' + this.computeServer.label;
  if (sku === 'custom') {
    sku = this.generateCustomInstanceSkuName('computeServer');
    cores = this.computeServer.customGuestCpus;
  }
  /**
   * @type {string}
   */
  const instanceName =
      sku.replace('CP-COMPUTEENGINE-VMIMAGE-', '').toLowerCase();
  cores = cores > 0 ? cores : this.CloudCalculator.getCoresNumber(sku);

  const isResourceBased = !sku.match(/e2-micro|e2-small|e2-medium|F1|G1/i);
  const isSudEligible = family !== 'A2' && family !== 'E2';
  addSud = addSud && isSudEligible;

  /**
   * @type {string}
   */
  const region = this.computeServer.location;
  /**
   * @type {number}
   */
  let perHostPrice = 0;
  const cudTerm = this.computeServer.cud;
  /** @type {boolean} */
  const isCud = this.isPositiveNumber_(cudTerm);
  let isInstanceCommitted = false;
  let termText = '';
  const bootDiskType = this.computeServer.bootDiskType;
  const bootDiskSize = this.computeServer.bootDiskSize;
  const groupId =
      this.computeServer.groupId ? this.computeServer.groupId : Math.random();
  const storageType = this.computeBootDiskTypes[bootDiskType].pd;

  if (isCud && !this.isCudDisabled) {
    hoursPerMonth = this.TOTAL_BILLING_HOURS;
    perHostPrice =
        this.CloudCalculator.getCUDCost(sku, region, cudTerm) * hoursPerMonth;

    termText = cudTerm + ' Year' + (parseInt(cudTerm, 10) == 3 ? 's' : '');
    this.computeServer.class = 'regular';
    isInstanceCommitted = true;
  } else {
    if (isPreemptible) {
      sku = sku + PB_SKU;
    }
    // Calculate the per-host price
    if (addSud) {
      sustainedPriceItem =
          this.CloudCalculator.calculateSustainedUseDiscountPrice(
              sku, hoursPerMonth, region, quantity);

      perHostPrice = sustainedPriceItem.totalPrice;
      sustainedUseDiscount = sustainedPriceItem.cumulativeDiscount;
      if ((hoursPerMonth > this.CloudCalculator.getSustainedUseBase() *
               this.TOTAL_BILLING_HOURS) &&
          !isPreemptible && sustainedUseDiscount > 0) {
        sustainedUse = true;
      }
    } else {
      if (sku.indexOf('CUSTOM') != -1) {
        perHostPrice =
            this.CloudCalculator.getCustomVmPrice(sku, region).unitPrice;
      } else if (!isResourceBased) {
        perHostPrice = this.CloudCalculator.getUnitPrice(sku, region).unitPrice;
      } else {
        perHostPrice =
            this.CloudCalculator.getResourceBasedPrice(sku, region).unitPrice;
      }
      perHostPrice = perHostPrice * hoursPerMonth;
    }
  }
  if (perHostPrice == 0) {
    this.machineType['computeServer'] = false;
    return;
  }
  // updates sku.
  this.computeServer.instance = sku;

  // Calculate the total hours
  const totalHoursPerMonth = quantity * hoursPerMonth;

  const ssd = this.computeServer.ssd;
  const ssdSku = 'CP-COMPUTEENGINE-LOCAL-SSD';
  let isSsdCommitted = false;
  if (isCud && !isPreemptible &&
      this.CloudCalculator.checkForCommitment(ssdSku, cudTerm)) {
    isSsdCommitted = true;
  }
  const ssdPrice =
      this.CloudCalculator.getSsdPrice(region, isPreemptible, cudTerm);
  // each ssd solid disk has 375 gb
  const ssdCost = ssdPrice * totalHoursPerMonth * ssd * 375;
  // Calculate GPU cost
  let gpuCost = 0;
  let nvidiaGridCost = 0;
  if (family == 'A2') {
    this.computeServer.gpuType = 'NVIDIA_TESLA_A100';
    this.computeServer.gpuCount =
        cores / (sku.toLowerCase().indexOf('megagpu') != -1 ? 6 : 12);
    this.computeServer.addGPUs = true;
  }
  let gpuType = this.computeServer.gpuType || '';
  let gpuCount = family == 'A2' ?
      this.computeServer.gpuCount * totalHoursPerMonth :
      this.checkAvailabilityForThisFamily('isGpuAvailable') ?
      this.computeServer.gpuCount * totalHoursPerMonth :
      0;

  let isGpuCommitted = false;
  /** @type {boolean} */
  const isGpuAvailableForRegion =
      this.checkGpuAvailability(gpuType, 'computeServer');
  if (this.computeServer.addGPUs &&
      !(this.lockGpu.computeServer || this.isSharedInstance.computeServer) &&
      !isGpuAvailableForRegion) {
    let gpuSKU = this.BASE_GPU_SKU + gpuType;
    if (isPreemptible) {
      gpuSKU = gpuSKU + PB_SKU;
    }
    if (isCud && this.CloudCalculator.checkForCommitment(gpuSKU, cudTerm)) {
      isGpuCommitted = true;
      gpuSKU = gpuSKU + '-CUD-' + cudTerm + '-YEAR';
    }
    gpuCost =
        this.CloudCalculator.calculateItemPrice(gpuSKU, gpuCount, region, 0);
    if (sustainedUse) {
      gpuCost = gpuCost * (1 - sustainedUseDiscount);
    } else if (isCud && !isGpuCommitted) {
      gpuCost = gpuCost * maxSud;
    }
    // calculate grid costs
    if (this.computeServer.enableGrid && gpuType != 'NVIDIA_TESLA_K80' &&
        gpuType != 'NVIDIA_TESLA_V100') {
      nvidiaGridCost = this.CloudCalculator.calculateItemPrice(
          'GPU_NVIDIA_GRID_LICENSE', gpuCount, region, 0);
    }
  }

  // Calculate Os price and
  let os = this.computeServer.os;
  let isOsCommitted = false;
  if (isCud && os.indexOf('sles-sap-1') > -1) {
    isOsCommitted = true;
    os = `${os}-cud-${cudTerm}-year`;
  }
  let osPrice = 0;
  if (os !== 'free') {
    // If gpuCost is 0, it means GPU is not included
    const numberOfGPUs = gpuCost ? this.computeServer.gpuCount : 0;
    osPrice = this.CloudCalculator.getOsPrice(os, sku, numberOfGPUs);
  }

  // Total OS cost
  const osCost = osPrice * totalHoursPerMonth;

  // Calculate the total price
  let gceCost = quantity * perHostPrice;
  if ((region == 'us-central1' || region == 'us-east1' ||
       region == 'us-west1') &&
      instanceName == 'f1-micro' && isUnderfreeTier) {
    gceCost = Math.max((quantity - 750 / 730), 0) * perHostPrice;
  }
  let extendedMemoryCost = 0;
  let extendedMemoryVolume = 0;
  if (isMemoryExtended) {
    extendedMemoryCost =
        (this.CloudCalculator.getExtendedCost(sku, region, family) *
         totalHoursPerMonth);
    if (sustainedUse) {
      extendedMemoryCost = extendedMemoryCost * (1 - sustainedUseDiscount);
    }
    if (isCud) {
      extendedMemoryCost = extendedMemoryCost * maxSud;
      gceCost += extendedMemoryCost;
    }
    extendedMemoryVolume = this.CloudCalculator.getExtendedMemoryVolume(
        this.computeServer.customGuestCpus, this.computeServer.inputMemoryGb,
        family);
  }
  // Calculate Public Ip Pricing
  // ephemeral ips are charged only when machine is on
  let freeIpAddrees = isUnderfreeTier ? this.TOTAL_BILLING_HOURS : 0;
  const ephemeralIpHours = Math.max(
      0, (this.computeServer.ephemeralIpCount * hoursPerMonth - freeIpAddrees));
  freeIpAddrees = Math.max(
      0, freeIpAddrees - this.computeServer.ephemeralIpCount * hoursPerMonth);
  let publicSKU = 'CP-COMPUTEENGINE-PUBLIC-IP-ADDRESS';
  let unusedSKU = 'CP-COMPUTEENGINE-UNUSED-STATIC-PUBLIC-IP';
  if (isPreemptible) {
    publicSKU = publicSKU + '-PREEMPTIBLE';
  }
  const ephemeralIpPrice = this.CloudCalculator.calculateItemPrice(
      publicSKU, ephemeralIpHours, region, 0);
  // static IP charges used and not. The cost is different.
  let staticIpUsedPrice = 0;
  let staticIpUnusedPrice = 0;
  const staticIpUsedHours = Math.max(
      0, (this.computeServer.staticIpCount * hoursPerMonth - freeIpAddrees));
  const staticIpUnusedHours = this.computeServer.staticIpCount *
      (this.TOTAL_BILLING_HOURS - hoursPerMonth);
  staticIpUsedPrice = this.CloudCalculator.calculateItemPrice(
      publicSKU, staticIpUsedHours, region, 0);
  staticIpUnusedPrice = this.CloudCalculator.calculateItemPrice(
      unusedSKU, staticIpUnusedHours, region, 0);
  const staticIpPrice = staticIpUsedPrice + staticIpUnusedPrice;
  const publicIpPrice = staticIpPrice + ephemeralIpPrice;

  // Calculate the total price
  const totalPrice = gceCost + osCost + ssdCost + gpuCost + nvidiaGridCost +
      ephemeralIpPrice + staticIpPrice;
  const effectiveRate = totalPrice / totalHoursPerMonth;
  const coreHours = totalHoursPerMonth * cores;

  /** @type {!cloudpricingcalculator.SkuData} */
  const newItem = {
    sku: sku,
    quantity: totalHoursPerMonth,
    quantityLabel: 'total hours per month',
    region:
        this.fullRegion[region] || this.fullRegion[this.regionFallback[region]],
    displayName: title,
    displayDescription: instanceName,
    uniqueId: null,
    price: null,
    hasAccItems: true,
    items: {
      sustainedUse: sustainedUse,
      sustainedUseDiscount: sustainedUseDiscount,
      effectiveRate: effectiveRate,
      gceCost: gceCost,
      gpuCost: gpuCost,
      nvidiaGridCost: nvidiaGridCost,
      osCost: osCost,
      extendedMemoryCost: extendedMemoryCost,
      extendedMemoryVolume: extendedMemoryVolume,
      ssd: this.computeServer.ssd,
      ssdCost: ssdCost,
      gpuCount: this.computeServer.gpuCount,
      gpuType: gpuType.replace(/_/g, ' '),
      coreHours: coreHours,
      detailedView: isCud || !addSud ? null : sustainedPriceItem.detailedView,
      termText: termText,
      isInstanceCommitted: isInstanceCommitted,
      isGpuCommitted: isGpuCommitted,
      isSsdCommitted: isSsdCommitted,
      isOsCommitted: isOsCommitted,
      ephemeralIpHours: ephemeralIpHours,
      ephemeralIpPrice: ephemeralIpPrice,
      staticIpUsedHours: staticIpUsedHours,
      staticIpUsedPrice: staticIpUsedPrice,
      staticIpUnusedHours: staticIpUnusedHours,
      staticIpUnusedPrice: staticIpUnusedPrice,
      publicIpPrice: publicIpPrice,
      isGpuAvailableForRegion: isGpuAvailableForRegion,
      isCudDisabled: this.isCudDisabled,
      groupId,
      editHook: {
        initialInputs: goog.object.clone(this.computeServer),
        product: 'computeServer',
        tab: 'compute-engine'
      }
    }
  };

  this.CloudCalculator.addItemToCart(newItem, totalPrice);

  // Add accompanying Persistent Disk
  this.setupPersistentDiskData();
  this.persistentDisk[storageType].value = bootDiskSize;
  this.persistentDisk[storageType].unit = this.DEFAULT_UNITS.pdStorage;

  // ExtremePd boot disk type has default provisioned IOPS value of 100000.
  if (storageType == 'extremePd') {
    this.persistentDisk['extremePdIopsCount'] = 100000;
  }

  goog.object.extend(this.persistentDisk, {
    quantity,
    bootDiskSize,
    bootDiskType,
    readonly: true,
    location: region,
    groupId,
    accompaniedProduct: 'Compute Engine'
  });
  this.addPersistentDisk();

  // Clear the data model
  this.setupComputeServerData();
  computeForm && this.resetForm(computeForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Checks local SSD is available for instance family and series. Handles some
 * exceptional scenarios where SSD are available for just some instances of the
 * series.
 * @param {string} product product it will be applied to.
 * @return {boolean} whether local SSD is available in config.
 * @export
 */
ListingCtrl.prototype.checkLocalSsdAvailibility = function(product) {
  let family, series, instance;
  if (product == 'containerEngine') {
    family = this.containerEngine.family;
    series = this.containerEngine.series;
    instance = this.containerEngine.instance;
  } else {
    family = this.computeServer.family;
    series = this.computeServer.series;
    instance = this.computeServer.instance;
  }

  if (instance == 'CP-COMPUTEENGINE-VMIMAGE-M1-MEGAMEM-96') {
    return true;
  }

  return this.gceMachineFamilyConfig[family] &&
      this.gceMachineFamilyConfig[family][series] &&
      this.gceMachineFamilyConfig[family][series]['isLocalSsdAvailable'];
};

/**
 * Checks parameter in config for selected instance family and series.
 * @param {string} param Param to check;
 * @param {?Object=} product product to check specific family type;
 * @return {boolean} whether this param is available in config.
 * @export
 */
ListingCtrl.prototype.checkAvailabilityForThisFamily = function(
    param, product) {
  let family = null;
  let series = null;
  if (product) {
    family = product.family;
    series = product.series;
  } else {
    family = this.computeServer.family;
    series = this.computeServer.series;
  }
  return this.gceMachineFamilyConfig[family] &&
      this.gceMachineFamilyConfig[family][series] &&
      this.gceMachineFamilyConfig[family][series][param];
};

/**
 * Checks product series belong to given set of param.
 * @param {string} product product name.
 * @param {!array} param param to validate.
 * @return {boolean} whether param belong to product.
 * @export
 */
ListingCtrl.prototype.checkAvailabilityForThisSeries = function(
    product, param) {
  const series = this.CloudCalculator.getFamilyFromSku(product);
  return param.includes(series);
};

/**
 * Setup Cloud Storage Data
 * @export
 */
ListingCtrl.prototype.setupCloudStorageData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    storageClass: string,
   *    location: string,
   *    multiRegionalStorage: !cloudpricingcalculator.DataWithUnit,
   *    egressTypes: !Array,
   *    egress: !Object<string,!cloudpricingcalculator.DataWithUnit>,
   *    restoreSize: !cloudpricingcalculator.DataWithUnit,
   *    classAOps: number,
   *    classBOps: number,
   *    addFreeTier: boolean
   * }}
   */
  this.cloudStorage = {
    storageClass: 'standard',
    submitted: false,
    location:
        this.retrieveLocation('us-central1', this.storageRegionList.regional),
    multiRegionalStorage:
        {value: '', unit: this.DEFAULT_UNITS.multiRegionalStorage},
    egressTypes: ['SAME-LOCATION'],
    egress: {
      'SAME-LOCATION': {value: null, unit: this.DEFAULT_UNITS.storageEgress},
      'DUAL-REGION-BUCKET':
          {value: null, unit: this.DEFAULT_UNITS.storageEgress},
      'MULTI-REGION-BUCKET':
          {value: null, unit: this.DEFAULT_UNITS.storageEgress},
      'MULTI-REGION-SAME-CONTINENT':
          {value: null, unit: this.DEFAULT_UNITS.storageEgress},
      'DIFFERENT-LOCATIONS-SAME-CONTINENT':
          {value: null, unit: this.DEFAULT_UNITS.storageEgress},
      'WORLDWIDE-EXCEPT-ASIA-AUSTRALIA':
          {value: null, unit: this.DEFAULT_UNITS.storageEgress},
      'ASIA-EXCEPT-CHINA':
          {value: null, unit: this.DEFAULT_UNITS.storageEgress},
      'CHINA': {value: null, unit: this.DEFAULT_UNITS.storageEgress},
      'AUSTRALIA': {value: null, unit: this.DEFAULT_UNITS.storageEgress}
    },
    restoreSize: {value: null, unit: this.DEFAULT_UNITS.restoreSize},
    classAOps: '',
    classBOps: '',
    addFreeTier: false
  };
};


/**
 * Return wheteher PMV option is available for this machine.
 * @param {?object=} product product to check specific family type.
 * @return {!bolean}
 * @export
 */
ListingCtrl.prototype.checkPmvAvailability = function(product) {
  return this.checkAvailabilityForThisFamily('isPreemptibleAvailable', product);
};

/**
 * Checks if free tier is available for the region.
 * @export
 */
ListingCtrl.prototype.checkStorageFreeTierAvailability = function() {
  const location = this.cloudStorage.location;
  this.storageFreeTierAvailable = location == 'us-east1' ||
      location == 'us-west1' || location == 'us-central1';
  if (!this.storageFreeTierAvailable) {
    this.cloudStorage.addFreeTier = false;
  }
};

/**
 * Add Cloud Storage to Cart
 *
 * @param {!angular.Form} cloudStorageForm
 * @export
 */
ListingCtrl.prototype.addCloudStorage = function(cloudStorageForm) {
  if (this.isFormEmpty(cloudStorageForm) || cloudStorageForm.$invalid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddCloudStorage');
  const location = this.cloudStorage.location;
  const egressLocation = 'us';
  const storageClass = this.cloudStorage.storageClass;
  const addFreeTier = this.cloudStorage.addFreeTier;
  const sku = `CP-BIGSTORE-${storageClass.toUpperCase()}`;
  const multiRegionalStorage = this.toDefaultUnit(
      this.cloudStorage.multiRegionalStorage.value,
      this.cloudStorage.multiRegionalStorage.unit,
      this.DEFAULT_UNITS.multiRegionalStorage);
  const restoreSize = this.toDefaultUnit(
      this.cloudStorage.restoreSize.value, this.cloudStorage.restoreSize.unit,
      this.DEFAULT_UNITS.restoreSize);
  const gcsClassAops = this.cloudStorage.classAOps;
  const gcsClassBops = this.cloudStorage.classBOps;
  const egressTypes = this.cloudStorage.egressTypes;
  let egress = {};
  for (const egressType of egressTypes) {
    egress[egressType] = this.toDefaultUnit(
        this.cloudStorage.egress[egressType].value,
        this.cloudStorage.egress[egressType].unit,
        this.DEFAULT_UNITS.storageEgress);
  }
  let storageFreeQuota = 0;
  let restoreSizeCost = 0;
  let gcsClassAopsFreeQuota = 0;
  let gcsClassBopsFreeQuota = 0;
  let multiRegionalStorageCost = 0;
  let gcsClassAopsCost = 0;
  let gcsClassBopsCost = 0;
  let egressCost = 0;
  let totalPrice = 0;

  if (storageClass == 'standard' && addFreeTier &&
      location.indexOf('us-') != -1) {
    storageFreeQuota = 5;
    gcsClassAopsFreeQuota = 5;
    gcsClassBopsFreeQuota = 5;
  }

  if (this.isPositiveNumber_(multiRegionalStorage)) {
    multiRegionalStorageCost = this.CloudCalculator.calculateItemPrice(
        sku, multiRegionalStorage, location, storageFreeQuota);
  }

  if (this.isPositiveNumber_(restoreSize) && storageClass != 'standard') {
    restoreSizeCost = this.CloudCalculator.calculateItemPrice(
        `${sku}-RESTORE-SIZE`, restoreSize, location);
  }

  if (this.isPositiveNumber_(gcsClassAops)) {
    gcsClassAopsCost = this.CloudCalculator.calculateItemPrice(
        `${sku}-CLASS-A-REQUEST`, gcsClassAops * 100, location,
        gcsClassAopsFreeQuota);
  }

  if (this.isPositiveNumber_(gcsClassBops)) {
    gcsClassBopsCost = this.CloudCalculator.calculateItemPrice(
        `${sku}-CLASS-B-REQUEST`, gcsClassBops * 100, location,
        gcsClassBopsFreeQuota);
  }

  for (const [egressType, egressValue] of Object.entries(egress)) {
    if (this.isPositiveNumber_(egressValue)) {
      let egressFreeQuota = 0;
      if (storageClass == 'standard' && addFreeTier &&
          egressType != 'AUSTRALIA' && egressType != 'CHINA') {
        egressFreeQuota = 1;
      }

      egressCost += this.CloudCalculator.calculateItemPrice(
          `CP-STORAGE-EGRESS-${egressType}`, egressValue, egressLocation,
          egressFreeQuota);
    }
  }

  totalPrice = multiRegionalStorageCost + gcsClassAopsCost + gcsClassBopsCost +
      egressCost + restoreSizeCost;

  /** @type {!cloudpricingcalculator.SkuData} */
  const storageItem = {
    quantityLabel: 'GiB',
    region: location,
    displayName: `1x ${this.storageClass[storageClass]}`,
    sku: sku,
    quantity: multiRegionalStorage,
    displayDescription: this.storageClass[storageClass],
    uniqueId: null,
    price: totalPrice,
    items: {
      storageClass: storageClass,
      multiRegionalStorage: multiRegionalStorage,
      restoreSize: restoreSize,
      gcsClassAops: gcsClassAops,
      gcsClassBops: gcsClassBops,
      egressTypes: egressTypes,
      egress: egress,
      editHook: {
        initialInputs: goog.object.clone(this.cloudStorage),
        product: 'cloudStorage',
        tab: 'storage'
      }
    }
  };
  this.CloudCalculator.addItemToCart(storageItem, totalPrice);

  // Clear the data model
  this.setupCloudStorageData();
  this.resetForm(cloudStorageForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Persistent Disk Data.
 * @export
 */
ListingCtrl.prototype.setupPersistentDiskData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    location: string,
   *    ssdStorage: ?cloudpricingcalculator.DataWithUnit,
   *    ssdStorageRegional: ?cloudpricingcalculator.DataWithUnit,
   *    zonalBalancedPd: ?cloudpricingcalculator.DataWithUnit,
   *    regionalBalancedPd: ?cloudpricingcalculator.DataWithUnit,
   *    storage: ?cloudpricingcalculator.DataWithUnit,
   *    storageRegional: ?cloudpricingcalculator.DataWithUnit,
   *    snapshotStorage: ?cloudpricingcalculator.DataWithUnit,
   *    snapshotStorageMultiRegional: ?cloudpricingcalculator.DataWithUnit,
   *    extremePd: ?cloudpricingcalculator.DataWithUnit,
   *    addFreeTier: boolean,
   *    readonly: boolean
   * }}
   */
  this.persistentDisk = {
    submitted: false,
    location: this.retrieveLocation(),
    ssdStorage: {value: '', unit: this.DEFAULT_UNITS.ssdStorage},
    ssdStorageRegional: {value: '', unit: this.DEFAULT_UNITS.ssdStorage},
    zonalBalancedPd: {value: '', unit: this.DEFAULT_UNITS.ssdStorage},
    regionalBalancedPd: {value: '', unit: this.DEFAULT_UNITS.ssdStorage},
    storage: {value: '', unit: this.DEFAULT_UNITS.pdStorage},
    storageRegional: {value: '', unit: this.DEFAULT_UNITS.pdStorage},
    extremePd: {value: '', unit: this.DEFAULT_UNITS.pdStorage},
    extremePdIopsCount: null,
    snapshotStorage: {value: '', unit: this.DEFAULT_UNITS.snapshotStorage},
    snapshotStorageMultiRegional:
        {value: '', unit: this.DEFAULT_UNITS.snapshotStorage},
    readonly: false,
    addFreeTier: false
  };
};


/**
 * Convertes user provided units to default.
 * @param {?number} size of user input
 * @param {number} unit choosed by user
 * @param {number} defUnit default unit
 * @return {number} normalized units
 * @export
 */
ListingCtrl.prototype.toDefaultUnit = function(size, unit, defUnit) {
  /** @type {number} */
  var value = size || 0;
  return value * Math.pow(1024, unit - defUnit);
};


/**
 * Convertes user provided units to ones.
 * @param {?number} value value of user input
 * @param {number} unit choosed by user
 * @return {number} user input in ones.
 * @private
 */
ListingCtrl.prototype.toDefaultNumber_ = function(value, unit) {
  /** @type {number} */
  var value = value || 0;
  return value * Math.pow(10, unit);
};


/**
 * Adds Peristent Disk to Cart
 *
 * @param {angular.Form=} persistentDiskForm
 * @export
 */
ListingCtrl.prototype.addPersistentDisk = function(persistentDiskForm) {
  if (persistentDiskForm ? this.isFormEmpty(persistentDiskForm) :
                           this.isObjectEmpty(this.persistentDisk)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddPersistentDisk');

  /** @type {number} */
  const pdSsdStorage = this.toDefaultUnit(
      this.persistentDisk.ssdStorage.value, this.persistentDisk.ssdStorage.unit,
      this.DEFAULT_UNITS.ssdStorage);
  const pdStorage = this.toDefaultUnit(
      this.persistentDisk.storage.value, this.persistentDisk.storage.unit,
      this.DEFAULT_UNITS.pdStorage);
  const pdSsdStorageRegional = this.toDefaultUnit(
      this.persistentDisk.ssdStorageRegional.value,
      this.persistentDisk.ssdStorageRegional.unit,
      this.DEFAULT_UNITS.ssdStorage);
  const pdZonalBalancedPd = this.toDefaultUnit(
      this.persistentDisk.zonalBalancedPd.value,
      this.persistentDisk.zonalBalancedPd.unit, this.DEFAULT_UNITS.ssdStorage);
  const pdRegionalBalancedPd = this.toDefaultUnit(
      this.persistentDisk.regionalBalancedPd.value,
      this.persistentDisk.regionalBalancedPd.unit,
      this.DEFAULT_UNITS.ssdStorage);
  const pdStorageRegional = this.toDefaultUnit(
      this.persistentDisk.storageRegional.value,
      this.persistentDisk.storageRegional.unit, this.DEFAULT_UNITS.pdStorage);
  const extremePd = this.toDefaultUnit(
      this.persistentDisk.extremePd.value, this.persistentDisk.extremePd.unit,
      this.DEFAULT_UNITS.pdStorage);
  const extremePdIopsCount = this.persistentDisk.extremePdIopsCount;
  const pdSnapshotStorage = this.toDefaultUnit(
      this.persistentDisk.snapshotStorage.value,
      this.persistentDisk.snapshotStorage.unit,
      this.DEFAULT_UNITS.snapshotStorage);
  const pdSnapshotStorageMultiRegional = this.toDefaultUnit(
      this.persistentDisk.snapshotStorageMultiRegional.value,
      this.persistentDisk.snapshotStorageMultiRegional.unit,
      this.DEFAULT_UNITS.snapshotStorage);
  const location = this.persistentDisk.location;
  let pdItem = null;

  const tab = persistentDiskForm &&
          persistentDiskForm.$name == 'GkePersistentDiskForm' ?
      'gke-standard' :
      'compute-engine';

  let dependedQuotaPD = 0;
  let dependedQuotaSS = 0;
  if (this.persistentDisk.addFreeTier && location.indexOf('us-') != -1) {
    dependedQuotaPD = 30;
    dependedQuotaSS = 5;
  }

  // For accompanying read-only PDs
  if (this.persistentDisk.readonly) {
    const accompaniedProduct = this.persistentDisk.accompaniedProduct;
    const bootDiskSize = this.persistentDisk.bootDiskSize;
    const bootDiskType = this.persistentDisk.bootDiskType;
    const quantity = this.persistentDisk.quantity;
    let pdStorageCost = 0;
    let pdStorageRegionalCost = 0;
    let pdSsdStorageCost = 0;
    let pdSsdStorageRegionalCost = 0;
    let pdZonalBalancedPdCost = 0;
    let pdRegionalBalancedPdCost = 0;
    let extremePdCost = 0;
    let extremePdIopsCountCost = 0;
    let pdSnapshotStorageCost = 0;
    let pdSnapshotStorageMultiRegionalCost = 0;
    let totalPrice = 0;
    let displayName = '1x';

    if (this.isPositiveNumber_(pdStorage)) {
      pdStorageCost = this.CloudCalculator.calculateItemPrice(
          'CP-COMPUTEENGINE-STORAGE-PD-CAPACITY', pdStorage, location);
    }

    if (this.isPositiveNumber_(pdStorageRegional)) {
      pdStorageRegionalCost = this.CloudCalculator.calculateItemPrice(
          'CP-COMPUTEENGINE-STORAGE-PD-CAPACITY-REGIONAL', pdStorageRegional,
          location);
    }

    if (this.isPositiveNumber_(pdSsdStorage)) {
      pdSsdStorageCost = this.CloudCalculator.calculateItemPrice(
          'CP-COMPUTEENGINE-STORAGE-PD-SSD', pdSsdStorage, location);
    }

    if (this.isPositiveNumber_(pdSsdStorageRegional)) {
      pdSsdStorageRegionalCost = this.CloudCalculator.calculateItemPrice(
          'CP-COMPUTEENGINE-STORAGE-PD-SSD-REGIONAL', pdSsdStorageRegional,
          location);
    }

    if (this.isPositiveNumber_(pdZonalBalancedPd)) {
      pdZonalBalancedPdCost = this.CloudCalculator.calculateItemPrice(
          'CP-COMPUTEENGINE-ZONAL-BALANCED-PD', pdZonalBalancedPd, location);
    }

    if (this.isPositiveNumber_(pdRegionalBalancedPd)) {
      pdRegionalBalancedPdCost = this.CloudCalculator.calculateItemPrice(
          'CP-COMPUTEENGINE-REGIONAL-BALANCED-PD', pdRegionalBalancedPd,
          location);
    }

    if (this.isPositiveNumber_(extremePd)) {
      extremePdCost = this.CloudCalculator.calculateItemPrice(
          'CP-COMPUTEENGINE-STORAGE-PD-EXTREME', extremePd, location);
    }

    if (this.isPositiveNumber_(extremePdIopsCount)) {
      extremePdIopsCountCost = this.CloudCalculator.calculateItemPrice(
          'CP-COMPUTEENGINE-STORAGE-PD-EXTREME-IOPS', extremePdIopsCount,
          location);
    }

    if (this.isPositiveNumber_(pdSnapshotStorage)) {
      pdSnapshotStorageCost = this.CloudCalculator.calculateItemPrice(
          'CP-COMPUTEENGINE-STORAGE-PD-SNAPSHOT', pdSnapshotStorage, location);
    }

    if (this.isPositiveNumber_(pdSnapshotStorageMultiRegional)) {
      pdSnapshotStorageMultiRegionalCost =
          this.CloudCalculator.calculateItemPrice(
              'CP-COMPUTEENGINE-STORAGE-PD-SNAPSHOT-MULTI-REGIONAL',
              pdSnapshotStorageMultiRegional, location);
    }

    totalPrice = pdStorageCost + pdStorageRegionalCost + pdSsdStorageCost +
        pdSsdStorageRegionalCost + pdZonalBalancedPdCost +
        pdRegionalBalancedPdCost + extremePdCost + extremePdIopsCountCost +
        pdSnapshotStorageCost + pdSnapshotStorageMultiRegionalCost;

    if (quantity > 0) {
      totalPrice *= quantity;
      displayName = `${quantity} x boot disk`;
    }

    pdItem = {
      sku: 'CP-COMPUTEENGINE-STORAGE-PD-READONLY',
      quantity: bootDiskSize,
      quantityLabel: 'GiB',
      region: location,
      displayName: displayName,
      displayDescription: accompaniedProduct ?
          `Persistent Disk - ${accompaniedProduct}` :
          'Persistent Disk',
      uniqueId: null,
      price: totalPrice,
      items: {
        bootDiskType,
        pdStorage,
        pdStorageRegional,
        pdSsdStorage,
        pdSsdStorageRegional,
        pdZonalBalancedPd,
        pdRegionalBalancedPd,
        extremePd,
        extremePdIopsCount,
        pdSnapshotStorage,
        pdSnapshotStorageMultiRegional,
        pdStorageCost,
        pdStorageRegionalCost,
        pdSsdStorageCost,
        pdSsdStorageRegionalCost,
        pdZonalBalancedPdCost,
        pdRegionalBalancedPdCost,
        extremePdCost,
        extremePdIopsCountCost,
        pdSnapshotStorageCost,
        pdSnapshotStorageMultiRegionalCost,
        accompaniedProduct,
        quantity,
        editHook: {
          initialInputs: goog.object.clone(this.persistentDisk),
          product: 'persistentDisk',
          tab: tab
        }
      }
    };
    this.CloudCalculator.addItemToCart(pdItem, totalPrice);
  } else {
    if (this.isPositiveNumber_(pdSsdStorage)) {
      pdItem = {
        sku: 'CP-COMPUTEENGINE-STORAGE-PD-SSD',
        quantity: pdSsdStorage,
        quantityLabel: 'GiB',
        region: location,
        displayName: 'SSD Persistent disk',
        displayDescription: 'SSD Storage',
        items: {
          editHook: {
            initialInputs: goog.object.clone(this.persistentDisk),
            product: 'persistentDisk',
            tab: tab
          }
        }
      };
      this.CloudCalculator.addItemToCart(pdItem);
    }

    if (this.isPositiveNumber_(pdStorage)) {
      pdItem = {
        sku: 'CP-COMPUTEENGINE-STORAGE-PD-CAPACITY',
        quantity: pdStorage,
        quantityLabel: 'GiB',
        region: location,
        displayName: 'Persistent disk',
        displayDescription: 'Persistent Disk',
        items: {
          dependedQuota: dependedQuotaPD,
          editHook: {
            initialInputs: goog.object.clone(this.persistentDisk),
            product: 'persistentDisk',
            tab: tab
          }
        }
      };
      this.CloudCalculator.addItemToCart(pdItem);
    }

    if (this.isPositiveNumber_(pdSsdStorageRegional)) {
      pdItem = {
        sku: 'CP-COMPUTEENGINE-STORAGE-PD-SSD-REGIONAL',
        quantity: pdSsdStorageRegional,
        quantityLabel: 'GiB',
        region: location,
        displayName: 'SSD Persistent disk Regional',
        displayDescription: 'SSD Storage',
        items: {
          editHook: {
            initialInputs: goog.object.clone(this.persistentDisk),
            product: 'persistentDisk',
            tab: tab
          }
        }
      };
      this.CloudCalculator.addItemToCart(pdItem);
    }

    if (this.isPositiveNumber_(pdZonalBalancedPd)) {
      pdItem = {
        sku: 'CP-COMPUTEENGINE-ZONAL-BALANCED-PD',
        quantity: pdZonalBalancedPd,
        quantityLabel: 'GiB',
        region: location,
        displayName: 'Zonal balanced PD',
        displayDescription: 'Zonal PD',
        uniqueId: null,
        price: null,
        items: {
          editHook: {
            initialInputs: goog.object.clone(this.persistentDisk),
            product: 'persistentDisk',
            tab: tab
          }
        }
      };
      this.CloudCalculator.addItemToCart(pdItem);
    }

    if (this.isPositiveNumber_(pdRegionalBalancedPd)) {
      pdItem = {
        sku: 'CP-COMPUTEENGINE-REGIONAL-BALANCED-PD',
        quantity: pdRegionalBalancedPd,
        quantityLabel: 'GiB',
        region: location,
        displayName: 'Regional balanced PD',
        displayDescription: 'Regional PD',
        uniqueId: null,
        price: null,
        items: {
          editHook: {
            initialInputs: goog.object.clone(this.persistentDisk),
            product: 'persistentDisk',
            tab: tab
          }
        }
      };
      this.CloudCalculator.addItemToCart(pdItem);
    }

    if (this.isPositiveNumber_(pdStorageRegional)) {
      pdItem = {
        sku: 'CP-COMPUTEENGINE-STORAGE-PD-CAPACITY-REGIONAL',
        quantity: pdStorageRegional,
        quantityLabel: 'GiB',
        region: location,
        displayName: 'Persistent disk Regional',
        displayDescription: 'Persistent Disk',
        items: {
          editHook: {
            initialInputs: goog.object.clone(this.persistentDisk),
            product: 'persistentDisk',
            tab: tab
          }
        }
      };
      this.CloudCalculator.addItemToCart(pdItem);
    }

    if (this.isPositiveNumber_(extremePd)) {
      pdItem = {
        sku: 'CP-COMPUTEENGINE-STORAGE-PD-EXTREME',
        quantity: extremePd,
        quantityLabel: 'GiB',
        region: location,
        displayName: 'Persistent Disk Extreme provisioned space',
        displayDescription: 'Persistent Disk',
        items: {
          editHook: {
            initialInputs: goog.object.clone(this.persistentDisk),
            product: 'persistentDisk',
            tab: tab
          }
        }
      };
      this.CloudCalculator.addItemToCart(pdItem);
    }

    if (this.isPositiveNumber_(extremePdIopsCount)) {
      pdItem = {
        sku: 'CP-COMPUTEENGINE-STORAGE-PD-EXTREME-IOPS',
        quantity: extremePdIopsCount,
        quantityLabel: '',
        region: location,
        displayName: 'Persistent Disk Extreme IOPS',
        displayDescription: 'Persistent Disk',
        items: {
          editHook: {
            initialInputs: goog.object.clone(this.persistentDisk),
            product: 'persistentDisk',
            tab: tab
          }
        }
      };
      this.CloudCalculator.addItemToCart(pdItem);
    }

    if (this.isPositiveNumber_(pdSnapshotStorage)) {
      pdItem = {
        sku: 'CP-COMPUTEENGINE-STORAGE-PD-SNAPSHOT',
        quantity: pdSnapshotStorage,
        quantityLabel: 'GiB',
        region: location,
        displayName: 'Persistent disk',
        displayDescription: 'Snapshot storage',
        items: {
          dependedQuota: dependedQuotaSS,
          editHook: {
            initialInputs: goog.object.clone(this.persistentDisk),
            product: 'persistentDisk',
            tab: tab
          }
        }
      };
      this.CloudCalculator.addItemToCart(pdItem);
    }

    if (this.isPositiveNumber_(pdSnapshotStorageMultiRegional)) {
      pdItem = {
        sku: 'CP-COMPUTEENGINE-STORAGE-PD-SNAPSHOT-MULTI-REGIONAL',
        quantity: pdSnapshotStorageMultiRegional,
        quantityLabel: 'GiB',
        region: location,
        displayName: 'Persistent disk',
        displayDescription: 'Multi-regional snapshot storage',
        items: {
          dependedQuota: dependedQuotaSS,
          editHook: {
            initialInputs: goog.object.clone(this.persistentDisk),
            product: 'persistentDisk',
            tab: tab
          }
        }
      };
      this.CloudCalculator.addItemToCart(pdItem);
    }
  }

  this.setupPersistentDiskData();
  persistentDiskForm && this.resetForm(persistentDiskForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up load balancing and network services load balancer data.
 * @export
 */
ListingCtrl.prototype.setupLoadBalancerData = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    location: {string},
   *    forwardingRules: {number},
   *    ingress: {cloudpricingcalculator.DataWithUnit}
   * }}
   */
  this.loadBalancer = {
    submitted: false,
    location: this.retrieveLocation(),
    forwardingRules: '',
    ingress: {value: '', unit: this.DEFAULT_UNITS.lbIngress}
  };
};


/**
 * Adds load balancing and network services load balancer to cart.
 *
 * @param {!angular.Form} loadBalancerForm
 * @export
 */
ListingCtrl.prototype.addLoadBalancer = function(loadBalancerForm) {
  if (!loadBalancerForm.$valid && !this.loadBalancer.forwardingRules > 0) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddLoadBalancer');

  /** @type {number} */
  var lbForwardingRules = parseInt(this.loadBalancer.forwardingRules);
  var lbIngress = this.toDefaultUnit(
      this.loadBalancer.ingress.value, this.loadBalancer.ingress.unit,
      this.DEFAULT_UNITS.lbIngress);
  /** @type {string} */
  var location = this.loadBalancer.location;
  /** @const {string} */
  var EXTRA_RULE = 'FORWARDING_RULE_CHARGE_EXTRA';
  var BASE_RULE = 'FORWARDING_RULE_CHARGE_BASE';
  var INGRESS_RULE = 'NETWORK_LOAD_BALANCED_INGRESS';
  /** @type {!cloudpricingcalculator.SkuData} */
  var lbItem = null;

  // Current billing includes 5 rules; Anything above is additional
  if (lbForwardingRules > 5) {
    var balance = lbForwardingRules - 5;
    lbItem = {
      quantityLabel: '',
      region: location,
      displayName: 'Forwarding rules',
      displayDescription: 'Forwarding rules',
      sku: EXTRA_RULE.toUpperCase(),
      quantity: balance,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.loadBalancer),
          product: 'loadBalancer',
          tab: 'compute-engine'
        }
      }
    };
    this.CloudCalculator.addItemToCart(lbItem);

    lbForwardingRules = 5;
  }

  if (this.isPositiveNumber_(lbForwardingRules)) {
    lbItem = {
      quantityLabel: '',
      region: location,
      displayName: 'Forwarding rules',
      displayDescription: 'Forwarding rules',
      sku: BASE_RULE.toUpperCase(),
      quantity: lbForwardingRules,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.loadBalancer),
          product: 'loadBalancer',
          tab: 'compute-engine'
        }
      }
    };
    this.CloudCalculator.addItemToCart(lbItem);
  }

  if (this.isPositiveNumber_(lbIngress)) {
    lbItem = {
      quantityLabel: 'GiB',
      region: location,
      displayName: 'Load Balancer ingress',
      displayDescription: 'Ingress',
      sku: INGRESS_RULE.toUpperCase(),
      quantity: lbIngress,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.loadBalancer),
          product: 'loadBalancer',
          tab: 'lb-network-services'
        }
      }
    };
    this.CloudCalculator.addItemToCart(lbItem);
  }

  this.setupLoadBalancerData();
  this.resetForm(loadBalancerForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up load balancing and network services Cloud NAT data.
 * @export
 */
ListingCtrl.prototype.setupLbnsCloudNatData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    cloudNatGateways: ?number,
   *    trafficProcessed: !cloudpricingcalculator.DataWithUnit
   * }}
   */
  this.lbnsCloudNat = {
    submitted: false,
    cloudNatGateways: null,
    trafficProcessed: {value: null, unit: this.DEFAULT_UNITS.lbIngress}
  };
};


/**
 * Adds load balancing and network services cloud NAT to cart.
 *
 * @param {!angular.Form} lbnsCloudNatForm
 * @export
 */
ListingCtrl.prototype.addLbnsCloudNat = function(lbnsCloudNatForm) {
  if (!lbnsCloudNatForm.$valid && !(this.lbnsCloudNat.cloudNatGateways > 0)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddLbnsCloudNat');

  let location = 'us';
  let lbCloudGateways = Number(this.lbnsCloudNat.cloudNatGateways);
  let lbTrafficProcessed = this.toDefaultUnit(
      this.lbnsCloudNat.trafficProcessed.value,
      this.lbnsCloudNat.trafficProcessed.unit,
      this.DEFAULT_UNITS.natTrafficProcessed);
  let cloudGatewayLowVmNumbersku =
      'CP-NETWORK-SERVICES-CLOUD-NAT-GATEWAY-UPTIME-LOW-VM-NUMBER';
  let cloudGatewayHighVmNumbersku =
      'CP-NETWORK-SERVICES-CLOUD-NAT-GATEWAY-UPTIME-HIGH-VM-NUMBER';
  let trafficProcessedPrice = this.CloudCalculator.calculateItemPrice(
      'CP-NETWORK-SERVICES-CLOUD-NAT-TRAFFIC', lbTrafficProcessed, location);

  let totalPrice = 0;
  let instancePrice = 0;

  if (lbCloudGateways <= 32) {
    instancePrice = this.CloudCalculator.calculateItemPrice(
                        cloudGatewayLowVmNumbersku, lbCloudGateways, location) *
        this.TOTAL_BILLING_HOURS;
  } else {
    instancePrice =
        (this.CloudCalculator.calculateItemPrice(
             cloudGatewayHighVmNumbersku, lbCloudGateways, location) /
         lbCloudGateways) *
        this.TOTAL_BILLING_HOURS;
  }

  totalPrice = instancePrice + trafficProcessedPrice;

  if (this.isPositiveNumber_(lbCloudGateways || lbTrafficProcessed)) {
    /** @type {!cloudpricingcalculator.SkuData} */
    const cloudNat = {
      quantityLabel: '',
      region: location,
      displayName: 'Cloud NAT',
      displayDescription: 'Number of gateways',
      sku: 'CP-NETWORK-SERVICES-CLOUD-NAT',
      quantity: lbCloudGateways,
      uniqueId: null,
      price: null,
      items: {
        trafficProcessed: lbTrafficProcessed,
        editHook: {
          initialInputs: goog.object.clone(this.lbnsCloudNat),
          product: 'lbnsCloudNAT',
          tab: 'lb-network-services'
        }
      }
    };
    this.CloudCalculator.addItemToCart(cloudNat, totalPrice);
  }

  this.setupLbnsCloudNatData();
  this.resetForm(lbnsCloudNatForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up load balancing and network services Cloud Armor data.
 * @export
 */
ListingCtrl.prototype.setupLbnsCloudArmorData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    policies: ?number,
   *    rules: ?number,
   *    commitmentType: string,
   *    protectedResources: ?number,
   *    egressCount: ?number,
   *    egressType: string,
   *    incomingRequests: !cloudpricingcalculator.DataWithUnit
   * }}
   */
  this.lbnsCloudArmor = {
    submitted: false,
    policies: null,
    rules: null,
    commitmentType: 'STANDARD',
    protectedResources: null,
    egressCount: null,
    egressType: 'LOAD-BALANCER',
    incomingRequests: {value: null, unit: 3},
  };
};

/**
 * Adds load balancing and network services Cloud Armor to cart.
 *
 * @param {!angular.Form} lbnsCloudArmorForm
 * @export
 */
ListingCtrl.prototype.addLbnsCloudArmor = function(lbnsCloudArmorForm) {
  if (!this.isLbnsCloudArmorFormValid(lbnsCloudArmorForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddLbnsCloudArmor');

  const requests = this.toDefaultNumber_(
    Number(this.lbnsCloudArmor.incomingRequests.value),
    this.lbnsCloudArmor.incomingRequests.unit);
  const location = 'us';
  const commitmentType = this.lbnsCloudArmor.commitmentType;
  const commitmentTypeLabel = this.armorCommitmentTypes[commitmentType];

  if (commitmentType == 'PLUS') {
    const protectedResources = this.lbnsCloudArmor.protectedResources;
    const egressCount = this.lbnsCloudArmor.egressCount || 0;
    const egressType = this.lbnsCloudArmor.egressType;
    const egressTypeLabel = this.armorEgressTypes[egressType];
    const subscriptionCost = this.CloudCalculator.calculateItemPrice(
      'CP-NETWORK-SERVICES-CLOUD-ARMOR-SUBSCRIPTION', 1, location);
    const protectedResourcesCost = this.CloudCalculator.calculateItemPrice(
      'CP-NETWORK-SERVICES-CLOUD-ARMOR-PROTECTED-RESOURCES', protectedResources,
      location);
    let egressCost = 0;
    if (this.isPositiveNumber_(egressCount)) {
      egressCost = this.CloudCalculator.calculateItemPrice(
        `CP-NETWORK-SERVICES-CLOUD-ARMOR-PROCESSING-${egressType.toUpperCase()}`,
        egressCount, location);
    }

    const totalPrice = subscriptionCost + protectedResourcesCost + egressCost;

    /** @type {!cloudpricingcalculator.SkuData} */
    const cloudArmor = {
      quantityLabel: 'Protected resources',
      quantity: Number(protectedResources),
      region: location,
      displayName: 'Cloud Armor',
      displayDescription: 'Cloud Armor',
      sku: 'CP-NETWORK-SERVICES-CLOUD-ARMOR-SUBSCRIPTION',
      uniqueId: null,
      price: null,
      items: {
        commitmentType,
        commitmentTypeLabel,
        protectedResources,
        egressCount,
        egressType,
        egressTypeLabel,
        subscriptionCost,
        protectedResourcesCost,
        egressCost,
        incomingRequests: requests,
        editHook: {
          initialInputs: goog.object.clone(this.lbnsCloudArmor),
          product: 'lbnsCloudArmor',
          tab: 'lb-network-services'
        }
      }
    };
    this.CloudCalculator.addItemToCart(cloudArmor, totalPrice);
  }
  else {
    /** @type {number} */
    const policiesVal = Number(this.lbnsCloudArmor.policies);
    const rulesVal = Number(this.lbnsCloudArmor.rules);
    const valueInMillions = requests;
    // converted total number of requests measured per million
    const requestsPerMillion = requests / 1000000;

    const armorPolicyPrice = this.CloudCalculator.calculateItemPrice(
        'CP-NETWORK-SERVICES-CLOUD-ARMOR-POLICY', policiesVal, location);
    const armorRulePrice = this.CloudCalculator.calculateItemPrice(
        'CP-NETWORK-SERVICES-CLOUD-ARMOR-RULE', rulesVal, location);
    const armorRequestsPrice = this.CloudCalculator.calculateItemPrice(
        'CP-NETWORK-SERVICES-CLOUD-ARMOR-REQUESTS', requestsPerMillion, location);
    const totalPrice = armorPolicyPrice + armorRulePrice + armorRequestsPrice;

    if (this.isPositiveNumber_(policiesVal || rulesVal || requests)) {
      /** @type {!cloudpricingcalculator.SkuData} */
      const cloudArmor = {
        quantityLabel: '',
        quantity: 0,
        region: location,
        displayName: 'Cloud Armor',
        displayDescription: 'Cloud Armor',
        sku: 'CP-NETWORK-SERVICES-CLOUD-ARMOR',
        uniqueId: null,
        price: null,
        items: {
          commitmentType,
          commitmentTypeLabel,
          armorPolicyPrice,
          armorRulePrice,
          armorRequestsPrice,
          incomingRequests: requests,
          valueInMillions: valueInMillions,
          editHook: {
            initialInputs: goog.object.clone(this.lbnsCloudArmor),
            product: 'lbnsCloudArmor',
            tab: 'lb-network-services'
          }
        }
      };
      this.CloudCalculator.addItemToCart(cloudArmor, totalPrice);
    }
  }
  this.setupLbnsCloudArmorData();
  this.resetForm(lbnsCloudArmorForm);
  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Validate Cloud Armor form.
 * @param {!angular.Form} lbnsCloudArmorForm
 * @return {boolean}
 * @export
 */
ListingCtrl.prototype.isLbnsCloudArmorFormValid = function(lbnsCloudArmorForm) {
  if (this.lbnsCloudArmor.commitmentType == 'PLUS') {
    return lbnsCloudArmorForm.protectedResources.$viewValue != null &&
           lbnsCloudArmorForm.protectedResources.$viewValue != '' &&
           lbnsCloudArmorForm.$valid;
  }
  else {
    return ((lbnsCloudArmorForm.policies.$viewValue != null &&
            lbnsCloudArmorForm.policies.$viewValue != '') ||
            (lbnsCloudArmorForm.rules.$viewValue != null &&
            lbnsCloudArmorForm.rules.$viewValue != '') ||
            (lbnsCloudArmorForm.incomingRequests.$viewValue != null &&
            lbnsCloudArmorForm.incomingRequests.$viewValue != '')) &&
           lbnsCloudArmorForm.$valid;
  }
};

/**
 * Sets up load balancing and network services IP Addresses data.
 * @export
 */
ListingCtrl.prototype.setupLbnsIpAddressData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    unusedIps: ?number,
   *    standardVmIps:?number,
   *    preemptibleVmIps: ?number,
   *    forwardingRulesIps: ?number
   * }}
   */
  this.lbnsIpAddresses = {
    submitted: false,
    location: this.retrieveLocation(),
    unusedIps: null,
    standardVmIps: null,
    preemptibleVmIps: null,
    forwardingRulesIps: null
  };
};


/**
 * Adds load balancing and network services IP addresses to cart.
 *
 * @param {!angular.Form} lbnsIpAddressForm
 * @export
 */
ListingCtrl.prototype.addLbnsIpAddress = function(lbnsIpAddressForm) {
  if (!lbnsIpAddressForm.$valid && !(this.lbnsIpAddresses.unusedIps > 0)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddLbnsIpAddress');
  const location = this.lbnsIpAddresses.location;
  let lbnsUnusedIps = Number(this.lbnsIpAddresses.unusedIps);
  lbnsUnusedIps = lbnsUnusedIps * this.TOTAL_BILLING_HOURS;
  let standardVmIps =
      Number(this.lbnsIpAddresses.standardVmIps) * this.TOTAL_BILLING_HOURS;
  let preemptibleVmIps =
      Number(this.lbnsIpAddresses.preemptibleVmIps) * this.TOTAL_BILLING_HOURS;
  let forwardingRulesIps = Number(this.lbnsIpAddresses.forwardingRulesIps);
  /** @type {!cloudpricingcalculator.SkuData} */
  let ipAddressItem;

  if (this.isPositiveNumber_(lbnsUnusedIps)) {
    ipAddressItem = {
      quantityLabel: '',
      sku: 'CP-NETWORK-SERVICES-IP-ADDRESSES',
      region: location,
      quantity: lbnsUnusedIps,
      displayName: 'Unused static IP addresses',
      displayDescription: 'Assigned but not used IPs',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.lbnsIpAddresses),
          product: 'lbnsIpAddresses',
          tab: 'lb-network-services'
        }
      }
    };
    this.CloudCalculator.addItemToCart(ipAddressItem);
  }
  if (this.isPositiveNumber_(standardVmIps)) {
    ipAddressItem = {
      quantityLabel: '',
      sku: 'CP-NETWORK-SERVICES-STANNDARD-VM-IP-ADDRESSES',
      region: location,
      quantity: standardVmIps,
      displayName: 'Used on standard VM instances IP addresses',
      displayDescription: 'Assigned and used in standard VM IPs',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.lbnsIpAddresses),
          product: 'lbnsIpAddresses',
          tab: 'lb-network-services'
        }
      }
    };
    this.CloudCalculator.addItemToCart(ipAddressItem);
  }
  if (this.isPositiveNumber_(preemptibleVmIps)) {
    ipAddressItem = {
      quantityLabel: '',
      sku: 'CP-NETWORK-SERVICES-PREEMPTIBLE-VM-IP-ADDRESSES',
      region: location,
      quantity: preemptibleVmIps,
      displayName: 'Used on preemptible VM instances IP addresses',
      displayDescription: 'Assigned and used in  preemptible VM IPs',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.lbnsIpAddresses),
          product: 'lbnsIpAddresses',
          tab: 'lb-network-services'
        }
      }
    };
    this.CloudCalculator.addItemToCart(ipAddressItem);
  }
  if (this.isPositiveNumber_(forwardingRulesIps)) {
    ipAddressItem = {
      quantityLabel: '',
      sku: 'CP-NETWORK-SERVICES-FORWARDING-RULES-IP-ADDRESSES',
      region: location,
      quantity: forwardingRulesIps,
      displayName: 'Attached to forwarding rules IP addresses',
      displayDescription: 'Assigned and used in  forwarding rules IPs',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.lbnsIpAddresses),
          product: 'lbnsIpAddresses',
          tab: 'lb-network-services'
        }
      }
    };
    this.CloudCalculator.addItemToCart(ipAddressItem);
  }

  this.setupLbnsIpAddressData();
  this.resetForm(lbnsIpAddressForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Setup Network Telemetry (VPC flow logs) Data
 * @export
 */
ListingCtrl.prototype.setupNetworkTelemetryData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    logsVolume: !cloudpricingcalculator.DataWithUnit
   * }}
   */
  this.vpcLogs = {
    submitted: false,
    logsVolume: {value: null, unit: this.DEFAULT_UNITS.vpcLogsVolume}
  };
};


/**
 * Adds Network Telemetry (VPC flow logs) to Cart.
 *
 * @param {!angular.Form} networkTelemetryForm
 * @export
 */
ListingCtrl.prototype.addVpcLogs = function(networkTelemetryForm) {
  if (networkTelemetryForm.logsVolume.$viewValue == '' &&
      !networkTelemetryForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddVpcLogs');
  /** @type {number} */
  var logsVolume = this.toDefaultUnit(
      this.vpcLogs.logsVolume.value, this.vpcLogs.logsVolume.unit,
      this.DEFAULT_UNITS.vpcLogsVolume);

  if (this.isPositiveNumber_(logsVolume)) {
    /** @type {!cloudpricingcalculator.SkuData} */
    const vpcLogsItem = {
      quantityLabel: 'GiB',
      region: 'us',
      displayName: 'VPC flow logs',
      sku: 'CP-VPC-FLOW-LOGS-SIZE',
      quantity: logsVolume,
      displayDescription: 'Logs volume',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.vpcLogs),
          product: 'vpcLogs',
          tab: 'lb-network-services'
        }
      }
    };
    this.CloudCalculator.addItemToCart(vpcLogsItem);
  }

  // Clear the data model
  this.setupNetworkTelemetryData();
  this.resetForm(networkTelemetryForm);

  // Scroll to the cart
  this.scrollToCart();
};



/**
 * Setup internet egress data.
 * @export
 */
ListingCtrl.prototype.setupInternetEgressData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    region: string,
   *    premiumNa: !cloudpricingcalculator.DataWithUnit,
   *    premiumEu: !cloudpricingcalculator.DataWithUnit,
   *    premiumApac: !cloudpricingcalculator.DataWithUnit,
   *    premiumWesternEurope: !cloudpricingcalculator.DataWithUnit,
   *    premiumSouthAmerica: !cloudpricingcalculator.DataWithUnit,
   *    premiumAmericas: !cloudpricingcalculator.DataWithUnit,
   *    premiumMiddleEast: !cloudpricingcalculator.DataWithUnit,
   *    premiumCentralAmerica: !cloudpricingcalculator.DataWithUnit,
   *    premiumEasternEurope: !cloudpricingcalculator.DataWithUnit,
   *    premiumEmea: !cloudpricingcalculator.DataWithUnit,
   *    premiumAfrica: !cloudpricingcalculator.DataWithUnit,
   *    premiumIndia: !cloudpricingcalculator.DataWithUnit,
   *    premiumChina: !cloudpricingcalculator.DataWithUnit,
   *    premiumAu: !cloudpricingcalculator.DataWithUnit,
   *    standardWorldwide: !cloudpricingcalculator.DataWithUnit,
   * }}
   */
  this.internetEgress = {
    submitted: false,
    region: this.retrieveLocation(),
    premiumApac: {value: null, unit: this.DEFAULT_UNITS.premiumApac},
    premiumWesternEurope:
        {value: null, unit: this.DEFAULT_UNITS.premiumWesternEurope},
    premiumSouthAmerica:
        {value: null, unit: this.DEFAULT_UNITS.premiumSouthAmerica},
    premiumAmericas: {value: null, unit: this.DEFAULT_UNITS.premiumAmericas},
    premiumMiddleEast:
        {value: null, unit: this.DEFAULT_UNITS.premiumMiddleEast},
    premiumCentralAmerica:
        {value: null, unit: this.DEFAULT_UNITS.premiumCentralAmerica},
    premiumEasternEurope:
        {value: null, unit: this.DEFAULT_UNITS.premiumEasternEurope},
    premiumEmea: {value: null, unit: this.DEFAULT_UNITS.premiumEmea},
    premiumAfrica: {value: null, unit: this.DEFAULT_UNITS.premiumAfrica},
    premiumIndia: {value: null, unit: this.DEFAULT_UNITS.premiumIndia},
    premiumChina: {value: null, unit: this.DEFAULT_UNITS.premiumChina},
    premiumAu: {value: null, unit: this.DEFAULT_UNITS.premiumAu},
    standardWorldwide:
        {value: null, unit: this.DEFAULT_UNITS.standardWorldwide},
  };
};

/**
 * Adds Internet Egress to Cart.
 *
 * @param {!angular.Form} internetEgressForm
 * @export
 */
ListingCtrl.prototype.addInternetEgress = function(internetEgressForm) {
  /** @type {number} */
  const premiumApac = this.toDefaultUnit(
      this.internetEgress.premiumApac.value,
      this.internetEgress.premiumApac.unit, this.DEFAULT_UNITS.premiumApac);

  /** @type {number} */
  const premiumWesternEurope = this.toDefaultUnit(
      this.internetEgress.premiumWesternEurope.value,
      this.internetEgress.premiumWesternEurope.unit,
      this.DEFAULT_UNITS.premiumWesternEurope);

  /** @type {number} */
  const premiumSouthAmerica = this.toDefaultUnit(
      this.internetEgress.premiumSouthAmerica.value,
      this.internetEgress.premiumSouthAmerica.unit,
      this.DEFAULT_UNITS.premiumSouthAmerica);

  /** @type {number} */
  const premiumAmericas = this.toDefaultUnit(
      this.internetEgress.premiumAmericas.value,
      this.internetEgress.premiumAmericas.unit,
      this.DEFAULT_UNITS.premiumAmericas);

  /** @type {number} */
  const premiumMiddleEast = this.toDefaultUnit(
      this.internetEgress.premiumMiddleEast.value,
      this.internetEgress.premiumMiddleEast.unit,
      this.DEFAULT_UNITS.premiumMiddleEast);

  /** @type {number} */
  const premiumCentralAmerica = this.toDefaultUnit(
      this.internetEgress.premiumCentralAmerica.value,
      this.internetEgress.premiumCentralAmerica.unit,
      this.DEFAULT_UNITS.premiumCentralAmerica);

  /** @type {number} */
  const premiumEasternEurope = this.toDefaultUnit(
      this.internetEgress.premiumEasternEurope.value,
      this.internetEgress.premiumEasternEurope.unit,
      this.DEFAULT_UNITS.premiumEasternEurope);

  /** @type {number} */
  const premiumEmea = this.toDefaultUnit(
      this.internetEgress.premiumEmea.value,
      this.internetEgress.premiumEmea.unit, this.DEFAULT_UNITS.premiumEmea);

  /** @type {number} */
  const premiumAfrica = this.toDefaultUnit(
      this.internetEgress.premiumAfrica.value,
      this.internetEgress.premiumAfrica.unit, this.DEFAULT_UNITS.premiumAfrica);

  /** @type {number} */
  const premiumIndia = this.toDefaultUnit(
      this.internetEgress.premiumIndia.value,
      this.internetEgress.premiumIndia.unit, this.DEFAULT_UNITS.premiumIndia);

  /** @type {number} */
  const premiumChina = this.toDefaultUnit(
      this.internetEgress.premiumChina.value,
      this.internetEgress.premiumChina.unit, this.DEFAULT_UNITS.premiumChina);

  /** @type {number} */
  const premiumAu = this.toDefaultUnit(
      this.internetEgress.premiumAu.value, this.internetEgress.premiumAu.unit,
      this.DEFAULT_UNITS.premiumAu);

  /** @type {number} */
  const standardWorldwide = this.toDefaultUnit(
      this.internetEgress.standardWorldwide.value,
      this.internetEgress.standardWorldwide.unit,
      this.DEFAULT_UNITS.standardWorldwide);

  var region = this.internetEgress.region;
  var sku = '';
  var egressItem = null;

  if (this.isPositiveNumber_(premiumApac)) {
    sku =
        `CP-INTERNET-EGRESS-PREMIUM-TIER-TO-APAC-FROM-${region.toUpperCase()}`;
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Premium Tier to APAC destinations',
      region: region,
      quantity: premiumApac,
      displayDescription: 'Internet Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.internetEgress),
          product: 'internetEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }
  if (this.isPositiveNumber_(premiumWesternEurope)) {
    sku = `CP-INTERNET-EGRESS-PREMIUM-TIER-TO-WESTERN-EUROPE-FROM-${
        region.toUpperCase()}`;
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Premium Tier to Western Europe destinations',
      region: region,
      quantity: premiumWesternEurope,
      displayDescription: 'Internet Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.internetEgress),
          product: 'internetEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }
  if (this.isPositiveNumber_(premiumSouthAmerica)) {
    sku = `CP-INTERNET-EGRESS-PREMIUM-TIER-TO-SOUTH-AMERICA-FROM-${
        region.toUpperCase()}`;
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Premium Tier to South America destinations',
      region: region,
      quantity: premiumSouthAmerica,
      displayDescription: 'Internet Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.internetEgress),
          product: 'internetEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }
  if (this.isPositiveNumber_(premiumAmericas)) {
    sku = `CP-INTERNET-EGRESS-PREMIUM-TIER-TO-AMERICAS-FROM-${
        region.toUpperCase()}`;
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Premium Tier to destination in Americas',
      region: region,
      quantity: premiumAmericas,
      displayDescription: 'Internet Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.internetEgress),
          product: 'internetEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }
  if (this.isPositiveNumber_(premiumMiddleEast)) {
    sku = `CP-INTERNET-EGRESS-PREMIUM-TIER-TO-MIDDLE-EAST-FROM-${
        region.toUpperCase()}`;
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Premium Tier to Middle East destinations',
      region: region,
      quantity: premiumMiddleEast,
      displayDescription: 'Internet Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.internetEgress),
          product: 'internetEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }
  if (this.isPositiveNumber_(premiumEasternEurope)) {
    sku = `CP-INTERNET-EGRESS-PREMIUM-TIER-TO-EASTERN-EUROPE-FROM-${
        region.toUpperCase()}`;
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Premium Tier to Eastern Europe destinations',
      region: region,
      quantity: premiumEasternEurope,
      displayDescription: 'Internet Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.internetEgress),
          product: 'internetEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }
  if (this.isPositiveNumber_(premiumCentralAmerica)) {
    sku = `CP-INTERNET-EGRESS-PREMIUM-TIER-TO-CENTRAL-AMERICA-FROM-${
        region.toUpperCase()}`;
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Premium Tier to Central America destinations',
      region: region,
      quantity: premiumCentralAmerica,
      displayDescription: 'Internet Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.internetEgress),
          product: 'internetEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }
  if (this.isPositiveNumber_(premiumEmea)) {
    sku =
        `CP-INTERNET-EGRESS-PREMIUM-TIER-TO-EMEA-FROM-${region.toUpperCase()}`;
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Premium Tier to EMEA destinations',
      region: region,
      quantity: premiumEmea,
      displayDescription: 'Internet Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.internetEgress),
          product: 'internetEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }
  if (this.isPositiveNumber_(premiumAfrica)) {
    sku = `CP-INTERNET-EGRESS-PREMIUM-TIER-TO-AFRICA-FROM-${
        region.toUpperCase()}`;
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Premium Tier to Africa destinations',
      region: region,
      quantity: premiumAfrica,
      displayDescription: 'Internet Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.internetEgress),
          product: 'internetEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }
  if (this.isPositiveNumber_(premiumIndia)) {
    sku =
        `CP-INTERNET-EGRESS-PREMIUM-TIER-TO-INDIA-FROM-${region.toUpperCase()}`;
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Premium Tier to India destinations',
      region: region,
      quantity: premiumIndia,
      displayDescription: 'Internet Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.internetEgress),
          product: 'internetEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }
  if (this.isPositiveNumber_(premiumChina)) {
    sku =
        `CP-INTERNET-EGRESS-PREMIUM-TIER-TO-CHINA-FROM-${region.toUpperCase()}`;
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Premium Tier to China (excluding Hong Kong)',
      region: region,
      quantity: premiumChina,
      displayDescription: 'Internet Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.internetEgress),
          product: 'internetEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }

  if (this.isPositiveNumber_(premiumAu)) {
    sku = `CP-INTERNET-EGRESS-PREMIUM-TIER-TO-AUSTRALIA-FROM-${
        region.toUpperCase()}`;
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Premium Tier to Australia',
      region: region,
      quantity: premiumAu,
      displayDescription: 'Internet Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.internetEgress),
          product: 'internetEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }

  if (this.isPositiveNumber_(standardWorldwide)) {
    sku = 'CP-INTERNET-EGRESS-STANDARD-TIER-FROM';
    sku = region.toUpperCase() === 'ASIA-NORTHEAST3' ?
        `CP-INTERNET-EGRESS-STANDARD-TIER-FROM-${region.toUpperCase()}` :
        this.combineSkuMultiregional_(sku, region);
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Standard Tier',
      region: region,
      quantity: standardWorldwide,
      displayDescription: 'Internet Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.internetEgress),
          product: 'internetEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }

  // Clear the data model
  this.setupInternetEgressData();
  this.resetForm(internetEgressForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Cloud vm egress data.
 * @export
 */
ListingCtrl.prototype.setupVmEgressData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    location: string,
   *    egressZoneSameRegion: !cloudpricingcalculator.DataWithUnit,
   *    egressEurope: !cloudpricingcalculator.DataWithUnit,
   *    egressUs: !cloudpricingcalculator.DataWithUnit,
   *    egressAsia: !cloudpricingcalculator.DataWithUnit,
   *    egressSouthAmerica: !cloudpricingcalculator.DataWithUnit,
   *    egressAustralia: !cloudpricingcalculator.DataWithUnit
   * }}
   */
  this.vmEgress = {
    submitted: false,
    location: this.retrieveLocation(),
    egressZoneSameRegion:
        {value: null, unit: this.DEFAULT_UNITS.egressZoneSameRegion},
    egressEurope: {value: null, unit: this.DEFAULT_UNITS.egressEurope},
    egressUs: {value: null, unit: this.DEFAULT_UNITS.egressUs},
    egressAsia: {value: null, unit: this.DEFAULT_UNITS.egressAsia},
    egressSouthAmerica:
        {value: null, unit: this.DEFAULT_UNITS.egressSouthAmerica},
    egressAustralia: {value: null, unit: this.DEFAULT_UNITS.egressAustralia},
  };
};

/**
 * Adds Cloud vm egress model to Cart.
 *
 * @param {!angular.Form} VmEgressForm
 * @export
 */
ListingCtrl.prototype.addVmEgress = function(VmEgressForm) {
  if (!VmEgressForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddVmToVmEgress');
  var region = this.vmEgress.location;
  const egressZoneSameRegion = this.toDefaultUnit(
      this.vmEgress.egressZoneSameRegion.value,
      this.vmEgress.egressZoneSameRegion.unit,
      this.DEFAULT_UNITS.egressZoneSameRegion);
  const egressEurope = this.toDefaultUnit(
      this.vmEgress.egressEurope.value, this.vmEgress.egressEurope.unit,
      this.DEFAULT_UNITS.egressEurope);
  const egressUs = this.toDefaultUnit(
      this.vmEgress.egressUs.value, this.vmEgress.egressUs.unit,
      this.DEFAULT_UNITS.egressUs);
  const egressAsia = this.toDefaultUnit(
      this.vmEgress.egressAsia.value, this.vmEgress.egressAsia.unit,
      this.DEFAULT_UNITS.egressAsia);
  const egressSouthAmerica = this.toDefaultUnit(
      this.vmEgress.egressSouthAmerica.value,
      this.vmEgress.egressSouthAmerica.unit,
      this.DEFAULT_UNITS.egressSouthAmerica);
  const egressAustralia = this.toDefaultUnit(
      this.vmEgress.egressAustralia.value, this.vmEgress.egressAustralia.unit,
      this.DEFAULT_UNITS.egressAustralia);
  var sku = '';
  var egressItem = null;
  if (this.isPositiveNumber_(egressZoneSameRegion)) {
    sku = 'CP-VM-EGRESS-TOSAME-REGION-FROM';
    sku = this.combineSkuMultiregional_(sku, region);
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName:
          'Egress to another zone in the same region or between external IP addresses in the same region',
      region: region,
      quantity: egressZoneSameRegion,
      displayDescription: 'VM Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.vmEgress),
          product: 'vmEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }

  if (this.isPositiveNumber_(egressEurope)) {
    sku = 'CP-VM-EGRESS-TO-EU-FROM';
    sku = this.combineSkuMultiregional_(sku, region);
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Egress to another region in Europe',
      region: region,
      quantity: egressEurope,
      displayDescription: 'VM Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.vmEgress),
          product: 'vmEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }

  if (this.isPositiveNumber_(egressUs)) {
    sku = 'CP-VM-EGRESS-TO-NORTH-AMERICA-FROM';
    sku = this.combineSkuMultiregional_(sku, region);
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Egress to another region in NORTH AMERICA',
      region: region,
      quantity: egressUs,
      displayDescription: 'VM Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.vmEgress),
          product: 'vmEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }

  if (this.isPositiveNumber_(egressAsia)) {
    sku = 'CP-VM-EGRESS-TO-ASIA-FROM';
    sku = this.combineSkuMultiregional_(sku, region);
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Egress to another region in Asia',
      region: region,
      quantity: egressAsia,
      displayDescription: 'VM Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.vmEgress),
          product: 'vmEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }

  if (this.isPositiveNumber_(egressSouthAmerica)) {
    sku = 'CP-VM-EGRESS-TO-SOUTHAMERICA-FROM';
    sku = this.combineSkuMultiregional_(sku, region);
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Egress to another region in SouthAmerica',
      region: region,
      quantity: egressSouthAmerica,
      displayDescription: 'VM Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.vmEgress),
          product: 'vmEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }

  if (this.isPositiveNumber_(egressAustralia)) {
    sku = 'CP-VM-EGRESS-TO-AUSTRALIA-FROM';
    sku = this.combineSkuMultiregional_(sku, region);
    egressItem = {
      quantityLabel: 'GiB',
      sku: sku,
      displayName: 'Egress to another region in Australia',
      region: region,
      quantity: egressAustralia,
      displayDescription: 'VM Egress',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.vmEgress),
          product: 'vmEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }
  // Clear the data model
  this.setupVmEgressData();
  this.resetForm(VmEgressForm);
  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Setup Interconnect egress data.
 * @export
 */
ListingCtrl.prototype.setupInterconnectEgressData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    region: string,
   *    dedicatedInterconnect: !cloudpricingcalculator.DataWithUnit,
   *    directPeering: !cloudpricingcalculator.DataWithUnit,
   * }}
   */
  this.interconnectEgress = {
    submitted: false,
    region: this.retrieveLocation(),
    dedicatedInterconnect:
        {value: null, unit: this.DEFAULT_UNITS.dedicatedInterconnect},
    directPeering: {value: null, unit: this.DEFAULT_UNITS.directPeering},
  };
};

/**
 * Adds Internet Egress to Cart.
 *
 * @param {!angular.Form} interconnectEgressForm
 * @export
 */
ListingCtrl.prototype.addinterconnectEgress = function(interconnectEgressForm) {
  /** @type {number} */
  const dedicatedInterconnect = this.toDefaultUnit(
      this.interconnectEgress.dedicatedInterconnect.value,
      this.interconnectEgress.dedicatedInterconnect.unit,
      this.DEFAULT_UNITS.dedicatedInterconnect);
  /** @type {number} */
  const directPeering = this.toDefaultUnit(
      this.interconnectEgress.directPeering.value,
      this.interconnectEgress.directPeering.unit,
      this.DEFAULT_UNITS.directPeering);
  var region = this.interconnectEgress.region;
  var egressItem = null;
  if (this.isPositiveNumber_(dedicatedInterconnect)) {
    egressItem = {
      quantityLabel: 'GiB',
      sku: `CP-DEDICATED-PARTNER-INTERCONNECT`,
      displayName: 'Dedicated/Partner Interconnect Egress',
      region: region,
      quantity: dedicatedInterconnect,
      displayDescription: 'Internet Egress',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.interconnectEgress),
          product: 'interconnectEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }

  if (this.isPositiveNumber_(directPeering)) {
    egressItem = {
      quantityLabel: 'GiB',
      sku: `CP-DIRECT-CARRIER-PEERING`,
      displayName: 'Direct/Carrier Peering Egress on the same continent',
      region: region,
      quantity: directPeering,
      displayDescription: 'Internet Egress',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.interconnectEgress),
          product: 'interconnectEgress',
          tab: 'networking-egress'
        }
      }
    };
    this.CloudCalculator.addItemToCart(egressItem);
  }

  // Clear the data model
  this.setupInterconnectEgressData();
  this.resetForm(interconnectEgressForm);

  // Scroll to the cart
  this.scrollToCart();
};
/**
 * Sets up CloudSourceRepo Model.
 * @export
 */
ListingCtrl.prototype.setupCloudSourceRepo = function() {
  /**
   * @type {{
   * submitted: boolean,
   * userCount: ?number,
   * storage: ?cloudpricingcalculator.DataWithUnit,
   * networkEgress: ?cloudpricingcalculator.DataWithUnit
   * }}
   */
  this.cloudSourceRepo = {
    submitted: false,
    userCount: null,
    storage: {value: null, unit: this.DEFAULT_UNITS.sourceRepStorage},
    networkEgress: {value: null, unit: this.DEFAULT_UNITS.sourceRepEgress},
  };
};

/**
 * Adds a CloudSourceRepo items to Cart
 *
 * @param {!angular.Form} cloudSourceRepoForm
 * @export
 */
ListingCtrl.prototype.addCloudSourceRepo = function(cloudSourceRepoForm) {
  if (this.isFormEmpty(cloudSourceRepoForm)) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddCloudSourceRepo');
  const userCount =
      this.cloudSourceRepo.userCount ? this.cloudSourceRepo.userCount : 0;
  const storage = this.toDefaultUnit(
      this.cloudSourceRepo.storage.value, this.cloudSourceRepo.storage.unit,
      this.DEFAULT_UNITS.sourceRepStorage);
  const networkEgress = this.toDefaultUnit(
      this.cloudSourceRepo.networkEgress.value,
      this.cloudSourceRepo.networkEgress.unit,
      this.DEFAULT_UNITS.sourceRepEgress);

  /** @type {number} */
  let totalPrice = 0;
  if (this.isPositiveNumber_(userCount)) {
    totalPrice += this.CloudCalculator.calculateTieredSKUPrice(
        'CP-SOURCE-REPOSITORY-ACTIVE-USER', userCount);
  }
  if (this.isPositiveNumber_(storage)) {
    totalPrice += this.CloudCalculator.calculateTieredSKUPrice(
        'CP-SOURCE-REPOSITORY-STORAGE', storage);
  }
  if (this.isPositiveNumber_(networkEgress)) {
    totalPrice += this.CloudCalculator.calculateTieredSKUPrice(
        'CP-SOURCE-REPOSITORY-EGRESS', networkEgress);
  }
  const cloudSourceRepoItem = {
    sku: 'CP-SOURCE-REPOSITORY',
    quantity: Number(userCount),
    region: '',
    displayName: '',
    displayDescription: 'Cloud Source Repositories',
    price: totalPrice,
    quantityLabel: '',
    uniqueId: null,
    items: {
      userCount: userCount,
      storage: storage,
      networkEgress: networkEgress,
      editHook: {
        initialInputs: goog.object.clone(this.cloudSourceRepo),
        product: 'cloudSourceRepo',
        tab: 'cloudSourceRepo'
      }
    }
  };
  this.CloudCalculator.addItemToCart(cloudSourceRepoItem, totalPrice);

  // Clear the data model
  this.setupCloudSourceRepo();
  this.resetForm(cloudSourceRepoForm);
  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Big Query Model.
 */

ListingCtrl.prototype.setupBigQuery = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    name: string,
   *    location: string,
   *    activeStorage: !cloudpricingcalculator.DataWithUnit,
   *    longTermStorage: !cloudpricingcalculator.DataWithUnit,
   *    streamingInserts: !cloudpricingcalculator.DataWithUnit,
   *    streamingReads: !cloudpricingcalculator.DataWithUnit,
   *    interactiveQueries: !cloudpricingcalculator.DataWithUnit
   * }}
   */
  this.bigQuery = {
    submitted: false,
    name: '',
    location: this.retrieveLocation('us'),
    activeStorage: {value: null, unit: this.DEFAULT_UNITS.bqStorage},
    longTermStorage: {value: null, unit: this.DEFAULT_UNITS.bqStorage},
    streamingInserts: {value: null, unit: this.DEFAULT_UNITS.streamingInserts},
    streamingReads: {value: null, unit: this.DEFAULT_UNITS.streamingReads},
    interactiveQueries:
        {value: null, unit: this.DEFAULT_UNITS.interactiveQueries}
  };
};


/**
 * Adds a BigQuery items to Cart.
 *
 * @param {!angular.Form} bigQueryForm
 * @export
 */
ListingCtrl.prototype.addBigQuery = function(bigQueryForm) {
  if (this.isFormEmpty(bigQueryForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddBigQuery');

  /** @type {number} */
  const activeStorage = this.toDefaultUnit(
      this.bigQuery.activeStorage.value, this.bigQuery.activeStorage.unit,
      this.DEFAULT_UNITS.bqStorage);
  /** @type {number} */
  const longTermStorage = this.toDefaultUnit(
      this.bigQuery.longTermStorage.value, this.bigQuery.longTermStorage.unit,
      this.DEFAULT_UNITS.bqStorage);
  /** @type {number} */
  const streamingInserts = this.toDefaultUnit(
      this.bigQuery.streamingInserts.value, this.bigQuery.streamingInserts.unit,
      this.DEFAULT_UNITS.streamingInserts);
  const streamingReads = this.toDefaultUnit(
      this.bigQuery.streamingReads.value, this.bigQuery.streamingReads.unit,
      this.DEFAULT_UNITS.streamingReads);
  /** @type {number} */
  const interactiveQueries = this.toDefaultUnit(
      this.bigQuery.interactiveQueries.value,
      this.bigQuery.interactiveQueries.unit,
      this.DEFAULT_UNITS.interactiveQueries);

  const items = {
    storage: activeStorage,
    longTermStorage: longTermStorage,
    streamingInserts: streamingInserts,
    streamingReads: streamingReads,
    interactiveQueries: interactiveQueries,
    editHook: {
      initialInputs: goog.object.clone(this.bigQuery),
      product: 'bigQuery',
      tab: 'bigquery'
    }
  };

  const region = this.bigQuery.location;

  const totalPrice = this.CloudCalculator.calculateBigQueryPrice(items, region);

  /** @type {!cloudpricingcalculator.SkuData} */
  const newItem = {
    sku: 'CP-BIGQUERY-GENERAL',
    region: region,
    displayName: this.bigQuery.name,
    quantity: this.bigQuery.activeStorage.value || 0,
    quantityLabel: 'GiB',
    displayDescription: 'BigQuery',
    price: null,
    uniqueId: null,
    items: items
  };

  this.CloudCalculator.addItemToCart(newItem, totalPrice);

  // Clear the data model
  this.setupBigQuery();
  this.resetForm(bigQueryForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Big Query Flat-rate Model.
 */

ListingCtrl.prototype.setupBigQueryFlatRate = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    plan: string,
   *    location: string,
   *    YearAgreement: boolean,
   *    slotsCount: number,
   *    queryThroughput: number,
   *    activeStorage: !cloudpricingcalculator.DataWithUnit,
   *    longTermStorage: !cloudpricingcalculator.DataWithUnit,
   *    streamingInserts: !cloudpricingcalculator.DataWithUnit,
   *    streamingReads: !cloudpricingcalculator.DataWithUnit,
   * }}
   */
  this.bigQueryFlatRate = {
    submitted: false,
    plan: 'flatRate-40',
    location: this.retrieveLocation('us'),
    YearAgreement: false,
    slotsCount: 500,
    queryThroughput: 1,
    activeStorage: {value: null, unit: this.DEFAULT_UNITS.bqStorage},
    longTermStorage: {value: null, unit: this.DEFAULT_UNITS.bqStorage},
    streamingInserts: {value: null, unit: this.DEFAULT_UNITS.streamingInserts},
    streamingReads: {value: null, unit: this.DEFAULT_UNITS.streamingReads}
  };
};


/**
 * Adds a BigQuery flat-rate items to Cart.
 *
 * @param {!angular.Form} bigQueryForm
 * @export
 */
ListingCtrl.prototype.addBigQueryFlatRate = function(bigQueryForm) {
  if (this.isFormEmpty(bigQueryForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddBigQueryFlatRate');

  /** @type {number} */
  const activeStorage = this.toDefaultUnit(
      this.bigQueryFlatRate.activeStorage.value,
      this.bigQueryFlatRate.activeStorage.unit, this.DEFAULT_UNITS.bqStorage);
  /** @type {number} */
  const longTermStorage = this.toDefaultUnit(
      this.bigQueryFlatRate.longTermStorage.value,
      this.bigQueryFlatRate.longTermStorage.unit, this.DEFAULT_UNITS.bqStorage);
  /** @type {number} */
  const streamingInserts = this.toDefaultUnit(
      this.bigQueryFlatRate.streamingInserts.value,
      this.bigQueryFlatRate.streamingInserts.unit,
      this.DEFAULT_UNITS.streamingInserts);
  const streamingReads = this.toDefaultUnit(
      this.bigQueryFlatRate.streamingReads.value,
      this.bigQueryFlatRate.streamingReads.unit,
      this.DEFAULT_UNITS.streamingReads);
  const quantity = this.bigQueryFlatRate.slotsCount;
  const items = {
    storage: activeStorage,
    longTermStorage: longTermStorage,
    streamingInserts: streamingInserts,
    streamingReads: streamingReads,
    editHook: {
      initialInputs: goog.object.clone(this.bigQueryFlatRate),
      product: 'bigQueryFlatRate',
      tab: 'bigquery'
    }
  };
  let sku = 'BIG_QUERY_FLAT_RATE_ANALYSIS';
  let displayName = `BigQuery flat-rate ${quantity} slots`;

  if (this.bigQueryFlatRate.YearAgreement) {
    sku = 'BIG_QUERY_FLAT_RATE_ANALYSIS_12_MONTHS';
    displayName = displayName + ' with 12 months agreement';
  }

  const region = this.bigQueryFlatRate.location;

  let totalPrice = this.CloudCalculator.calculateBigQueryPrice(items, region);
  totalPrice += this.CloudCalculator.calculateItemPrice(sku, quantity, region);


  /** @type {!cloudpricingcalculator.SkuData} */
  const newItem = {
    sku: sku,
    region: region,
    displayName: displayName,
    quantity: quantity,
    quantityLabel: 'slots',
    displayDescription: 'BigQuery Flat-Rate',
    price: null,
    uniqueId: null,
    items: items
  };

  this.CloudCalculator.addItemToCart(newItem, totalPrice);

  // Clear the data model
  this.setupBigQueryFlatRate();
  this.resetForm(bigQueryForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Big Query BI Engine on-demand Model.
 */
ListingCtrl.prototype.setupBqBiEngineOnDemand = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    location: string,
   *    memoryCapacity: !cloudpricingcalculator.DataWithUnit,
   *    addFreeTier: boolean
   * }}
   */
  this.bqBiEngineOnDemand = {
    submitted: false,
    location: this.retrieveLocation('us', this.bqBiEngineRegionList),
    memoryCapacity:
        {value: null, unit: this.DEFAULT_UNITS.bqBiEngineMemoryCapacity},
    addFreeTier: false
  };
};

/**
 * Adds a BigQuery BI Engine on-demand items to Cart.
 * @param {!angular.Form} biEngineForm
 * @export
 */
ListingCtrl.prototype.addBqBiEngineOnDemand = function(biEngineForm) {
  if (this.isFormEmpty(biEngineForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddBqBiEngineOnDemand');

  const location = this.bqBiEngineOnDemand.location;
  const locationName =
      this.bqBiEngineRegionList.find(item => item.value == location).name;
  const memoryCapacity = this.toDefaultUnit(
      this.bqBiEngineOnDemand.memoryCapacity.value,
      this.bqBiEngineOnDemand.memoryCapacity.unit,
      this.DEFAULT_UNITS.bqBiEngineMemoryCapacity);
  const addFreeTier = this.bqBiEngineOnDemand.addFreeTier;
  const freeTierQuota = addFreeTier ? 1 : 0;
  const pricePerHour = this.CloudCalculator.calculateItemPrice(
    'CP-BQ-BI-ENGINE-ONDEMAND', 1, location);
  const totalPrice = pricePerHour * (memoryCapacity - freeTierQuota) *
    this.TOTAL_BILLING_HOURS;
  /** @type {!cloudpricingcalculator.SkuData} */
  const newItem = {
    sku: 'CP-BQ-BI-ENGINE-ONDEMAND',
    region: location,
    quantity: memoryCapacity,
    quantityLabel: 'GiB',
    displayName: '1x',
    displayDescription: 'BigQuery BI Engine on-demand',
    price: null,
    uniqueId: null,
    items: {
      memoryCapacity: memoryCapacity,
      locationName: locationName,
      totalHours: this.TOTAL_BILLING_HOURS,
      pricePerHour: pricePerHour,
      editHook: {
        initialInputs: goog.object.clone(this.bqBiEngineOnDemand),
        product: 'bqBiEngineOnDemand',
        tab: 'bq-bi-engine'
      }
    }
  };

  this.CloudCalculator.addItemToCart(newItem, totalPrice);

  // Clear the data model
  this.setupBqBiEngineOnDemand();
  this.resetForm(biEngineForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Big Query BI Engine flat-rate Model.
 */
ListingCtrl.prototype.setupBqBiEngineFlatRate = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    slots: number,
   *    location: string,
   *    memoryCapacity: !cloudpricingcalculator.DataWithUnit,
   * }}
   */
  this.bqBiEngineFlatRate = {
    submitted: false,
    slots: 500,
    location: this.retrieveLocation('us', this.bqBiEngineRegionList),
    memoryCapacity:
        {value: null, unit: this.DEFAULT_UNITS.bqBiEngineMemoryCapacity}
  };
};

/**
 * Adds a BigQuery BI Engine flat-rate items to Cart.
 * @param {!angular.Form} bqBiEngineFlatRateForm
 * @export
 */
ListingCtrl.prototype.addBqBiEngineFlatRate = function(bqBiEngineFlatRateForm) {
  if (this.isFormEmpty(bqBiEngineFlatRateForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddBqBiEngineFlatRate');

  const location = this.bqBiEngineFlatRate.location;
  const locationName =
    this.bqBiEngineRegionList.find(item => item.value == location).name;
  const slots = this.bqBiEngineFlatRate.slots;
  const memoryCapacity = this.toDefaultUnit(
    this.bqBiEngineFlatRate.memoryCapacity.value,
    this.bqBiEngineFlatRate.memoryCapacity.unit,
    this.DEFAULT_UNITS.bqBiEngineMemoryCapacity);
  const freeMemoryCapacity = this.bqBiSlotsMemoryMapping[slots];
  const paidMemoryCapacity = memoryCapacity > freeMemoryCapacity ?
    memoryCapacity - freeMemoryCapacity : 0 ;
  const pricePerHour = this.CloudCalculator.calculateItemPrice(
    'CP-BQ-BI-ENGINE-ONDEMAND', 1, location);
  const totalPrice = pricePerHour * paidMemoryCapacity *
    this.TOTAL_BILLING_HOURS;

  /** @type {!cloudpricingcalculator.SkuData} */
  const newItem = {
    sku: 'CP-BQ-BI-ENGINE-FLATRATE',
    region: location,
    quantity: memoryCapacity,
    quantityLabel: 'GiB',
    displayName: '1x',
    displayDescription: 'BigQuery BI Engine flat-rate',
    price: null,
    uniqueId: null,
    items: {
      slots: slots,
      memoryCapacity: memoryCapacity,
      freeMemoryCapacity: freeMemoryCapacity,
      paidMemoryCapacity: paidMemoryCapacity,
      locationName: locationName,
      totalHours: this.TOTAL_BILLING_HOURS,
      pricePerHour: pricePerHour,
      editHook: {
        initialInputs: goog.object.clone(this.bqBiEngineFlatRate),
        product: 'bqBiEngineFlatRate',
        tab: 'bq-bi-engine'
      }
    }
  };

  this.CloudCalculator.addItemToCart(newItem, totalPrice);

  // Clear the data model
  this.setupBqBiEngineFlatRate();
  this.resetForm(bqBiEngineFlatRateForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up BigQuery Omni model.
 */
ListingCtrl.prototype.setupBigQueryOmni = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    slotCount: number,
   *    region: string,
   *    commitment: string
   * }}
   */
  this.bigQueryOmni = {
    submitted: false,
    slotCount: 100,
    region: 'aws-us-east1',
    commitment: 'monthly'
  };
};

/**
 * Adds a BigQuery Omni item to the cart.
 * @param {!angular.Form} bigQueryOmniForm
 * @export
 */
ListingCtrl.prototype.addBigQueryOmni = function(bigQueryOmniForm) {
  if (this.isFormEmpty(bigQueryOmniForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'addBigQueryOmni');

  const regionArray = this.bigQueryOmni.region.split('-');
  const service = regionArray.shift();
  const region = regionArray.join('-');
  const regionName = this.bigQueryOmniRegionList
    .find(item => item.value === this.bigQueryOmni.region).name;
  const slotCount = this.bigQueryOmni.slotCount;
  const commitment = this.bigQueryOmni.commitment;

  /** @type {!cloudpricingcalculator.SkuData} */
  const newItem = {
    sku: `CP-BQ-OMNI-${commitment.toUpperCase()}-${service.toUpperCase()}`,
    region: region,
    quantity: slotCount,
    quantityLabel: 'slots',
    displayName: 'BigQuery Omni',
    displayDescription: 'BigQuery Omni',
    price: null,
    uniqueId: null,
    items: {
      commitmentDisplay: this.bigQueryOmniCommitment[commitment],
      regionDisplay: regionName,
      editHook: {
        initialInputs: goog.object.clone(this.bigQueryOmni),
        product: 'bigQueryOmni',
        tab: 'bigquery-omni'
      }
    }
  };

  this.CloudCalculator.addItemToCart(newItem);

  // Clear the data model
  this.setupBigQueryOmni();
  this.resetForm(bigQueryOmniForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Updates BigQuery plan info according to selected plan.
 * @export
 */

ListingCtrl.prototype.updatePlanInfo = function() {
  /** @type {number} */
  var planRate = this.retrievePlanRate_(this.bigQueryFlatRate.plan);
  if (planRate) {
    this.bigQueryFlatRate.slotsCount = this.retrieveSlotsCount_(planRate);
    this.bigQueryFlatRate.queryThroughput =
        this.retrieveQueryThroughput_(planRate);
  }
};


/**
 * Retrieves Slots count for chosen plan rate.
 * @param {number} tabNumber number of a tab.
 * @export
 */

ListingCtrl.prototype.switchBQTabs = function(tabNumber) {
  if (angular.isNumber(tabNumber)) {
    this.bqTab = tabNumber;
  }
};


/**
 * Retrieves Slots count for chosen plan rate.
 * @param {number} planRate thousands of $ for this plan.
 * @return {number} number of slots for this plan.
 * @private
 */

ListingCtrl.prototype.retrieveSlotsCount_ = function(planRate) {
  /** @type {number} */
  var slotsRate = 50;
  if (!planRate) {
    return 0;
  }
  return planRate * slotsRate;
};


/**
 * Retrieves Query Throughput for chosen plan rate.
 * @param {number} planRate thousands of $ for this plan.
 * @return {number} Query Throughput rate for this plan.
 * @private
 */

ListingCtrl.prototype.retrieveQueryThroughput_ = function(planRate) {
  /** @type {number} */
  var queryRate = 40;
  if (!planRate) {
    return 0;
  }
  return planRate / queryRate;
};


/**
 * Retrieves Plan Rate for chosen plan.
 * @param {string} plan flat rate plan.
 * @return {number} plan rate.
 * @private
 */

ListingCtrl.prototype.retrievePlanRate_ = function(plan) {
  if (!plan) {
    return 0;
  }
  return parseInt(plan.replace('flatRate-', ''));
};


/**
 * Sets up Cloud Datastore Model.
 * @export
 */

ListingCtrl.prototype.setupDatastore = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    instances: {cloudpricingcalculator.DataWithUnit},
   *    writeOp: {number},
   *    readOp: {number},
   *    entityReadsCount: {number},
   *    entityWritesCount: {number},
   *    entityDeletesCount: {number}
   * }}
   */
  this.datastore = {
    submitted: false,
    instances: {value: '', unit: this.DEFAULT_UNITS.dsStorage},
    writeOp: '',
    readOp: '',
    entityReadsCount: '',
    entityWritesCount: '',
    entityDeletesCount: ''
  };
};


/**
 * Adds Cloud Datastore to Cart.
 *
 * @param {!angular.Form} dataStoreForm
 * @export
 */
ListingCtrl.prototype.addDatastore = function(dataStoreForm) {
  if (!dataStoreForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddCloudDatastore');

  /** @type {number} */
  var dsInstances = this.toDefaultUnit(
      this.datastore.instances.value, this.datastore.instances.unit,
      this.DEFAULT_UNITS.dsStorage);
  /** @type {number} */
  var dsWriteOp = parseFloat(this.datastore.writeOp);
  /** @type {number} */
  var dsReadOp = parseFloat(this.datastore.readOp);
  /** @type {number} */
  var entityReadsCount = parseFloat(this.datastore.entityReadsCount);
  /** @type {number} */
  var entityWritesCount = parseFloat(this.datastore.entityWritesCount);
  /** @type {number} */
  var entityDeletesCount = parseFloat(this.datastore.entityDeletesCount);
  /** @type {!cloudpricingcalculator.SkuData} */
  var dsItem = null;

  if (this.isPositiveNumber_(dsInstances)) {
    dsItem = {
      sku: 'CP-CLOUD-DATASTORE-INSTANCES',
      quantity: dsInstances,
      quantityLabel: 'GiB',
      region: 'us',
      displayName: 'Datastore Storage',
      displayDescription: 'Cloud Datastore',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.datastore),
          product: 'datastore',
          tab: 'cloud-datastore'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dsItem);
  }

  if (this.isPositiveNumber_(dsWriteOp)) {
    dsItem = {
      sku: 'CP-CLOUD-DATASTORE-WRITE-OP',
      quantity: dsWriteOp,
      quantityLabel: 'GiB',
      region: 'us',
      displayName: 'Write operations',
      displayDescription: 'Cloud Datastore',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.datastore),
          product: 'datastore',
          tab: 'cloud-datastore'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dsItem);
  }

  if (this.isPositiveNumber_(dsReadOp)) {
    dsItem = {
      sku: 'CP-CLOUD-DATASTORE-READ-OP',
      quantity: dsReadOp,
      quantityLabel: 'GiB',
      region: 'us',
      displayName: 'Read operations',
      displayDescription: 'Cloud Datastore',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.datastore),
          product: 'datastore',
          tab: 'cloud-datastore'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dsItem);
  }

  if (this.isPositiveNumber_(entityReadsCount)) {
    dsItem = {
      sku: 'CP-CLOUD-DATASTORE-ENTITY-READ',
      quantity: entityReadsCount,
      quantityLabel: '',
      region: 'us',
      displayName: 'Datastore',
      displayDescription: 'Cloud Datastore',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.datastore),
          product: 'datastore',
          tab: 'cloud-datastore'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dsItem);
  }

  if (this.isPositiveNumber_(entityWritesCount)) {
    dsItem = {
      sku: 'CP-CLOUD-DATASTORE-ENTITY-WRITE',
      quantity: entityWritesCount,
      quantityLabel: '',
      region: 'us',
      displayName: 'Datastore',
      displayDescription: 'Cloud Datastore',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.datastore),
          product: 'datastore',
          tab: 'cloud-datastore'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dsItem);
  }

  if (this.isPositiveNumber_(entityDeletesCount)) {
    dsItem = {
      sku: 'CP-CLOUD-DATASTORE-ENTITY-DELETE',
      quantity: entityDeletesCount,
      quantityLabel: '',
      region: 'us',
      displayName: 'Datastore',
      displayDescription: 'Cloud Datastore',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.datastore),
          product: 'datastore',
          tab: 'cloud-datastore'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dsItem);
  }

  this.setupDatastore();
  this.resetForm(dataStoreForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Cloud Firestore Model.
 * @export
 */

ListingCtrl.prototype.setupFirestore = function() {
  /**
   * @type {{
   *    submitted: !boolean,
   *    location: string,
   *    documentReadsCount: ?number,
   *    documentWritesCount: ?number,
   *    documentDeletesCount: ?number,
   *    storedDataVolume: ?cloudpricingcalculator.DataWithUnit,
   *    networkEgressVolume: ?cloudpricingcalculator.DataWithUnit
   * }}
   */
  this.firestore = {
    submitted: false,
    location: this.retrieveLocation('us', this.firestoreRegionList),
    documentReadsCount: '',
    documentWritesCount: '',
    documentDeletesCount: '',
    storedDataVolume: {value: '', unit: this.DEFAULT_UNITS.dsStorage},
    networkEgressVolume: {value: '', unit: this.DEFAULT_UNITS.dsStorage}
  };
};


/**
 * Adds Cloud Firestore to Cart.
 *
 * @param {!angular.Form} firestoreForm
 * @export
 */
ListingCtrl.prototype.addFirestore = function(firestoreForm) {
  if (!firestoreForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddCloudFirestore');

  /** @type {string} */
  var location = this.firestore.location;
  var sku = '';
  /** @type {number} */
  var storedDataVolume = this.toDefaultUnit(
      this.firestore.storedDataVolume.value,
      this.firestore.storedDataVolume.unit, this.DEFAULT_UNITS.dsStorage);
  var documentReadsCount = parseFloat(this.firestore.documentReadsCount);
  var documentWritesCount = parseFloat(this.firestore.documentWritesCount);
  var documentDeletesCount = parseFloat(this.firestore.documentDeletesCount);
  var qty = 0;
  /** @type {!cloudpricingcalculator.SkuData} */
  var fsItem = null;

  if (this.isPositiveNumber_(storedDataVolume)) {
    sku = 'CP-FIRESTORE-DATA-STORED';
    sku = this.combineSkuRegional_(sku, location);
    fsItem = {
      sku: sku,
      quantity: storedDataVolume,
      quantityLabel: 'GiB',
      region: location,
      displayName: 'Cloud Firestore',
      displayDescription: 'Persistent Disk',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.firestore),
          product: 'firestore',
          tab: 'cloud-firestore'
        }
      }
    };
    this.CloudCalculator.addItemToCart(fsItem);
  }

  if (this.isPositiveNumber_(documentReadsCount)) {
    sku = 'CP-FIRESTORE-DOCUMENT-READS';
    sku = this.combineSkuRegional_(sku, location);
    qty = Math.max(0, documentReadsCount) * this.DAYS;
    fsItem = {
      sku: sku,
      quantity: qty,
      quantityLabel: '',
      region: location,
      displayName: 'Cloud Firestore',
      displayDescription: 'Document Reads',
      items: {
        dependedQuota: this.FIRESTORE_DAILY_QUOTA_READS * this.DAYS,
        editHook: {
          initialInputs: goog.object.clone(this.firestore),
          product: 'firestore',
          tab: 'cloud-firestore'
        }
      }
    };
    this.CloudCalculator.addItemToCart(fsItem);
  }

  if (this.isPositiveNumber_(documentWritesCount)) {
    sku = 'CP-FIRESTORE-DOCUMENT-WRITES';
    sku = this.combineSkuRegional_(sku, location);
    qty = Math.max(0, documentWritesCount) * this.DAYS;
    fsItem = {
      sku: sku,
      quantity: qty,
      quantityLabel: '',
      region: location,
      displayName: 'Cloud Firestore',
      displayDescription: 'Document Writes',
      items: {
        dependedQuota: this.FIRESTORE_DAILY_QUOTA_WRITES * this.DAYS,
        editHook: {
          initialInputs: goog.object.clone(this.firestore),
          product: 'firestore',
          tab: 'cloud-firestore'
        }
      }
    };
    this.CloudCalculator.addItemToCart(fsItem);
  }

  if (this.isPositiveNumber_(documentDeletesCount)) {
    sku = 'CP-FIRESTORE-DOCUMENT-DELETES';
    sku = this.combineSkuRegional_(sku, location);
    qty = Math.max(0, documentDeletesCount) * this.DAYS;
    fsItem = {
      sku: sku,
      quantity: qty,
      quantityLabel: '',
      region: location,
      displayName: 'Cloud Firestore',
      displayDescription: 'Document Deletes',
      items: {
        dependedQuota: this.FIRESTORE_DAILY_QUOTA_DELETES * this.DAYS,
        editHook: {
          initialInputs: goog.object.clone(this.firestore),
          product: 'firestore',
          tab: 'cloud-firestore'
        }
      }
    };
    this.CloudCalculator.addItemToCart(fsItem);
  }

  this.setupFirestore();
  this.resetForm(firestoreForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Cloud DNS Model.
 * @export
 */

ListingCtrl.prototype.setupCloudDns = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    zone: {number},
   *    queries: {number}
   * }}
   */
  this.cloudDns = {submitted: false, zone: '', queries: ''};
};


/**
 * Adds a Cloud Dns items to Cart.
 *
 * @param {!angular.Form} cloudDnsForm
 * @export
 */
ListingCtrl.prototype.addCloudDns = function(cloudDnsForm) {
  if (!cloudDnsForm.$valid) {
    report;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddCloudDns');
  /** @type {number} */
  var dnsZone = parseFloat(this.cloudDns.zone);
  /** @type {number} */
  var dnsQueries = parseFloat(this.cloudDns.queries);
  /** @type {!cloudpricingcalculator.SkuData} */
  var dnsItem = null;

  if (this.isPositiveNumber_(dnsZone)) {
    dnsItem = {
      quantityLabel: 'zones',
      displayName: 'Cloud DNS',
      sku: 'CP-CLOUD-DNS-ZONES',
      region: 'us',
      quantity: dnsZone,
      displayDescription: 'Managed Zones',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.cloudDns),
          product: 'cloudDns',
          tab: 'cloud-dns'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dnsItem);
  }

  if (this.isPositiveNumber_(dnsQueries)) {
    dnsItem = {
      quantityLabel: '',
      displayName: 'Cloud DNS',
      sku: 'CP-CLOUD-DNS-QUERIES',
      region: 'us',
      quantity: dnsQueries,
      displayDescription: 'queries',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.cloudDns),
          product: 'cloudDns',
          tab: 'cloud-dns'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dnsItem);
  }

  // Clear the data model
  this.setupCloudDns();
  this.resetForm(cloudDnsForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Microsoft Active Directory.
 * @export
 */

ListingCtrl.prototype.setupMicrosoftAd = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    numberOfInstance: ?number,
   *    domainType: number
   * }}
   */
  this.microsoftAd = {submitted: false, numberOfInstance: null, domainType: 1};
};

/**
 * Adds a Microsoft Active Directory items to Cart.
 *
 * @param {!angular.Form} MicrosoftAdForm
 * @export
 */
ListingCtrl.prototype.addMicrosoftAd = function(MicrosoftAdForm) {
  if (!MicrosoftAdForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddMicrosoftAd');
  /** @type {?number} */
  let numberOfInstance = this.microsoftAd.numberOfInstance;
  /** @type {number} */
  let domainType = this.microsoftAd.domainType;
  let quantity = numberOfInstance * domainType * this.TOTAL_BILLING_HOURS;
  if (this.isPositiveNumber_(numberOfInstance)) {
    const microsoftAdItem = {
      displayName: 'Microsoft Active Directory',
      sku: 'CP-MICROSOFT-AD',
      region: 'us',
      quantity: quantity,
      displayDescription: 'Microsoft Active Directory',
      price: null,
      uniqueId: null,
      quantityLabel: '',
      items: {
        numberOfInstance: numberOfInstance,
        domainType: domainType,
        editHook: {
          initialInputs: goog.object.clone(this.cloudDns),
          product: 'microsoftAd',
          tab: 'microsoft-ad'
        }
      }
    };
    this.CloudCalculator.addItemToCart(microsoftAdItem);
  }

  // Clear the data model
  this.setupMicrosoftAd();
  this.resetForm(MicrosoftAdForm);

  // Scroll to the cart
  this.scrollToCart();
};
/**
 * Sets up Translate Api Model.
 * @export
 */

ListingCtrl.prototype.setupTranslateApi = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    translation: ?number,
   *    detection: ?number,
   *    document: ?number
   * }}
   */
  this.translateApi =
      {submitted: false, translation: null, detection: null, document: null};
};


/**
 * Adds a Translate API items to Cart.
 *
 * @param {!angular.Form} translateForm
 * @export
 */
ListingCtrl.prototype.addTranslationApi = function(translateForm) {
  if (this.isFormEmpty(translateForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddTranslationApi');
  /** @type {number} */
  const translation = parseFloat(this.translateApi.translation);
  /** @type {number} */
  const detection = parseFloat(this.translateApi.detection);
  /** @type {number} */
  const document = parseFloat(this.translateApi.document);
  /** @type {!cloudpricingcalculator.SkuData} */
  let translationItem;

  if (this.isPositiveNumber_(translation)) {
    translationItem = {
      quantityLabel: 'characters',
      displayName: 'Text Translation',
      sku: 'CP-TRANSLATE-API-TRANSLATION',
      region: 'us',
      quantity: translation,
      displayDescription: 'Text Translation',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.translateApi),
          product: 'translateApi',
          tab: 'translate'
        }
      }
    };
    this.CloudCalculator.addItemToCart(translationItem);
  }
  if (this.isPositiveNumber_(detection)) {
    translationItem = {
      quantityLabel: 'characters',
      displayName: 'Language Detection',
      sku: 'CP-TRANSLATE-API-DETECTION',
      region: 'us',
      quantity: detection,
      displayDescription: 'Language Detection',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.translateApi),
          product: 'translateApi',
          tab: 'translate'
        }
      }
    };
    this.CloudCalculator.addItemToCart(translationItem);
  }
  if (this.isPositiveNumber_(document)) {
    translationItem = {
      quantityLabel: 'pages',
      displayName: 'Document Translation',
      sku: 'CP-TRANSLATE-API-DOCUMENT',
      region: 'us',
      quantity: document,
      displayDescription: 'Document Translation',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.translateApi),
          product: 'translateApi',
          tab: 'translate'
        }
      }
    };
    this.CloudCalculator.addItemToCart(translationItem);
  }

  // Clear the data model
  this.setupTranslateApi();
  this.resetForm(translateForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Secret Manager Model.
 * @export
 */

ListingCtrl.prototype.setupSecretManager = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    location: string,
   *    activeSecretVersions: ?number,
   *    accessOperations: ?number,
   *    rotationNotifications: ?number
   * }}
   */
  this.secretManager = {
    submitted: false,
    location:
        this.retrieveLocation('us-central1', this.secretManagerRegionList),
    activeSecretVersions: null,
    accessOperations: null,
    rotationNotifications: null
  };
};


/**
 * Adds Secret Manager items to Cart.
 *
 * @param {!angular.Form} secretManagerForm
 * @export
 */
ListingCtrl.prototype.addSecretManager = function(secretManagerForm) {
  if (this.isFormEmpty(secretManagerForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddSecretManager');

  const location = 'us-central1';
  const activeSecretVersions = this.secretManager.activeSecretVersions;
  const accessOperations = this.secretManager.accessOperations;
  const rotationNotifications = this.secretManager.rotationNotifications;

  const activeSecretVersionsCost = this.CloudCalculator.calculateItemPrice(
      'CP-SECRET-MANAGER-ACTIVE-SECRET-VERSION', Number(activeSecretVersions),
      location);
  const accessOperationsCost = this.CloudCalculator.calculateItemPrice(
                                   'CP-SECRET-MANAGER-ACCESS-OPERATIONS',
                                   Number(accessOperations), location) /
      10000;
  const rotationNotificationsCost = this.CloudCalculator.calculateItemPrice(
      'CP-SECRET-MANAGER-ROTATION-NOTIFICATIONS', Number(rotationNotifications),
      location);

  const totalPrice = activeSecretVersionsCost + accessOperationsCost +
      rotationNotificationsCost;

  /** @type {!cloudpricingcalculator.SkuData} */
  const secretManagerItem = {
    quantityLabel: '',
    displayName: 'Secret Manager',
    sku: 'CP-SECRET-MANAGER',
    region: this.secretManager.location,
    quantity: activeSecretVersions ? activeSecretVersions : 0,
    displayDescription: 'Secret Manager',
    price: null,
    uniqueId: null,
    items: {
      editHook: {
        initialInputs: goog.object.clone(this.secretManager),
        product: 'secretmanager',
        tab: 'secret-manager'
      }
    }
  };
  this.CloudCalculator.addItemToCart(secretManagerItem, totalPrice);

  // Clear the data model
  this.setupSecretManager();
  this.resetForm(secretManagerForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Setup Prediction Api Model
 * @export
 */
ListingCtrl.prototype.setupPredictionApi = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    prediction: {number},
   *    bulk: {cloudpricingcalculator.DataWithUnit},
   *    streaming: {number}
   * }}
   */
  this.predictionApi = {
    submitted: false,
    prediction: '',
    bulk: {value: '', unit: this.DEFAULT_UNITS.bulk},
    streaming: ''
  };
};


/**
 * Add a Prediction API items to Cart
 *
 * @param {!angular.Form} predictionForm
 * @export
 */
ListingCtrl.prototype.addPredictionApi = function(predictionForm) {
  if (!(predictionForm.prediction.$viewValue != '' ||
        predictionForm.bulk.$viewValue != '' ||
        predictionForm.streaming.$viewValue != '') &&
      !predictionForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddPredictionApi');

  /** @type {number} */
  var prediction = parseFloat(this.predictionApi.prediction);
  /** @type {number} */
  var bulk = this.toDefaultUnit(
      this.predictionApi.bulk.value, this.predictionApi.bulk.unit,
      this.DEFAULT_UNITS.bulk);
  /** @type {number} */
  var streaming = parseFloat(this.predictionApi.streaming);
  /** @type {!cloudpricingcalculator.SkuData} */
  var predictionItem = null;

  if (this.isPositiveNumber_(prediction)) {
    predictionItem = {
      quantityLabel: '',
      displayName: 'Predictions',
      sku: 'CP-PREDICTION-PREDICTION',
      region: 'us',
      quantity: prediction,
      displayDescription: 'Predictions',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.predictionApi),
          product: 'predictionApi',
          tab: 'prediction-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(predictionItem);
  }
  if (this.isPositiveNumber_(bulk)) {
    predictionItem = {
      quantityLabel: '',
      displayName: 'Bulk Training Data',
      sku: 'CP-PREDICTION-BULK-TRAINING',
      region: 'us',
      quantity: bulk,
      displayDescription: 'Bulk Training Data',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.predictionApi),
          product: 'predictionApi',
          tab: 'prediction-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(predictionItem);
  }
  if (this.isPositiveNumber_(streaming)) {
    predictionItem = {
      quantityLabel: '',
      displayName: 'Streaming Training Data',
      sku: 'CP-PREDICTION-STREAMING-TRAINING',
      region: 'us',
      quantity: streaming,
      displayDescription: 'Streaming Training Data',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.predictionApi),
          product: 'predictionApi',
          tab: 'prediction-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(predictionItem);
  }

  // Clear the data model
  this.setupPredictionApi();
  this.resetForm(predictionForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Pub/Sub Model.
 * @export
 */
ListingCtrl.prototype.setupPubSub = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    topicName: string,
   *    volume: !cloudpricingcalculator.DataWithUnit,
   *    subscriptionCount: ?number,
   *    topicDays: ?number,
   *    acknowledgedCount: ?number,
   *    acknowledgedDays: ?number,
   *    snapshotCount: ?number,
   *    snapshotDays: ?number,
   * }}
   */
  this.pubSub = {
    submitted: false,
    topicName: '',
    volume: {value: null, unit: this.DEFAULT_UNITS.pubsubData},
    subscriptionCount: null,
    topicDays: null,
    acknowledgedCount: null,
    acknowledgedDays: null,
    snapshotCount: null,
    snapshotDays: null
  };
};


/**
 * Adds a Pub/Sub items to Cart.
 *
 * @param {!angular.Form} pubSubForm
 * @export
 */
ListingCtrl.prototype.addPubSub = function(pubSubForm) {
  if (this.isFormEmpty(pubSubForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddPubSub');

  const daysMonthly = 30;

  /** @type {number} */
  const volume = this.toDefaultUnit(
      this.pubSub.volume.value, this.pubSub.volume.unit,
      this.DEFAULT_UNITS.pubsubData);
  const volumeUnit =
      this.units_select.find(s => s.value == Number(this.pubSub.volume.unit));
  const topicName = this.pubSub.topicName;
  const subscriptionCount = this.pubSub.subscriptionCount || 0;
  const topicDays = this.pubSub.topicDays || 0;
  const acknowledgedCount = this.pubSub.acknowledgedCount || 0;
  const acknowledgedDays = this.pubSub.acknowledgedDays || 0;
  const snapshotCount = this.pubSub.snapshotCount || 0;
  const snapshotDays = this.pubSub.snapshotDays || 0;

  let quantity = volume * daysMonthly * (1 + subscriptionCount);
  const baseCost = this.CloudCalculator.calculateItemPrice(
      'CP-PUBSUB-MESSAGE-DELIVERY-BASIC', quantity, 'us');

  quantity = volume * topicDays;
  const topicRetentionCost = this.CloudCalculator.calculateItemPrice(
      'CP-PUBSUB-TOPIC-VOLUME', quantity, 'us');

  quantity = volume * acknowledgedCount * acknowledgedDays;
  const subscriptionRetentionCost = this.CloudCalculator.calculateItemPrice(
      'CP-PUBSUB-RETAINED-BACKLOG-VOLUME', quantity, 'us');

  quantity = 0.5 * 1 / daysMonthly * volume * snapshotDays * snapshotCount;
  const snapshotCost = this.CloudCalculator.calculateItemPrice(
      'CP-PUBSUB-SNAPSHOT-BACKLOG-VOLUME', quantity, 'us');

  const totalPrice =
      baseCost + topicRetentionCost + subscriptionRetentionCost + snapshotCost;

  /** @type {!cloudpricingcalculator.SkuData} */
  let pubSubItem;

  if (this.isPositiveNumber_(volume)) {
    pubSubItem = {
      quantityLabel: volumeUnit ? volumeUnit.name : '',
      displayName: '',
      sku: 'CP-PUBSUB',
      region: 'us',
      quantity: volume,
      displayDescription: topicName,
      price: totalPrice,
      items: {
        baseCost,
        topicRetentionCost,
        subscriptionRetentionCost,
        snapshotCost,
        editHook: {
          initialInputs: goog.object.clone(this.pubSub),
          product: 'pubSub',
          tab: 'pub-sub'
        }
      }
    };
    this.CloudCalculator.addItemToCart(pubSubItem, totalPrice);
  }

  // Clear the data model
  this.setupPubSub();
  this.resetForm(pubSubForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Dedicated InterconnectVpn Model.
 * @export
 */
ListingCtrl.prototype.setupDedicatedInterconnectVpn = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    tenGbitInterconnect: ?number,
   *    tenGbitInterconnectRegion: string,
   *    hundredGbitInterconnect: ?number,
   *    hundredGbitInterconnectRegion: string,
   *    interconnectAttachment: ?number,
   *    interconnectAttachmentRegion: string,
   * }}
   */
  this.dedicatedInterconnectVpn = {
    submitted: false,
    tenGbitInterconnect: null,
    tenGbitInterconnectRegion: this.retrieveLocation(),
    hundredGbitInterconnect: null,
    hundredGbitInterconnectRegion: this.retrieveLocation(),
    interconnectAttachment: null,
    interconnectAttachmentRegion: this.retrieveLocation()
  };
};

/**
 * Add a Dedicated InterconnectVpn items to Cart
 * @param {!angular.Form} dedicatedInterconncetVpnForm
 * @export
 */
ListingCtrl.prototype.addDedicatedInterconnectVpn = function(
    dedicatedInterconncetVpnForm) {
  if (!(dedicatedInterconncetVpnForm.tenGbitInterconnect.$viewValue != '' ||
        dedicatedInterconncetVpnForm.hundredGbitInterconnect.$viewValue != '' ||
        dedicatedInterconncetVpnForm.interconnectAttachment.$viewValue != '') &&
      !dedicatedInterconncetVpnForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddDedicatedInterconnectVpn');

  let tenGbitInterconnect = this.dedicatedInterconnectVpn.tenGbitInterconnect;
  let tenGbitInterconnectRegion =
      this.dedicatedInterconnectVpn.tenGbitInterconnectRegion;
  let hundredGbitInterconnect =
      this.dedicatedInterconnectVpn.hundredGbitInterconnect;
  let hundredGbitInterconnectRegion =
      this.dedicatedInterconnectVpn.hundredGbitInterconnectRegion;
  let interconnectAttachment =
      this.dedicatedInterconnectVpn.interconnectAttachment *
      this.TOTAL_BILLING_HOURS;
  let interconnectAttachmentRegion =
      this.dedicatedInterconnectVpn.interconnectAttachmentRegion;

  let tenGbitInterconnectCost = this.CloudCalculator.calculateItemPrice(
      'CP-INTERCONNECTVPN-DEDICATED-CIRCUIT-10GB', Number(tenGbitInterconnect),
      tenGbitInterconnectRegion);

  let hundredGbitInterconnectCost = this.CloudCalculator.calculateItemPrice(
      'CP-INTERCONNECTVPN-DEDICATED-CIRCUIT-100GB',
      Number(hundredGbitInterconnect), hundredGbitInterconnectRegion);

  let interconnectAttachmentCost = this.CloudCalculator.calculateItemPrice(
      'CP-INTERCONNECTVPN-ATTACHMENT', interconnectAttachment,
      interconnectAttachmentRegion);

  let interconnectVpnTotalCost = interconnectAttachmentCost +
      hundredGbitInterconnectCost + tenGbitInterconnectCost;

  if (interconnectVpnTotalCost > 0) {
    /** @type {!cloudpricingcalculator.SkuData} */
    const interconnectVpn = {
      quantityLabel: '',
      sku: 'CP-DEDICATED-INTERCONNECTVPN',
      quantity: 0,
      region: 'us',
      displayName: 'Interconnect & Cloud VPN',
      price: interconnectVpnTotalCost,
      displayDescription: 'Interconnect & Cloud VPN',
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.dedicatedInterconnectVpn),
          product: 'dedicatedInterconnectVpn',
          tab: 'interconnect-vpn',
        }
      }
    };
    this.CloudCalculator.addItemToCart(
        interconnectVpn, interconnectVpnTotalCost);
  }

  // Clear the data model
  this.setupDedicatedInterconnectVpn();
  this.resetForm(dedicatedInterconncetVpnForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Partner InterconnectVpn Model.
 * @export
 */
ListingCtrl.prototype.setupPartnerInterconnectVpn = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    partnerInterconnectAttachment: string,
   *    numberOfAttachments: ?number,
   * }}
   */
  this.partnerInterconnectVpn = {
    submitted: false,
    partnerInterconnectAttachment: '0.05417',
    numberOfAttachments: null
  };
};


/**
 * Add a Partner InterconnectVpn items to Cart
 * @param {!angular.Form} partnerInterconnectVpnForm
 * @export
 */
ListingCtrl.prototype.addPartnerInterconnectVpn = function(
    partnerInterconnectVpnForm) {
  if (!(partnerInterconnectVpnForm.partnerInterconnectAttachment.$viewValue !=
            '' ||
        partnerInterconnectVpnForm.numberOfAttachments.$viewValue != '') &&
      !partnerInterconnectVpnForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddPartnerInterconnectVpn');

  let partnerAttachment =
      Number(this.partnerInterconnectVpn.partnerInterconnectAttachment);
  let attachments = this.partnerInterconnectVpn.numberOfAttachments;

  let totalPrice = attachments * partnerAttachment * this.TOTAL_BILLING_HOURS;

  let partnerAttachmentName = '';
  goog.array.forEach(this.partnerInterconnectVpnAttachmentList, function(item) {
    if (item.value == partnerAttachment) {
      partnerAttachmentName = item.name;
    }
  });

  if (this.isPositiveNumber_(partnerAttachment && attachments)) {
    /** @type {!cloudpricingcalculator.SkuData} */
    const partnerInterconnectVpn = {
      displayName: 'Partner Interconnect & Cloud VPN',
      sku: 'CP-PARTNER-INTERCONNECTVPN',
      quantity: 0,
      region: '',
      quantityLabel: '',
      price: null,
      displayDescription: 'Partner Interconnect & Cloud VPN',
      uniqueId: null,
      items: {
        partnerAttachmentName: partnerAttachmentName,
        editHook: {
          initialInputs: goog.object.clone(this.partnerInterconnectVpn),
          product: 'partnerInterconnectVpn',
          tab: 'interconnect-vpn',
        }
      }
    };
    this.CloudCalculator.addItemToCart(partnerInterconnectVpn, totalPrice);
  }

  // Clear the data model
  this.setupPartnerInterconnectVpn();
  this.resetForm(partnerInterconnectVpnForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Cloud Vpn Model.
 * @export
 */
ListingCtrl.prototype.setupCloudVpn = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    location: string,
   *    vpn: ?number
   * }}
   */
  this.cloudVpn = {
    submitted: false,
    location: this.retrieveLocation(),
    vpn: null
  };
};


/**
 * Add a Cloud Vpn items to Cart
 * @param {!angular.Form} vpnForm
 * @export
 */
ListingCtrl.prototype.addVpn = function(vpnForm) {
  if (!(vpnForm.vpn.$viewValue != '' || vpnForm.location.$viewValue != '') &&
      !vpnForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddVpn');

  let vpn = parseFloat(this.cloudVpn.vpn) * this.TOTAL_BILLING_HOURS;
  let location = this.cloudVpn.location;
  let totalPrice =
      this.CloudCalculator.calculateItemPrice('CP-VPN', vpn, location);

  if (this.isPositiveNumber_(vpn)) {
    const vpnItem = {
      quantityLabel: 'tunnel/hours',
      displayName: 'Cloud VPN',
      sku: 'CP-VPN',
      region: location,
      quantity: vpn,
      displayDescription: 'VPN',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.cloudVpn),
          product: 'vpn',
          tab: 'interconnect-vpn'
        }
      }
    };
    this.CloudCalculator.addItemToCart(vpnItem, totalPrice);
  }

  // Clear the data model
  this.setupCloudVpn();
  this.resetForm(vpnForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Dataflow Model.
 * @export
 */
ListingCtrl.prototype.setupDataflow = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    jobType: string,
   *    dataProcessed: !cloudpricingcalculator.DataWithUnit,
   *    location: string,
   *    instance: string,
   *    custom : !object,
   *    hoursPerMonth: number,
   *    workerCount: number,
   *    storageType: string,
   *    storage: !cloudpricingcalculator.DataWithUnit,
   *    addGPUs: boolean,
   *    gpuCount: number,
   *    gpuType : string,
   *    series : string,
   *    family : string
   * }}
   */
  this.dataflow = {
    submitted: false,
    jobType: 'batch',
    dataProcessed:
        {value: null, unit: this.DEFAULT_UNITS.dataflowDataProcessed},
    hoursPerMonth: 1,
    location: this.retrieveLocation('us-central1', this.dataflowRegionList),
    workerType: 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-1',
    custom: {cpu: 1, ram: 3.75},
    workerCount: 1,
    storageType: 'pd',
    storage: {value: 100, unit: this.DEFAULT_UNITS.dataflowPd},
    addGPUs: false,
    gpuCount: 0,
    gpuType: '',
    series: 'n1',
    family: 'gp'
  };
};


/**
 * Add a Dataflow items to Cart
 *
 * @param {!angular.Form} dataflowForm
 * @export
 */
ListingCtrl.prototype.addDataflow = function(dataflowForm) {
  if (!dataflowForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddDataflow');
  /** @type {string} */
  const jobType = this.dataflow.jobType;
  let sku = this.dataflow.workerType;
  /** @type {number} */
  const hours = this.dataflow.hoursPerMonth;
  const workers = this.dataflow.workerCount;
  let ram = null;
  let cores = null;
  if (sku == 'n1-custom') {
    ram = this.dataflow.custom.ram;
    cores = this.dataflow.custom.cpu;
    let coresMib = this.toDefaultUnit(ram, 2, 1);
    sku = sku + '-' + cores + '-' + coresMib;
  } else {
    ram = this.CloudCalculator.getRAMValue(sku);
    cores = this.CloudCalculator.getCoresNumber(sku);
  }
  const vcpuCount = hours * workers * cores;
  const memoryCount = hours * workers * ram;
  const dataProcessed = this.toDefaultUnit(
      this.dataflow.dataProcessed.value, this.dataflow.dataProcessed.unit,
      this.DEFAULT_UNITS.dataflowDataProcessed);
  /** @type {number} */
  let storage = this.toDefaultUnit(
      this.dataflow.storage.value, this.dataflow.storage.unit,
      this.DEFAULT_UNITS.dataflowPd);
  this.dataflow.storage.value = storage;
  this.dataflow.storage.unit = this.DEFAULT_UNITS.dataflowPd;
  storage *= hours * workers;
  /** @type {string} */
  const location = this.dataflow.location;
  /** @type {string} */
  const storageType = this.dataflow.storageType;
  /** @type {number} */
  let totalPrice = 0;
  /** @type {string} */
  const basicSku = 'CP-DATAFLOW-' + jobType.toUpperCase();
  // Firstly add vCPU's cost.
  /** @type {string} */
  const vcpuSku = basicSku + '-VCPU';
  totalPrice +=
      this.CloudCalculator.calculateItemPrice(vcpuSku, vcpuCount, location);
  // Than add memory cost.
  /** @type {string} */
  const memorySku = basicSku + '-MEMORY';
  totalPrice +=
      this.CloudCalculator.calculateItemPrice(memorySku, memoryCount, location);
  // Data processing cost
  const dataProcessedCost = this.CloudCalculator.calculateItemPrice(
      `${basicSku}-DATA-PROCESSED`, dataProcessed, location);
  totalPrice += dataProcessedCost;
  // After that add storage cost.
  /** @type {string} */
  const storageSku = basicSku + '-STORAGE-' + storageType.toUpperCase();
  totalPrice +=
      this.CloudCalculator.calculateItemPrice(storageSku, storage, location);
  const instanceName =
      sku.replace('CP-COMPUTEENGINE-VMIMAGE-', '').toLowerCase();
  const gpuType = this.dataflow.gpuType || '';
  // Calculate GPU cost
  let gpuCost = 0;
  const gpuCount = this.dataflow.gpuCount * hours;
  if (this.dataflow.addGPUs) {
    let gpuSKU = this.BASE_DATAFLOWGPU_SKU + gpuType;
    gpuCost =
        this.CloudCalculator.calculateItemPrice(gpuSKU, gpuCount, location, 0);
  }
  totalPrice += gpuCost;
  const displayDescription = workers.toString() + ' x ' + instanceName +
      ' workers in ' + jobType.charAt(0).toUpperCase() + jobType.slice(1) +
      ' Mode';
  /** @type {!cloudpricingcalculator.SkuData} */
  const dataflowItem = {
    quantityLabel: '',
    displayName: 'Dataflow',
    sku: 'CP-DATAFLOW-GENERAL',
    region: location,
    quantity: vcpuCount,
    displayDescription: displayDescription,
    price: null,
    uniqueId: null,
    items: {
      gpuCount: gpuCount,
      gpuCost: gpuCost,
      gpuType: gpuType,
      vcpuHours: vcpuCount,
      ramHours: memoryCount,
      storageHours: storage,
      dataProcessed: dataProcessed,
      editHook: {
        initialInputs: goog.object.clone(this.dataflow),
        product: 'dataflow',
        tab: 'cloud-dataflow'
      }
    }
  };

  this.CloudCalculator.addItemToCart(dataflowItem, totalPrice);

  // Clear the data model
  this.setupDataflow();
  this.resetForm(dataflowForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up workflows Model.
 * @export
 */
ListingCtrl.prototype.setupWorkflows = function() {
  /**
   * @type {{
   * submitted: boolean,
   * internalSteps: !cloudpricingcalculator.DataWithUnit,
   * externalSteps: !cloudpricingcalculator.DataWithUnit,
   * }}
   */
  this.workflows = {
    submitted: false,
    internalSteps: {value: null, unit: 3},
    externalSteps: {value: null, unit: 3}
  };
};

/**
 * Adds a workflows items to Cart
 *
 * @param {!angular.Form} workflowsForm
 * @export
 */
ListingCtrl.prototype.addWorkflows = function(workflowsForm) {
  if (!workflowsForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddWorkflows');
  const internalSteps = this.toDefaultNumber_(
      this.workflows.internalSteps.value, this.workflows.internalSteps.unit);
  const externalSteps = this.toDefaultNumber_(
      this.workflows.externalSteps.value, this.workflows.externalSteps.unit);
  if (this.isPositiveNumber_(internalSteps)) {
    /** @type {!cloudpricingcalculator.SkuData} */
    const workflowsItem = {
      quantityLabel: 'steps',
      displayDescription: 'Internal steps',
      displayName: 'Workflows',
      sku: 'CP-WORKFLOWS-INTERNAL-STEPS',
      region: 'us',
      quantity: internalSteps,
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.workflows),
          product: 'workflows',
          tab: 'workflows'
        }
      }
    };
    this.CloudCalculator.addItemToCart(workflowsItem);
  }
  if (this.isPositiveNumber_(externalSteps)) {
    /** @type {!cloudpricingcalculator.SkuData} */
    const workflowsItem = {
      quantityLabel: 'steps',
      displayDescription: 'External steps',
      displayName: 'Workflows',
      sku: 'CP-WORKFLOWS-EXTERNAL-STEPS',
      region: 'us',
      quantity: externalSteps,
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.workflows),
          product: 'workflows',
          tab: 'workflows'
        }
      }
    };
    this.CloudCalculator.addItemToCart(workflowsItem);
  }
  // Clear the data model
  this.setupWorkflows();
  this.resetForm(workflowsForm);
  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up RecommendationsAi Model.
 * @export
 */
ListingCtrl.prototype.setupRecommendationsAi = function() {
  /**
   * @type {{
   * submitted: boolean,
   * predictionRequests: ?number,
   * trainingNodeHours: number,
   * tunningNodeHours: number,
   * }}
   */
  this.recommendationsAi = {
    submitted: false,
    predictionRequests: 5000000,
    trainingNodeHours: 190,
    tunningNodeHours: 25,
  };
};

/**
 * Adds a RecommendationsAi items to Cart
 *
 * @param {!angular.Form} recommendationsAiForm
 * @export
 */
ListingCtrl.prototype.addRecommendationsAi = function(recommendationsAiForm) {
  if (this.isFormEmpty(recommendationsAiForm)) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddRecommendationsAi');
  const predictionRequests = this.recommendationsAi.predictionRequests / 1000;
  const trainingNodeHours = this.recommendationsAi.trainingNodeHours;
  const tunningNodeHours = this.recommendationsAi.tunningNodeHours;
  /** @type {number} */
  let totalPrice = 0;
  if (this.isPositiveNumber_(predictionRequests)) {
    totalPrice += this.CloudCalculator.calculateTieredSKUPrice(
        'CP-RECOMMENDATIONS-AI-PREDICTIONS', predictionRequests);
  }
  if (this.isPositiveNumber_(trainingNodeHours)) {
    totalPrice += this.CloudCalculator.calculateItemPrice(
        'CP-RECOMMENDATIONS-AI-TRAINING', trainingNodeHours, 'us');
  }
  if (this.isPositiveNumber_(tunningNodeHours)) {
    totalPrice += this.CloudCalculator.calculateItemPrice(
        'CP-RECOMMENDATIONS-AI-TRAINING', tunningNodeHours, 'us');
  }
  const recommendationsAiItem = {
    sku: 'CP-RECOMMENDATIONS-AI',
    quantity: trainingNodeHours,
    region: '',
    displayName: '',
    displayDescription: 'Recommendations AI',
    price: totalPrice,
    quantityLabel: '',
    uniqueId: null,
    items: {
      predictionRequests: predictionRequests,
      trainingNodeHours: trainingNodeHours,
      tunningNodeHours: tunningNodeHours,
      editHook: {
        initialInputs: goog.object.clone(this.recommendationsAi),
        product: 'recommendationsAi',
        tab: 'recommendationsAi'
      }
    }
  };
  this.CloudCalculator.addItemToCart(recommendationsAiItem, totalPrice);

  // Clear the data model
  this.setupRecommendationsAi();
  this.resetForm(recommendationsAiForm);
  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Bigtable Model.
 * @export
 */
ListingCtrl.prototype.setupBigtable = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    name: string,
   *    nodes: number,
   *    location: string,
   *    ssd: !cloudpricingcalculator.DataWithUnit,
   *    hdd: !cloudpricingcalculator.DataWithUnit,
   *    hours: number,
   *    days: number,
   *    minutes: number,
   *    timeType: string,
   *    timeMode: string,
   *    daysMonthly: number,
   * }}
   */
  this.bigtable = {
    submitted: false,
    name: '',
    nodes: '',
    location: this.retrieveLocation('us-central1', this.bigtableRegionList),
    ssd: {value: '', unit: this.DEFAULT_UNITS.btSsd},
    hdd: {value: '', unit: this.DEFAULT_UNITS.btHdd},
    hours: 24,
    days: 7,
    minutes: 1440,
    timeType: 'hours',
    timeMode: 'day',
    daysMonthly: 30,
  };
};


/**
 * Add a Bigtable items to Cart
 *
 * @param {!angular.Form} bigtableForm
 * @export
 */
ListingCtrl.prototype.addBigtable = function(bigtableForm) {
  if (this.isFormEmpty(bigtableForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddBigtable');

  /** @type {number} */
  let hours = 0;
  switch (this.bigtable.timeType) {
    case 'hours':
      hours = this.bigtable.hours;
      break;
    case 'minutes':
      hours = this.bigtable.minutes / 60;
      break;
    case 'days':
      hours = this.bigtable.daysMonthly * 24;
      break;
  }

  /** @type {number} */
  const hoursMultiplier =
      this.bigtable.timeMode == 'day' ? this.bigtable.days * this.WEEKS : 1;
  /**  @type {number} */
  const hoursPerMonth = hours * hoursMultiplier;

  /** @type {number} */
  let nodes = parseFloat(this.bigtable.nodes);
  /** @type {string} */
  const location = this.bigtable.location;
  /** @type {number} */
  let ssd = this.toDefaultUnit(
      this.bigtable.ssd.value, this.bigtable.ssd.unit,
      this.DEFAULT_UNITS.btSsd);
  this.bigtable.ssd.value = ssd;
  this.bigtable.ssd.unit = this.DEFAULT_UNITS.btSsd;
  /** @type {number} */
  let hdd = this.toDefaultUnit(
      this.bigtable.hdd.value, this.bigtable.hdd.unit,
      this.DEFAULT_UNITS.btHdd);
  this.bigtable.hdd.value = hdd;
  this.bigtable.hdd.unit = this.DEFAULT_UNITS.btHdd;
  /** @type {!cloudpricingcalculator.SkuData} */
  let bigtableItem;
  /** @type {number} */
  let totalPrice = 0;

  if (this.isPositiveNumber_(nodes)) {
    // nodes are charged per hour
    nodes *= hoursPerMonth;
    totalPrice += this.CloudCalculator.calculateItemPrice(
        'CP-BIGTABLE-NODES', nodes, location);
  }

  if (this.isPositiveNumber_(ssd)) {
    ssd *= this.TB_TO_GB;
    totalPrice += this.CloudCalculator.calculateItemPrice(
        'CP-BIGTABLE-SSD', ssd, location);
  }

  if (this.isPositiveNumber_(hdd)) {
    hdd *= this.TB_TO_GB;
    totalPrice += this.CloudCalculator.calculateItemPrice(
        'CP-BIGTABLE-HDD', hdd, location);
  }

  bigtableItem = {
    quantityLabel: '',
    displayName: 'Cloud Bigtable',
    sku: 'CP-BIGTABLE-GENERAL',
    region: location,
    quantity: hoursPerMonth,
    displayDescription: this.bigtable.name,
    items: {
      editHook: {
        initialInputs: goog.object.clone(this.bigtable),
        product: 'bigtable',
        tab: 'bigtable'
      }
    }
  };

  this.CloudCalculator.addItemToCart(bigtableItem, totalPrice);

  // Clear the data model
  this.setupBigtable();
  this.resetForm(bigtableForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Setup Dataproc Model
 * @export
 */
ListingCtrl.prototype.setupDataproc = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    name: string,
   *    instanceLocation: string,
   *    masterVM: string,
   *    enableHA: boolean,
   *    customMaster: {cpu: number, ram: number},
   *    workersVM: string,
   *    customWorker: {cpu: number, ram: number},
   *    workersCount: number,
   *    preemptibleWorkersCount: number,
   *    hoursPerMonth: number,
   *    addGceCost: boolean,
   *    storageLocation: string,
   *    storageType: string,
   *    pdStorage: !cloudpricingcalculator.DataWithUnit,
   *    ssd: number
   * }}
   */
  this.dataproc = {
    submitted: false,
    name: '',
    instanceLocation: this.retrieveLocation(),
    masterVM: 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-4',
    enableHA: false,
    customMaster: {cpu: 1, ram: 3.75},
    workersVM: 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-4',
    customWorker: {cpu: 1, ram: 3.75},
    workersCount: 0,
    preemptibleWorkersCount: 0,
    hoursPerMonth: 0,
    addGceCost: true,
    storageLocation: this.retrieveLocation(),
    storageType: 'storage',
    pdStorage: {value: 500, unit: this.DEFAULT_UNITS.dataprocPd},
    ssd: 0
  };
};


/**
 * Add a Dataproc items to Cart
 *
 * @param {!angular.Form} dataprocForm
 * @export
 */
ListingCtrl.prototype.addDataproc = function(dataprocForm) {
  if (this.isFormEmpty(dataprocForm)) {
    return;
  }

  const enableHA = this.dataproc.enableHA;
  const haMultiplier = enableHA ? 3 : 1;
  let masterSku = this.dataproc.masterVM;
  if (masterSku === 'custom') {
    masterSku = 'CP-COMPUTEENGINE-VMIMAGE-N1-CUSTOM-' +
        this.dataproc.customMaster.cpu + '-' +
        this.dataproc.customMaster.ram * 1024;
  }
  const masterSeries = this.CloudCalculator.getFamilyFromSku(masterSku);
  const masterFamily = this.getFamilyFromSeries(masterSeries);
  let workerSku = this.dataproc.workersVM;
  if (workerSku === 'custom') {
    workerSku = 'CP-COMPUTEENGINE-VMIMAGE-N1-CUSTOM-' +
        this.dataproc.customWorker.cpu + '-' +
        this.dataproc.customWorker.ram * 1024;
  }
  const workerSeries = this.CloudCalculator.getFamilyFromSku(workerSku);
  const workerFamily = this.getFamilyFromSeries(workerSeries);
  const masterCPUCount = this.CloudCalculator.getCoresNumber(masterSku);
  const workerCPUCount = this.CloudCalculator.getCoresNumber(workerSku);
  const masters = 1 * haMultiplier;
  const workers = parseFloat(this.dataproc.workersCount) || 0;
  const pmWorkers = parseFloat(this.dataproc.preemptibleWorkersCount) || 0;
  const totalHours = parseFloat(this.dataproc.hoursPerMonth);
  const totalCPU =
      (masters) * masterCPUCount + (workers + pmWorkers) * workerCPUCount;
  const totalAmount = totalCPU * totalHours;
  const storageType = this.dataproc.storageType;
  const ssd = this.dataproc.ssd;
  const name = this.dataproc.name;
  const instanceLocation = this.dataproc.instanceLocation;
  const storageLocation = this.dataproc.storageLocation;
  const pdStorage = this.toDefaultUnit(
      this.dataproc.pdStorage.value, this.dataproc.pdStorage.unit,
      this.DEFAULT_UNITS.dataprocPd);
  const pdStorageTimeProvisioned = pdStorage * (workers + pmWorkers + masters) *
      totalHours / this.TOTAL_BILLING_HOURS;
  const groupId = Math.random();
  /** @type {!cloudpricingcalculator.SkuData} */
  let dataprocItem;

  if (this.isPositiveNumber_(totalAmount)) {
    dataprocItem = {
      quantityLabel: '',
      displayName: 'Dataproc',
      sku: 'CP-DATAPROC',
      region: 'us',
      quantity: totalAmount,
      displayDescription: name,
      hasAccItems: true,
      items: {
        totalCPU: totalCPU,
        totalHours: totalHours,
        pdStorageTimeProvisioned,
        groupId,
        editHook: {
          initialInputs: goog.object.clone(this.dataproc),
          product: 'dataproc',
          tab: 'dataproc'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dataprocItem);
    // Add GCE charges
    if (this.dataproc.addGceCost) {
      // Add master vm
      goog.object.extend(this.computeServer, {
        quantity: enableHA ? 3 : 1,
        class: 'regular',
        family: masterFamily,
        series: masterSeries.toLowerCase(),
        label: 'Dataproc master node',
        ssd: ssd,
        instance: masterSku,
        custom: goog.object.clone(this.dataproc.customMaster),
        customGuestCpus: this.dataproc.customMaster.cpu,
        inputMemoryGb: this.dataproc.customMaster.ram,
        hours: this.dataproc.hoursPerMonth,
        timeType: 'hours',
        timeMode: 'month',
        readonly: true,
        location: instanceLocation,
        groupId,
        addSud: true
      });
      this.addComputeServer();
      // Add workers vm
      // First add minimum required normal workers if using preemtible VMs
      if (workers > 0) {
        goog.object.extend(this.computeServer, {
          quantity: workers,
          class: 'regular',
          family: workerFamily,
          series: workerSeries.toLowerCase(),
          label: 'Dataproc worker nodes',
          ssd: ssd,
          instance: workerSku,
          custom: goog.object.clone(this.dataproc.customWorker),
          customGuestCpus: this.dataproc.customWorker.cpu,
          inputMemoryGb: this.dataproc.customWorker.ram,
          hours: this.dataproc.hoursPerMonth,
          timeType: 'hours',
          timeMode: 'month',
          readonly: true,
          location: instanceLocation,
          groupId,
          addSud: true
        });
        this.addComputeServer();
      }
      if (pmWorkers > 0) {
        goog.object.extend(this.computeServer, {
          quantity: pmWorkers,
          os: 'free',
          class: 'preemptible',
          label: 'Preemptible Dataproc worker nodes',
          ssd: ssd,
          instance: workerSku,
          custom: goog.object.clone(this.dataproc.customWorker),
          customGuestCpus: this.dataproc.customWorker.cpu,
          inputMemoryGb: this.dataproc.customWorker.ram,
          hours: this.dataproc.hoursPerMonth,
          timeType: 'hours',
          timeMode: 'month',
          readonly: true,
          location: instanceLocation,
          groupId,
        });
        this.addComputeServer();
      }
      // Add 500 gb of PD for each vm.
      this.setupPersistentDiskData();
      this.persistentDisk[storageType].value = pdStorageTimeProvisioned;
      this.persistentDisk[storageType].unit = 2;
      goog.object.extend(this.persistentDisk, {
        readonly: true,
        location: storageLocation,
        groupId,
        accompaniedProduct: 'Dataproc'
      });
      this.addPersistentDisk();
    }
  }

  // Clear the data model
  this.setupDataproc();
  this.resetForm(dataprocForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Validate DataprocForm.
 *
 * @param {!angular.Form} DataprocForm
 * @export
 */

ListingCtrl.prototype.validateDataprocForm = function(DataprocForm) {
  const customMasterCpu = DataprocForm.customMasterCpu ?
      Number(DataprocForm.customMasterCpu.$viewValue) :
      0;
  const customWorkerCpu = DataprocForm.customWorkerCpu ?
      Number(DataprocForm.customWorkerCpu.$viewValue) :
      0;

  let validCustomMasterCpu = true;
  let validCustomWorkerCpu = true;
  if (this.dataproc.masterVM == 'custom')
    if (customMasterCpu > 1)
      if (customMasterCpu % 2 !== 0) {
        validCustomMasterCpu = false;
      }

  if (this.dataproc.workersVM == 'custom')
    if (customWorkerCpu > 1)
      if (customWorkerCpu % 2 !== 0) {
        validCustomWorkerCpu = false;
      }

  this.DataprocFormValid =
      validCustomMasterCpu && validCustomWorkerCpu && DataprocForm.$valid;
};

/**
 * Sets up Container Engine Model.
 * @export
 */
ListingCtrl.prototype.setupContainerEngine = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    quantity: number,
   *    os: string,
   *    zonalClusterCount: ?number,
   *    regionalClusterCount: ?number,
   *    label: string,
   *    instance: string,
   *    extendedMemory: boolean,
   *    class : string,
   *    family: string,
   *    series: string,
   *    hours: number,
   *    days: number,
   *    ssd: number,
   *    custom: !object,
   *    location: string,
   *    minutes: number,
   *    timeType: string,
   *    daysMonthly: number,
   *    addGPUs: boolean,
   *    enableGrid: boolean,
   *    gpuCount: number,
   *    gpuType: string,
   *    addSud: boolean,
   *    bootDiskType: string,
   *    bootDiskSize: number
   * }}
   */
  this.containerEngine = {
    submitted: false,
    tier: 'advanced',
    quantity: '',
    os: 'container',
    zonalClusterCount: null,
    regionalClusterCount: null,
    label: '',
    class: 'regular',
    family: 'gp',
    series: 'e2',
    instance: 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-1',
    extendedMemory: false,
    hours: 24,
    days: 7,
    ssd: 0,
    custom: {cpu: 1, ram: 0.9},
    location: this.retrieveLocation(),
    minutes: 1440,
    timeType: 'hours',
    timeMode: 'day',
    daysMonthly: 30,
    addGPUs: false,
    enableGrid: false,
    gpuCount: 0,
    cud: 0,
    gpuType: '',
    addSud: false,
    bootDiskType: 'STORAGE-PD-CAPACITY',
    bootDiskSize: 100
  };
  this.gkeCustomLimit(this.containerEngine.custom.cpu);
  this.applyGpuRestriction('containerEngine');
  this.applyMemoryOptimizedVMCUDRestriction('containerEngine');
  this.generateLocalSsdOptions('containerEngine');
};


/**
 * Adds a Container Engine items to Cart.
 *
 * @param {!angular.Form} containerEngineForm
 * @export
 */
ListingCtrl.prototype.addContainerEngine = function(containerEngineForm) {
  if (!containerEngineForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddContainerEngine');
  /**
   * @type {number}
   */
  const hours = this.containerEngine.timeType == 'hours' ?
      this.containerEngine.hours :
      this.containerEngine.timeType == 'minutes' ?
      this.containerEngine.minutes / 60 :
      this.containerEngine.daysMonthly * 24;
  /** @type {number} */
  const hoursMultiplier = this.containerEngine.timeMode == 'day' ?
      this.containerEngine.days * this.WEEKS :
      1;
  /**
   * Calculate the days / month based on average
   * @type {number}
   */

  let hoursPerMonth = hours * hoursMultiplier;

  /**
   * @type {number}
   */
  const quantity = this.containerEngine.quantity;

  let cores = 0;
  const family = this.containerEngine.series.toUpperCase();
  /**
   * @type {string}
   */
  let sku = this.containerEngine.instance;
  const custMaxRam =
      this.gceMachineFamilyConfig[this.containerEngine
                                      .family][this.containerEngine
                                                   .series]['maxCustomRamRatio'] *
      this.containerEngine.custom.cpu;
  let isMemoryExtended = this.containerEngine.extendedMemory &&
      (this.containerEngine.custom.ram > custMaxRam);
  /** @const {string} */
  const PB_SKU = '-PREEMPTIBLE';

  /**
   * @type {string}
   */
  let title = quantity + ' x ' + this.containerEngine.label;
  if (sku == 'custom') {
    sku = this.generateCustomInstanceSkuName('containerEngine');
    cores = this.containerEngine.custom.cpu;
  }

  /**
   * @type {string}
   */
  const instanceName =
      sku.replace('CP-COMPUTEENGINE-VMIMAGE-', '').toLowerCase();
  cores = cores > 0 ? cores : this.CloudCalculator.getCoresNumber(sku);
  /**
   * @type {string}
   */
  const region = this.containerEngine.location;
  /**
   * @type {number}
   */
  let perHostPrice = 0;
  const cudTerm = this.containerEngine.cud;
  /** @type {boolean} */
  const isCud = this.isPositiveNumber_(cudTerm);
  let sustainedUse = false;
  let isInstanceCommitted = false;
  let termText = '';
  let sustainedPriceItem = {};
  let sustainedUseDiscount = null;
  /** @type {string} */
  const vmClass = this.computeServer.class;
  /** @type {boolean} */
  const isPreemptibleAvailable = this.checkPmvAvailability();
  let isPreemptible =
      vmClass.toLowerCase() === 'preemptible' && isPreemptibleAvailable;
  const bootDiskType = this.containerEngine.bootDiskType;
  const bootDiskSize = this.containerEngine.bootDiskSize;
  const groupId = Math.random();
  const storageType = this.gkeBootDiskTypes[bootDiskType].pd;

  if (isCud) {
    hoursPerMonth = this.TOTAL_BILLING_HOURS;
    perHostPrice =
        this.CloudCalculator.getCUDCost(sku, region, cudTerm) * hoursPerMonth;

    termText = cudTerm + ' Year' + (parseInt(cudTerm, 10) == 3 ? 's' : '');
    this.containerEngine.class = 'regular';
    isInstanceCommitted = true;
  } else {
    /** @type {string} */
    let vmClass = this.containerEngine.class;

    /**
     * @type {boolean}
     */
    let isPreemptibleAvailable =
        this.checkPmvAvailability(this.containerEngine);
    isPreemptible =
        vmClass.toLowerCase() === 'preemptible' && isPreemptibleAvailable;

    if (isPreemptible) {
      sku = sku + PB_SKU;
    }
    sustainedPriceItem =
        this.CloudCalculator.calculateSustainedUseDiscountPrice(
            sku, hoursPerMonth, region, quantity);

    perHostPrice = sustainedPriceItem.totalPrice;
    sustainedUseDiscount = sustainedPriceItem.cumulativeDiscount;
    if ((hoursPerMonth > this.CloudCalculator.getSustainedUseBase() *
             this.TOTAL_BILLING_HOURS) &&
        !isPreemptible && sustainedUseDiscount > 0) {
      sustainedUse = true;
    }
  }
  // Calculate the total hours
  const totalHoursPerMonth = quantity * hoursPerMonth;

  // Calculate Os price and cost
  let os = this.containerEngine.os;
  const osPrice = os === 'win' ? this.CloudCalculator.getOsPrice(os, sku) : 0;
  const osCost = osPrice * totalHoursPerMonth;

  // Calculate GPU cost
  let gpuCost = 0;
  let nvidiaGridCost = 0;
  /** @const {string} */
  const gpuType = this.containerEngine.gpuType || '';
  const gpuCount = this.checkAvailabilityForThisFamily(
                       'isGpuAvailable', this.containerEngine) ?
      this.containerEngine.gpuCount * totalHoursPerMonth :
      0;
  let isGpuCommitted = false;
  /** @type {boolean} */
  const isGpuAvailableForRegion =
      this.checkGpuAvailability(gpuType, 'containerEngine');
  if (this.containerEngine.addGPUs &&
      !(this.lockGpu.containerEngine ||
        this.isSharedInstance.containerEngine) &&
      !isGpuAvailableForRegion) {
    let gpuSKU = this.BASE_GPU_SKU + gpuType;
    if (isPreemptible) {
      gpuSKU = gpuSKU + PB_SKU;
    }
    if (isCud && this.CloudCalculator.checkForCommitment(gpuSKU, cudTerm)) {
      isGpuCommitted = true;
      gpuSKU = gpuSKU + '-CUD-' + cudTerm + '-YEAR';
    }
    gpuCost =
        this.CloudCalculator.calculateItemPrice(gpuSKU, gpuCount, region, 0);
    if (sustainedUse) {
      gpuCost = gpuCost * (1 - sustainedUseDiscount);
    } else if (isCud && !isGpuCommitted) {
      gpuCost = gpuCost * 0.7;
    }
    // calculate grid costs
    if (this.containerEngine.enableGrid && gpuType != 'NVIDIA_TESLA_K80' &&
        gpuType != 'NVIDIA_TESLA_V100') {
      nvidiaGridCost = this.CloudCalculator.calculateItemPrice(
          'GPU_NVIDIA_GRID_LICENSE', gpuCount, region, 0);
    }
  }
  // Calculate the total price
  let gceCost = quantity * perHostPrice;
  /** @type {number} */
  const zonalClusters =
      Math.max(0, (this.containerEngine.zonalClusterCount || 0) - 1);
  const regionalClusters = this.containerEngine.regionalClusterCount || 0;
  const containerPrice = this.CloudCalculator.calculateItemPrice(
      'CP-GKE-CONTAINER-MANAGMENT-COST', zonalClusters + regionalClusters, 'us',
      0);
  const containerCost = containerPrice * hoursPerMonth;
  /** @type {number} */
  const ssd = this.containerEngine.ssd;
  const ssdSku = 'CP-COMPUTEENGINE-LOCAL-SSD';
  let isSsdCommitted = false;
  if (isCud && !isPreemptible &&
      this.CloudCalculator.checkForCommitment(ssdSku, cudTerm)) {
    isSsdCommitted = true;
  }
  const ssdPrice =
      this.CloudCalculator.getSsdPrice(region, isPreemptible, cudTerm);
  // each ssd solid disk has 375 gb
  const ssdCost = ssdPrice * totalHoursPerMonth * ssd * 375;
  // Calculate the Extended Memory cost.
  let extendedMemoryCost = 0;
  let extendedMemoryVolume = 0;
  if (isMemoryExtended) {
    extendedMemoryCost =
        (this.CloudCalculator.getExtendedCost(sku, region, family) *
         totalHoursPerMonth);
    if (sustainedUse) {
      extendedMemoryCost = extendedMemoryCost * (1 - sustainedUseDiscount);
    }
    if (isCud) {
      let maxSud = this.CloudCalculator.getMaxSudForSeries(family);
      extendedMemoryCost = extendedMemoryCost * maxSud;
      gceCost += extendedMemoryCost;
    }
    extendedMemoryVolume = this.CloudCalculator.getExtendedMemoryVolume(
        this.containerEngine.custom.cpu, this.containerEngine.custom.ram,
        family);
  }
  // Calculate the total price
  const totalPrice =
      gceCost + ssdCost + containerCost + gpuCost + nvidiaGridCost + osCost;

  const effectiveRate = totalPrice / totalHoursPerMonth;
  const coreHours = totalHoursPerMonth * cores;
  /** @type {!cloudpricingcalculator.SkuData} */
  const newItem = {
    sku: sku,
    quantity: totalHoursPerMonth,
    quantityLabel: 'total hours per month',
    region: this.fullRegion[region],
    displayName: title,
    displayDescription: instanceName,
    price: null,
    uniqueId: null,
    hasAccItems: true,
    items: {
      sustainedUse: sustainedUse,
      sustainedUseDiscount: sustainedUseDiscount,
      effectiveRate: effectiveRate,
      gceCost: gceCost,
      ssdCost: ssdCost,
      nvidiaGridCost: nvidiaGridCost,
      osCost: osCost,
      containerCost: containerCost,
      ssd: ssd,
      extendedMemoryCost: extendedMemoryCost,
      extendedMemoryVolume: extendedMemoryVolume,
      hoursPerMonth: hoursPerMonth,
      isMemoryExtended: isMemoryExtended,
      isCud: isCud,
      gpuCountVailCount: gpuCount,
      isPreemptible: isPreemptible,
      machineClass: (this.containerEngine.class).toUpperCase(),
      containerMode: this.containerEngine.containerEdition,
      detailedView: isCud ? null : sustainedPriceItem.detailedView,
      gpuCost: gpuCost,
      gpuCount: this.containerEngine.gpuCount,
      gpuType: gpuType.replace(/_/g, ' '),
      coreHours: coreHours,
      termText: termText,
      isInstanceCommitted: isInstanceCommitted,
      isSsdCommitted: isSsdCommitted,
      isGpuCommitted: termText,
      isSharedInstance: this.isSharedInstance.containerEngine,
      lockGpu: this.lockGpu.containerEngine,
      family: this.containerEngine.family,
      isGpuAvailableForRegion: isGpuAvailableForRegion,
      groupId,
      editHook: {
        initialInputs: goog.object.clone(this.containerEngine),
        product: 'containerEngine',
        tab: 'gke-standard'
      }
    }
  };

  this.CloudCalculator.addItemToCart(newItem, totalPrice);

  // Add accompanying Persistent Disk
  this.setupPersistentDiskData();
  this.persistentDisk[storageType].value = bootDiskSize;
  this.persistentDisk[storageType].unit = this.DEFAULT_UNITS.pdStorage;
  goog.object.extend(this.persistentDisk, {
    bootDiskSize,
    bootDiskType,
    quantity,
    readonly: true,
    location: region,
    groupId,
    accompaniedProduct: 'GKE Standard'
  });
  this.addPersistentDisk();

  // Clear the data model
  this.setupContainerEngine();
  this.resetForm(containerEngineForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up GKE Autopilot Data
 * @export
 */
ListingCtrl.prototype.setupGkeAutopilot = function() {
  this.gkeAutopilot = {
    submitted: false,
    label: '',
    location: this.retrieveLocation(),
    replicaCount: null,
    cpuCount: null,
    memoryVolume: {value: '', unit: this.DEFAULT_UNITS.gkeMemoryVolume},
    storageVolume: {value: '', unit: 2},
    hours: 24,
    days: 7,
    minutes: 1440,
    timeType: 'hours',
    timeMode: 'day',
    daysMonthly: 30,
  };
};


/**
 * Adds Container Builder restore to Cart.
 *
 * @param {!angular.Form} gkeAutopilotForm
 * @export
 */
ListingCtrl.prototype.addGkeAutopilot = function(gkeAutopilotForm) {
  if (gkeAutopilotForm.$invalid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddGkeAutopilot');
  const region = this.gkeAutopilot.location;
  let totalPrice = 0;
  const replicaCount = this.gkeAutopilot.replicaCount;
  const totalHours = ('hours' == this.gkeAutopilot.timeType ?
                          this.gkeAutopilot.hours :
                          'minutes' == this.gkeAutopilot.timeType ?
                          this.gkeAutopilot.minutes / 60 :
                          24 * this.gkeAutopilot.daysMonthly) *
      ('day' == this.gkeAutopilot.timeMode ?
           this.gkeAutopilot.days * this.WEEKS :
           1) *
      replicaCount;

  const roundedmvcpu = Math.ceil(this.gkeAutopilot.cpuCount / 0.25) * 0.25;
  const cpuUsage = roundedmvcpu * totalHours;
  const cpuCost = this.CloudCalculator.calculateItemPrice(
      'CP-GKE-AUTOPILOT-CORE-HOURS', cpuUsage, region, 0);
  totalPrice += cpuCost;
  const memoryVolume = this.toDefaultUnit(
      this.gkeAutopilot.memoryVolume.value, this.gkeAutopilot.memoryVolume.unit,
      2);
  const memoryUsage = memoryVolume * totalHours;
  const memoryCost = this.CloudCalculator.calculateItemPrice(
      'CP-GKE-AUTOPILOT-RAM-GIB-HOURS', memoryUsage, region, 0);
  totalPrice += memoryCost;
  const storageVolume = this.toDefaultUnit(
      this.gkeAutopilot.storageVolume.value,
      this.gkeAutopilot.storageVolume.unit, 2);
  const storageUsage = storageVolume * totalHours;
  const storageCost = this.CloudCalculator.calculateItemPrice(
      'CP-GKE-AUTOPILOT-STORAGE-GIB-HOURS', storageUsage, region, 0);
  totalPrice += storageCost;
  const item = {
    sku: 'CP-GKE-AUTOPILOT-GENERAL',
    quantity: totalHours,
    quantityLabel: 'total hours per month',
    region: region,
    displayName: 'GKE Autopilot Pods',
    displayDescription: 'Total pods hours',
    price: totalPrice,
    uniqueId: null,
    items: {
      cpuUsage: cpuUsage,
      cpuCost: cpuCost,
      memoryUsage: memoryUsage,
      memoryCost: memoryCost,
      storageUsage: storageUsage,
      storageCost: storageCost,
      textLabel: replicaCount + ' x ' + this.gkeAutopilot.label,
      editHook: {
        initialInputs: goog.object.clone(this.gkeAutopilot),
        product: 'gkeAutopilot',
        tab: 'gke-autopilot'
      }
    }
  };
  this.CloudCalculator.addItemToCart(item, totalPrice);
  this.setupGkeAutopilot();
  this.resetForm(gkeAutopilotForm);
  this.scrollToCart();
};


/**
 * Setup Container Builder Data
 * @export
 */
ListingCtrl.prototype.setupContainerBuilderData = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    buildTime: {number},
   *    buildStorage: {number},
   *    instanceType: {string}
   * }}
   */
  this.containerBuilder = {
    submitted: false,
    buildTime: '',
    buildStorage: 100,
    instanceType: 'n1-standard-1'
  };
};

/**
 * Setup GkeCluster Model.
 * @export
 */
ListingCtrl.prototype.setupGkeCluster = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    zonalClusterCount: ?number,
   *    regionalClusterCount: ?number,
   * }}
   */
  this.gkeClusters = {
    submitted: !1,
    zonalClusterCount: null,
    regionalClusterCount: null
  };
};


/**
 * Adds Gke Clusters to Cart.
 *
 * @param {!angular.Form} gkeClustersForm
 * @param {?block} block block name of sku
 * @export
 */

ListingCtrl.prototype.addGkeClusters = function(gkeClustersForm, block) {
  if (gkeClustersForm.$invalid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddGkeCluters');
  const zonalClusterCount = parseFloat(this.gkeClusters.zonalClusterCount);
  const regionalClusterCount =
      parseFloat(this.gkeClusters.regionalClusterCount);
  if (this.isPositiveNumber_(zonalClusterCount)) {
    var clusterItem = {
      quantityLabel: 'hours',
      displayName: 'GKE Clusters Fee',
      sku: 'CP-GKE-CONTAINER-MANAGMENT-COST-ZONAL',
      region: 'us',
      quantity: zonalClusterCount * this.TOTAL_BILLING_HOURS,
      displayDescription: 'Zonal Clusters',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.gkeClusters),
          product: 'gkeClusters',
          tab: block ? block : 'gke-standard'
        }
      }
    };
    this.CloudCalculator.addItemToCart(clusterItem);
  }
  this.isPositiveNumber_(regionalClusterCount) &&
      (clusterItem = {
        quantityLabel: 'hours',
        displayName: 'GKE Clusters Fee',
        sku: 'CP-GKE-CONTAINER-MANAGMENT-COST-REGIONAL',
        region: 'us',
        quantity: regionalClusterCount * this.TOTAL_BILLING_HOURS,
        displayDescription: 'Zonal Clusters',
        price: null,
        uniqueId: null,
        items: {
          editHook: {
            initialInputs: goog.object.clone(this.gkeClusters),
            product: 'gkeClusters',
            tab: block ? block : 'gke-standard'
          }
        }
      },
       this.CloudCalculator.addItemToCart(clusterItem));
  this.setupGkeCluster();
  this.resetForm(gkeClustersForm);
  this.scrollToCart();
};


/**
 * Adds Container Builder restore to Cart.
 *
 * @param {!angular.Form} cbForm
 * @export
 */
ListingCtrl.prototype.addContainerBuilder = function(cbForm) {
  if (cbForm.buildTime.$viewValue == '' && !cbForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddContainerBuilder');
  /** @type {number} */
  var buildTime = this.containerBuilder.buildTime;
  var storage = this.containerBuilder.buildStorage * (buildTime / 60) /
      this.TOTAL_BILLING_HOURS;
  var totalPrice = 0;
  /** @const {string} */
  var BASE_SKU = 'CP-CONTAINER-BUILD-TIME-';
  var STORAGE_SKU = 'CP-COMPUTEENGINE-STORAGE-PD-SSD';
  /** @type {string} */
  var instance = this.containerBuilder.instanceType;
  var sku = BASE_SKU + instance.toUpperCase();
  var region = 'us-east1';
  /** @type {!cloudpricingcalculator.SkuData} */
  var cbItem = null;
  if (instance == 'n1-standard-1' && buildTime <= 120) {
    storage = this.containerBuilder.buildStorage <= 100 ? 0 : storage;
  }

  var storagePrice =
      this.CloudCalculator.calculateItemPrice(STORAGE_SKU, storage, region);
  var builderPrice =
      this.CloudCalculator.calculateItemPrice(sku, buildTime, region);
  totalPrice = storagePrice + builderPrice;

  cbItem = {
    quantityLabel: 'Minutes',
    region: 'us',
    displayName: 'Google Kubernetes Engine',
    sku: sku,
    quantity: buildTime,
    displayDescription: 'Container Builder',
    items: {
      editHook: {
        initialInputs: goog.object.clone(this.containerBuilder),
        product: 'containerBuilder',
        tab: 'container'
      }
    }
  };
  this.CloudCalculator.addItemToCart(cbItem, totalPrice);

  // Clear the data model
  this.setupContainerBuilderData();
  this.resetForm(cbForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Resets form to pristine state
 *
 * @param {!angular.Form} form
 * @export
 */
ListingCtrl.prototype.resetForm = function(form) {
  form.$setPristine();
  form.$setUntouched();
};


/**
 * Shows feedback form form.
 * @param {Element} ev Source of the element.
 * @export
 */
ListingCtrl.prototype.showFeedbackForm = function(ev) {
  this.mdDialog
      .show({
        templateUrl: '/static/components/feedbackquote/feedbackquote.ng',
        targetEvent: ev,
        parent: angular.element(document.body),
        bindToController: true,
        clickOutsideToClose: true,
        controllerAs: 'emailQuote',
        controller:
            cloudpricingcalculator.components.feedbackquote.FeedbackQuote
      })
      .then(
          function(answer) {
            // console.log(answer, 'yeah');
          },
          function() {
            console.log('cancel');
          });
};


/**
 * Calles on each slider update.
 * @export
 */
ListingCtrl.prototype.updateCpuSlider = function() {
  const cpuCount = this.computeServer.sliderCpus;
  const n2dCores = [2, 4, 8, 16, 32, 48, 64, 80, 96];
  if (this.computeServer.series === 'n2d') {
    if (n2dCores.includes(cpuCount)) {
      this.computeServer.customGuestCpus = cpuCount;
    } else {
      var val = this.getNextValueInInterval_(cpuCount, n2dCores);
      this.computeServer.customGuestCpus =
          this.getNextValueInInterval_(cpuCount, n2dCores);
      ;
    }
  } else {
    if (cpuCount > 1) {
      this.computeServer.customGuestCpus = 2 * (cpuCount - 1);
    } else {
      this.computeServer.customGuestCpus = cpuCount;
    }
  }
  this.setCpus_();
};


/**
 * Finds next valid value in the valid interval.
 * @param {number} value value to be checked
 * @param {Array<number>} interval array of valid vallues
 * @return {number} next value
 * @private
 */
ListingCtrl.prototype.getNextValueInInterval_ = function(value, interval) {
  const len = interval.length;
  for (let i = 0; i < len; i++) {
    if (value < interval[i]) {
      return interval[i];
    }
  }
  /* for (let res of interval) {
    console.log(value, res, value <= res)
    if (value <= res) {
      return res;
    }
  } */
};


/**
 * Updates number of cpu for machineType with the value on the slider.
 * @export
 */
ListingCtrl.prototype.setCpuSlider = function() {
  this.updateCpuSlider();
  this.setCpus_();
};


/**
 * Update the limit of GKE custom machine RAM value.
 * @param {number} cpu number of CPUs
 * @export
 */
ListingCtrl.prototype.gkeCustomLimit = function(cpu) {
  this.gkeCustom.ramMin =
      this.gceMachineFamilyConfig[this.containerEngine
                                      .family][this.containerEngine
                                                   .series]['minCustomRamRatio'] *
      cpu;
  this.gkeCustom.ramMax =
      this.gceMachineFamilyConfig[this.containerEngine
                                      .family][this.containerEngine
                                                   .series]['maxCustomRamRatio'] *
      cpu;
  if (this.containerEngine.extendedMemory) {
    this.gkeCustom.ramMax = this.checkAvailabilityForThisFamily(
        'maxExtendedMemory', this.containerEngine);
  }
};

/**
 * Update the limit for Cloud SQL custom machine RAM value.
 * @param {number} coreCount number of cores
 * @param {string} product product it will be applied to.
 * @export
 */
ListingCtrl.prototype.setCustomRamLimit = function(coreCount, product) {
  this[product].ramLimit.min = Math.max(
      this.cloudSqlValidationLimits.cpuRamMinRatio * coreCount,
      this.cloudSqlValidationLimits.memoryMin);
  this[product].ramLimit.max = Math.min(
      this.cloudSqlValidationLimits.cpuRamMaxRatio * coreCount,
      this.cloudSqlValidationLimits.memoryMax);
};

/**
 * Adjusts memory slider and input after changing properties.
 * @private
 */
ListingCtrl.prototype.adjustMemorySlider_ = function() {
  var curMem = this.minMemory;
  // Set the memory slider value later. This prevents the slider from
  // setting the slider value before setting its min and max.
  this.timeout_(function() {
    // this.computeServer.customMemoryGb = curMem;
    this.computeServer.inputMemoryGb = curMem;
    this.checkInputMemory();
  }.bind(this), 0);
};


/**
 * Check if the value from the cores input box is valid.
 * @export
 */
ListingCtrl.prototype.checkInputCpus = function() {
  if (this.computeServer.customGuestCpus === undefined) {
    this.hasTouchedMemorySlider = false;
    return;
  }
  this.setCpus_();
};


/**
 * Updates number of cpu for machineType with user input.
 * @private
 */
ListingCtrl.prototype.setCpus_ = function() {
  this.setSliderCpus_();
  this.setMemoryRange_(this.computeServer.customGuestCpus);
  const curMem = this.minMemory;
  // Set the memory slider value later. This prevents the slider from
  // setting the slider value before setting its min and max.
  this.timeout_(function() {
    // this.computeServer.customMemoryGb = curMem;
    this.computeServer.inputMemoryGb = curMem;
    this.checkInputMemory();
  }.bind(this), 0);
  this.generateLocalSsdOptions('computeServer');
};


/**
 * Updates the sliderCpus value based on the selected number of CPUs in
 * customGuestCpus.
 * @private
 */
ListingCtrl.prototype.setSliderCpus_ = function() {
  if (this.computeServer.customGuestCpus > 1 &&
      this.computeServer.series !== 'n2d') {
    this.computeServer.sliderCpus = this.computeServer.customGuestCpus / 2 + 1;
  } else {
    this.computeServer.sliderCpus = this.computeServer.customGuestCpus;
  }
};


/**
 * Sets the memory range for the memory slider based on the number of CPUs.
 * @param {number} cpu number of CPUs
 * @private
 */
ListingCtrl.prototype.setMemoryRange_ = function(cpu) {
  const minCustomRam = this.getCurrentCustomRamRatio('min');
  const maxCustomRam = this.getCurrentCustomRamRatio('max');
  let memoryLimit = maxCustomRam * cpu;
  if (this.checkAvailabilityForThisFamily('hardMaxCustomRamRation')) {
    memoryLimit = Math.min(
        memoryLimit,
        this.checkAvailabilityForThisFamily('hardMaxCustomRamRation'));
  }
  if (this.computeServer.extendedMemory) {
    memoryLimit = this.checkAvailabilityForThisFamily('maxExtendedMemory');
  }
  this.maxMemory = this.adjustNumber_(memoryLimit);
  this.minMemory = this.adjustNumber_(minCustomRam * cpu);
  // Decrease the minimum memory value for the slider by one step so that
  // the actual minMemory, which may not be a multiple of the step, is
  // selectable.
  this.minSliderMemory = this.minMemory - 0.25;
};


/**
 * Rounds a number to 0.1. Used for getting memory values for the slider.
 * @param {number} number to round
 * @return {number} rounded number
 * @private
 */
ListingCtrl.prototype.adjustNumber_ = function(number) {
  return Math.floor(number * 10) / 10;
};


/**
 * Updates the memory of machineType with the value on the slider.
 * @export
 */
ListingCtrl.prototype.setMemorySlider = function() {
  this.hasTouchedMemorySlider = true;
  this.updateMemorySlider();
  this.computeServer.inputMemoryGb = this.computeServer.customMemoryGb;
  // this.setMemoryNoRound();
};


/**
 * Called on each slider update.
 * @export
 */
ListingCtrl.prototype.updateMemorySlider = function() {
  var memoryGb = this.roundMemory_(this.computeServer.customMemoryGb);
  this.computeServer.customMemoryGb = this.adjustMemoryInRange_(memoryGb);
  this.computeServer.inputMemoryGb = this.adjustMemoryInRange_(memoryGb);
  this.checkStandardIfPossible_();
};


/**
 * Updates the memory of machineType with the value on the slider.
 * @param {?string} product product to check family type
 * @export
 */
ListingCtrl.prototype.updateGPUCount = function(product) {
  let prod = product ? this[product] : this.computeServer;
  const instance = prod.instance || prod.nodeType || prod.workerType;
  const cpuCount = this.CloudCalculator.getCoresNumber(instance);
  if (!cpuCount || !this.gpuMinCoreList) {
    return;
  }
  const gpuType = prod.gpuType;
  const cpuRatio = this.gpuMinCoreList[gpuType];
  this.minGPU = Math.min(Math.ceil(cpuCount / cpuRatio), cpuRatio);
  if (this.minGPU > prod.gpuCount) {
    prod.gpuCount = 0;
  }
};


/**
 * Updates GPU type/count.
 * @param {string} product product family (Compute/GKE)
 * @export
 */
ListingCtrl.prototype.onGpuTypeChange = function(product) {
  if (product === 'containerEngine') {
    this.applyGkeDiesRestrictions();
  }

  this.applyGpuRestriction(product);
};


/**
 * Updates the minGpuTenant for sole-tenant for Added GPU.
 * @export
 */
ListingCtrl.prototype.minGpuOfSole = function() {
  let gpuNumbers = this.supportedGpuNumbers[this.soleTenant.gpuType];
  if (gpuNumbers)
    this.minGpuTenant = gpuNumbers[gpuNumbers.length - 1].value;
};


/**
 * Updates the memory of machineType with the value on the slider.
 * @export
 */
ListingCtrl.prototype.applyGkeDiesRestrictions = function() {
  var instance = this.containerEngine.instance;
  var cpuCount = this.CloudCalculator.getInstanceParams(instance)['cores'];
  var gpuType = this.containerEngine.gpuType;
  var cpuRatio = this.gpuMinCoreList[gpuType];
  this.minGkeGPU = Math.min(Math.ceil(cpuCount / cpuRatio), cpuRatio);
  if (this.minGkeGPU > this.containerEngine.gpuCount) {
    this.containerEngine.gpuCount = 0;
  }
};


/**
 * Returns accepted values for the memory slider.
 * @param {number} mem the memory in Gb
 * @return {number} the value of the memory for the slider
 * @private
 */
ListingCtrl.prototype.roundMemory_ = function(mem) {
  // The edges of the slider should be at the minimum/maximum memory available
  // regardless of rounding.
  if (mem >= this.maxMemory) {
    return this.maxMemory;
  }
  if (mem <= this.minMemory) {
    return this.minMemory;
  }
  // For mem under 10 increase by 0.25
  if (mem < 10) {
    return Math.floor(mem * 4) / 4;
  }  // for mem between 10 and 20 increase by 0.5
  else if (mem < 20) {
    return Math.floor(mem * 2) / 2;
  }  // for mem between 20 and 50 increase by 1
  else if (mem < 50) {
    return Math.floor(mem);
  }  // for mem between 50 and 100 increase by 2
  else if (mem < 100) {
    return Math.floor(mem / 2) * 2;
  }
  // for mem over increase by 5
  return Math.floor(mem / 5) * 5;
};


/**
 * Adjusts the memory value to not exceed the memory range.
 * @param {number} mem the current memory value
 * @return {number} the adjusted value
 * @private
 */
ListingCtrl.prototype.adjustMemoryInRange_ = function(mem) {
  return Math.min(Math.max(mem, this.minMemory), this.maxMemory);
};


/**
 * Check if the memory from the input box is correct.
 * @export
 */
ListingCtrl.prototype.checkInputMemory = function() {
  if (this.computeServer.inputMemoryGb === undefined) {
    this.hasTouchedMemorySlider = false;
    return;
  }

  this.computeServer.inputMemoryGb =
      Math.round(this.computeServer.inputMemoryGb * 100) / 100;
  this.timeout_(function() {
    this.computeServer.customMemoryGb = this.computeServer.inputMemoryGb;
    this.hasTouchedMemorySlider = true;
    this.checkStandardIfPossible_();
  }.bind(this));
  this.updateGPUCount();
};


/**
 * Reacts on instance change.
 * @param {string} product product name.
 * @export
 */
ListingCtrl.prototype.onCloudSqlInstanceChange = function(product) {
  // Shared cores instances are not elligible for CUD, resets CUD term to 0 if
  // it was previously checked to 1 or 3
  this.applyCudRestriction(product);
  // Restrict user from choosing instance in unsupported regions
  const instanceSku =
      product == 'cloudSqlServer' ? 'CP-CLOUDSQLSERVER-VCPU' : 'CP-DB-CORE';
  const supportedRegions =
      this.CloudCalculator.getSupportedRegionList(instanceSku);
  (goog.array.contains(supportedRegions, this[product].location)) ?
      this.cloudSqlValidation[product] = false :
      this.cloudSqlValidation[product] = true;
};

/**
 * Restricts user from choosing Cud in unsupported regions.
 * @param {string} product product it will be applied to.
 * @export
 */
ListingCtrl.prototype.applyCudRestriction = function(product) {
  const instance = this[product].instance;
  const sku = product == 'cloudSQL2' || product == 'cloudSQLPostgre' ?
      'DB-CORE' :
      product == 'cloudSqlServer' ? 'CLOUDSQLSERVER-VCPU' :
                                    instance;
  const supportedRegions = this.CloudCalculator.getCudRegionList(sku);
  const region = this[product].location;
  if ((goog.array.contains(supportedRegions, region) ||
       (instance.indexOf('custom'))) &&
      !(instance === 'db-f1-micro' || instance === 'db-g1-small')) {
    this.cloudSqlValidation[product + 'Cud'] = false;
  } else {
    this.cloudSqlValidation[product + 'Cud'] = true;
    this[product].cud = 0;
  }
};


/**
 * Sets up Cloud SQL Data.
 * @export
 */
ListingCtrl.prototype.setupCloudSQL2Data = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    instanceCount: ?number,
   *    instance: string,
   *    label: string,
   *    location: string,
   *    storage: !cloudpricingcalculator.DataWithUnit,
   *    backup: !cloudpricingcalculator.DataWithUnit,
   *    custom: !Object.<string,number>,
   *    includeHA: boolean,
   *    hours: number,
   *    days: number,
   *    minutes: number,
   *    timeType: string,
   *    timeMode: string,
   *    daysMonthly: number,
   *    cud: number,
   *    ramLimit: !Object.<string, number>
   * }}
   */
  this.cloudSQL2 = {
    submitted: false,
    instanceCount: null,
    label: '',
    instance: 'db-standard-1',
    location: this.retrieveLocation(),
    storageType: 'SSD',
    storage: {value: '', unit: this.DEFAULT_UNITS.sql2Storage},
    backup: {value: '', unit: this.DEFAULT_UNITS.sql2Backup},
    custom: {vcpu: 1, ram: 3.75},
    includeHA: false,
    hours: 24,
    days: 7,
    minutes: 1440,
    timeType: 'hours',
    timeMode: 'day',
    daysMonthly: 30,
    cud: 0,
    ramLimit: {min: 3.75, max: 6.5}
  };
};

/**
 * Generates SKU name for mySql and Postgre products. Here custom instance and
 * predefined instance have the same price. Hence, predefined instances also
 * have `CUSTOM` SKU name behind the scenes.
 * @param {string} product
 * @returns {string}
 * @export
 */
ListingCtrl.prototype.generateCloudSqlSkuName = function(product) {
  let sku = 'CP-';
  if (this[product].instance === 'db-f1-micro' ||
      this[product].instance === 'db-g1-small') {
    return sku + this[product].instance.toUpperCase();
  } else if (this[product].instance != 'custom') {
    const parsedInstance = this[product].instance.split('-');
    const vcpu = parseInt(parsedInstance[2], 10);
    let ram;
    for (const instance of this.cloudSqlInstanceList[parsedInstance[1]]
             .instances) {
      if (instance.vcpu === vcpu) {
        ram = instance.ram;
        break;
      }
    }
    return sku + `DB-CUSTOM-${vcpu}-${ram}`;
  } else {
    sku += `DB-CUSTOM-${this[product].custom.vcpu}-${this[product].custom.ram}`;
    return sku;
  }
};

/**
 * Adds a Cloud SQL Instance to Cart.
 *
 * @param {!angular.Form} cloudSQLForm
 * @export
 */
ListingCtrl.prototype.addCloudSQL2 = function(cloudSQLForm) {
  if (!cloudSQLForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddCloudSQL2');
  /** @type {number} */
  let haMultiplier = 1;
  const hours = this.cloudSQL2.timeType == 'hours' ? this.cloudSQL2.hours :
      this.cloudSQL2.timeType == 'minutes' ? this.cloudSQL2.minutes / 60 :
                                             this.cloudSQL2.daysMonthly * 24;
  const hoursMultiplier =
      this.cloudSQL2.timeMode == 'day' ? this.cloudSQL2.days * this.WEEKS : 1;
  /**
   * Calculate the days / month based on average
   * @type {number}
   */
  let hoursPerMonth = hours * hoursMultiplier;
  const cud = (this.cloudSQL2.instance === 'db-f1-micro' ||
               this.cloudSQL2.instance === 'db-g1-small') ?
      0 :
      this.cloudSQL2.cud;
  let sku = this.generateCloudSqlSkuName('cloudSQL2');
  if (this.cloudSQL2.instance == 'custom') {
    this.cloudSQL2.instance = `DB-CUSTOM-${this.cloudSQL2.custom.vcpu}-${
        this.cloudSQL2.custom.ram * 1024}`;
  }

  /** @type {string} */
  let termText = '';

  if (cud > 0) {
    hoursPerMonth = this.TOTAL_BILLING_HOURS;
    sku = `${sku}-CUD-${cud}-YEAR`;
    termText = `${cud} Year${cud == 3 ? 's' : ''}`;
  }

  let skuData = null;

  const quantity = this.cloudSQL2.instanceCount;
  const quantityLabel = 'total hours per month';
  const region = this.cloudSQL2.location;

  if (this.cloudSQL2.includeHA) {
    haMultiplier = 2;
  }
  let price = 0;
  // Calculate instance price first
  /** @type {number}*/
  const instancePrice =
      this.CloudCalculator.calculateItemPrice(sku, hoursPerMonth, region);
  price += instancePrice * haMultiplier;

  // Add the storage cost
  const storage = this.toDefaultUnit(
      this.cloudSQL2.storage.value, this.cloudSQL2.storage.unit,
      this.DEFAULT_UNITS.sql2Storage);
  this.cloudSQL2.storage.value = storage;
  this.cloudSQL2.storage.unit = this.DEFAULT_UNITS.sql2Storage;
  const storageType = this.cloudSQL2.storageType;
  const storageSku = 'CP-CLOUDSQL-STORAGE-' + storageType;
  skuData = this.CloudCalculator.cloudSkuData[storageSku];
  price += storage * skuData[region] * haMultiplier;
  // Add backup cost
  const backup = this.toDefaultUnit(
      this.cloudSQL2.backup.value, this.cloudSQL2.backup.unit,
      this.DEFAULT_UNITS.sql2Backup);
  this.cloudSQL2.backup.value = backup;
  this.cloudSQL2.backup.unit = this.DEFAULT_UNITS.sql2Backup;
  skuData = this.CloudCalculator.cloudSkuData['CP-CLOUDSQL-BACKUP'];
  price += backup * skuData[region];

  const title = this.cloudSQL2.label || this.cloudSQL2.instance;

  const databaseConfig = storage + ' GB';

  price *= quantity;

  /** @type {!cloudpricingcalculator.SkuData} */
  const sqlItem = {
    sku: sku,
    quantity: hoursPerMonth,
    quantityLabel: quantityLabel,
    region:
        this.fullRegion[region] || this.fullRegion[this.regionFallback[region]],
    displayName: title,
    displayDescription: databaseConfig,
    price: null,
    uniqueId: null,
    items: {
      termText: termText,
      editHook: {
        initialInputs: goog.object.clone(this.cloudSQL2),
        product: 'cloudSQL2',
        tab: 'sql'
      }
    }
  };

  this.CloudCalculator.addItemToCart(sqlItem, price);

  this.setupCloudSQL2Data();
  this.resetForm(cloudSQLForm);
  this.onCloudSqlInstanceChange('cloudSQL2');

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Vision Api Model.
 * @export
 */

ListingCtrl.prototype.setupVisionApiData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    labelDetection: !cloudpricingcalculator.DataWithUnit,
   *    ocr: !cloudpricingcalculator.DataWithUnit,
   *    explicitDetection: !cloudpricingcalculator.DataWithUnit,
   *    facialDetection: !cloudpricingcalculator.DataWithUnit,
   *    landmarkDetection: !cloudpricingcalculator.DataWithUnit,
   *    logoDetection: !cloudpricingcalculator.DataWithUnit,
   *    imageProperties: !cloudpricingcalculator.DataWithUnit,
   *    webDetection: !cloudpricingcalculator.DataWithUnit,
   *    documentDetection: !cloudpricingcalculator.DataWithUnit,
   *    cropHints: !cloudpricingcalculator.DataWithUnit,
   *    objectLocalization: !cloudpricingcalculator.DataWithUnit
   * }}
   */
  this.visionApi = {
    submitted: false,
    labelDetection: {value: null, unit: 3},
    ocr: {value: null, unit: 3},
    explicitDetection: {value: null, unit: 3},
    facialDetection: {value: null, unit: 3},
    landmarkDetection: {value: null, unit: 3},
    logoDetection: {value: null, unit: 3},
    imageProperties: {value: null, unit: 3},
    webDetection: {value: null, unit: 3},
    documentDetection: {value: null, unit: 3},
    cropHints: {value: null, unit: 3},
    objectLocalization: {value: null, unit: 3}
  };
};


/**
 * Adds a Vision API items to Cart.
 *
 * @param {!angular.Form} visioForm
 * @export
 */
ListingCtrl.prototype.addVisionApi = function(visioForm) {
  if (this.isFormEmpty(visioForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddVisionApi');
  /** @type {number} */
  const labelDetection = this.toDefaultNumber_(
      this.visionApi.labelDetection.value, this.visionApi.labelDetection.unit);
  /** @type {number} */
  const ocr =
      this.toDefaultNumber_(this.visionApi.ocr.value, this.visionApi.ocr.unit);
  /** @type {number} */
  const explicitDetection = this.toDefaultNumber_(
      this.visionApi.explicitDetection.value,
      this.visionApi.explicitDetection.unit);
  /** @type {number} */
  const facialDetection = this.toDefaultNumber_(
      this.visionApi.facialDetection.value,
      this.visionApi.facialDetection.unit);
  /** @type {number} */
  const landmarkDetection = this.toDefaultNumber_(
      this.visionApi.landmarkDetection.value,
      this.visionApi.landmarkDetection.unit);
  /** @type {number} */
  const logoDetection = this.toDefaultNumber_(
      this.visionApi.logoDetection.value, this.visionApi.logoDetection.unit);
  /** @type {number} */
  const imageProperties = this.toDefaultNumber_(
      this.visionApi.imageProperties.value,
      this.visionApi.imageProperties.unit);
  /** @type {number} */
  const webDetection = this.toDefaultNumber_(
      this.visionApi.webDetection.value, this.visionApi.webDetection.unit);
  /** @type {number} */
  const documentDetection = this.toDefaultNumber_(
      this.visionApi.documentDetection.value,
      this.visionApi.documentDetection.unit);
  /** @type {number} */
  const cropHints = this.toDefaultNumber_(
      this.visionApi.cropHints.value, this.visionApi.cropHints.unit);
  /** @type {number} */
  const objectLocalization = this.toDefaultNumber_(
      this.visionApi.objectLocalization.value,
      this.visionApi.objectLocalization.unit);
  /** @type {!cloudpricingcalculator.SkuData} */
  let visionApiItem;

  if (this.isPositiveNumber_(labelDetection)) {
    visionApiItem = {
      quantityLabel: 'units',
      displayName: 'Label Detection',
      sku: 'CP-VISION-LABEL-DETECTION',
      region: 'us',
      quantity: labelDetection,
      displayDescription: 'Label Detection',
      items: {
        dependedSku: 'CP-VISION-EXPLICIT-CONTENT-DETECTION',
        editHook: {
          initialInputs: goog.object.clone(this.visionApi),
          product: 'visionApi',
          tab: 'vision-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(visionApiItem);
  }
  if (this.isPositiveNumber_(ocr)) {
    visionApiItem = {
      quantityLabel: 'units',
      displayName: 'OCR',
      sku: 'CP-VISION-OCR',
      region: 'us',
      quantity: ocr,
      displayDescription: 'OCR',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.visionApi),
          product: 'visionApi',
          tab: 'vision-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(visionApiItem);
  }
  if (this.isPositiveNumber_(explicitDetection)) {
    visionApiItem = {
      quantityLabel: 'units',
      displayName: 'Explicit Content Detection',
      sku: 'CP-VISION-EXPLICIT-CONTENT-DETECTION',
      region: 'us',
      quantity: explicitDetection,
      displayDescription: 'Explicit Content Detection',
      items: {
        dependedQuota: 'CP-VISION-LABEL-DETECTION',
        editHook: {
          initialInputs: goog.object.clone(this.visionApi),
          product: 'visionApi',
          tab: 'vision-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(visionApiItem);
  }
  if (this.isPositiveNumber_(facialDetection)) {
    visionApiItem = {
      quantityLabel: 'units',
      displayName: 'Facial Detection',
      sku: 'CP-VISION-FACIAL-DETECTION',
      region: 'us',
      quantity: facialDetection,
      displayDescription: 'Facial Detection',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.visionApi),
          product: 'visionApi',
          tab: 'vision-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(visionApiItem);
  }
  if (this.isPositiveNumber_(landmarkDetection)) {
    visionApiItem = {
      quantityLabel: 'units',
      displayName: 'Landmark Detection',
      sku: 'CP-VISION-LANDMARK-DETECTION',
      region: 'us',
      quantity: landmarkDetection,
      displayDescription: 'Landmark Detection',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.visionApi),
          product: 'visionApi',
          tab: 'vision-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(visionApiItem);
  }
  if (this.isPositiveNumber_(logoDetection)) {
    visionApiItem = {
      quantityLabel: 'units',
      displayName: 'Logo Detection',
      sku: 'CP-VISION-LOGO-DETECTION',
      region: 'us',
      quantity: logoDetection,
      displayDescription: 'Logo Detection',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.visionApi),
          product: 'visionApi',
          tab: 'vision-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(visionApiItem);
  }
  if (this.isPositiveNumber_(imageProperties)) {
    visionApiItem = {
      quantityLabel: 'units',
      displayName: 'Image Properties',
      sku: 'CP-VISION-IMAGE-PROPERTIES',
      region: 'us',
      quantity: imageProperties,
      displayDescription: 'Image Properties',
      items: {
        dependedSku: 'CP-VISION-CROP-HINTS',
        editHook: {
          initialInputs: goog.object.clone(this.visionApi),
          product: 'visionApi',
          tab: 'vision-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(visionApiItem);
  }
  if (this.isPositiveNumber_(webDetection)) {
    visionApiItem = {
      quantityLabel: 'units',
      displayName: 'Web Detection',
      sku: 'CP-VISION-IMAGE-WEB-DETECTION',
      region: 'us',
      quantity: webDetection,
      displayDescription: 'Web Detection',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.visionApi),
          product: 'visionApi',
          tab: 'vision-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(visionApiItem);
  }
  if (this.isPositiveNumber_(documentDetection)) {
    visionApiItem = {
      quantityLabel: 'units',
      displayName: 'Document Text Detection',
      sku: 'CP-VISION-IMAGE-DOCUMENT-TEXT-DETECTION',
      region: 'us',
      quantity: documentDetection,
      displayDescription: 'Document Text Detection',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.visionApi),
          product: 'visionApi',
          tab: 'vision-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(visionApiItem);
  }
  if (this.isPositiveNumber_(cropHints)) {
    visionApiItem = {
      quantityLabel: 'units',
      displayName: 'Crop Hints',
      sku: 'CP-VISION-CROP-HINTS',
      region: 'us',
      quantity: cropHints,
      displayDescription: 'Crop Hints',
      items: {
        dependedQuota: 'CP-VISION-IMAGE-PROPERTIES',
        editHook: {
          initialInputs: goog.object.clone(this.visionApi),
          product: 'visionApi',
          tab: 'vision-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(visionApiItem);
  }
  if (this.isPositiveNumber_(objectLocalization)) {
    visionApiItem = {
      quantityLabel: 'units',
      displayName: 'Object Localization',
      sku: 'CP-VISION-OBJECT-LOCALIZATION',
      region: 'us',
      quantity: objectLocalization,
      displayDescription: 'Object Localization',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.visionApi),
          product: 'visionApi',
          tab: 'vision-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(visionApiItem);
  }

  // Clear the data model
  this.setupVisionApiData();
  this.resetForm(visioForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Job Discovery Model.
 * @export
 */

ListingCtrl.prototype.setupJobDiscoveryData = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    queryCount: {cloudpricingcalculator.DataWithUnit},
   *    objectCount: {cloudpricingcalculator.DataWithUnit}
   * }}
   */
  this.jobDiscovery = {
    submitted: false,
    queryCount: {value: '', unit: 3},
    objectCount: {value: '', unit: 3}
  };
};


/**
 * Adds a Job Discovery items to Cart.
 *
 * @param {!angular.Form} jobDiscoveryForm
 * @export
 */
ListingCtrl.prototype.addJobDiscovery = function(jobDiscoveryForm) {
  if (!jobDiscoveryForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddJobDiscovery');
  /** @type {number} */
  const queryCount = this.toDefaultNumber_(
      this.jobDiscovery.queryCount.value, this.jobDiscovery.queryCount.unit);
  const objectCount = this.toDefaultNumber_(
      this.jobDiscovery.objectCount.value, this.jobDiscovery.objectCount.unit);

  /** @type {!cloudpricingcalculator.SkuData} */
  let jobDiscoveryItem = null;

  if (this.isPositiveNumber_(queryCount)) {
    jobDiscoveryItem = {
      quantityLabel: '',
      displayName: 'Job Searches',
      sku: 'CP-JOB-DISCOVERY-QUERIES',
      region: 'us',
      quantity: queryCount,
      displayDescription: 'Talent Solution',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.jobDiscovery),
          product: 'jobDiscovery',
          tab: 'talent-solution'
        }
      }
    };
    this.CloudCalculator.addItemToCart(jobDiscoveryItem);
  }
  if (this.isPositiveNumber_(objectCount)) {
    jobDiscoveryItem = {
      quantityLabel: '',
      displayName: 'Job and Company Objects',
      sku: 'CP-JOB-DISCOVERY-JOB-COMPANY-OBJECTS',
      region: 'us',
      quantity: objectCount,
      displayDescription: 'Talent Solution',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.jobDiscovery),
          product: 'jobDiscovery',
          tab: 'talent-solution'
        }
      }
    };
    this.CloudCalculator.addItemToCart(jobDiscoveryItem);
  }

  // Clear the data model
  this.setupJobDiscoveryData();
  this.resetForm(jobDiscoveryForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Operations Model.
 * @export
 */

ListingCtrl.prototype.setupOperationsData = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    gcpResourceCount: number,
   *    awsResourceCount: number,
   *    logsVolume: {cloudpricingcalculator.DataWithUnit},
   *    descriptorsCount: number,
   *    timeSeriesCount: number
   * }}
   */
  this.operations = {
    submitted: false,
    gcpResourceCount: '',
    awsResourceCount: '',
    logsVolume: {value: '', unit: this.DEFAULT_UNITS.sdLogs},
    descriptorsCount: '',
    timeSeriesCount: ''
  };
};


/**
 * Adds a Vision API items to Cart.
 *
 * @param {!angular.Form} operationsForm
 * @export
 */
ListingCtrl.prototype.addOperations = function(operationsForm) {
  if (!(operationsForm.gcpResourceCount.$viewValue != '' ||
        operationsForm.awsResourceCount.$viewValue != '' ||
        operationsForm.logsVolume.$viewValue != '' ||
        operationsForm.descriptorsCount.$viewValue != '' ||
        operationsForm.timeSeriesCount.$viewValue != '') &&
      !operationsForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddOperations');
  /** @type {number} */
  var gcpResourceCount = this.operations.gcpResourceCount || 0;
  /** @type {number} */
  var awsResourceCount = this.operations.awsResourceCount || 0;
  var resourceCount = awsResourceCount + gcpResourceCount;
  /** @type {number} */
  var logsVolume = this.toDefaultUnit(
      this.operations.logsVolume.value, this.operations.logsVolume.unit,
      this.DEFAULT_UNITS.sdLogs);
  /** @type {number} */
  var descriptorsCount = this.operations.descriptorsCount;
  /** @type {number} */
  var timeSeriesCount = this.operations.timeSeriesCount;
  /** @type {number} */
  var dependedQuota = 0;

  /** @type {!cloudpricingcalculator.SkuData} */
  var operationsItem = null;

  if (this.isPositiveNumber_(resourceCount)) {
    operationsItem = {
      quantityLabel: 'resources',
      displayName: 'Operations',
      sku: 'CP-STACKDRIVER-MONITORED-RESOURCES',
      region: 'us',
      quantity: resourceCount,
      displayDescription: 'Number of monitored resources',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.operations),
          product: 'operations',
          tab: 'operations-suite'
        }
      }
    };
    this.CloudCalculator.addItemToCart(operationsItem);
  }
  if (this.isPositiveNumber_(logsVolume)) {
    dependedQuota = 50;
    dependedQuota += resourceCount * 10;
    operationsItem = {
      quantityLabel: 'GiB',
      displayName: 'Operations',
      sku: 'CP-STACKDRIVER-LOGS-VOLUME',
      region: 'us',
      quantity: logsVolume,
      displayDescription: 'Volume of logs',
      items: {
        dependedQuota: dependedQuota,
        editHook: {
          initialInputs: goog.object.clone(this.operations),
          product: 'operations',
          tab: 'operations-suite'
        }
      }
    };
    this.CloudCalculator.addItemToCart(operationsItem);
  }
  if (this.isPositiveNumber_(descriptorsCount)) {
    operationsItem = {
      quantityLabel: 'items',
      displayName: 'Operations',
      sku: 'CP-STACKDRIVER-METRICS-DESCRIPTION',
      region: 'us',
      quantity: descriptorsCount,
      displayDescription: 'Number of metrics descriptors',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.operations),
          product: 'operations',
          tab: 'operations-suite'
        }
      }
    };
    this.CloudCalculator.addItemToCart(operationsItem);
  }
  if (this.isPositiveNumber_(timeSeriesCount)) {
    dependedQuota = 500 * resourceCount;
    operationsItem = {
      quantityLabel: 'items',
      displayName: 'Operations',
      sku: 'CP-STACKDRIVER-TIME-SERIES',
      region: 'us',
      quantity: timeSeriesCount,
      displayDescription: 'Number of time-series',
      items: {
        dependedQuota: dependedQuota,
        editHook: {
          initialInputs: goog.object.clone(this.operations),
          product: 'operations',
          tab: 'operations-suite'
        }
      }
    };
    this.CloudCalculator.addItemToCart(operationsItem);
  }


  // Clear the data model
  this.setupOperationsData();
  this.resetForm(operationsForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Operations Model.
 * @export
 */
ListingCtrl.prototype.setupOperationsData2metrics = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    name: string,
   *    resourceCount: number,
   *    metricsCount: number,
   *    frequency: number
   * }}
   */
  this.operations2metrics = {
    submitted: false,
    name: '',
    metricsType: 'info',
    resourceCount: '',
    metricsCount: '',
    frequency: '',
    metricsVolume: {value: '', unit: this.DEFAULT_UNITS.sdMetricsVolume}
  };
};


/**
 * Adds a Vision API items to Cart.
 *
 * @param {!angular.Form} operationsForm
 * @export
 */
ListingCtrl.prototype.addOperations2metrics = function(operationsForm) {
  if (!operationsForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddOperationsNewMetrics');
  /** @type {number} */
  var dataVolume = 0;
  if (this.operations2metrics.metricsVolume.value) {
    dataVolume = this.toDefaultUnit(
        this.operations2metrics.metricsVolume.value,
        this.operations2metrics.metricsVolume.unit,
        this.DEFAULT_UNITS.sdMetricsVolume);
  } else {
    /** @type {number} */
    var resourceCount = this.operations2metrics.resourceCount || 0;
    var metricsCount = this.operations2metrics.metricsCount || 0;
    var frequency = this.operations2metrics.frequency || 0;
    // Total volume converted to MB/month.
    dataVolume = resourceCount * metricsCount * frequency * 8 * 730 / 1048576;
  }
  /** @type {!cloudpricingcalculator.SkuData} */
  var operationsItem = null;

  if (this.isPositiveNumber_(dataVolume)) {
    operationsItem = {
      quantityLabel: 'MB',
      displayName: 'Operations',
      sku: 'CP-STACKDRIVER-MONITORED-RESOURCES-VOLUME',
      region: 'us',
      quantity: dataVolume,
      displayDescription: 'Volume of monitoring data',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.operations2metrics),
          product: 'operations2metrics',
          tab: 'operations-suite'
        }
      }
    };
    this.CloudCalculator.addItemToCart(operationsItem);
  }
  // Clear the data model
  this.setupOperationsData2metrics();
  this.resetForm(operationsForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Operations Model.
 * @export
 */

ListingCtrl.prototype.setupOperationsData2logs = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    logsVolume: {cloudpricingcalculator.DataWithUnit}
   * }}
   */
  this.operations2logs = {
    submitted: false,
    logsVolume: {value: '', unit: this.DEFAULT_UNITS.sdLogs}
  };
};


/**
 * Adds a Vision API items to Cart.
 *
 * @param {!angular.Form} operationsForm
 * @export
 */
ListingCtrl.prototype.addOperations2logs = function(operationsForm) {
  if (!operationsForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddOperationsNewLogs');
  /** @type {number} */
  var logsVolume = this.toDefaultUnit(
      this.operations2logs.logsVolume.value,
      this.operations2logs.logsVolume.unit, this.DEFAULT_UNITS.sdLogs);

  /** @type {!cloudpricingcalculator.SkuData} */
  var operationsItem = null;
  if (this.isPositiveNumber_(logsVolume)) {
    operationsItem = {
      quantityLabel: 'GiB',
      displayName: 'Operations',
      sku: 'CP-STACKDRIVER-LOGS-VOLUME-NEW',
      region: 'us',
      quantity: logsVolume,
      displayDescription: 'Volume of logs',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.operations2logs),
          product: 'operations2logs',
          tab: 'operations-suite'
        }
      }
    };
    this.CloudCalculator.addItemToCart(operationsItem);
  }
  // Clear the data model
  this.setupOperationsData2logs();
  this.resetForm(operationsForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Operations Model.
 * @export
 */

ListingCtrl.prototype.setupOperationsData2traces = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    traceSpanCount: number
   * }}
   */
  this.operations2traces = {submitted: false, traceSpanCount: ''};
};


/**
 * Adds a Vision API items to Cart.
 *
 * @param {!angular.Form} operationsForm
 * @export
 */
ListingCtrl.prototype.addOperations2traces = function(operationsForm) {
  if (!operationsForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddOperationsNewTraces');

  /** @type {number} */
  var traceSpanCount = this.operations2traces.traceSpanCount;


  /** @type {!cloudpricingcalculator.SkuData} */
  var operationsItem = null;

  if (this.isPositiveNumber_(traceSpanCount)) {
    operationsItem = {
      quantityLabel: '',
      displayName: 'Operations',
      sku: 'CP-STACKDRIVER-TRACE-SPANS',
      region: 'us',
      quantity: traceSpanCount,
      displayDescription: 'Number of trace spans created',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.operations2traces),
          product: 'operations2traces',
          tab: 'operations-suite'
        }
      }
    };
    this.CloudCalculator.addItemToCart(operationsItem);
  }
  // Clear the data model
  this.setupOperationsData2traces();
  this.resetForm(operationsForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Setups cloud CDN data.
 * @export
 */
ListingCtrl.prototype.setupCloudCdnData = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    cacheEgressApac: {cloudpricingcalculator.DataWithUnit},
   *    cacheEgressCn: {cloudpricingcalculator.DataWithUnit},
   *    cacheEgressEu: {cloudpricingcalculator.DataWithUnit},
   *    cacheEgressNa: {cloudpricingcalculator.DataWithUnit},
   *    cacheEgressOce: {cloudpricingcalculator.DataWithUnit},
   *    cacheEgressSa: {cloudpricingcalculator.DataWithUnit},
   *    cacheEgressOther: {cloudpricingcalculator.DataWithUnit},
   *    cacheFillIntraEu: {cloudpricingcalculator.DataWithUnit},
   *    cacheFillIntraNaEu: {cloudpricingcalculator.DataWithUnit},
   *    cacheFillIntraOce: {cloudpricingcalculator.DataWithUnit},
   *    cacheFillIntraSa: {cloudpricingcalculator.DataWithUnit},
   *    cacheFillInterOce: {cloudpricingcalculator.DataWithUnit},
   *    cacheFillInterOther: {cloudpricingcalculator.DataWithUnit},
   *    cacheFillIntraOther: {cloudpricingcalculator.DataWithUnit},
   *    cacheLookupCount: {number},
   *    cacheFillInterRegion: {cloudpricingcalculator.DataWithUnit},
   *    cacheInvalidationCount: {number}
   * }}
   */
  this.cloudCdn = {
    submitted: false,
    cacheEgressApac: {value: '', unit: this.DEFAULT_UNITS.cacheEgressApac},
    cacheEgressCn: {value: '', unit: this.DEFAULT_UNITS.cacheEgressCn},
    cacheEgressEu: {value: '', unit: this.DEFAULT_UNITS.cacheEgressEu},
    cacheEgressNa: {value: '', unit: this.DEFAULT_UNITS.cacheEgressNa},
    cacheEgressOce: {value: '', unit: this.DEFAULT_UNITS.cacheEgressOce},
    cacheEgressSa: {value: '', unit: this.DEFAULT_UNITS.cacheEgressSa},
    cacheEgressOther: {value: '', unit: this.DEFAULT_UNITS.cacheEgressOther},
    cacheFillIntraNaEu:
        {value: '', unit: this.DEFAULT_UNITS.cacheFillIntraNaEu},
    cacheFillIntraOther:
        {value: '', unit: this.DEFAULT_UNITS.cacheFillIntraOther},
    cacheFillInterRegion:
        {value: '', unit: this.DEFAULT_UNITS.cacheFillInterRegion},
    cacheLookupCount: ''
  };
};


/**
 * Adds Network Network Egress to Cart.
 *
 * @param {!angular.Form} cloudCdnForm
 * @export
 */
ListingCtrl.prototype.addCloudCdn = function(cloudCdnForm) {
  if (!(cloudCdnForm.cacheEgressApac.$viewValue != '' ||
        cloudCdnForm.cacheEgressCn.$viewValue != '' ||
        cloudCdnForm.cacheEgressEu.$viewValue != '' ||
        cloudCdnForm.cacheEgressNa.$viewValue != '' ||
        cloudCdnForm.cacheEgressOce.$viewValue != '' ||
        cloudCdnForm.cacheEgressSa.$viewValue != '' ||
        cloudCdnForm.cacheEgressOther.$viewValue != '' ||
        cloudCdnForm.cacheFillIntraNaEu.$viewValue != '' ||
        cloudCdnForm.cacheFillIntraOther.$viewValue != '' ||
        cloudCdnForm.cacheFillInterRegion.$viewValue != '' ||
        cloudCdnForm.cacheLookupCount.$viewValue != '') &&
      !cloudCdnForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddCloudCdn');

  /** @type {number} */
  let cacheEgressApac = this.toDefaultUnit(
      this.cloudCdn.cacheEgressApac.value, this.cloudCdn.cacheEgressApac.unit,
      this.DEFAULT_UNITS.cacheEgressApac);
  /** @type {number} */
  let cacheEgressCn = this.toDefaultUnit(
      this.cloudCdn.cacheEgressCn.value, this.cloudCdn.cacheEgressCn.unit,
      this.DEFAULT_UNITS.cacheEgressCn);
  /** @type {number} */
  let cacheEgressEu = this.toDefaultUnit(
      this.cloudCdn.cacheEgressEu.value, this.cloudCdn.cacheEgressEu.unit,
      this.DEFAULT_UNITS.cacheEgressEu);
  /** @type {number} */
  let cacheEgressNa = this.toDefaultUnit(
      this.cloudCdn.cacheEgressNa.value, this.cloudCdn.cacheEgressNa.unit,
      this.DEFAULT_UNITS.cacheEgressNa);
  /** @type {number} */
  let cacheEgressOce = this.toDefaultUnit(
      this.cloudCdn.cacheEgressOce.value, this.cloudCdn.cacheEgressOce.unit,
      this.DEFAULT_UNITS.cacheEgressOce);
  /** @type {number} */
  let cacheEgressSa = this.toDefaultUnit(
      this.cloudCdn.cacheEgressSa.value, this.cloudCdn.cacheEgressSa.unit,
      this.DEFAULT_UNITS.cacheEgressSa);
  /** @type {number} */
  let cacheEgressOther = this.toDefaultUnit(
      this.cloudCdn.cacheEgressOther.value, this.cloudCdn.cacheEgressOther.unit,
      this.DEFAULT_UNITS.cacheEgressOther);
  /** @type {number} */
  let cacheFillIntraNaEu = this.toDefaultUnit(
      this.cloudCdn.cacheFillIntraNaEu.value,
      this.cloudCdn.cacheFillIntraNaEu.unit,
      this.DEFAULT_UNITS.cacheFillIntraNaEu);
  /** @type {number} */
  let cacheFillIntraOther = this.toDefaultUnit(
      this.cloudCdn.cacheFillIntraOther.value,
      this.cloudCdn.cacheFillIntraOther.unit,
      this.DEFAULT_UNITS.cacheFillIntraEu);
  /** @type {number} */
  let cacheFillInterRegion = this.toDefaultUnit(
      this.cloudCdn.cacheFillInterRegion.value,
      this.cloudCdn.cacheFillInterRegion.unit,
      this.DEFAULT_UNITS.cacheFillIntraNaEu);

  /** @type {number} */
  let cacheLookupCount = parseFloat(this.cloudCdn.cacheLookupCount);

  let cdnItem = null;

  if (this.isPositiveNumber_(cacheEgressApac)) {
    cdnItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud CDN',
      sku: 'CP-CLOUDCDN-CACHE-EGRESS-APAC',
      region: 'APAC',
      quantity: cacheEgressApac,
      displayDescription: 'Cache egress - Asia/Pacific',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.cloudCdn),
          product: 'cloudCdn',
          tab: 'cloud-cdn'
        }
      }
    };
    this.CloudCalculator.addItemToCart(cdnItem);
  }

  if (this.isPositiveNumber_(cacheEgressCn)) {
    cdnItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud CDN',
      sku: 'CP-CLOUDCDN-CACHE-EGRESS-CN',
      region: 'CN',
      quantity: cacheEgressCn,
      displayDescription: 'Cache egress - China',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.cloudCdn),
          product: 'cloudCdn',
          tab: 'cloud-cdn'
        }
      }
    };
    this.CloudCalculator.addItemToCart(cdnItem);
  }

  if (this.isPositiveNumber_(cacheEgressEu)) {
    cdnItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud CDN',
      sku: 'CP-CLOUDCDN-CACHE-EGRESS-EU',
      region: 'EU',
      quantity: cacheEgressEu,
      displayDescription: 'Cache egress - Europe',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.cloudCdn),
          product: 'cloudCdn',
          tab: 'cloud-cdn'
        }
      }
    };
    this.CloudCalculator.addItemToCart(cdnItem);
  }

  if (this.isPositiveNumber_(cacheEgressNa)) {
    cdnItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud CDN',
      sku: 'CP-CLOUDCDN-CACHE-EGRESS-NA',
      region: 'NA',
      quantity: cacheEgressNa,
      displayDescription: 'Cache egress - North America',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.cloudCdn),
          product: 'cloudCdn',
          tab: 'cloud-cdn'
        }
      }
    };
    this.CloudCalculator.addItemToCart(cdnItem);
  }

  if (this.isPositiveNumber_(cacheEgressOce)) {
    cdnItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud CDN',
      sku: 'CP-CLOUDCDN-CACHE-EGRESS-OCE',
      region: 'OCE',
      quantity: cacheEgressOce,
      displayDescription: 'Cache egress - Oceania',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.cloudCdn),
          product: 'cloudCdn',
          tab: 'cloud-cdn'
        }
      }
    };
    this.CloudCalculator.addItemToCart(cdnItem);
  }

  if (this.isPositiveNumber_(cacheEgressSa)) {
    cdnItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud CDN',
      sku: 'CP-CLOUDCDN-CACHE-EGRESS-SA',
      region: 'SA',
      quantity: cacheEgressSa,
      displayDescription: 'Cache egress - South America',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.cloudCdn),
          product: 'cloudCdn',
          tab: 'cloud-cdn'
        }
      }
    };
    this.CloudCalculator.addItemToCart(cdnItem);
  }

  if (this.isPositiveNumber_(cacheEgressOther)) {
    cdnItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud CDN',
      sku: 'CP-CLOUDCDN-CACHE-EGRESS-OTHER',
      region: 'OTHER',
      quantity: cacheEgressOther,
      displayDescription: 'Cache egress - All other destinations',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.cloudCdn),
          product: 'cloudCdn',
          tab: 'cloud-cdn'
        }
      }
    };
    this.CloudCalculator.addItemToCart(cdnItem);
  }

  if (this.isPositiveNumber_(cacheFillIntraNaEu)) {
    cdnItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud CDN',
      sku: 'CP-CLOUDCDN-CACHE-FILL-INTRA-NA-EU',
      region: 'us',
      quantity: cacheFillIntraNaEu,
      displayDescription: 'Intra-region cache fill within NA or EU',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.cloudCdn),
          product: 'cloudCdn',
          tab: 'cloud-cdn'
        }
      }
    };
    this.CloudCalculator.addItemToCart(cdnItem);
  }

  if (this.isPositiveNumber_(cacheFillIntraOther)) {
    cdnItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud CDN',
      sku: 'CP-CLOUDCDN-CACHE-FILL-INTRA-OTHER',
      region: 'us',
      quantity: cacheFillIntraOther,
      displayDescription:
          'Intra-region cache fill within APAC, LATAM, Oceania, ' +
          'Africa & Middle East',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.cloudCdn),
          product: 'cloudCdn',
          tab: 'cloud-cdn'
        }
      }
    };
    this.CloudCalculator.addItemToCart(cdnItem);
  }

  if (this.isPositiveNumber_(cacheFillInterRegion)) {
    cdnItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud CDN',
      sku: 'CP-CLOUDCDN-CACHE-FILL-INTER-REGION',
      region: 'us',
      quantity: cacheFillInterRegion,
      displayDescription: 'Inter-Region Cache Fill',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.cloudCdn),
          product: 'cloudCdn',
          tab: 'cloud-cdn'
        }
      }
    };
    this.CloudCalculator.addItemToCart(cdnItem);
  }

  if (this.isPositiveNumber_(cacheLookupCount)) {
    cdnItem = {
      quantityLabel: 'requests',
      displayName: 'Cloud CDN',
      sku: 'CP-CLOUDCDN-CACHE-LOOKUP-REQUESTS',
      region: 'us',
      quantity: cacheLookupCount,
      displayDescription: 'HTTP/HTTPS cache lookup requests',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.cloudCdn),
          product: 'cloudCdn',
          tab: 'cloud-cdn'
        }
      }
    };
    this.CloudCalculator.addItemToCart(cdnItem);
  }

  this.setupCloudCdnData();
  this.resetForm(cloudCdnForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Speech Api Model.
 * @export
 */

ListingCtrl.prototype.setupSpeechApi = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    recognition: ?number,
   *    model: string,
   *    dataLogging: boolean
   * }}
   */
  this.speechApi = {
    submitted: false,
    recognition: null,
    model: 'DEFAULT-STANDARD',
    dataLogging: false
  };
};


/**
 * Adds a Speech API items to Cart.
 *
 * @param {!angular.Form} speechApiForm
 * @export
 */
ListingCtrl.prototype.addSpeechApi = function(speechApiForm) {
  if (!speechApiForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddSpeechApi');
  const location = 'us';
  const recognition = parseFloat(this.speechApi.recognition);
  const model = this.speechApi.model.split('-')[0];
  const type = this.speechApi.model.split('-')[1];
  const dataLogging = this.speechApi.dataLogging;
  const sku = dataLogging ? `CP-SPEECH-TO-TEXT-${type}-LOGGING` :
                            `CP-SPEECH-TO-TEXT-${type}`;

  /*
   * The Speech-to-Text prices are per 15 seconds.
   * Hence we multiply it by 4 (60 sec/15 sec)
   */
  const recognitionCost =
      this.CloudCalculator.calculateItemPrice(sku, recognition, location) * 4;

  if (this.isPositiveNumber_(recognition)) {
    /** @type {!cloudpricingcalculator.SkuData} */
    const speechItem = {
      quantityLabel: 'minutes',
      displayName: '1x',
      sku: sku,
      region: location,
      quantity: recognition,
      displayDescription: 'Recognition',
      price: recognitionCost,
      uniqueId: null,
      items: {
        model: this.speechModels[type][model],
        editHook: {
          initialInputs: goog.object.clone(this.speechApi),
          product: 'speechApi',
          tab: 'speech-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(speechItem, recognitionCost);
  }
  // Clear the data model
  this.setupSpeechApi();
  this.resetForm(speechApiForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Text-to-Speech Model.
 * @export
 */

ListingCtrl.prototype.setupTextToSpeech = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    characters: ?number,
   *    feature: string,
   * }}
   */
  this.textToSpeech = {submitted: false, characters: null, feature: 'standard'};
};


/**
 * Adds a Text-to-Speech item to Cart.
 *
 * @param {!angular.Form} textToSpeechForm
 * @export
 */
ListingCtrl.prototype.addTextToSpeech = function(textToSpeechForm) {
  if (this.isFormEmpty(textToSpeechForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddTextToSpeech');

  /** @type {number} */
  const characters = parseFloat(this.textToSpeech.characters);
  /** @type {string} */
  const feature = this.textToSpeech.feature;
  /** @type {!cloudpricingcalculator.SkuData} */
  let textToSpeechItem;

  if (this.isPositiveNumber_(characters)) {
    textToSpeechItem = {
      quantityLabel: 'characters',
      displayName: 'Text-to-Speech',
      sku: `CP-TEXT-TO-SPEECH-${
          feature === 'standard' ? 'STANDARD' : 'WAVENET'}`,
      region: 'us',
      quantity: characters,
      displayDescription: feature === 'standard' ? 'Standard' : 'WaveNet',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.textToSpeech),
          product: 'textToSpeech',
          tab: 'text-to-speech'
        }
      }
    };
    this.CloudCalculator.addItemToCart(textToSpeechItem);
  }
  // Clear the data model
  this.setupTextToSpeech();
  this.resetForm(textToSpeechForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up NL Api Model.
 * @export
 */

ListingCtrl.prototype.setupNLApiData = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    entityRecognition: {cloudpricingcalculator.DataWithUnit},
   *    sentimentAnalysis: {cloudpricingcalculator.DataWithUnit},
   *    syntaxAnalysis: {cloudpricingcalculator.DataWithUnit},
   *    contentClassification: {cloudpricingcalculator.DataWithUnit}
   * }}
   */
  this.nLApi = {
    submitted: false,
    entityRecognition: {value: '', unit: 3},
    sentimentAnalysis: {value: '', unit: 3},
    syntaxAnalysis: {value: '', unit: 3},
    contentClassification: {value: '', unit: 3}
  };
};


/**
 * Adds a NL API items to Cart.
 *
 * @param {!angular.Form} NLApiForm
 * @export
 */
ListingCtrl.prototype.addNLApi = function(NLApiForm) {
  if (!NLApiForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddNLApi');
  /** @type {number} */
  var entityRecognition = this.toDefaultNumber_(
      this.nLApi.entityRecognition.value, this.nLApi.entityRecognition.unit);
  var sentimentAnalysis = this.toDefaultNumber_(
      this.nLApi.sentimentAnalysis.value, this.nLApi.sentimentAnalysis.unit);
  var syntaxAnalysis = this.toDefaultNumber_(
      this.nLApi.syntaxAnalysis.value, this.nLApi.syntaxAnalysis.unit);
  var contentClassification = this.toDefaultNumber_(
      this.nLApi.contentClassification.value,
      this.nLApi.contentClassification.unit);
  /** @type {!cloudpricingcalculator.SkuData} */
  var nLItem = null;

  if (this.isPositiveNumber_(entityRecognition)) {
    nLItem = {
      quantityLabel: 'records',
      displayName: 'Cloud Natural Language API',
      sku: 'CP-NL-API-ENTITY-RECOGNITION',
      region: 'us',
      quantity: entityRecognition,
      displayDescription: 'Entity Recognition',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.nLApi),
          product: 'nLApi',
          tab: 'nl-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(nLItem);
  }
  if (this.isPositiveNumber_(sentimentAnalysis)) {
    nLItem = {
      quantityLabel: 'records',
      displayName: 'Natural Language API',
      sku: 'CP-NL-API-SENTIMENT-ANALYSIS',
      region: 'us',
      quantity: sentimentAnalysis,
      displayDescription: 'Sentiment Analysis',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.nLApi),
          product: 'nLApi',
          tab: 'nl-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(nLItem);
  }
  if (this.isPositiveNumber_(syntaxAnalysis)) {
    nLItem = {
      quantityLabel: 'records',
      displayName: 'Natural Language API',
      sku: 'CP-NL-API-SYNTAX-ANALYSIS',
      region: 'us',
      quantity: syntaxAnalysis,
      displayDescription: 'Sentiment Analysis',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.nLApi),
          product: 'nLApi',
          tab: 'nl-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(nLItem);
  }
  if (this.isPositiveNumber_(contentClassification)) {
    nLItem = {
      quantityLabel: 'records',
      displayName: 'Natural Language API',
      sku: 'CP-NL-API-CONTENT-CLASSIFICATION',
      region: 'us',
      quantity: contentClassification,
      displayDescription: 'Content Classification',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.nLApi),
          product: 'nLApi',
          tab: 'nl-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(nLItem);
  }
  // Clear the data model
  this.setupNLApiData();
  this.resetForm(NLApiForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up ML Model.
 * @export
 */

ListingCtrl.prototype.setupMLData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    location: string,
   *    name: string,
   *    trainingTier: string,
   *    standardCount: string,
   *    largeCount: string,
   *    complexSCount: string,
   *    complexMCount: string,
   *    complexLCount: string,
   *    standardGpuCount: string,
   *    complexMGpuCount: string,
   *    complexLGpuCount: string,
   *    standardP100Count: string,
   *    complexMP100Count: string,
   *    standardV100Count: string,
   *    largeModelV100Count: string,
   *    complexModelMV100: string,
   *    complexModelLV100: string,
   *    trainingUnitsCount: number,
   *    trainingJobTime: number,
   *    trainingJobsCount: number,
   *    predictionsCount: number,
   *    predictionTime: number
   * }}
   */
  this.mL = {
    submitted: false,
    location: 'us',
    name: '',
    trainingTier: 'BASIC',
    standardCount: '',
    largeCount: '',
    complexSCount: '',
    complexMCount: '',
    complexLCount: '',
    standardGpuCount: '',
    complexMGpuCount: '',
    complexLGpuCount: '',
    standardP100Count: '',
    complexMP100Count: '',
    standardV100Count: '',
    largeModelV100Count: '',
    complexModelMV100: '',
    complexModelLV100: '',
    trainingJobTime: '',
    predictionMode: 'batch',
    nodehours: ''
  };
};


/**
 * Adds a NL API items to Cart.
 *
 * @param {!angular.Form} MLForm
 * @export
 */
ListingCtrl.prototype.addML = function(MLForm) {
  if (!MLForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddML');
  /** @type {string} */
  const region = this.mL.location;
  const name = this.mL.name;
  let sku = 'CP-ML-TRAINING';
  /** @type {number} */
  const trainingUnits = this.CloudCalculator.getMlUnitsCount(this.mL);
  const trainingTime = this.mL.trainingJobTime;
  const trainingAmount = (trainingUnits * trainingTime) / 60;
  const trainingCost =
      this.CloudCalculator.calculateItemPrice(sku, trainingAmount, region);
  /*var predictionsAmount = this.mL.predictionsCount;
  var inferenceTime = this.mL.predictionTime;
  var processingTime = predictionsAmount * inferenceTime;*/
  const totalPredictionNodeHours = this.mL.nodehours;
  let mode = this.mL.predictionMode;
  sku = mode == 'batch' ? 'CP-ML-PREDICTION-BATCH' : 'CP-ML-PREDICTION-ONLINE';
  let predictionTotalCost = 0;
  predictionTotalCost = this.CloudCalculator.calculateItemPrice(
      sku, totalPredictionNodeHours, region);
  const totalPrice = predictionTotalCost + trainingCost;
  /** @type {!cloudpricingcalculator.SkuData} */
  const mLItem = {
    quantityLabel: '',
    displayName: 'AI Platform',
    sku: 'CP-ML-GENERAL',
    region: this.fullRegion[region],
    quantity: trainingUnits,
    displayDescription: name,
    items: {
      mlUnits: trainingUnits,
      processingTime: totalPredictionNodeHours,
      editHook:
          {initialInputs: goog.object.clone(this.mL), product: 'mL', tab: 'ml'}
    }
  };
  this.CloudCalculator.addItemToCart(mLItem, totalPrice);
  // Clear the data model
  this.setupMLData();
  this.resetForm(MLForm);

  // Scroll to the cart
  this.scrollToCart();
};



/**
 * Attribute directive attached to md-slider. Runs the given function when
 * the user stops dragging the slider.
 * @return {!angular.Directive}
 * @constructor
 * @ngInject
 */
cloudpricingcalculator.DragEndDirective = function() {
  return {
    restrict: 'A',
    link: function(scope, element, attr) {
      element.on('$md.dragend', function() {
        scope.$eval(attr['dragEnd']);
      });
    }
  };
};


/**
 * Sets up Cloud Endpoints Model.
 * @export
 */
ListingCtrl.prototype.setupEndpoints = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    requestCount: {number}
   * }}
   */
  this.endpoints = {submitted: false, requestCount: ''};
};


/**
 * Adds a Cloud Endpoints to Cart.
 *
 * @param {!angular.Form} endpointsForm
 * @export
 */
ListingCtrl.prototype.addEndpoints = function(endpointsForm) {
  if (!endpointsForm.$valid || !this.endpoints.requestCount) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddCloudEndpoints');
  /** @type {number} */
  var requestCount = parseFloat(this.endpoints.requestCount);
  /** @type {!cloudpricingcalculator.SkuData} */
  var endpointsItem = null;

  if (this.isPositiveNumber_(requestCount)) {
    endpointsItem = {
      quantityLabel: 'millions',
      displayName: 'Cloud Endpoints',
      sku: 'CP-CLOUD-ENDPOINTS-REQUESTS',
      region: 'us',
      quantity: requestCount,
      displayDescription: 'Requests',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.endpoints),
          product: 'endpoints',
          tab: 'cloud-endpoints'
        }
      }
    };
    this.CloudCalculator.addItemToCart(endpointsItem);
  }

  // Clear the data model
  this.setupEndpoints();
  this.resetForm(endpointsForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Cloud KMS Model.
 * @export
 */

ListingCtrl.prototype.setupKMSData = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    keysCount: {number},
   *    keyOperationsCount: {number}
   * }}
   */
  this.kMS = {submitted: false, keysCount: '', keyOperationsCount: ''};
};


/**
 * Adds a Cloud KMS items to Cart.
 *
 * @param {!angular.Form} kMSForm
 * @export
 */
ListingCtrl.prototype.addKMS = function(kMSForm) {
  if (!(kMSForm.keysCount.$viewValue != '' ||
        kMSForm.keyOperationsCount.$viewValue != '') &&
      !kMSForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddKMS');
  /** @type {number} */
  var keysCount = parseFloat(this.kMS.keysCount);
  /** @type {number} */
  var keyOperationsCount = parseFloat(this.kMS.keyOperationsCount);
  /** @type {!cloudpricingcalculator.SkuData} */
  var kMSItem = null;

  if (this.isPositiveNumber_(keysCount)) {
    kMSItem = {
      quantityLabel: '',
      displayName: 'Cloud KMS',
      sku: 'CP-KMS-KEY-VERSION',
      region: 'us',
      quantity: keysCount,
      displayDescription: 'Keys',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.kMS),
          product: 'kMS',
          tab: 'cloud-kms'
        }
      }
    };
    this.CloudCalculator.addItemToCart(kMSItem);
  }
  if (this.isPositiveNumber_(keyOperationsCount)) {
    kMSItem = {
      quantityLabel: 'operations',
      displayName: 'Cloud KMS',
      sku: 'CP-KMS-CRYPTO-OPERATION',
      region: 'us',
      quantity: keyOperationsCount,
      displayDescription: 'Key Use Operations',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.kMS),
          product: 'kMS',
          tab: 'cloud-kms'
        }
      }
    };
    this.CloudCalculator.addItemToCart(kMSItem);
  }

  // Clear the data model
  this.setupKMSData();
  this.resetForm(kMSForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Spanner Model.
 * @export
 */
ListingCtrl.prototype.setupSpanner = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    name: string,
   *    configuration: string,
   *    computeUnit: string,
   *    processingUnitsCount: number,
   *    nodesCount: number,
   *    storage: !cloudpricingcalculator.DataWithUnit,
   *    backup: !cloudpricingcalculator.DataWithUnit,
   *    nodeStorageValidation: boolean,
   *    processingStorageValidation: boolean,
   *    processingUnitValidation: boolean
   * }}
   */
  this.spanner = {
    submitted: false,
    name: '',
    configuration: 'regional',
    location:
        this.retrieveLocation('us-central1', this.spannerRegionList.regional),
    computeUnit: 'processing-units',
    processingUnitsCount: 100,
    nodesCount: 0,
    storage: {value: '', unit: 2},
    backup: {value: '', unit: 2},
    nodeStorageValidation: false,
    processingStorageValidation: false,
    processingUnitValidation: true
  };
};


/**
 * Add a Spanner items to Cart
 *
 * @param {!angular.Form} spannerForm
 * @export
 */
ListingCtrl.prototype.addSpanner = function(spannerForm) {
  if (!spannerForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddSpanner');
  /** @type {number} */
  let nodes = this.spanner.computeUnit == 'nodes' ?
      parseFloat(this.spanner.nodesCount) :
      parseFloat(this.spanner.processingUnitsCount / 1000);
  /** @type {number} */
  let ssd = this.toDefaultUnit(
      this.spanner.storage.value, this.spanner.storage.unit,
      this.DEFAULT_UNITS.spannerStorage);
  this.spanner.storage.value = ssd;
  this.spanner.storage.unit = this.DEFAULT_UNITS.spannerStorage;

  let backup = this.toDefaultUnit(
      this.spanner.backup.value, this.spanner.backup.unit,
      this.DEFAULT_UNITS.spannerBackup);
  this.spanner.backup.value = backup;
  this.spanner.backup.unit = this.DEFAULT_UNITS.spannerBackup;

  /** @type {!cloudpricingcalculator.SkuData} */
  let spannerItem;
  /** @type {number} */
  let nodePrice = 0;
  /** @type {number} */
  let storagePrice = 0;
  /** @type {number} */
  let backupPrice = 0;
  /** @type {number} */
  let totalPrice = 0;
  /** @type {string} */
  const location = this.spanner.location;

  if (this.isPositiveNumber_(nodes)) {
    // nodes are charged per hour
    nodes *= this.TOTAL_BILLING_HOURS;
    nodePrice += this.CloudCalculator.calculateItemPrice(
        'CP-SPANNER-NODE', nodes, location);
    totalPrice += nodePrice;
  }

  if (this.isPositiveNumber_(ssd)) {
    ssd *= this.TB_TO_GB;
    storagePrice += this.CloudCalculator.calculateItemPrice(
        'CP-SPANNER-STORAGE-SSD', ssd, location);
    totalPrice += storagePrice;
  }

  if (this.isPositiveNumber_(backup)) {
    backup *= this.TB_TO_GB;
    backupPrice += this.CloudCalculator.calculateItemPrice(
        'CP-SPANNER-BACKUP', backup, location);
    totalPrice += backupPrice;
  }

  spannerItem = {
    quantityLabel: '',
    displayName: 'Cloud Spanner',
    sku: 'CP-SPANNER-GENERAL',
    region: location,
    quantity: nodes,
    displayDescription: this.spanner.name,
    items: {
      nodePrice,
      storagePrice,
      backupPrice,
      editHook: {
        initialInputs: goog.object.clone(this.spanner),
        product: 'spanner',
        tab: 'spanner'
      }
    }
  };
  this.CloudCalculator.addItemToCart(spannerItem, totalPrice);

  // Clear the data model
  this.setupSpanner();
  this.resetForm(spannerForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Spanner validation.
 * @export
 */
ListingCtrl.prototype.spannerStorageValidation = function() {
  if (this.spanner.computeUnit == 'nodes') {
    if ((this.toDefaultUnit(
             this.spanner.storage.value, this.spanner.storage.unit, 3) >
         2 * this.spanner.nodesCount) &&
        (this.spanner.nodesCount > 0 || this.spanner.nodesCount == '')) {
      this.spanner.nodeStorageValidation = true;
      this.spanner.processingStorageValidation = false;
    } else {
      this.spanner.nodeStorageValidation = false;
      this.spanner.processingStorageValidation = false;
      this.spanner.processingUnitValidation = true;
    }
  } else {
    if ((this.toDefaultUnit(
             this.spanner.storage.value, this.spanner.storage.unit, 2) >
         205 * this.spanner.processingUnitsCount / 100) &&
        (this.spanner.processingUnitsCount > 0 ||
         this.spanner.processingUnitsCount == '')) {
      this.spanner.processingStorageValidation = true;
      this.spanner.nodeStorageValidation = false;
    } else {
      this.spanner.processingStorageValidation = false;
      this.spanner.nodeStorageValidation = false;
    }
    if (this.spanner.processingUnitsCount > 0) {
      this.spanner.processingUnitValidation =
          !(this.spanner.processingUnitsCount > 1000 ?
                this.spanner.processingUnitsCount % 1000 != 0 :
                this.spanner.processingUnitsCount % 100 != 0);
    } else {
      this.spanner.processingUnitValidation = true;
    }
  }
};


/**
 * Sets up Functions Model.
 * @export
 */
ListingCtrl.prototype.setupFunctions = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    name: {string},
   *    type: {string},
   *    executionTime: {number},
   *    bandwidth: {cloudpricingcalculator.DataWithUnit},
   *    invocationsCount: {number}
   * }}
   */
  this.functions = {
    submitted: false,
    name: '',
    type: '128-200',
    executionTime: '',
    bandwidth: {value: '', unit: 1},
    invocationsCount: '',
  };
};


/**
 * Add a Functions items to Cart
 *
 * @param {!angular.Form} functionsForm
 * @export
 */
ListingCtrl.prototype.addFunctions = function(functionsForm) {
  if (!functionsForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddFunctions');
  /** @type {!Object.<string, number>} */
  var typeDict = this.parseFunctionsType_(this.functions.type);
  /** @type {number} */
  var executionTime = this.functions.executionTime / 1000;
  var invocationsCount = this.functions.invocationsCount;
  var gbSeconds = (typeDict.ram / 1024) * executionTime * invocationsCount;
  var ghzSeconds = (typeDict.cpu / 1000) * executionTime * invocationsCount;
  var bandwidth =
      this.toDefaultUnit(
          this.functions.bandwidth.value, this.functions.bandwidth.unit, 2) *
      invocationsCount;
  /** @type {!cloudpricingcalculator.SkuData} */
  var functionsItem = null;
  /** @type {number} */
  var totalPrice = 0;

  if (this.isPositiveNumber_(gbSeconds)) {
    totalPrice += this.CloudCalculator.calculateItemPrice(
        'CP-FUNCTIONS-GB-SECONDS', gbSeconds, 'us');
  }

  if (this.isPositiveNumber_(ghzSeconds)) {
    totalPrice += this.CloudCalculator.calculateItemPrice(
        'CP-FUNCTIONS-GHZ-SECONDS', ghzSeconds, 'us');
  }

  if (this.isPositiveNumber_(invocationsCount)) {
    totalPrice += this.CloudCalculator.calculateItemPrice(
        'CP-FUNCTIONS-EXECUTIONS', invocationsCount, 'us');
  }

  if (this.isPositiveNumber_(bandwidth)) {
    totalPrice += this.CloudCalculator.calculateItemPrice(
        'CP-FUNCTIONS-BW-O', bandwidth, 'us');
  }

  functionsItem = {
    quantityLabel: '',
    displayName: 'Cloud Functions',
    sku: 'CP-FUNCTIONS-GENERAL',
    region: 'us',
    quantity: invocationsCount,
    displayDescription: this.functions.name,
    items: {
      gbSeconds: gbSeconds,
      ghzSeconds: ghzSeconds,
      bandwidth: bandwidth,
      editHook: {
        initialInputs: goog.object.clone(this.functions),
        product: 'functions',
        tab: 'functions'
      }
    }
  };

  this.CloudCalculator.addItemToCart(functionsItem, totalPrice);

  // Clear the data model
  this.setupFunctions();
  this.resetForm(functionsForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up PSO Data.
 * @export
 */
ListingCtrl.prototype.setupPSOData = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    type: {!Array.<string>}
   * }}
   */
  this.pso = {submitted: false, types: []};
};


/**
 * Adds PSO to Cart.
 *
 * @param {!angular.Form} psoForm
 * @export
 */
ListingCtrl.prototype.addPSO = function(psoForm) {
  if (!psoForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddPSO');
  goog.array.forEach(this.pso.types, function(type) {
    var displayName = this.getPSOName(type);
    /** @type {!cloudpricingcalculator.SkuData} */
    var psoItem = {
      quantityLabel: '',
      region: 'us',
      displayName: displayName,
      sku: type,
      quantity: 1,
      displayDescription: 'PSO',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.pso),
          product: 'pso',
          tab: 'support'
        }
      }
    };
    this.CloudCalculator.addItemToCart(psoItem);
  }, this);

  // Clear the data model
  this.setupPSOData();
  this.resetForm(psoForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Gets PSO name.
 *
 * @param {string} type Type of the PSO
 * @return {string} name of the pso
 * @export
 */
ListingCtrl.prototype.getPSOName = function(type) {
  var name = '';
  goog.array.forEach(this.psoList, function(item) {
    if (item.value == type) {
      name = item.name;
    }
  }, this);
  return name;
};



/**
 * Checks PSO checkbox.
 *
 * @param {string} item item to be checked
 * @param {!Array.<string>} list array where to check
 * @return {boolean} whether item is present in the list
 * @export
 */
ListingCtrl.prototype.checkPsoBox = function(item, list) {
  return list.indexOf(item) > -1;
};



/**
 * Toggles PSO checkbox .
 *
 * @param {string} item item to be toggle
 * @param {!Array.<string>} list array where to toggle
 * @export
 */
ListingCtrl.prototype.togglePsoBox = function(item, list) {
  let idx = list.indexOf(item);
  if (item == 'CP-PROF-SVC-TAM') {
    this.setActiveTab('premium-support');
  } else if (idx > -1) {
    list.splice(idx, 1);
  } else {
    list.push(item);
  }
};


/**
 * Parse functions type CPU/Mhz.
 *
 * @param {string} type Functions type
 * @return {!Object.<string, number>} CPU/Mhz values of current type.
 * @private
 */
ListingCtrl.prototype.parseFunctionsType_ = function(type) {
  var response = type.split('-');
  return {'ram': response[0] || 0, 'cpu': response[1] || 0};
};


/**
 * Sets up reCAPTCHA Model.
 * @export
 */

ListingCtrl.prototype.setupRecaptcha = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    assessments: ?number
   * }}
   */
  this.recaptcha = {submitted: false, assessments: null};
};


/**
 * Adds reCAPTCHA items to Cart.
 *
 * @param {!angular.Form} recaptchaForm
 * @export
 */
ListingCtrl.prototype.addRecaptcha = function(recaptchaForm) {
  if (!(recaptchaForm.assessments.$viewValue != '') && !recaptchaForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddRecaptcha');

  const location = 'us';
  const assessments = this.recaptcha.assessments / 1000;
  if (this.isPositiveNumber_(assessments)) {
    /** @type {!cloudpricingcalculator.SkuData} */
    const recaptchaItem = {
      quantityLabel: 'assessments',
      displayName: 'Assessments',
      sku: 'CP-RECAPTCHA',
      region: location,
      quantity: assessments,
      displayDescription: 'Number of assessments to create',
      price: null,
      uniqueId: null,
      items: {
        assessments: assessments,
        editHook: {
          initialInputs: goog.object.clone(this.recaptcha),
          product: 'recaptcha',
          tab: 'recaptcha'
        }
      }
    };
    this.CloudCalculator.addItemToCart(recaptchaItem);
  }


  // Clear the data model
  this.setupRecaptcha();
  this.resetForm(recaptchaForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Premium Support Model.
 * @export
 */

ListingCtrl.prototype.setupPremiumSupport = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    usage:string,
   *    gcpUsage: ?number,
   *    gSuiteUsage: ?number,
   *    tamServiceLevel: number,
   *    numberOfTam: ?number
   * }}
   */
  this.premiumSupport = {
    submitted: false,
    usage: 'gcp',
    gcpUsage: null,
    gSuiteUsage: null,
    tamServiceLevel: 0,
    numberOfTam: null
  };
};
/**
 * Re-set form on dropdown change Type
 * @param {!object} formName form name.
 * @param {string} constructorName product constructor name.
 * @export
 */
ListingCtrl.prototype.setUsageType = function(formName, constructorName) {
  if (constructorName == 'premiumSupport') {
    this[constructorName] = {
      submitted: false,
      usage: formName.usage.$viewValue,
      gcpUsage: null,
      gSuiteUsage: null,
      tamServiceLevel: 0,
      numberOfTam: null
    };
  } else {
    this[constructorName] = {
      submitted: false,
      usage: formName.usage.$viewValue,
      gcpUsage: null,
      gSuiteUsage: null
    };
  }
  this.resetForm(formName);
};
/**
 * Adds a Premimum Support items to Cart.
 *
 * @param {!angular.Form} premiumSupportForm
 * @export
 */
ListingCtrl.prototype.addPremiumSupport = function(premiumSupportForm) {
  if (!(premiumSupportForm.gcpUsage.$viewValue != '' ||
        premiumSupportForm.gSuiteUsage.$viewValue != '') &&
      !premiumSupportForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddPremiumSupport');
  let tamServiceLevel = this.premiumSupport.tamServiceLevel;
  const numberOfTam =
      tamServiceLevel == 4 ? this.premiumSupport.numberOfTam : null;
  const tamServiceLevelType = [
    'Named TAM', 'Expanded TAM', null, 'Dedicated TAM', 'Multi TAM'
  ][tamServiceLevel];
  if (tamServiceLevel == 4 && numberOfTam > 0) {
    tamServiceLevel = numberOfTam * tamServiceLevel - 1;
  }
  const tamPrice = this.CloudCalculator.calculateItemPrice(
      'CP-TECHNICAL-ACCOUNT-MANAGEMENT', Number(tamServiceLevel), 'us');
  /** @type {number} */
  let PremiumSupportPrice = this.CloudCalculator.calculateSupportPrice(
      'CP-PREMIUM-SUPPORT', this.premiumSupport.gcpUsage,
      this.premiumSupport.gSuiteUsage);
  /** @type {number} */
  const totalPrice = tamPrice + PremiumSupportPrice;
  /** @type {!cloudpricingcalculator.SkuData} */
  const premimumSupportItem = {
    quantityLabel: 'monthly usage',
    displayName: 'Premium Support',
    sku: 'CP-PREMIUM-SUPPORT',
    quantity: totalPrice,
    region: 'us',
    gcpUsage: this.premiumSupport.gcpUsage,
    gSuiteUsage: this.premiumSupport.gSuiteUsage,
    displayDescription: 'Premium',
    items: {
      PremiumSupportPrice: PremiumSupportPrice,
      tamPrice: tamPrice,
      numberOfTam: numberOfTam,
      tamServiceLevelType: tamServiceLevelType,
      editHook: {
        initialInputs: goog.object.clone(this.premiumSupport),
        product: 'premiumSupport',
        tab: 'premium-support'
      }
    }
  };
  this.CloudCalculator.addItemToCart(premimumSupportItem, totalPrice);

  // Clear the data model
  this.setupPremiumSupport();
  this.resetForm(premiumSupportForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Enhanced Support Model.
 * @export
 */

ListingCtrl.prototype.setupEnhancedSupport = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    usage:string,
   *    gcpUsage: ?number,
   *    gSuiteUsage: ?number
   * }}
   */
  this.enhancedSupport =
      {submitted: false, usage: 'gsuite', gcpUsage: null, gSuiteUsage: null};
};

/**
 * Adds a Enhanced Support items to Cart.
 *
 * @param {!angular.Form} enhancedSupportForm
 * @export
 */
ListingCtrl.prototype.addEnhancedSupport = function(enhancedSupportForm) {
  if (!(enhancedSupportForm.gcpUsage.$viewValue != '' ||
        enhancedSupportForm.gSuiteUsage.$viewValue != '') &&
      !enhancedSupportForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'addEnhancedSupport');
  /** @type {number} */
  var totalPrice = this.CloudCalculator.calculateSupportPrice(
      'CP-ENHANCED-SUPPORT', this.enhancedSupport.gcpUsage,
      this.enhancedSupport.gSuiteUsage);
  /** @type {!cloudpricingcalculator.SkuData} */
  const enhancedSupportItem = {
    quantityLabel: 'monthly usage',
    displayName: 'Enhanced Support',
    sku: 'CP-ENHANCED-SUPPORT',
    quantity: totalPrice,
    region: 'us',
    displayDescription: 'Enhanced',
    price: totalPrice,
    uniqueId: null,
    items: {
      gcpUsage: this.enhancedSupport.gcpUsage,
      gSuiteUsage: this.enhancedSupport.gSuiteUsage,
      editHook: {
        initialInputs: goog.object.clone(this.enhancedSupport),
        product: 'enhancedSupport',
        tab: 'enhanced-support'
      }
    }
  };
  this.CloudCalculator.addItemToCart(enhancedSupportItem, totalPrice);

  // Clear the data model
  this.setupEnhancedSupport();
  this.resetForm(enhancedSupportForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Standard Support Model.
 * @export
 */

ListingCtrl.prototype.setupStandardSupport = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    usage:string,
   *    gcpUsage: ?number,
   * }}
   */
  this.standardSupport = {submitted: false, usage: 'gcp', gcpUsage: null};
};

/**
 * Adds a Enhanced Support items to Cart.
 *
 * @param {!angular.Form} standardSupportForm
 * @export
 */
ListingCtrl.prototype.addStandardSupport = function(standardSupportForm) {
  if (!(standardSupportForm.gcpUsage.$viewValue != '') &&
      !standardSupportForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'addStandardSupport');
  /** @type {number} */
  const totalPrice = this.CloudCalculator.calculateSupportPrice(
      'CP-STANDARD-SUPPORT', this.standardSupport.gcpUsage);
  /** @type {!cloudpricingcalculator.SkuData} */
  const standardSupportItem = {
    quantityLabel: 'monthly usage',
    displayName: 'Standard Support',
    sku: 'CP-STANDARD-SUPPORT',
    quantity: totalPrice,
    region: 'us',
    displayDescription: 'Standard',
    price: totalPrice,
    uniqueId: null,
    items: {
      gcpUsage: this.standardSupport.gcpUsage,
      editHook: {
        initialInputs: goog.object.clone(this.standardSupport),
        product: 'standardSupport',
        tab: 'standard-support'
      }
    }
  };
  this.CloudCalculator.addItemToCart(standardSupportItem, totalPrice);

  // Clear the data model
  this.setupStandardSupport();
  this.resetForm(standardSupportForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Cloud SQL Postgre Data.
 * @export
 */
ListingCtrl.prototype.setupCloudSQLPostgreData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    instanceCount: ?number,
   *    instance: string,
   *    label: string,
   *    location: string,
   *    storage: !cloudpricingcalculator.DataWithUnit,
   *    backup: !cloudpricingcalculator.DataWithUnit,
   *    custom: !Object.<string,number>,
   *    includeHA: boolean,
   *    hours: number,
   *    days: number,
   *    minutes: number,
   *    timeType: string,
   *    timeMode: string,
   *    daysMonthly: number,
   *    cud: number,
   *    ramLimit: !Object.<string, number>
   * }}
   */
  this.cloudSQLPostgre = {
    submitted: false,
    instanceCount: null,
    instance: 'db-standard-1',
    label: '',
    location: this.retrieveLocation(),
    storageType: 'SSD',
    storage: {value: '', unit: this.DEFAULT_UNITS.sql2Storage},
    backup: {value: '', unit: this.DEFAULT_UNITS.sql2Backup},
    includeHA: false,
    custom: {vcpu: 1, ram: 3.75},
    hours: 24,
    days: 7,
    minutes: 1440,
    timeType: 'hours',
    timeMode: 'day',
    daysMonthly: 30,
    cud: 0,
    ramLimit: {min: 3.75, max: 6.5}
  };
};


/**
 * Adds a Cloud SQL Postgre Instance to Cart.
 *
 * @param {!angular.Form} cloudSQLForm
 * @export
 */
ListingCtrl.prototype.addCloudSQLPostgre = function(cloudSQLForm) {
  if (!cloudSQLForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddCloudSQLPostgre');
  /** @type {number} */
  let haMultiplier = 1;
  const hours = this.cloudSQLPostgre.timeType == 'hours' ?
      this.cloudSQLPostgre.hours :
      this.cloudSQLPostgre.timeType == 'minutes' ?
      this.cloudSQLPostgre.minutes / 60 :
      this.cloudSQLPostgre.daysMonthly * 24;
  const hoursMultiplier = this.cloudSQLPostgre.timeMode == 'day' ?
      this.cloudSQLPostgre.days * this.WEEKS :
      1;
  let skuData = null;
  /**
   * Calculate the days / month based on average
   * @type {number}
   */
  let hoursPerMonth = hours * hoursMultiplier;
  const cud = (this.cloudSQLPostgre.instance === 'db-f1-micro' ||
               this.cloudSQLPostgre.instance === 'db-g1-small') ?
      0 :
      this.cloudSQLPostgre.cud;
  let sku = this.generateCloudSqlSkuName('cloudSQLPostgre');
  if (this.cloudSQLPostgre.instance == 'custom') {
    this.cloudSQLPostgre.instance =
        `DB-CUSTOM-${this.cloudSQLPostgre.custom.vcpu}-${
            this.cloudSQLPostgre.custom.ram * 1024}`;
  }

  let termText = '';

  if (cud > 0) {
    hoursPerMonth = this.TOTAL_BILLING_HOURS;
    sku = `${sku}-CUD-${cud}-YEAR`;
    termText = `${cud} Year${cud == 3 ? 's' : ''}`;
  }

  const quantity = this.cloudSQLPostgre.instanceCount;
  const quantityLabel = 'total hours per month';
  const region = this.cloudSQLPostgre.location;

  if (this.cloudSQLPostgre.includeHA) {
    haMultiplier = 2;
  }

  // Calculate instance price first
  /** @type {number}*/
  const instancePrice =
      this.CloudCalculator.calculateItemPrice(sku, hoursPerMonth, region);
  let price = instancePrice * haMultiplier;
  // Add the storage cost
  const storage = this.toDefaultUnit(
      this.cloudSQLPostgre.storage.value, this.cloudSQLPostgre.storage.unit,
      this.DEFAULT_UNITS.sql2Storage);
  this.cloudSQLPostgre.storage.value = storage;
  const storageType = this.cloudSQLPostgre.storageType;
  const storageSku = 'CP-CLOUDSQL-STORAGE-' + storageType;
  this.cloudSQLPostgre.storage.unit = this.DEFAULT_UNITS.sql2Storage;
  skuData = this.CloudCalculator.cloudSkuData[storageSku];
  price += storage * skuData[region] * haMultiplier;
  // Add backup cost
  const backup = this.toDefaultUnit(
      this.cloudSQLPostgre.backup.value, this.cloudSQLPostgre.backup.unit,
      this.DEFAULT_UNITS.sql2Backup);
  this.cloudSQLPostgre.backup.value = backup;
  this.cloudSQLPostgre.backup.unit = this.DEFAULT_UNITS.sql2Backup;
  skuData = this.CloudCalculator.cloudSkuData['CP-CLOUDSQL-BACKUP'];
  price += backup * skuData[region];

  const title = this.cloudSQLPostgre.label || this.cloudSQLPostgre.instance;

  const databaseConfig = storage + ' GB';

  price *= quantity;

  /** @type {!cloudpricingcalculator.SkuData} */
  const sqlItem = {
    sku: sku,
    quantity: hoursPerMonth,
    quantityLabel: quantityLabel,
    region:
        this.fullRegion[region] || this.fullRegion[this.regionFallback[region]],
    displayName: title,
    displayDescription: databaseConfig,
    price: null,
    uniqueId: null,
    items: {
      termText: termText,
      editHook: {
        initialInputs: goog.object.clone(this.cloudSQLPostgre),
        product: 'cloudSQLPostgre',
        tab: 'sql'
      }
    }
  };

  this.CloudCalculator.addItemToCart(sqlItem, price);

  this.setupCloudSQLPostgreData();
  this.resetForm(cloudSQLForm);
  this.onCloudSqlInstanceChange('cloudSQLPostgre');

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up DLP API Model.
 * @export
 */
ListingCtrl.prototype.setupDlpApi = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    requestsCount: {number},
   *    inspectedContentVolume: {cloudpricingcalculator.DataWithUnit},
   *    transformedContentVolume: {cloudpricingcalculator.DataWithUnit}
   * }}
   */
  this.dlpApi = {
    submitted: false,
    requestsCount: '',
    inspectedContentVolume: {value: '', unit: 0},
    transformedContentVolume: {value: '', unit: 0},
  };
};


/**
 * Add a DLP API items to Cart
 *
 * @param {!angular.Form} dlpApiForm
 * @export
 */
ListingCtrl.prototype.addDlpApi = function(dlpApiForm) {
  if (dlpApiForm.$invalid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddDlpApi');

  /** @type {number} */
  var requests = this.dlpApi.requestsCount;
  var infotypesCount = 1;
  var singleRequestInspectVolume = this.toDefaultUnit(
      this.dlpApi.inspectedContentVolume.value,
      this.dlpApi.inspectedContentVolume.unit, 2);
  // It's divided by 1000 * 1000 because billable is Giga Units(GU) and input
  // is in KU
  var inspectedContentUnits =
      singleRequestInspectVolume * infotypesCount * requests;
  var singleRequestTransformVolume = this.toDefaultUnit(
      this.dlpApi.transformedContentVolume.value,
      this.dlpApi.transformedContentVolume.unit, 2);
  var transformedContentUnits = singleRequestTransformVolume * requests;
  var location = 'us';
  /** @type {!cloudpricingcalculator.SkuData} */
  var dlpItem = null;

  if (this.isPositiveNumber_(inspectedContentUnits)) {
    dlpItem = {
      quantityLabel: 'GiB',
      region: location,
      displayName: 'DLP API',
      sku: 'CP-DLP-INSPECTION',
      quantity: inspectedContentUnits,
      displayDescription: 'Content Inspection',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.dlpApi),
          product: 'dlpApi',
          tab: 'data-loss-prevention'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dlpItem);
  }

  if (this.isPositiveNumber_(transformedContentUnits)) {
    dlpItem = {
      quantityLabel: 'GiB',
      region: location,
      displayName: 'DLP API',
      sku: 'CP-DLP-TRANSFORMATION',
      quantity: transformedContentUnits,
      displayDescription: 'Content Transformation',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.dlpApi),
          product: 'dlpApi',
          tab: 'data-loss-prevention'
        }
      }
    };

    this.CloudCalculator.addItemToCart(dlpItem);
  }

  // Clear the data model
  this.setupDlpApi();
  this.resetForm(dlpApiForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up DLP API Model for storage scans.
 * @export
 */
ListingCtrl.prototype.setupDlpApiStorage = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    jobCount: {number},
   *    storedContentVolume: {cloudpricingcalculator.DataWithUnit},
   *    infotypesCount: {number},
   *    transformedContentVolume: {cloudpricingcalculator.DataWithUnit}
   * }}
   */
  this.dlpApiStorage = {
    submitted: false,
    storedContentVolume: {value: '', unit: 2}

  };
};


/**
 * Add a DLP API items to Cart
 *
 * @param {!angular.Form} dlpApiForm
 * @export
 */
ListingCtrl.prototype.addDlpApiStorage = function(dlpApiForm) {
  if (dlpApiForm.$invalid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddDlpApi');

  /** @type {number} */
  var soredDataInspections = this.toDefaultUnit(
      this.dlpApiStorage.storedContentVolume.value,
      this.dlpApiStorage.storedContentVolume.unit, 2);
  var location = 'us';
  /** @type {!cloudpricingcalculator.SkuData} */
  var dlpItem = null;
  if (this.isPositiveNumber_(soredDataInspections)) {
    dlpItem = {
      quantityLabel: 'GiB',
      region: location,
      displayName: 'DLP API',
      sku: 'CP-DLP-STORAGE-INSPECTION',
      quantity: soredDataInspections,
      displayDescription: 'Stored Data Inspection',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.dlpApiStorage),
          product: 'dlpApiStorage',
          tab: 'data-loss-prevention'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dlpItem);
  }

  // Clear the data model
  this.setupDlpApiStorage();
  this.resetForm(dlpApiForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Dataprep Model.
 * @export
 */
ListingCtrl.prototype.setupDataprep = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    edition: string,
   *    userCount: ?number,
   *    unitCount: ?number,
   * }}
   */
  this.dataprep =
      {submitted: false, edition: 'starter', userCount: null, unitCount: null};
};


/**
 * Adds a Dataprep to Cart.
 *
 * @param {!angular.Form} dataprepForm
 * @export
 */
ListingCtrl.prototype.addDataprep = function(dataprepForm) {
  if (this.isFormEmpty(dataprepForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddCloudDataprep');

  /** @type {string} */
  const edition = this.dataprep.edition.toUpperCase();
  /** @type {number} */
  const userCount = parseFloat(this.dataprep.userCount);
  /** @type {number} */
  const unitCount = parseFloat(this.dataprep.unitCount);

  /** @type {!cloudpricingcalculator.SkuData} */
  let dataprepItem;

  if (this.isPositiveNumber_(userCount)) {
    dataprepItem = {
      quantityLabel: 'users',
      displayName: 'Dataprep by Trifacta',
      sku: `CP-DATAPREP-${edition}-USER`,
      quantity: userCount,
      displayDescription: 'Cloud Dataprep',
      region: 'us',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.dataprep),
          product: 'dataprep',
          tab: 'dataprep'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dataprepItem);
  }

  if (this.isPositiveNumber_(unitCount)) {
    dataprepItem = {
      quantityLabel: 'units',
      displayName: 'Dataprep by Trifacta',
      sku: `CP-DATAPREP-${edition}-UNIT`,
      quantity: unitCount,
      displayDescription: 'Cloud Dataprep',
      region: 'us',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.dataprep),
          product: 'dataprep',
          tab: 'dataprep'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dataprepItem);
  }

  // Clear the data model
  this.setupDataprep();
  this.resetForm(dataprepForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Setup IoT Core Data
 * @export
 */
ListingCtrl.prototype.setupIotCoreData = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    modelingType: string,
   *    deviceCount: ?number,
   *    messageCount: ?number,
   *    dataVolume: {cloudpricingcalculator.DataWithUnit},
   *    messageSize:{cloudpricingcalculator.DataWithUnit},
   * }}
   */
  this.iotCore = {
    submitted: false,
    modelingType: 'value',
    deviceCount: null,
    messageCount: null,
    dataVolume: {value: '', unit: this.DEFAULT_UNITS.iotDataVolume},
    messageSize: {value: '', unit: this.DEFAULT_UNITS.messageSize},
  };
};


/**
 * Adds IoT Core restore to Cart.
 *
 * @param {!angular.Form} iotForm
 * @export
 */
ListingCtrl.prototype.addIotCore = function(iotForm) {
  if (iotForm.dataVolume.$viewValue == '' && !iotForm.$valid) {
    return;
  }
  /** @type {?number} */
  let dataVolume = null;
  let messageSize = null;
  this.Analytics.sendEvent('AddIotCore');
  if (this.iotCore.modelingType == 'value') {
    dataVolume = this.toDefaultUnit(
        this.iotCore.dataVolume.value, this.iotCore.dataVolume.unit,
        this.DEFAULT_UNITS.iotDataVolume);
  } else if (this.iotCore.modelingType == 'info') {
    messageSize = this.iotCore.messageSize ?
        this.toDefaultUnit(
            this.iotCore.messageSize.value, this.iotCore.messageSize.unit,
            this.DEFAULT_UNITS.messageSize) :
        null;
    dataVolume = this.iotCore.deviceCount * this.iotCore.messageCount *
        messageSize * this.DAYS;
  }

  /** @type {?cloudpricingcalculator.SkuData} */
  let iotCoreItem = null;

  if (this.isPositiveNumber_(dataVolume)) {
    iotCoreItem = {
      quantityLabel: 'MiB',
      region: 'us',
      displayName: 'Iot Core',
      sku: 'CP-IOT-CORE-DATA',
      quantity: dataVolume,
      displayDescription: 'Data exchanged',
      items: {
        messageSize: messageSize,
        editHook: {
          initialInputs: goog.object.clone(this.iotCore),
          product: 'iotCore',
          tab: 'iot-core'
        }
      }
    };
    this.CloudCalculator.addItemToCart(iotCoreItem);
  }

  // Clear the data model
  this.setupIotCoreData();
  this.resetForm(iotForm);

  // Scroll to the cart
  this.scrollToCart();
};



/**
 * Sets up Vision Api Model.
 * @export
 */

ListingCtrl.prototype.setupVideoApiData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    labelDetection: ?number,
   *    explicitDetection: ?number,
   *    shotDetection: ?number,
   *    speechTranscription: ?number,
   *    objectTracking: ?number,
   *    textDetection: ?number,
   *    logoDetection: ?number,
   *    faceDetection: ?number,
   *    personDetection: ?number,
   *    celebrityRecognition: ?number,
   *    streamingLabelDetection: ?number,
   *    streamingExplicitDetection: ?number,
   *    streamingShotDetection: ?number,
   *    streamingObjectTracking: ?number
   * }}
   */
  this.videoApi = {
    submitted: false,
    labelDetection: null,
    explicitDetection: null,
    shotDetection: null,
    speechTranscription: null,
    objectTracking: null,
    textDetection: null,
    logoDetection: null,
    faceDetection: null,
    personDetection: null,
    celebrityRecognition: null,
    streamingLabelDetection: null,
    streamingExplicitDetection: null,
    streamingShotDetection: null,
    streamingObjectTracking: null
  };
};


/**
 * Adds a Vision API items to Cart.
 *
 * @param {!angular.Form} videoForm
 * @export
 */
ListingCtrl.prototype.addVideoApi = function(videoForm) {
  if (this.isFormEmpty(videoForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddVideIntelligenceApi');

  const features = [
    {
      skuId: 'LABEL-DETECTION',
      name: 'Label Detection',
      quantity: this.videoApi.labelDetection
    },
    {
      skuId: 'SHOT-DETECTION',
      name: 'Explicit Content Detection',
      quantity: this.videoApi.shotDetection
    },
    {
      skuId: 'EXPLICIT-CONTENT-DETECTION',
      name: 'Shot Detection',
      quantity: this.videoApi.explicitDetection
    },
    {
      skuId: 'SPEECH-TRANSCRIPTION',
      name: 'Speech Tanscription',
      quantity: this.videoApi.speechTranscription
    },
    {
      skuId: 'OBJECT-TRACKING',
      name: 'Object Tracking',
      quantity: this.videoApi.objectTracking
    },
    {
      skuId: 'TEXT-DETECTION',
      name: 'Text Detection',
      quantity: this.videoApi.textDetection
    },
    {
      skuId: 'LOGO-DETECTION',
      name: 'Logo Detection',
      quantity: this.videoApi.logoDetection
    },
    {
      skuId: 'FACE-DETECTION',
      name: 'Face Detection',
      quantity: this.videoApi.faceDetection
    },
    {
      skuId: 'PERSON-DETECTION',
      name: 'Person Detection',
      quantity: this.videoApi.personDetection
    },
    {
      skuId: 'CELEBRITY-RECOGNITION',
      name: 'Celebrity Recognition',
      quantity: this.videoApi.celebrityRecognition
    },
    {
      skuId: 'STREAMING-LABEL-DETECTION',
      name: 'Streaming Label Detection',
      quantity: this.videoApi.streamingLabelDetection
    },
    {
      skuId: 'STREAMING-SHOT-DETECTION',
      name: 'Streaming Explicit Content Detection',
      quantity: this.videoApi.streamingShotDetection
    },
    {
      skuId: 'STREAMING-EXPLICIT-CONTENT-DETECTION',
      name: 'Streaming Shot Detection',
      quantity: this.videoApi.streamingExplicitDetection
    },
    {
      skuId: 'STREAMING-OBJECT-TRACKING',
      name: 'Streaming Object Tracking',
      quantity: this.videoApi.streamingObjectTracking
    }
  ];

  features.forEach(feature => {
    if (this.isPositiveNumber_(feature.quantity)) {
      let videoApiItem = {
        quantityLabel: 'minutes',
        displayName: 'Video Intelligence API',
        sku: `CP-VIDEO-INTELLIGENCE-${feature.skuId}`,
        region: 'us',
        quantity: feature.quantity,
        displayDescription: feature.name,
        items: {
          editHook: {
            initialInputs: goog.object.clone(this.videoApi),
            product: 'videoApi',
            tab: 'video-api'
          }
        }
      };
      this.CloudCalculator.addItemToCart(videoApiItem);
    }
  });

  // Clear the data model
  this.setupVideoApiData();
  this.resetForm(videoForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Cloud TPUs Model.
 * @export
 */

ListingCtrl.prototype.setupTpuData = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    recognition: {number}
   * }}
   */
  this.tpu = {
    submitted: false,
    tpuCount: '',
    location: 'us-central1',
    tpuGeneration: 'V2',
    tpuClass: 'regular',
    hours: 24,
    days: 7,
    minutes: 1440,
    timeType: 'hours',
    timeMode: 'day',
    daysMonthly: 30
  };
};


/**
 * Adds Cloud TPUs to Cart.
 *
 * @param {!angular.Form} tpuForm
 * @export
 */
ListingCtrl.prototype.addTpu = function(tpuForm) {
  if (!tpuForm.$valid) {
    return;
  }
  /**
   * @type {number}
   */
  var hours = this.tpu.timeType == 'hours' ? this.tpu.hours :
      this.tpu.timeType == 'minutes'       ? this.tpu.minutes / 60 :
                                             this.tpu.daysMonthly * 24;
  /** @type {number} */
  var hoursMultiplier =
      this.tpu.timeMode == 'day' ? this.tpu.days * this.WEEKS : 1;
  var sku = 'CP-CLOUD-TPU';
  if (this.tpu.tpuGeneration === 'V3') {
    sku = sku + '-V3';
  }
  if (this.tpu.tpuClass === 'preemptible') {
    sku = sku + '-PREEMPTIBLE';
  }
  /**
   * Calculate the days / month based on average
   * @type {number}
   */
  var hoursPerMonth = hours * hoursMultiplier;
  /**
   * @type {number}
   */
  var tpus = this.tpu.tpuCount;
  var quantity = tpus * hoursPerMonth;

  var region = this.tpu.location;

  this.Analytics.sendEvent('addToEstimate', 'AddTPU');
  /** @type {!cloudpricingcalculator.SkuData} */
  var tpuItem = {
    quantityLabel: 'hours',
    displayName: 'Cloud TPUs',
    sku: sku,
    region: region,
    quantity: quantity,
    displayDescription: 'TPUs hours',
    items: {
      editHook: {
        initialInputs: goog.object.clone(this.tpu),
        product: 'tpu',
        tab: 'compute-engine'
      }
    }
  };
  this.CloudCalculator.addItemToCart(tpuItem);
  // Clear the data model
  this.setupTpuData();
  this.resetForm(tpuForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Datafusion Model.
 * @export
 */

ListingCtrl.prototype.setupDataFusionData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    label: string,
   *    fusionEdition: string,
   *    numberOfInstance: ?number,
   *    instanceTime: number,
   * }}
   */
  this.dataFusion = {
    submitted: false,
    label: '',
    fusionEdition: 'basic',
    numberOfInstance: null,
    instanceTime: 730
  };
};


/**
 * Adds a Datafusion items to Cart.
 *
 * @param {!angular.Form} dataFusionForm
 * @export
 */
ListingCtrl.prototype.addDataFusion = function(dataFusionForm) {
  if (!dataFusionForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddDataFusion');
  const fusionEdition = this.dataFusion.fusionEdition;
  /** @type {?number} */
  const numberOfInstance = this.dataFusion.numberOfInstance;
  const instanceTime = this.dataFusion.instanceTime;
  /** @const {string} */
  const sku = 'CP-DATAFUSION-' + fusionEdition.toUpperCase();
  const quantity = instanceTime * numberOfInstance;

  /** @type {!cloudpricingcalculator.SkuData} */
  const dataFusionItem = {
    quantityLabel: 'instance hours',
    displayName: 'Data Fusion',
    sku: sku,
    region: 'us',
    quantity: quantity,
    displayDescription: 'Instance',
    price: null,
    uniqueId: null,
    items: {
      fusionEdition: fusionEdition.toUpperCase(),
      editHook: {
        initialInputs: goog.object.clone(this.dataFusion),
        product: 'dataFusion',
        tab: 'data-fusion'
      }
    }
  };

  this.CloudCalculator.addItemToCart(dataFusionItem);
  // Clear the data model
  this.setupDataFusionData();
  this.resetForm(dataFusionForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Memorystore for Redis Model.
 * @export
 */

ListingCtrl.prototype.setupMemorystoreData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    label: string,
   *    serviceTier: string,
   *    instanceSize: number,
   *    instanceTime: number,
   *    location: string
   * }}
   */
  this.memorystore = {
    submitted: false,
    label: '',
    serviceTier: 'basic',
    instanceSize: '',
    instanceTime: 730,
    location: this.retrieveLocation('us-central1', this.redisRegionList)
  };
};


/**
 * Adds a Memorystore items to Cart.
 *
 * @param {!angular.Form} redisForm
 * @export
 */
ListingCtrl.prototype.addMemorystore = function(redisForm) {
  if (!redisForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddMemorystoreForRedis');
  /** @type {number} */
  var instanceSize = this.memorystore.instanceSize;
  var instanceTime = this.memorystore.instanceTime;
  /** @const {string} */
  var REDIS_SKU = 'CP-MEMORYSTORE-REDIS';
  /** @type {string} */
  var region = this.memorystore.location;
  var serviceTier = this.memorystore.serviceTier;
  var usageTier = this.CloudCalculator.checkRedisTier(instanceSize);
  var sku = [REDIS_SKU, serviceTier, usageTier].join('-').toUpperCase();
  var qty = instanceSize * instanceTime;

  /** @type {!cloudpricingcalculator.SkuData} */
  var memorystoreApiItem = {
    quantityLabel: 'instance hours',
    displayName: 'Cloud Memorystore for Redis',
    sku: sku,
    region: region,
    quantity: qty,
    displayDescription: 'Instance',
    items: {
      usageTier: usageTier,
      editHook: {
        initialInputs: goog.object.clone(this.memorystore),
        product: 'memorystore',
        tab: 'memorystore'
      }
    }
  };
  this.CloudCalculator.addItemToCart(memorystoreApiItem);

  // Clear the data model
  this.setupMemorystoreData();
  this.resetForm(redisForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Memorystore for Memcached Model.
 * @export
 */

ListingCtrl.prototype.setupMemcachedData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    instanceCount: number,
   *    label: string,
   *    nodeCount: number,
   *    vcpuCount: number,
   *    memoryVolume: number,
   *    instanceTime: number,
   *    location: string
   * }}
   */
  this.memcached = {
    submitted: false,
    instanceCount: null,
    label: '',
    nodeCount: null,
    vcpuCount: null,
    memoryVolume: null,
    instanceTime: 730,
    location: this.retrieveLocation('us-central1', this.memecashedRegionList),
  };
};


/**
 * Adds a Memorystore items to Cart.
 *
 * @param {!angular.Form} memcachedForm
 * @export
 */
ListingCtrl.prototype.addMemcached = function(memcachedForm) {
  if (!memcachedForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddMemorystoreForMemcached');
  /** @const {number} */
  const instanceCount = this.memcached.instanceCount;
  const nodeCount = this.memcached.nodeCount;
  const vcpuCount = this.memcached.vcpuCount;
  const memoryVolume = this.memcached.memoryVolume;
  const instanceTime = this.memcached.instanceTime;
  const vcpuHours = instanceCount * nodeCount * vcpuCount * instanceTime;
  const memoryPerHour = instanceCount * nodeCount * memoryVolume;
  const memoryHours = memoryPerHour * instanceTime;
  /** @const {string} */
  const tier = memoryPerHour > 5 ? 'M2' : 'M1';
  const memcachedSkuBase = 'CP-MEMORYSTORE-MEMCACHED';
  const label = this.memcached.label;
  const region = this.memcached.location;

  let totalPrice = 0;
  // calculate vcpu usage cost first
  let sku = [memcachedSkuBase, 'VCPU', tier].join('-').toUpperCase();
  totalPrice +=
      this.CloudCalculator.calculateItemPrice(sku, vcpuHours, region, 0);
  // calculate vcpu usage cost first
  sku = [memcachedSkuBase, 'RAM', tier].join('-').toUpperCase();
  totalPrice +=
      this.CloudCalculator.calculateItemPrice(sku, memoryHours, region, 0);

  /** @type {!cloudpricingcalculator.SkuData} */
  const memcachedApiItem = {
    quantityLabel: 'instance hours',
    displayName: 'Cloud Memorystore for Memcached',
    sku: memcachedSkuBase,
    region: region,
    quantity: instanceCount * instanceTime,
    displayDescription: `${instanceCount} x ${label}`,
    items: {
      tier: tier,
      vcpuHours: vcpuHours,
      memoryHours: memoryHours,
      editHook: {
        initialInputs: goog.object.clone(this.memcached),
        product: 'memcached',
        tab: 'memcached'
      }
    }
  };
  this.CloudCalculator.addItemToCart(memcachedApiItem, totalPrice);

  // Clear the data model
  this.setupMemcachedData();
  this.resetForm(memcachedForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Setup flages for SSD and GPU in Sole Tenant Data Model
 * @export
 */
ListingCtrl.prototype.onSoletenantNodeTypeChange = function() {
  let nodeType = this.soleTenant.nodeType.split('-')[3];
  if (nodeType == 'N1' || nodeType == 'N2' || nodeType == 'N2D') {
    this.soleTenant.localSsd = true;
  } else {
    this.soleTenant.localSsd = false;
    this.soleTenant.ssd = '0';
  }
  if (this.soleTenant.nodeType == 'CP-COMPUTEENGINE-VMIMAGE-N1-NODE-96-624') {
    this.soleTenant.gpuFlag = true;
    this.soleTenant.cud = 0;
  } else {
    this.soleTenant.gpuFlag = false;
    this.soleTenant.cud = 0;
    if (this.soleTenant.nodeType ==
        'CP-COMPUTEENGINE-VMIMAGE-M2-NODE-416-11776') {
      this.soleTenant.cud = 1;
    }
  }
  const instanceSku = 'CP-COMPUTEENGINE-' + nodeType + '-PREDEFINED-VM-CORE';
  const supportedRegions =
      this.CloudCalculator.getSupportedRegionList(instanceSku);
  (goog.array.contains(supportedRegions, this.soleTenant.location)) ?
      this.isSoleTenantRegionSupported = true :
      this.isSoleTenantRegionSupported = false;
};


/**
 * Setup VMware Engine setup.
 * @export
 */
ListingCtrl.prototype.setupVMwareeData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    location: string,
   *    nodeType: string,
   *    nodesCount: ?number,
   *    cud: string,
   *    hours: number,
   *    days: number,
   *    minutes: number,
   *    timeType: string,
   *    timeMode: string,
   *    daysMonthly: number,
   * }}
   */
  this.vmwareData = {
    submitted: false,
    location: this.retrieveLocation('us-central1', this.vmWareRegionList),
    nodeType: 'VE1-STANDARD-72',
    nodesCount: null,
    cud: '0',
    hours: 24,
    days: 7,
    minutes: 1440,
    timeType: 'hours',
    timeMode: 'day',
    daysMonthly: 30,
  };
};


/**
 * Add a VMware to Cart
 *
 * @param {!angular.Form} vmwareForm
 * @export
 */
ListingCtrl.prototype.addvmwareEngine = function(vmwareForm) {
  if (vmwareForm && !vmwareForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'addvmwareEngine');

  /**
   * @type {number}
   */
  let hours = this.vmwareData.timeType == 'hours' ? this.vmwareData.hours :
      this.vmwareData.timeType == 'minutes' ? this.vmwareData.minutes / 60 :
                                              this.vmwareData.daysMonthly * 24;
  /** @type {number} */
  const hoursMultiplier =
      this.vmwareData.timeMode == 'day' ? this.vmwareData.days * this.WEEKS : 1;
  /**
   * Calculate the days / month based on average
   * @type {number}
   */
  let hoursPerMonth = hours * hoursMultiplier;

  const location = this.vmwareData.location;
  const nodeType = this.vmwareData.nodeType;
  const nodesCount = this.vmwareData.nodesCount;
  const cud = this.vmwareData.cud;
  let cudDescription = '';
  let sku = 'CP-VMWARE-' + nodeType;
  if (cud != '0') {
    hoursPerMonth = this.TOTAL_BILLING_HOURS;
    if (cud.indexOf('PREPAID') >= 0) {
      sku = `${sku}-${cud}-YEAR`;
      cudDescription =
          `${cud.split('-')[1]} year ${cud.split('-')[0].toLowerCase()}`;
    } else {
      sku = `${sku}-CUD-${cud}-YEAR`;
      cudDescription = `${cud} year`;
    }
  }
  const quantity = nodesCount * hoursPerMonth;
  const effectiveHourRate = this.CloudCalculator.cloudSkuData[sku][location];
  /** @type {!cloudpricingcalculator.SkuData} */
  const vmwareApiItem = {
    quantityLabel: 'Number of hours per month',
    displayName: 'VMware Engine',
    sku: sku,
    region: location,
    quantity: quantity,
    displayDescription: nodeType,
    price: null,
    uniqueId: null,
    items: {
      cud: cud,
      cudDescription: cudDescription,
      nodesCount: nodesCount,
      effectiveHourRate: effectiveHourRate,
      editHook: {
        initialInputs: goog.object.clone(this.vmwareData),
        product: 'vmwareData',
        tab: 'vmware'
      }
    }
  };
  this.CloudCalculator.addItemToCart(vmwareApiItem);
  // Clear the data model
  this.setupVMwareeData();
  this.resetForm(vmwareForm);

  // Scroll to the cart
  this.scrollToCart();
};
/**
 * Setup Sole Tenant Data Model
 * @export
 */
ListingCtrl.prototype.setupSoleTenantData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    nodesCount: number,
   *    label: string,
   *    nodeType: string,
   *    hours: number,
   *    days: number,
   *    location: string,
   *    minutes: number,
   *    timeType: string,
   *    timeMode: string,
   *    daysMonthly: number,
   *    localSsd: boolean,
   *    gpuFlag: boolean,
   *    addGPUs: boolean,
   *   cpuOvercommit: boolean,
   *    gpuCount: number,
   *    gpuType: string,
   *    enableGrid: boolean
   * }}
   */
  this.soleTenant = {
    submitted: false,
    nodesCount: '',
    label: '',
    cud: 0,
    ssd: '0',
    nodeType: 'CP-COMPUTEENGINE-VMIMAGE-N1-NODE-96-624',
    hours: 24,
    days: 7,
    location: this.retrieveLocation('us-central1', this.soleTenantRegionList),
    minutes: 1440,
    timeType: 'hours',
    timeMode: 'day',
    daysMonthly: 30,
    localSsd: true,
    gpuFlag: true,
    addGPUs: false,
    cpuOvercommit: false,
    gpuCount: 0,
    gpuType: '',
    enableGrid: false
  };
};


/**
 * Add a Sole Tenant to Cart
 *
 * @param {!angular.Form} soleTenantForm
 * @export
 */
ListingCtrl.prototype.addSoleTenant = function(soleTenantForm) {
  if (soleTenantForm && !soleTenantForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddSoleTenant');
  /**
   * @type {number}
   */
  let hours = this.soleTenant.timeType == 'hours' ? this.soleTenant.hours :
      this.soleTenant.timeType == 'minutes' ? this.soleTenant.minutes / 60 :
                                              this.soleTenant.daysMonthly * 24;
  /** @type {number} */
  const hoursMultiplier =
      this.soleTenant.timeMode == 'day' ? this.soleTenant.days * this.WEEKS : 1;
  /**
   * Calculate the days / month based on average
   * @type {number}
   */
  let hoursPerMonth = hours * hoursMultiplier;
  /**
   * @type {number}
   */
  const quantity = this.soleTenant.nodesCount;
  /**
   * @type {string}
   */
  let sku = this.soleTenant.nodeType;
  /** @type {boolean} */
  let sustainedUse = false;
  /**
   * @type {string}
   */
  const title = quantity + ' x ' + this.soleTenant.label;
  /**
   * @type {string}
   */
  const instanceName =
      sku.replace('CP-COMPUTEENGINE-VMIMAGE-', '').toLowerCase();
  /**
   * @type {string}
   */
  const region = this.soleTenant.location;
  /**
   * @type {number}
   */
  let perHostPrice = 0;
  const cudTerm = this.soleTenant.cud;
  /** @type {boolean} */
  const isCud = this.isPositiveNumber_(cudTerm);
  let isInstanceCommitted = false;
  let termText = '';
  if (isCud) {
    hoursPerMonth = this.TOTAL_BILLING_HOURS;
    perHostPrice =
        this.CloudCalculator.getCUDCost(sku, region, cudTerm, this.soleTenant) *
        hoursPerMonth;

    termText = cudTerm + ' Year' + (parseInt(cudTerm, 10) == 3 ? 's' : '');
    this.computeServer.class = 'regular';
    isInstanceCommitted = true;
  } else {
    // Calculate the per-host price
    /**
     * @type {!cloudpricingcalculator.ComputePriceItem}
     */
    var sustainedPriceItem =
        this.CloudCalculator.calculateSustainedUseDiscountPrice(
            sku, hoursPerMonth, region, quantity, this.soleTenant);

    perHostPrice = sustainedPriceItem.totalPrice;
    var sustainedUseDiscount = sustainedPriceItem.cumulativeDiscount;
    if ((hoursPerMonth > this.CloudCalculator.getSustainedUseBase() *
             this.TOTAL_BILLING_HOURS)) {
      sustainedUse = true;
    }
  }
  // Calculate the total hours
  const totalHoursPerMonth = quantity * hoursPerMonth;
  // Calculate GPU cost
  let gpuCost = 0;
  /** @const {string} */
  const gpuType = this.soleTenant.gpuType || '';
  const gpuCount = this.soleTenant.gpuCount * totalHoursPerMonth;
  let isGpuCommitted = false;
  if (this.soleTenant.addGPUs &&
      this.soleTenant.nodeType == 'CP-COMPUTEENGINE-VMIMAGE-N1-NODE-96-624') {
    let gpuSKU = this.BASE_GPU_SKU + gpuType;
    if (isCud && this.CloudCalculator.checkForCommitment(gpuSKU, cudTerm)) {
      isGpuCommitted = true;
      gpuSKU = gpuSKU + '-CUD-' + cudTerm + '-YEAR';
    }
    gpuCost =
        this.CloudCalculator.calculateItemPrice(gpuSKU, gpuCount, region, 0);
    if (sustainedUse) {
      gpuCost = gpuCost * (1 - sustainedUseDiscount);
    } else if (isCud && !isGpuCommitted) {
      gpuCost = gpuCost * 0.7;
    }
  }

  const ssd = this.soleTenant.ssd;
  const ssdSku = 'CP-COMPUTEENGINE-LOCAL-SSD';
  let isSsdCommitted = false;
  if (isCud && this.CloudCalculator.checkForCommitment(ssdSku, cudTerm)) {
    isSsdCommitted = true;
  }
  let ssdPrice = null;
  if (this.soleTenant.localSsd) {
    ssdPrice = this.CloudCalculator.getSsdPrice(region, false, 0);
  }
  // each ssd solid disk has 375 gb
  let ssdCost = ssdPrice * totalHoursPerMonth * ssd * 375;
  let gceCost = quantity * perHostPrice;
  // Calculate the total price
  const totalPrice = gceCost + ssdCost + gpuCost;
  const effectiveRate = totalPrice / totalHoursPerMonth;

  /** @type {!cloudpricingcalculator.SkuData} */
  const newItem = {
    sku: sku,
    quantity: totalHoursPerMonth,
    quantityLabel: 'total hours per month',
    region:
        this.fullRegion[region] || this.fullRegion[this.regionFallback[region]],
    displayName: title,
    displayDescription: instanceName,
    price: null,
    uniqueId: null,
    items: {
      sustainedUse: sustainedUse,
      sustainedUseDiscount: sustainedUseDiscount,
      effectiveRate: effectiveRate,
      gceCost: gceCost,
      gpuCost: gpuCost,
      ssdCost: ssdCost,
      gpuCount: this.soleTenant.gpuCount,
      gpuType: gpuType,
      ssd: ssd,
      localSsd: this.soleTenant.localSsd,
      isCud: isCud,
      isInstanceCommitted: isInstanceCommitted,
      isGpuCommitted: isGpuCommitted,
      isSsdCommitted: isSsdCommitted,
      cpuOvercommit: this.soleTenant.cpuOvercommit,
      detailedView: isCud ? null : sustainedPriceItem.detailedView,
      termText: termText,
      editHook: {
        cpuOvercommitFlag: !this.checkAvailabilityForThisSeries(
            this.soleTenant.nodeType, ['N1', 'N2']),
        initialInputs: goog.object.clone(this.soleTenant),
        product: 'soleTenant',
        tab: 'compute-engine'
      }
    }
  };

  this.CloudCalculator.addItemToCart(newItem, totalPrice);

  // Clear the data model
  this.setupSoleTenantData();
  soleTenantForm && this.resetForm(soleTenantForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Memorystore Model.
 * @export
 */

ListingCtrl.prototype.setupDialogflowEsData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    usersCount: ?number,
   *    sessionsCount: ?number,
   *    audioQueriesCount: ?number,
   *    textQueriesCount: ?number
   * }}
   */
  this.dialogflowEs = {
    submitted: false,
    usersCount: null,
    sessionsCount: null,
    audioQueriesCount: null,
    textQueriesCount: null,
  };
};


/**
 * Adds a Dialogflow ES items to Cart.
 *
 * @param {!angular.Form} dialogflowEsForm
 * @export
 */
ListingCtrl.prototype.addDialogflowEs = function(dialogflowEsForm) {
  if (!dialogflowEsForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddDialogflowEs');
  const users = this.dialogflowEs.usersCount;
  const sessions = this.dialogflowEs.sessionsCount;
  const mp = users * sessions;
  const audioQueriesCount = this.dialogflowEs.audioQueriesCount * mp;
  const textQueriesCount = this.dialogflowEs.textQueriesCount * mp;
  let dialogflowItem = null;

  if (this.isPositiveNumber_(audioQueriesCount)) {
    dialogflowItem = {
      quantityLabel: 'queries',
      displayName: 'Dialogflow ES',
      sku: 'CP-DIALOGFLOW-AUDIO-QUERY-LENGTH-MICROS',
      region: 'us',
      quantity: audioQueriesCount,
      displayDescription: 'Audio Queries',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.dialogflowEs),
          product: 'dialogflowEs',
          tab: 'dialogflow'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dialogflowItem);
  }
  if (this.isPositiveNumber_(textQueriesCount)) {
    dialogflowItem = {
      quantityLabel: 'queries',
      displayName: 'Dialogflow ES',
      sku: 'CP-DIALOGFLOW-TEXT-QUERY-OPERATIONS',
      region: 'us',
      quantity: textQueriesCount,
      displayDescription: 'Text Queries',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.dialogflowEs),
          product: 'dialogflowEs',
          tab: 'dialogflow'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dialogflowItem);
  }

  // Clear the data model
  this.setupDialogflowEsData();
  this.resetForm(dialogflowEsForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Dailogflow CX Model.
 * @export
 */

ListingCtrl.prototype.setupDialogflowCxData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    usersCount: ?number,
   *    sessionsCount: ?number,
   *    audioQueriesCount: ?number,
   *    textQueriesCount: ?number
   * }}
   */
  this.dialogflowCx = {
    submitted: false,
    usersCount: null,
    sessionsCount: null,
    audioQueriesCount: null,
    textQueriesCount: null,
  };
};

/**
 * Adds a Dialogflow CX items to Cart.
 *
 * @param {!angular.Form} dialogflowCxForm
 * @export
 */
ListingCtrl.prototype.addDialogflowCx = function(dialogflowCxForm) {
  if (!dialogflowCxForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AdddialogflowCx');
  /** @type {?number} */
  const users = this.dialogflowCx.usersCount;
  const sessions = this.dialogflowCx.sessionsCount;
  const mp = users * sessions;
  const audioQueriesCount = this.dialogflowCx.audioQueriesCount * mp;
  const textQueriesCount = this.dialogflowCx.textQueriesCount * mp;
  let dialogflowItem= null;

  if (this.isPositiveNumber_(audioQueriesCount)) {
    dialogflowItem = {
      quantityLabel: 'queries',
      displayName: 'Dialogflow CX',
      sku: 'CP-DIALOGFLOWCX-AUDIO-QUERY-LENGTH-MICROS',
      region: 'us',
      quantity: audioQueriesCount,
      displayDescription: 'Audio Queries',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.dialogflowCx),
          product: 'dialogflowCx',
          tab: 'dialogflow'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dialogflowItem);
  }
  if (this.isPositiveNumber_(textQueriesCount)) {
    dialogflowItem = {
      quantityLabel: 'queries',
      displayName: 'Dialogflow CX',
      sku: 'CP-DIALOGFLOWCX-TEXT-QUERY-OPERATIONS',
      region: 'us',
      quantity: textQueriesCount,
      displayDescription: 'Text Queries',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.dialogflowCx),
          product: 'dialogflowCx',
          tab: 'dialogflow'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dialogflowItem);
  }

  // Clear the data model
  this.setupDialogflowCxData();
  this.resetForm(dialogflowCxForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Composer Data Model
 * @export
 */
ListingCtrl.prototype.setupComposerData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    nodesCount: number,
   *    label: string,
   *    nodeType: string,
   *    hours: number,
   *    days: number,
   *    location: string,
   *    minutes: number,
   *    timeType: string,
   *    daysMonthly: number,
   *    family: string,
   *    series: string
   * }}
   */
  this.composer = {
    submitted: false,
    workersCount: '',
    label: '',
    egressVolume: '',
    instance: 'CP-COMPUTEENGINE-VMIMAGE-N1-STANDARD-1',
    dcLocation: this.retrieveLocation('us-central1', this.composerRegionList),
    hours: 24,
    days: 7,
    minutes: 1440,
    timeType: 'hours',
    timeMode: 'day',
    daysMonthly: 30,
    family: 'gp',
    series: 'n1'
  };
};


/**
 * Add a Composer to Cart
 *
 * @param {!angular.Form} composerForm
 * @export
 */
ListingCtrl.prototype.addComposer = function(composerForm) {
  if (composerForm && !composerForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddComposer');
  /**
   * @type {number}
   */
  const hours = this.composer.timeType == 'hours' ? this.composer.hours :
      this.composer.timeType == 'minutes'         ? this.composer.minutes / 60 :
                                            this.composer.daysMonthly * 24;
  /** @type {number} */
  const hoursMultiplier =
      this.composer.timeMode == 'day' ? this.composer.days * this.WEEKS : 1;
  /**
   * Calculate the days / month based on average
   * @type {number}
   */
  const hoursPerMonth = hours * hoursMultiplier;
  /**
   * @type {number}
   */
  const helperNodesCount = this.composer.workersCount;
  /**
   * @type {string}
   */
  const helperNodeType = this.composer.instance;
  const region = this.composer.dcLocation;

  // these are not adjustable parameters of composer.
  const DB_CORES = 2;
  const DB_SKU = 'CP-COMPOSER-DATABASE-CORE-HOURS';
  const dbUsage = DB_CORES * hoursPerMonth;
  const WEB_CORES = 2;
  const WEB_SKU = 'CP-COMPOSER-WEB-CORE-HOURS';
  const webUsage = WEB_CORES * hoursPerMonth;
  const COMPOSER_STORAGE = 30;
  const COMPOSER_STORAGE_SKU = 'CP-COMPOSER-STORAGE';
  const storageUsage =
      COMPOSER_STORAGE * hoursPerMonth / this.TOTAL_BILLING_HOURS;
  const COMPOSER_EGRESS_SKU = 'CP-COMPOSER-NETWORK-EGRESS';
  const egress = this.composer.egressVolume || 0;

  const dbCost =
      this.CloudCalculator.calculateItemPrice(DB_SKU, dbUsage, region, 0);
  const webCost =
      this.CloudCalculator.calculateItemPrice(WEB_SKU, webUsage, region, 0);
  const storageCost = this.CloudCalculator.calculateItemPrice(
      COMPOSER_STORAGE_SKU, storageUsage, region, 0);
  const egressCost = this.CloudCalculator.calculateItemPrice(
      COMPOSER_EGRESS_SKU, egress, region, 0);
  const totalPrice = dbCost + webCost + storageCost + egressCost;

  /** @type {!cloudpricingcalculator.SkuData} */
  const composerItem = {
    quantityLabel: '',
    displayName: 'Cloud Composer',
    sku: 'CP-COMPOSER',
    region: region,
    quantity: 1,
    displayDescription: this.composer.label,
    uniqueId: null,
    price: null,
    items: {
      dbUsage: dbUsage,
      webUsage: webUsage,
      storageUsage: storageUsage,
      egress: egress,
      totalHours: hoursPerMonth,
      editHook: {
        initialInputs: goog.object.clone(this.composer),
        product: 'composer',
        tab: 'composer'
      }
    }
  };
  this.CloudCalculator.addItemToCart(composerItem, totalPrice);
  // Add GCE charges
  goog.object.extend(this.computeServer, {
    quantity: helperNodesCount,
    label: 'Composer worker node',
    family: this.composer.family,
    series: this.composer.series,
    instance: helperNodeType,
    location: region,
    hours: hoursPerMonth,
    timeType: 'hours',
    timeMode: 'month'
  });
  this.addComputeServer();
  // Add 100 gb of PD for each vm.
  goog.object.extend(this.persistentDisk, {
    location: region,
    storage:
        {value: 100 * helperNodesCount, unit: this.DEFAULT_UNITS.pdStorage},
  });
  this.addPersistentDisk();


  // Clear the data model
  this.setupComposerData();
  composerForm && this.resetForm(composerForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Setup BQ ML Data
 * @export
 */
ListingCtrl.prototype.setupBqml = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    location: string,
   *    creationVolume: !cloudpricingcalculator.DataWithUnit,
   *    predictionVolume: !cloudpricingcalculator.DataWithUnit,
   *    evaluationVolume: !cloudpricingcalculator.DataWithUnit
   * }}
   */
  this.bqml = {
    submitted: false,
    location: this.retrieveLocation('us', this.bqmlRegionList),
    creationVolume: {value: '', unit: this.DEFAULT_UNITS.bqmlCreation},
    predictionVolume: {value: '', unit: this.DEFAULT_UNITS.bqmlOperations},
    evaluationVolume: {value: '', unit: this.DEFAULT_UNITS.bqmlOperations}
  };
};


/**
 * Adds BQ ML to Cart.
 *
 * @param {!angular.Form} bqmlForm
 * @export
 */
ListingCtrl.prototype.addBqml = function(bqmlForm) {
  if (bqmlForm.creationVolume.$viewValue == '' &&
      bqmlForm.predictionVolume.$viewValue == '' &&
      bqmlForm.evaluationVolume.$viewValue == '' && !bqmlForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddBigQueryML');
  /** @type {string} */
  var location = this.bqml.location;
  /** @type {number} */
  var creationVolume = this.toDefaultUnit(
      this.bqml.creationVolume.value, this.bqml.creationVolume.unit,
      this.DEFAULT_UNITS.bqmlCreation);
  var predictionVolume = this.toDefaultUnit(
      this.bqml.predictionVolume.value, this.bqml.predictionVolume.unit,
      this.DEFAULT_UNITS.bqmlOperations);
  var evaluationVolume = this.toDefaultUnit(
      this.bqml.evaluationVolume.value, this.bqml.evaluationVolume.unit,
      this.DEFAULT_UNITS.bqmlOperations);

  /** @type {!cloudpricingcalculator.SkuData} */
  var bqmlItem = null;

  if (this.isPositiveNumber_(creationVolume)) {
    bqmlItem = {
      quantityLabel: 'TB',
      region: location,
      displayName: 'BigQuery ML',
      sku: 'CP-BIGQUERYML-MODEL-CREATION',
      quantity: creationVolume,
      displayDescription: 'Creation Model Data',
      items: {
        dependedQuota: 0.01,
        editHook: {
          initialInputs: goog.object.clone(this.bqml),
          product: 'bqml',
          tab: 'bigquery-ml'
        }
      }
    };
    this.CloudCalculator.addItemToCart(bqmlItem);
  }

  if (this.isPositiveNumber_(predictionVolume)) {
    bqmlItem = {
      quantityLabel: 'TB',
      region: location,
      displayName: 'BigQuery ML',
      sku: 'CP-BIGQUERYML-MODEL-PREDICTION',
      quantity: predictionVolume,
      displayDescription: 'Prediction Data',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.bqml),
          product: 'bqml',
          tab: 'bigquery-ml'
        }
      }
    };
    this.CloudCalculator.addItemToCart(bqmlItem);
  }

  if (this.isPositiveNumber_(evaluationVolume)) {
    bqmlItem = {
      quantityLabel: 'TB',
      region: location,
      displayName: 'BigQuery ML',
      sku: 'CP-BIGQUERYML-MODEL-EVALUATION',
      quantity: evaluationVolume,
      displayDescription: 'Evaluation Data',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.bqml),
          product: 'bqml',
          tab: 'bigquery-ml'
        }
      }
    };
    this.CloudCalculator.addItemToCart(bqmlItem);
  }

  // Clear the data model
  this.setupBqml();
  this.resetForm(bqmlForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Healthcare Api Model.
 * @export
 */

ListingCtrl.prototype.setupHealthcareApiData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    location: string,
   *    datastoreCount: number,
   *    standardNotificationCount: ?cloudpricingcalculator.DataWithUnit,
   *    standardRequestsCount: ?cloudpricingcalculator.DataWithUnit,
   *    complexRequestsCount: ?cloudpricingcalculator.DataWithUnit,
   *    multiRequestsCount: ?cloudpricingcalculator.DataWithUnit,
   *    storageStructured: ?cloudpricingcalculator.DataWithUnit,
   *    storageBlob: ?cloudpricingcalculator.DataWithUnit,
   *    storageBlobNearline: ?cloudpricingcalculator.DataWithUnit,
   *    storageBlobColdline: ?cloudpricingcalculator.DataWithUnit,
   *    etlBatchVolume: ?cloudpricingcalculator.DataWithUnit,
   *    consentCount: ?cloudpricingcalculator.DataWithUnit,
   *    accessDeterminationCount: ?cloudpricingcalculator.DataWithUnit,
   *    dicomVolume: ?cloudpricingcalculator.DataWithUnit
   * }}
   */
  this.healthcareApi = {
    submitted: false,
    location:
        this.retrieveLocation('us-central1', this.healthcareApiRegionList),
    datastoreCount: '',
    standardNotificationCount: {value: '', unit: 3},
    standardRequestsCount: {value: '', unit: 3},
    complexRequestsCount: {value: '', unit: 3},
    multiRequestsCount: {value: '', unit: 3},
    storageStructured: {value: '', unit: 2},
    storageBlob: {value: '', unit: 2},
    storageBlobNearline: {value: '', unit: 2},
    storageBlobColdline: {value: '', unit: 2},
    etlBatchVolume: {value: '', unit: 2},
    etlStreamingVolume: {value: '', unit: 2},
    dicomVolume: {value: '', unit: 2},
    consentCount: {value: '', unit: 3},
    accessDeterminationCount: {value: '', unit: 6}
  };
};


/**
 * Adds a Healthcare API items to Cart.
 *
 * @param {!angular.Form} healthcareForm
 * @export
 */
ListingCtrl.prototype.addHealthcareApi = function(healthcareForm) {
  if (!healthcareForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddHealthcareApi');
  /** @type {number} */
  const indexingMultiplier = 4;
  const datastoreCount = 0;
  const standardNotificationCount = this.toDefaultNumber_(
      this.healthcareApi.standardNotificationCount.value,
      this.healthcareApi.standardNotificationCount.unit);
  const standardRequestsCount = this.toDefaultNumber_(
      this.healthcareApi.standardRequestsCount.value,
      this.healthcareApi.standardRequestsCount.unit);
  const complexRequestsCount = this.toDefaultNumber_(
      this.healthcareApi.complexRequestsCount.value,
      this.healthcareApi.complexRequestsCount.unit);
  const multiRequestsCount = this.toDefaultNumber_(
      this.healthcareApi.multiRequestsCount.value,
      this.healthcareApi.multiRequestsCount.unit);
  const storageStructured = this.toDefaultUnit(
                                this.healthcareApi.storageStructured.value,
                                this.healthcareApi.storageStructured.unit, 2) *
      indexingMultiplier;

  const storageBlob = this.toDefaultUnit(
      this.healthcareApi.storageBlob.value, this.healthcareApi.storageBlob.unit,
      2);
  const storageBlobNearline = this.toDefaultUnit(
      this.healthcareApi.storageBlobNearline.value,
      this.healthcareApi.storageBlobNearline.unit, 2);
  const storageBlobColdline = this.toDefaultUnit(
      this.healthcareApi.storageBlobColdline.value,
      this.healthcareApi.storageBlobColdline.unit, 2);
  const etlBatchVolume = this.toDefaultUnit(
      this.healthcareApi.etlBatchVolume.value,
      this.healthcareApi.etlBatchVolume.unit, 2);
  const etlStreamingVolume = this.toDefaultUnit(
      this.healthcareApi.etlStreamingVolume.value,
      this.healthcareApi.etlStreamingVolume.unit, 2);
  const dicomVolume = this.toDefaultUnit(
      this.healthcareApi.dicomVolume.value, this.healthcareApi.dicomVolume.unit,
      2);
  const consentCount = this.toDefaultNumber_(
      this.healthcareApi.consentCount.value,
      this.healthcareApi.consentCount.unit);
  const accessDeterminationCount = this.toDefaultNumber_(
      this.healthcareApi.accessDeterminationCount.value,
      this.healthcareApi.accessDeterminationCount.unit);
  /** @type {string} */
  let sku = '';
  let location = this.healthcareApi.location;
  /** @type {!cloudpricingcalculator.SkuData} */
  let healthcareApiItem = null;

  if (this.isPositiveNumber_(datastoreCount)) {
    sku = 'CP-HEALTCARE-API-DATASTORE-HOURS';
    sku = this.combineSkuMultiregional_(sku, location);
    healthcareApiItem = {
      quantityLabel: 'hours',
      displayName: 'Cloud Healthcare API',
      sku: sku,
      region: location,
      quantity: datastoreCount,
      displayDescription: 'Datastores',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.healthcareApi),
          product: 'healthcareApi',
          tab: 'healthcare-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(healthcareApiItem);
  }

  if (this.isPositiveNumber_(standardNotificationCount)) {
    sku = 'CP-HEALTCARE-API-NOTIFICATIONS-STANDARD';
    healthcareApiItem = {
      quantityLabel: '',
      displayName: 'Cloud Healthcare API',
      sku: sku,
      region: location,
      quantity: standardNotificationCount,
      displayDescription: 'Standard Notifications',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.healthcareApi),
          product: 'healthcareApi',
          tab: 'healthcare-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(healthcareApiItem);
  }

  if (this.isPositiveNumber_(standardRequestsCount)) {
    sku = 'CP-HEALTCARE-API-REQUESTS-STANDARD';
    healthcareApiItem = {
      quantityLabel: 'requests',
      displayName: 'Cloud Healthcare API',
      sku: sku,
      region: location,
      quantity: standardRequestsCount,
      displayDescription: 'Standard Requests',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.healthcareApi),
          product: 'healthcareApi',
          tab: 'healthcare-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(healthcareApiItem);
  }

  if (this.isPositiveNumber_(complexRequestsCount)) {
    sku = 'CP-HEALTCARE-API-REQUESTS-COMPLEX';
    healthcareApiItem = {
      quantityLabel: 'requests',
      displayName: 'Cloud Healthcare API',
      sku: sku,
      region: location,
      quantity: complexRequestsCount,
      displayDescription: 'Complex Requests',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.healthcareApi),
          product: 'healthcareApi',
          tab: 'healthcare-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(healthcareApiItem);
  }

  if (this.isPositiveNumber_(multiRequestsCount)) {
    sku = 'CP-HEALTCARE-API-REQUESTS-MULTI';
    healthcareApiItem = {
      quantityLabel: 'requests',
      displayName: 'Cloud Healthcare API',
      sku: sku,
      region: location,
      quantity: multiRequestsCount,
      displayDescription: 'Multi-operation requests',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.healthcareApi),
          product: 'healthcareApi',
          tab: 'healthcare-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(healthcareApiItem);
  }

  if (this.isPositiveNumber_(storageStructured)) {
    sku = 'CP-HEALTCARE-API-STORAGE-STRUCTURED';
    sku = this.combineSkuRegional_(sku, location);
    healthcareApiItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud Healthcare API',
      sku: sku,
      region: location,
      quantity: storageStructured,
      displayDescription: 'Structured Storage',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.healthcareApi),
          product: 'healthcareApi',
          tab: 'healthcare-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(healthcareApiItem);
  }

  if (this.isPositiveNumber_(storageBlob)) {
    sku = 'CP-HEALTCARE-API-STORAGE-BLOB';
    sku = this.combineSkuRegional_(sku, location);
    healthcareApiItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud Healthcare API',
      sku: sku,
      region: location,
      quantity: storageBlob,
      displayDescription: 'Standard Blob Storage',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.healthcareApi),
          product: 'healthcareApi',
          tab: 'healthcare-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(healthcareApiItem);
  }

  if (this.isPositiveNumber_(storageBlobNearline)) {
    sku = 'CP-HEALTCARE-API-STORAGE-BLOB-NEARLINE';
    sku = this.combineSkuRegional_(sku, location);
    healthcareApiItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud Healthcare API',
      sku: sku,
      region: location,
      quantity: storageBlobNearline,
      displayDescription: 'Nearline Blob Storage',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.healthcareApi),
          product: 'healthcareApi',
          tab: 'healthcare-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(healthcareApiItem);
  }

  if (this.isPositiveNumber_(storageBlobColdline)) {
    sku = 'CP-HEALTCARE-API-STORAGE-BLOB-COLDLINE';
    sku = this.combineSkuRegional_(sku, location);
    healthcareApiItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud Healthcare API',
      sku: sku,
      region: location,
      quantity: storageBlobColdline,
      displayDescription: 'Coldline Blob Storage',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.healthcareApi),
          product: 'healthcareApi',
          tab: 'healthcare-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(healthcareApiItem);
  }

  if (this.isPositiveNumber_(etlBatchVolume)) {
    sku = 'CP-HEALTCARE-API-ETL-BATCH';
    healthcareApiItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud Healthcare API',
      sku: sku,
      region: location,
      quantity: etlBatchVolume,
      displayDescription: 'ETL Data Processed in batch mode',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.healthcareApi),
          product: 'healthcareApi',
          tab: 'healthcare-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(healthcareApiItem);
  }
  // add streaming etl
  if (this.isPositiveNumber_(etlStreamingVolume)) {
    sku = 'CP-HEALTCARE-API-ETL-STREAMING';
    healthcareApiItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud Healthcare API',
      sku: sku,
      region: location,
      quantity: etlStreamingVolume,
      displayDescription: 'ETL Data Processed in streaming mode',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.healthcareApi),
          product: 'healthcareApi',
          tab: 'healthcare-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(healthcareApiItem);
  }

  if (this.isPositiveNumber_(dicomVolume)) {
    sku = 'CP-HEALTCARE-DICOM-TRANSCODING';
    healthcareApiItem = {
      quantityLabel: 'GiB',
      displayName: 'Cloud Healthcare API',
      sku: sku,
      region: location,
      quantity: dicomVolume,
      displayDescription: 'DICOM Transcoding',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.healthcareApi),
          product: 'healthcareApi',
          tab: 'healthcare-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(healthcareApiItem);
  }

  if (this.isPositiveNumber_(consentCount)) {
    sku = 'CP-HEALTCARE-API-CONSENT';
    healthcareApiItem = {
      quantityLabel: '',
      displayName: 'Cloud Healthcare API',
      sku: sku,
      region: location,
      quantity: consentCount,
      displayDescription: 'Managed Consents',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.healthcareApi),
          product: 'healthcareApi',
          tab: 'healthcare-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(healthcareApiItem);
  }

  if (this.isPositiveNumber_(accessDeterminationCount)) {
    sku = 'CP-HEALTCARE-API-ACCESS-DETERMINATION';
    healthcareApiItem = {
      quantityLabel: '',
      displayName: 'Cloud Healthcare API',
      sku: sku,
      region: location,
      quantity: accessDeterminationCount,
      displayDescription: 'Access Determinations',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.healthcareApi),
          product: 'healthcareApi',
          tab: 'healthcare-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(healthcareApiItem);
  }

  // Clear the data model
  this.setupHealthcareApiData();
  this.resetForm(healthcareForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Orbiterai Model.
 * @export
 */

ListingCtrl.prototype.setupOrbiteraData = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    mgmVolume: {number},
   *    gcpBilling: {number},
   *    thirdPartyBilling: {number}
   * }}
   */
  this.orbitera =
      {submitted: false, mgmVolume: '', gcpBilling: '', thirdPartyBilling: ''};
};


/**
 * Adds a OrbiteraI items to Cart.
 *
 * @param {!angular.Form} orbiteraForm
 * @export
 */
ListingCtrl.prototype.addOrbitera = function(orbiteraForm) {
  if (!(orbiteraForm.mgmVolume.$viewValue != '' ||
        orbiteraForm.gcpBilling.$viewValue != '' ||
        orbiteraForm.thirdPartyBilling.$viewValue != '') &&
      !orbiteraForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddOrbitera');
  /** @type {number} */
  // the charge for Marketplace Gross Merchandise Volume is 5%
  var MGM_CHARGE = 0.05;
  var mgmCost = this.orbitera.mgmVolume * MGM_CHARGE;
  // the charge for GCP is 0%
  var GCP_CHARGE = 0;
  var gcpCost = this.orbitera.gcpBilling * GCP_CHARGE;
  // the charge for 3rd party is 1%
  var THIRD_PARTY_CHARGE = 0.01;
  var thirdPartyCost = this.orbitera.thirdPartyBilling * THIRD_PARTY_CHARGE;
  var totalPrice = mgmCost + gcpCost + thirdPartyCost;
  /** @type {!cloudpricingcalculator.SkuData} */
  var orbiteraItem = {
    quantityLabel: '',
    displayName: 'Orbitera',
    sku: 'CP-ORBITERA-GENERAL',
    region: 'us',
    quantity: totalPrice,
    displayDescription: 'Total cost',
    items: {
      mgmCost: mgmCost,
      gcpCost: gcpCost,
      thirdPartyCost: thirdPartyCost,
      editHook: {
        initialInputs: goog.object.clone(this.orbitera),
        product: 'orbitera',
        tab: 'orbitera'
      }
    }
  };
  this.CloudCalculator.addItemToCart(orbiteraItem, totalPrice);

  // Clear the data model
  this.setupOrbiteraData();
  this.resetForm(orbiteraForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * @TODO(oivonin@) Get rid of naming mismatches.

 * Fixes asia regions naming issue
 *
 * @param {string} reg name to check.
 * @return {string} postfix that fixes naming.
 * @export
 */
ListingCtrl.prototype.fixRegNaming = function(reg) {
  return reg.endsWith('asia-southeast') ? '1' : '';
};


/**
 * Combines sku with multi region name
 *
 * @param {string} sku generic sku that will be combined.
 * @param {string} region region for this sku.
 * @return {string} combined sku.
 * @private
 */
ListingCtrl.prototype.combineSkuMultiregional_ = function(sku, region) {
  var REGIONS_MAP = {
    'us': 'US',
    'us-central1': 'NA',
    'us-east1': 'NA',
    'us-east4': 'NA',
    'us-west4': 'NA',
    'us-west1': 'NA',
    'us-west2': 'NA',
    'us-west3': 'NA',
    'europe': 'EUROPE',
    'europe-west1': 'EUROPE',
    'europe-west2': 'EUROPE',
    'europe-west3': 'EUROPE',
    'europe-central2': 'EUROPE',
    'asia': 'APAC',
    'asia-east': 'APAC',
    'asia-east1': 'APAC',
    'asia-east2': 'APAC',
    'asia-northeast': 'APAC',
    'asia-northeast1': 'APAC',
    'asia-northeast2': 'APAC',
    'asia-northeast3': 'APAC',
    'asia-southeast': 'APAC',
    'asia-southeast1': 'APAC',
    'asia-southeast2': 'APAC',
    'asia-south1': 'APAC',
    'asia-south2': 'APAC',
    'australia-southeast1': 'APAC',
    'australia-southeast2': 'APAC',
    'southamerica-east1': 'SA',
    'southamerica-west1': 'SA',
    'europe-west4': 'EUROPE',
    'europe-west6': 'EUROPE',
    'europe-north1': 'EUROPE',
    'northamerica-northeast1': 'NA',
    'northamerica-northeast2': 'NA'
  };

  var REGIONS_MAP_INTERNET_EGRESS = {
    'us': 'NA',
    'us-central1': 'NA',
    'us-east1': 'NA',
    'us-east4': 'NA',
    'us-west4': 'NA',
    'us-west1': 'NA',
    'us-west2': 'NA',
    'us-west3': 'NA',
    'europe-west1': 'EUROPE',
    'europe-west2': 'EUROPE',
    'europe-west3': 'EUROPE',
    'europe-central2': 'EUROPE',
    'asia': 'APAC',
    'asia-east': 'APAC',
    'asia-east1': 'APAC',
    'asia-east2': 'APAC',
    'asia-northeast': 'APAC',
    'asia-northeast1': 'APAC',
    'asia-northeast2': 'APAC',
    'asia-northeast3': 'APAC',
    'asia-southeast': 'APAC',
    'asia-southeast1': 'APAC',
    'asia-southeast2': 'APAC',
    'asia-south1': 'APAC',
    'asia-south2': 'APAC',
    'australia-southeast1': 'AUS',
    'australia-southeast2': 'AUS',
    'southamerica-east1': 'SA',
    'southamerica-west1': 'SA',
    'europe-west4': 'EUROPE',
    'europe-west6': 'EUROPE',
    'europe-north1': 'EUROPE',
    'northamerica-northeast1': 'NA',
    'northamerica-northeast2': 'NA'
  };
  if (sku.includes('CP-INTERNET-EGRESS')) {
    return sku + '-' + REGIONS_MAP_INTERNET_EGRESS[region];
  } else {
    return sku + '-' + REGIONS_MAP[region];
  }
};


/**
 * Combines sku with region name
 *
 * @param {string} sku generic sku that will be combined.
 * @param {string} region region for this sku.
 * @return {string} combined sku.
 * @private
 */
ListingCtrl.prototype.combineSkuRegional_ = function(sku, region) {
  return sku + '-' + region.toUpperCase();
};


/**
 * Sets up Run Model.
 * @export
 */
ListingCtrl.prototype.setupRun = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    name: string,
   *    cpuAllocation: number,
   *    cpuAllocationType: string,
   *    memoryAllocation: number,
   *    concurrencyRequestCount: number,
   *    executionTimeMs: number,
   *    egress: number,
   *    requestCount: number,
   *    minimumInstanceCount: number,
   *    cud: number
   * }}
   */
  this.run = {
    submitted: false,
    name: '',
    region: this.retrieveLocation('us-central1', this.cloudRunRegionList),
    cpuAllocation: 1,
    cpuAllocationType: 'THROTTLED',
    memoryAllocation: 0.25,
    concurrencyRequestCount: 20,
    executionTimeMs: '',
    egress: '',
    requestCount: '',
    minimumInstanceCount: 0,
    cud: 0
  };
};


/**
 * Add a Run items to Cart
 *
 * @param {!angular.Form} runForm
 * @export
 */
ListingCtrl.prototype.addRun = function(runForm) {
  if (!runForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddCloudRun');
  const region = this.run.region;
  const cudTerm = this.run.cud;
  const isCud = this.isPositiveNumber_(cudTerm);
  const cudDiscount = 0.83;
  const cpuAllocationType = this.run.cpuAllocationType;
  let tierType = null;
  let minimumInstanceCpuSku = '';
  let minimumInstanceMemorySku = '';

  Object.keys(this.cloudRunTierRegionList)
      .forEach(
          key =>
              ((this.cloudRunTierRegionList[key]).includes(region) ?
                   tierType = key :
                   null));

  const cpuSku = 'CP-CLOUD-RUN-CPU-ALLOCATION-TIME-' + tierType.toUpperCase() +
      '-' + cpuAllocationType;
  const memorySku = 'CP-CLOUD-RUN-MEMORY-ALLOCATION-TIME-' +
      tierType.toUpperCase() + '-' + cpuAllocationType;
  let requestsSku = '';
  /** @type {number} */
  let totalPrice = 0;
  /** @type {number} */
  let minimumInstanceCountPrice = 0;
  const executionTimeSeconds = this.run.executionTimeMs / 1000;
  const requestCount = this.run.requestCount;
  const minimumInstanceCount = this.run.minimumInstanceCount;
  const concurency = this.run.concurrencyRequestCount;
  const memoryAllocation = this.run.memoryAllocation;
  const cpuAllocation = this.run.cpuAllocation;
  // get Cpu Allocation cost
  const cpuAllocationTime =
      executionTimeSeconds * cpuAllocation * requestCount / concurency;
  const cpuAllocationCost =
      this.CloudCalculator.calculateItemPrice(cpuSku, cpuAllocationTime, 'us');
  totalPrice += cpuAllocationCost;
  const memoryAllocationTime =
      memoryAllocation * executionTimeSeconds * requestCount / concurency;
  const memoryAllocationCost = this.CloudCalculator.calculateItemPrice(
      memorySku, memoryAllocationTime, 'us');
  totalPrice += memoryAllocationCost;

  if (cpuAllocationType == 'THROTTLED') {
    requestsSku = 'CP-CLOUD-RUN-REQUESTS-' + tierType.toUpperCase();
    const requestsCost = this.CloudCalculator.calculateItemPrice(
        requestsSku, requestCount, 'us');
    totalPrice += requestsCost;
  }

  if (isCud) {
    totalPrice = totalPrice * cudDiscount;
  }

  if (this.isPositiveNumber_(minimumInstanceCount)) {
    minimumInstanceCpuSku =
        'CP-CLOUD-RUN-MINIMUMINSTANCE-CPU-' + tierType.toUpperCase();
    minimumInstanceMemorySku =
        'CP-CLOUD-RUN-MINIMUMINSTANCE-MEMORY-' + tierType.toUpperCase();
    const minimumInstanceCpuPrice = this.CloudCalculator.calculateItemPrice(
        minimumInstanceCpuSku, minimumInstanceCount, 'us');
    const minimumInstanceMemoryPrice = this.CloudCalculator.calculateItemPrice(
        minimumInstanceMemorySku, minimumInstanceCount, 'us');
    minimumInstanceCountPrice =
        (minimumInstanceCpuPrice * cpuAllocation +
         minimumInstanceMemoryPrice * memoryAllocation) *
        this.TOTAL_BILLING_HOURS * 60 * 60;
    if (isCud) {
      minimumInstanceCountPrice = minimumInstanceCountPrice * cudDiscount;
    }
    totalPrice += minimumInstanceCountPrice;
  }
  /** @type {!cloudpricingcalculator.SkuData} */
  const runItem = {
    quantityLabel: '',
    displayName: 'Cloud Run',
    sku: 'CP-CLOUD-RUN-GENERAL',
    region: this.fullRegion[region],
    quantity: totalPrice,
    displayDescription: 'Total cost',
    price: totalPrice,
    uniqueId: null,
    items: {
      isCud: isCud,
      cpuSku: cpuSku,
      memorySku: memorySku,
      requestsSku: requestsSku,
      minimumInstanceCpuSku: minimumInstanceCpuSku,
      minimumInstanceMemorySku: minimumInstanceMemorySku,
      minimumInstanceCount: minimumInstanceCount,
      minimumInstanceCountPrice: minimumInstanceCountPrice,
      cpuAllocationType: cpuAllocationType,
      cpuAllocationTypeText: this.cpuAllocationTypeList[cpuAllocationType],
      cpuAllocationTime: cpuAllocationTime,
      memoryAllocationTime: memoryAllocationTime,
      requestCount: requestCount,
      tierType: tierType,
      editHook: {
        initialInputs: goog.object.clone(this.run),
        product: 'run',
        tab: 'cloud-run'
      }
    }
  };
  this.CloudCalculator.addItemToCart(runItem, totalPrice);

  // Clear the data model
  this.setupRun();
  this.resetForm(runForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up Identity Platform Model.
 * @export
 */

ListingCtrl.prototype.setupIdentityPlatform = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    socialActiveUsersCount: {number},
   *    enterpriseActiveUsersCount: {number},
   *    successfulVerificationUsCount: {number},
   *    successfulVerificationNonUsCount: {number}
   * }}
   */
  this.identityPlatform = {
    submitted: false,
    socialActiveUsersCount: '',
    enterpriseActiveUsersCount: '',
    successfulVerificationUsCount: '',
    successfulVerificationNonUsCount: ''
  };
};


/**
 * Adds a Identity Platform items to Cart.
 *
 * @param {!angular.Form} identityPlatformForm
 * @export
 */
ListingCtrl.prototype.addIdentityPlatform = function(identityPlatformForm) {
  if (!(identityPlatformForm.socialActiveUsersCount.$viewValue != '' ||
        identityPlatformForm.enterpriseActiveUsersCount.$viewValue != '' ||
        identityPlatformForm.successfulVerificationUsCount.$viewValue != '' ||
        identityPlatformForm.successfulVerificationNonUsCount.$viewValue !=
            '') &&
      !identityPlatformForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddIdentityPlatform');
  /** @type {number} */
  var socialActiveUsersCount =
      parseFloat(this.identityPlatform.socialActiveUsersCount);
  var enterpriseActiveUsersCount =
      parseFloat(this.identityPlatform.enterpriseActiveUsersCount);
  var successfulVerificationUsCount =
      parseFloat(this.identityPlatform.successfulVerificationUsCount);
  var successfulVerificationNonUsCount =
      parseFloat(this.identityPlatform.successfulVerificationNonUsCount);
  /** @type {!cloudpricingcalculator.SkuData} */
  var identityPlatformItem = null;

  if (this.isPositiveNumber_(socialActiveUsersCount)) {
    identityPlatformItem = {
      quantityLabel: '',
      displayName: 'Identity Platform',
      sku: 'CP-IDENTITY-PLATFORM-TIER1-ACTIVE-USERS',
      region: 'us',
      quantity: socialActiveUsersCount,
      displayDescription: 'Tier 1 Monthly Active Users',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.identityPlatform),
          product: 'identityPlatform',
          tab: 'identity-platform'
        }
      }
    };
    this.CloudCalculator.addItemToCart(identityPlatformItem);
  }
  if (this.isPositiveNumber_(enterpriseActiveUsersCount)) {
    identityPlatformItem = {
      quantityLabel: '',
      displayName: 'Identity Platform',
      sku: 'CP-IDENTITY-PLATFORM-TIER2-ACTIVE-USERS',
      region: 'us',
      quantity: enterpriseActiveUsersCount,
      displayDescription: 'Tier 2 Monthly Active Users',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.identityPlatform),
          product: 'identityPlatform',
          tab: 'identity-platform'
        }
      }
    };
    this.CloudCalculator.addItemToCart(identityPlatformItem);
  }
  if (this.isPositiveNumber_(successfulVerificationUsCount)) {
    identityPlatformItem = {
      quantityLabel: '',
      displayName: 'Identity Platform',
      sku: 'CP-IDENTITY-PLATFORM-PHONE-VERIFICATION-US-CANADA-INDIA',
      region: 'us',
      quantity: successfulVerificationUsCount,
      displayDescription:
          'Verifications with SMS Text Messages sent to United States, Canada and India',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.identityPlatform),
          product: 'identityPlatform',
          tab: 'identity-platform'
        }
      }
    };
    this.CloudCalculator.addItemToCart(identityPlatformItem);
  }
  if (this.isPositiveNumber_(successfulVerificationNonUsCount)) {
    identityPlatformItem = {
      quantityLabel: '',
      displayName: 'Identity Platform',
      sku: 'CP-IDENTITY-PLATFORM-PHONE-VERIFICATION-OUTSIDE-US-CANADA-INDIA',
      region: 'us',
      quantity: successfulVerificationNonUsCount,
      displayDescription:
          'Verifications with SMS Text Messages sent to countries outside United States, Canada and India',
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.identityPlatform),
          product: 'identityPlatform',
          tab: 'identity-platform'
        }
      }
    };
    this.CloudCalculator.addItemToCart(identityPlatformItem);
  }

  // Clear the data model
  this.setupIdentityPlatform();
  this.resetForm(identityPlatformForm);

  // Scroll to the cart
  this.scrollToCart();
};


/**
 * Sets up SCC Model.
 * @export
 */

ListingCtrl.prototype.setupSccData = function() {
  /**
   * @type {{
   *    submitted: {boolean},
   *    tierType: {string},
   *    translation: {cloudpricingcalculator.DataWithUnit},
   *    cud: {number}
   * }}
   */
  this.scc = {
    submitted: false,
    tierType: 'STANDARD',
    dataVolume: {value: '', unit: 2},
    cud: 1
  };
};


/**
 * Adds a Translate API items to Cart.
 *
 * @param {!angular.Form} sccForm
 * @export
 */
ListingCtrl.prototype.addScc = function(sccForm) {
  if (!sccForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddSecureCommandCenter');
  /** @type {number} */
  let dataVolume = this.toDefaultUnit(
      this.scc.dataVolume.value, this.scc.dataVolume.unit, 2);
  // User input is a daily usage. We need to substract free daily quota
  // and get monthly usage
  dataVolume = Math.max(0, dataVolume - 1) * this.DAYS;
  let sku = 'CP-SECURITY-COMMAND-CENTER-' + this.scc.tierType;
  let price;
  if (this.scc.tierType == 'PREMIUM') {
    sku = sku + '-' + this.scc.cud + '-CUD';
    const spend = this.CloudCalculator.cloudSkuData[sku]['us'];
    price = Math.max(25000, spend * 0.05) / 12 * dataVolume;
  } else {
    price = this.CloudCalculator.calculateItemPrice(sku, dataVolume, 'us');
  }
  if (this.isPositiveNumber_(dataVolume)) {
    const sccItem = {
      quantityLabel: 'GiB',
      displayName: 'Security Command Center',
      sku: sku,
      region: 'us',
      quantity: dataVolume,
      price: price,
      uniqueId: null,
      displayDescription: 'Total data data volume written into Cloud SCC',
      items: {
        dataVolume: dataVolume,
        tierType: this.scc.tierType,
        cud: this.scc.cud,
        editHook: {
          initialInputs: goog.object.clone(this.scc),
          product: 'scc',
          tab: 'scc'
        }
      }
    };
    this.CloudCalculator.addItemToCart(sccItem, price);
  }

  // Clear the data model
  this.setupSccData();
  this.resetForm(sccForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Scheduler Model.
 * @export
 */

ListingCtrl.prototype.setupSchedulerData = function() {
  /**
   * @type {{
   * submitted: boolean,
   * jobsCount: string
   * }}
   */

  this.scheduler = {submitted: false, jobsCount: ''};
};


/**
 * Adds Cloud Scheduler to Cart.
 *
 * @param {!angular.Form} schedulerForm
 * @export
 */
ListingCtrl.prototype.addScheduler = function(schedulerForm) {
  if (!schedulerForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddScheduler');
  /** @type {!cloudpricingcalculator.SkuData} */
  const schedulerItem = {
    displayName: 'Cloud Scheduler',
    sku: 'CP-SCHEDULER-JOB',
    region: 'us',
    quantity: this.scheduler.jobsCount,
    displayDescription: 'Total Number of jobs.',
    items: {
      editHook: {
        initialInputs: goog.object.clone(this.scheduler),
        product: 'scheduler',
        tab: 'cloud-scheduler'
      }
    }
  };
  this.CloudCalculator.addItemToCart(schedulerItem);

  // Clear the data model
  this.setupSchedulerData();
  this.resetForm(schedulerForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Filestore Button validation.
 * @param {string} tier Filestore tier (Standard|Premium|HighScale|Enterprise)
 * @export
 */

ListingCtrl.prototype.filestoreChange = function(tier) {
  const tierProp = `${tier}Tier`;
  const minProp = `${tier}Min`;
  const maxProp = `${tier}Max`;
  const stepProp = `${tier}Step`;

  const value = this.toDefaultUnit(
      this.filestore[tierProp].value, this.filestore[tierProp].unit,
      this.DEFAULT_UNITS.dsStorage);

  this.filestoreValidationMessage[tier] = '';
  if (value) {
    if (value % this.filestoreValidationLimits[stepProp] !== 0) {
      const stepInUserUnit = this.toDefaultUnit(
          this.filestoreValidationLimits[stepProp],
          this.DEFAULT_UNITS.dsStorage, this.filestore[tierProp].unit);
      this.filestoreValidationMessage[tier] =
          `Value should be divisible by ${stepInUserUnit}`;
    }
    if (value < this.filestoreValidationLimits[minProp]) {
      const minInUserUnit = this.toDefaultUnit(
          this.filestoreValidationLimits[minProp], this.DEFAULT_UNITS.dsStorage,
          this.filestore[tierProp].unit);
      this.filestoreValidationMessage[tier] =
          `Minimum value is ${minInUserUnit}`;
    }
    if (value > this.filestoreValidationLimits[maxProp]) {
      const maxInUserUnit = this.toDefaultUnit(
          this.filestoreValidationLimits[maxProp], this.DEFAULT_UNITS.dsStorage,
          this.filestore[tierProp].unit);
      this.filestoreValidationMessage[tier] =
          `Maximum value is ${maxInUserUnit}`;
    }
  }

  this.filestoreButton = !!this.filestoreValidationMessage[tier];
};


/**
 * Check whether Form is totally Empty or not.
 * @param {!angular.Form} form angular form to check inputs.
 * @return {boolean} whether form is empty.
 * @export
 */
ListingCtrl.prototype.isFormEmpty = function(form) {
  var formInputs = goog.object.filter(form, function(val, key) {
    return key.indexOf('$') == -1;
  });
  var isFormEmpty = goog.object.every(formInputs, function(val, key) {
    return (val.$viewValue == null) || val.$viewValue == '';
  });
  return form.$invalid || isFormEmpty;
};

/**
 * Check whether Object is totally Empty or not.
 * @param {!Object} obj angular form to check inputs.
 * @return {boolean} whether form is empty.
 * @export
 */
ListingCtrl.prototype.isObjectEmpty = (obj) => {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
};

/**
 * Sets up Filestore Model.
 * @export
 */

ListingCtrl.prototype.setupFilestoreData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    location: string,
   *    standardTier: ?cloudpricingcalculator.DataWithUnit,
   *    premiumTier: ?cloudpricingcalculator.DataWithUnit,
   *    highScaleTier: ?cloudpricingcalculator.DataWithUnit,
   *    enterpriseTier: ?cloudpricingcalculator.DataWithUnit
   * }}
   */

  this.filestore = {
    submitted: false,
    location: this.retrieveLocation('us-central1', this.filestoreRegionList),
    standardTier: {value: null, unit: this.DEFAULT_UNITS.dsStorage},
    premiumTier: {value: null, unit: this.DEFAULT_UNITS.dsStorage},
    highScaleTier: {value: null, unit: this.DEFAULT_UNITS.dsStorage},
    enterpriseTier: {value: null, unit: this.DEFAULT_UNITS.dsStorage}
  };

  for (const prop in this.filestoreValidationMessage) {
    this.filestoreValidationMessage[prop] = '';
  }
};


/**
 * Adds Cloud Filestore to Cart.
 *
 * @param {!angular.Form} filestoreForm
 * @export
 */
ListingCtrl.prototype.addFilestore = function(filestoreForm) {
  if (this.isFormEmpty(filestoreForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddFilestore');

  /** @type {string} */
  const location = this.filestore.location;

  /** @type {number} */
  let standardTierValue = this.toDefaultUnit(
      this.filestore.standardTier.value, this.filestore.standardTier.unit,
      this.DEFAULT_UNITS.dsStorage);
  let premiumTierValue = this.toDefaultUnit(
      this.filestore.premiumTier.value, this.filestore.premiumTier.unit,
      this.DEFAULT_UNITS.dsStorage);
  let highScaleTierValue = this.toDefaultUnit(
      this.filestore.highScaleTier.value, this.filestore.highScaleTier.unit,
      this.DEFAULT_UNITS.dsStorage);
  let enterpriseTierValue = this.toDefaultUnit(
      this.filestore.enterpriseTier.value, this.filestore.enterpriseTier.unit,
      this.DEFAULT_UNITS.dsStorage);

  /** @type {!cloudpricingcalculator.SkuData} */
  var filestoreItem = null;

  if (this.isPositiveNumber_(standardTierValue)) {
    filestoreItem = {
      quantityLabel: 'GiB',
      region: location,
      displayName: 'Filestore',
      sku: 'CP-FILESTORE-STANDARD',
      quantity: standardTierValue,
      displayDescription: 'Persistent Disk',
      items: {
        dependedQuota: 0,
        editHook: {
          initialInputs: goog.object.clone(this.filestore),
          product: 'filestore',
          tab: 'cloud-filestore'
        }
      }
    };
    this.CloudCalculator.addItemToCart(filestoreItem);
  }

  if (this.isPositiveNumber_(premiumTierValue)) {
    filestoreItem = {
      quantityLabel: 'GiB',
      region: location,
      displayName: 'Filestore',
      sku: 'CP-FILESTORE-PREMIUM',
      quantity: premiumTierValue,
      displayDescription: 'Persistent Disk',
      items: {
        dependedQuota: 0,
        editHook: {
          initialInputs: goog.object.clone(this.filestore),
          product: 'filestore',
          tab: 'cloud-filestore'
        }
      }
    };
    this.CloudCalculator.addItemToCart(filestoreItem);
  }

  if (this.isPositiveNumber_(highScaleTierValue)) {
    filestoreItem = {
      quantityLabel: 'GiB',
      region: location,
      displayName: 'Filestore',
      sku: 'CP-FILESTORE-HIGHSCALE',
      quantity: highScaleTierValue,
      displayDescription: 'Persistent Disk',
      items: {
        dependedQuota: 0,
        editHook: {
          initialInputs: goog.object.clone(this.filestore),
          product: 'filestore',
          tab: 'cloud-filestore'
        }
      }
    };
    this.CloudCalculator.addItemToCart(filestoreItem);
  }

  if (this.isPositiveNumber_(enterpriseTierValue)) {
    filestoreItem = {
      quantityLabel: 'GiB',
      region: location,
      displayName: 'Filestore',
      sku: 'CP-FILESTORE-ENTERPRISE',
      quantity: enterpriseTierValue,
      displayDescription: 'Persistent Disk',
      items: {
        dependedQuota: 0,
        editHook: {
          initialInputs: goog.object.clone(this.filestore),
          product: 'filestore',
          tab: 'cloud-filestore'
        }
      }
    };
    this.CloudCalculator.addItemToCart(filestoreItem);
  }

  // Clear the data model
  this.setupFilestoreData();
  this.resetForm(filestoreForm);
  this.filestoreButton = true;

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Certificate Authority service model.
 * @export
 */

ListingCtrl.prototype.setupCaServiceData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    caTier: string,
   *    numberOfCa: ?number,
   *    totalCertificates: ?number
   * }}
   */

  this.caservice = {
    submitted: false,
    caTier: 'devOps',
    numberOfCa: null,
    totalCertificates: null
  };
};


/**
 * Adds Certificate Authority Service to Cart.
 *
 * @param {!angular.Form} CaserviceForm
 * @export
 */
ListingCtrl.prototype.addCaservice = function(CaserviceForm) {
  if (!CaserviceForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddCaservice');

  const caTier = this.caservice.caTier;
  const numberOfCa = this.caservice.numberOfCa;
  const totalCertificates = this.caservice.totalCertificates;
  const numberOfCaSku = caTier == 'devOps' ?
      'CP-CERTIFICATE-AUTHORITY-MONTHLY-FEE-DEV' :
      'CP-CERTIFICATE-AUTHORITY-MONTHLY-FEE-ENTERPRISE';
  const numberOfCaSkuData = this.CloudCalculator.cloudSkuData[numberOfCaSku];
  const caFeePrice = numberOfCaSkuData['us'] * numberOfCa;
  const certificateSku = caTier == 'devOps' ? 'CP-CERTIFICATE-FEE-DEV' :
                                              'CP-CERTIFICATE-FEE-ENTERPRISE';
  const certificatePrice = this.CloudCalculator.calculateItemPrice(
      certificateSku, totalCertificates);
  const totalPrice = caFeePrice + certificatePrice;
  if (this.isPositiveNumber_(totalPrice)) {
    const caserviceItem = {
      quantityLabel: caTier,
      region: '',
      displayName: 'Certificate Authority Service ',
      sku: 'CP-CERTIFICATE-AUTHORITY',
      quantity: totalPrice,
      displayDescription: 'Certficate fee',
      price: totalPrice,
      uniqueId: null,
      items: {
        caFeePrice: caFeePrice,
        certificatePrice: certificatePrice,
        numberOfCaSku: numberOfCaSku,
        certificateSku: certificateSku,
        numberOfCa: numberOfCa,
        totalCertificates: totalCertificates,
        editHook: {
          initialInputs: goog.object.clone(this.caservice),
          product: 'caService',
          tab: 'ca-service'
        }
      }
    };
    this.CloudCalculator.addItemToCart(caserviceItem, totalPrice);
  }

  // Clear the data model
  this.setupCaServiceData();
  this.resetForm(CaserviceForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up CloudSqlServer Model.
 * @export
 */

ListingCtrl.prototype.setupCloudSqlServerData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    instanceCount: ?number,
   *    instance: string,
   *    custom: !Object<string,number>,
   *    totalPrice: number,
   *    label: string,
   *    dataBaseVersion: string,
   *    location: string,
   *    core: number,
   *    memory:!cloudpricingcalculator.DataWithUnit,
   *    includeHA : boolean,
   *    storage: !cloudpricingcalculator.DataWithUnit,
   *    backup: !cloudpricingcalculator.DataWithUnit,
   *    days: number,
   *    minutes: number,
   *    timeType: string,
   *    timeMode: string,
   *    daysMonthly: number,
   *    cud: number,
   *    ramLimit: !Object.<string, number>
   * }}
   */

  this.cloudSqlServer = {
    submitted: false,
    instanceCount: null,
    totalPrice: null,
    label: '',
    instance: 'db-standard-1',
    custom: {vcpu: 1, ram: 3.75},
    dataBaseVersion: 'STANDARD',
    location: this.retrieveLocation(),
    core: null,
    includeHA: false,
    memory: {value: null, unit: this.DEFAULT_UNITS.aeMemory},
    storage: {value: null, unit: this.DEFAULT_UNITS.sql2Storage},
    backup: {value: null, unit: this.DEFAULT_UNITS.sql2Backup},
    hours: 24,
    days: 7,
    minutes: 1440,
    timeType: 'hours',
    timeMode: 'day',
    daysMonthly: 30,
    cud: 0,
    ramLimit: {min: 3.75, max: 6.5}
  };
};

/**
 * Adds Cloud for sql server model to Cart.
 *
 * @param {!angular.Form} cloudSqlServerForm
 * @export
 */
ListingCtrl.prototype.addCloudSqlServer = function(cloudSqlServerForm) {
  if (!cloudSqlServerForm.$valid) {
    return;
  }
  this.Analytics.sendEvent('addToEstimate', 'AddSqlServer');
  /** @type {number} */
  let haMultiplier = 1;
  if (this.cloudSqlServer.includeHA) {
    haMultiplier = 2;
  }
  const region = this.cloudSqlServer.location;
  let hours = this.cloudSqlServer.timeType == 'hours' ?
      this.cloudSqlServer.hours :
      this.cloudSqlServer.timeType == 'minutes' ?
      this.cloudSqlServer.minutes / 60 :
      this.cloudSqlServer.daysMonthly * 24;
  let hoursMultiplier = this.cloudSqlServer.timeMode == 'day' ?
      this.cloudSqlServer.days * this.WEEKS :
      1;
  let hoursPerMonth = hours * hoursMultiplier;

  let cud = this.cloudSqlServer.cud;
  let termText = '';
  let cudSKu = '';
  let totalPrice = 0;
  let coreCount, ram;

  if (cud > 0) {
    hoursPerMonth = this.TOTAL_BILLING_HOURS;
    cudSKu = `-CUD-${cud}-YEAR`;
    termText = `${cud} Year${cud == 3 ? 's' : ''}`;
  }

  if (this.cloudSqlServer.instance != 'custom') {
    const parsedInstance = this.cloudSqlServer.instance.split('-');
    coreCount = parseInt(parsedInstance[2], 10);
    const instance =
        this.cloudSqlInstanceList[parsedInstance[1]].instances.find(
            item => item.vcpu === coreCount);
    ram = instance.ram;
  } else {
    coreCount = this.cloudSqlServer.custom.vcpu;
    ram = this.cloudSqlServer.custom.ram;
  }

  // Calculate the license price
  let licence = this.cloudSqlServer.dataBaseVersion;
  let licenceSku = 'CP-CLOUDSQLSERVER-LICENCING-' + licence.toUpperCase();
  // Instances with fewer than 4 vCPUs will be charged for SQL Server at 4 times
  // the license rate.
  let vcpuQuantity = Math.max(4, coreCount);
  let licencePrice = this.CloudCalculator.calculateItemPrice(
      licenceSku, vcpuQuantity * hoursPerMonth, region);

  const vcpuPrice = this.CloudCalculator.calculateItemPrice(
      'CP-CLOUDSQLSERVER-VCPU' + cudSKu,
      coreCount * hoursPerMonth * haMultiplier, region);

  const memoryPrice = this.CloudCalculator.calculateItemPrice(
      'CP-CLOUDSQLSERVER-MEMORY' + cudSKu, ram * hoursPerMonth * haMultiplier,
      region);

  const storageConver = this.toDefaultUnit(
      this.cloudSqlServer.storage.value, this.cloudSqlServer.storage.unit,
      this.DEFAULT_UNITS.sql2Storage);
  const storagePrice = this.CloudCalculator.calculateItemPrice(
      'CP-CLOUDSQLSERVER-STORAGE', storageConver * haMultiplier, region);

  const backupConver = this.toDefaultUnit(
      this.cloudSqlServer.backup.value, this.cloudSqlServer.backup.unit,
      this.DEFAULT_UNITS.sql2Backup);
  const backupPrice = this.CloudCalculator.calculateItemPrice(
      'CP-CLOUDSQLSERVER-BACKUP', backupConver * haMultiplier, region);

  totalPrice =
      (licencePrice + vcpuPrice + memoryPrice + storagePrice + backupPrice) *
      this.cloudSqlServer.instanceCount;
  const instanceLabel = this.cloudSqlServer.instance == 'custom' ?
      `DB-CUSTOM-${coreCount}-${ram}` :
      this.cloudSqlServer.instance.toUpperCase();
  const title = this.cloudSqlServer.label || instanceLabel;

  /** @type {!cloudpricingcalculator.SkuData} */
  const cloudsqlServerItem = {
    displayName: title,
    sku: 'CP-CLOUDFORSQLSERVER-JOB',
    region:
        this.fullRegion[region] || this.fullRegion[this.regionFallback[region]],
    quantity: hoursPerMonth,
    displayDescription: 'Total hours per month.',
    items: {
      termText: termText,
      databaseVersion: this.cloudSqlServer.dataBaseVersion,
      storage: storageConver,
      backup: backupConver,
      haMultiplier: haMultiplier,
      instanceLabel: instanceLabel,
      coreCount,
      ram,
      version: 2.0,
      editHook: {
        initialInputs: goog.object.clone(this.cloudSqlServer),
        product: 'cloudSqlServer',
        tab: 'sql'
      }
    }
  };
  this.CloudCalculator.addItemToCart(cloudsqlServerItem, totalPrice);

  // Clear the data model
  this.setupCloudSqlServerData();
  this.resetForm(cloudSqlServerForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Artifact Registry Model.
 * @export
 */
ListingCtrl.prototype.setupArtifactRegistryData = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    storageAmount: ?cloudpricingcalculator.DataWithUnit
   * }}
   */
  this.artifactRegistry = {
    submitted: false,
    storageAmount: {value: null, unit: this.DEFAULT_UNITS.dsStorage}
  };
};

/**
 * Adds Artifact Registry to Cart.
 *
 * @param {!angular.Form} artifactRegistryForm
 * @export
 */
ListingCtrl.prototype.addArtifactRegistry = function(artifactRegistryForm) {
  if (!artifactRegistryForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddArtifactRegistry');

  /** @type {number} */
  var storageAmount = this.toDefaultUnit(
      this.artifactRegistry.storageAmount.value,
      this.artifactRegistry.storageAmount.unit, this.DEFAULT_UNITS.dsStorage);
  if (this.isPositiveNumber_(storageAmount)) {
    /** @type {!cloudpricingcalculator.SkuData} */
    const artifactRegistryItem = {
      quantityLabel: 'GiB',
      region: '',
      displayName: 'Artifact Registry',
      sku: 'CP-ARTIFACT-REGISTRY',
      quantity: storageAmount,
      displayDescription: 'Amount of Storage',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.artifactRegistry),
          product: 'artifactRegistry',
          tab: 'artifact-registry'
        }
      }
    };
    this.CloudCalculator.addItemToCart(artifactRegistryItem);
  }
  // Clear the data model
  this.setupArtifactRegistryData();
  this.resetForm(artifactRegistryForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Data Catalog Model.
 * @export
 */
ListingCtrl.prototype.setupDataCatalog = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    metadataStorage: !cloudpricingcalculator.DataWithUnit,
   *    catalogApiCallCount: !cloudpricingcalculator.DataWithUnit
   * }}
   */
  this.dataCatalog = {
    submitted: false,
    metadataStorage: {value: null, unit: this.DEFAULT_UNITS.metadataStorage},
    catalogApiCallCount:
        {value: null, unit: this.DEFAULT_UNITS.catalogApiCallCount}
  };
};

/**
 * Adds Data Catalog to Cart.
 *
 * @param {!angular.Form} dataCatalogForm
 * @export
 */
ListingCtrl.prototype.addDataCatalog = function(dataCatalogForm) {
  if (!dataCatalogForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddDataCatalog');

  /** @type {number} */
  const metadataStorage = this.toDefaultUnit(
      this.dataCatalog.metadataStorage.value,
      this.dataCatalog.metadataStorage.unit,
      this.DEFAULT_UNITS.metadataStorage);
  /** @type {number} */
  const catalogApiCallCount = this.toDefaultNumber_(
      this.dataCatalog.catalogApiCallCount.value,
      this.dataCatalog.catalogApiCallCount.unit);
  let dataCatalogItem = null;
  let sku = null;
  if (this.isPositiveNumber_(metadataStorage)) {
    sku = 'CP-DATACATALOG-METADATA-STORAGE-MIB';
    dataCatalogItem = {
      quantityLabel: 'MiB',
      displayName: 'Metadata storage pricing',
      sku: sku,
      quantity: metadataStorage,
      displayDescription: 'Data Catalog',
      price: null,
      region: 'us',
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.dataCatalog),
          product: 'dataCatalogApi',
          tab: 'data-catalog'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dataCatalogItem);
  }

  if (this.isPositiveNumber_(catalogApiCallCount)) {
    sku = 'CP-DATACATALOG-CATALOG-API';
    dataCatalogItem = {
      quantityLabel: 'million',
      displayName: 'Data Catalog API calls pricing',
      sku: sku,
      quantity: catalogApiCallCount,
      displayDescription: 'Data Catalog',
      price: null,
      region: 'us',
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.dataCatalog),
          product: 'dataCatalogApi',
          tab: 'data-catalog'
        }
      }
    };
    this.CloudCalculator.addItemToCart(dataCatalogItem);
  }

  // Clear the data model
  this.setupDataCatalog();
  this.resetForm(dataCatalogForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Anthos Model.
 * @export
 */

ListingCtrl.prototype.setupAnthos = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    pricingType: string,
   *    environment: string,
   *    cpuCount: ?number,
   *    hours: number,
   *    days: number,
   *    minutes: number,
   *    timeType: string,
   *    timeMode: string,
   *    daysMonthly: number
   * }}
   */
  this.anthos = {
    submitted: false,
    pricingType: 'payg',
    environment: 'cloud-gc',
    cpuCount: null,
    hours: 24,
    days: 7,
    minutes: 1440,
    timeType: 'hours',
    timeMode: 'day',
    daysMonthly: 30,
  };
};

/**
 * Adds Anthos items to Cart.
 *
 * @param {!angular.Form} anthosForm
 * @export
 */
ListingCtrl.prototype.addAnthos = function(anthosForm) {
  if (!anthosForm.$valid) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'AddAnthos');

  const region = 'us';
  const pricingType =
      this.anthos.pricingType === 'payg' ? 'PAYG' : 'SUBSCRIPTION';

  /** @type {number} */
  let hours = 0;
  switch (this.anthos.timeType) {
    case 'hours':
      hours = this.anthos.hours;
      break;
    case 'minutes':
      hours = this.anthos.minutes / 60;
      break;
    case 'days':
      hours = this.anthos.daysMonthly * 24;
      break;
  }

  /** @type {number} */
  const hoursMultiplier =
      this.anthos.timeMode == 'day' ? this.anthos.days * this.WEEKS : 1;
  /**  @type {number} */
  const hoursPerMonth = pricingType === 'PAYG' ? hours * hoursMultiplier :
                                                 this.TOTAL_BILLING_HOURS;

  const pricingTypeName =
      this.anthosPricingTypeList.find(s => s.value === this.anthos.pricingType)
          .name;
  const environment =
      this.anthos.environment.startsWith('cloud') ? 'CLOUD' : 'ONPREM';
  const environmentName =
      this.anthosEnvironmentList.find(s => s.value === this.anthos.environment)
          .name;
  const cpuCount = Number(this.anthos.cpuCount) * hoursPerMonth;

  const sku = `CP-ANTHOS-${environment}-${pricingType}`;
  const totalPrice =
      this.CloudCalculator.calculateItemPrice(sku, cpuCount, region);

  /** @type {!cloudpricingcalculator.SkuData} */
  const anthosItem = {
    displayName: 'Anthos',
    sku: sku,
    region: region,
    quantity: cpuCount,
    quantityLabel: 'hours',
    displayDescription: `${pricingTypeName} | ${environmentName}`,
    price: totalPrice,
    uniqueId: null,
    items: {
      editHook: {
        initialInputs: goog.object.clone(this.anthos),
        product: 'anthos',
        tab: 'anthos'
      }
    }
  };
  this.CloudCalculator.addItemToCart(anthosItem, totalPrice);

  // Clear the data model
  this.setupAnthos();
  this.resetForm(anthosForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Sets up Transcoder API model.
 */
ListingCtrl.prototype.setupTranscoderApi = function() {
  /**
   * @type {{
   *    submitted: boolean,
   *    sdMinuteCount: ?number,
   *    hdMinuteCount: ?number,
   *    uhdMinuteCount: ?number
   * }}
   */
  this.transcoderApi = {
    submitted: false,
    sdMinuteCount: null,
    hdMinuteCount: null,
    uhdMinuteCount: null
  };
};

/**
 * Adds a Trancoder API item to the cart.
 * @param {!angular.Form} transcoderApiForm
 * @export
 */
ListingCtrl.prototype.addTranscoderApi = function(transcoderApiForm) {
  if (this.isFormEmpty(transcoderApiForm)) {
    return;
  }

  this.Analytics.sendEvent('addToEstimate', 'addTranscoderApi');

  const sdMinutes = Number(this.transcoderApi.sdMinuteCount);
  const hdMinutes = Number(this.transcoderApi.hdMinuteCount);
  const uhdMinutes = Number(this.transcoderApi.uhdMinuteCount);

  if (this.isPositiveNumber_(sdMinutes)) {
    /** @type {!cloudpricingcalculator.SkuData} */
    const sdItem = {
      sku: `CP-TRANSCODER-API-SD`,
      region: 'us',
      quantity: sdMinutes,
      quantityLabel: 'Minutes',
      displayName: '1x',
      displayDescription: 'Transcoder API',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.transcoderApi),
          product: 'transcoderApi',
          tab: 'transcoder-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(sdItem);
  }

  if (this.isPositiveNumber_(hdMinutes)) {
    /** @type {!cloudpricingcalculator.SkuData} */
    const hdItem = {
      sku: `CP-TRANSCODER-API-HD`,
      region: 'us',
      quantity: hdMinutes,
      quantityLabel: 'Minutes',
      displayName: '1x',
      displayDescription: 'Transcoder API',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.transcoderApi),
          product: 'transcoderApi',
          tab: 'transcoder-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(hdItem);
  }

  if (this.isPositiveNumber_(uhdMinutes)) {
    /** @type {!cloudpricingcalculator.SkuData} */
    const uhdItem = {
      sku: `CP-TRANSCODER-API-UHD`,
      region: 'us',
      quantity: uhdMinutes,
      quantityLabel: 'Minutes',
      displayName: '1x',
      displayDescription: 'Transcoder API',
      price: null,
      uniqueId: null,
      items: {
        editHook: {
          initialInputs: goog.object.clone(this.transcoderApi),
          product: 'transcoderApi',
          tab: 'transcoder-api'
        }
      }
    };
    this.CloudCalculator.addItemToCart(uhdItem);
  }

  // Clear the data model
  this.setupTranscoderApi();
  this.resetForm(transcoderApiForm);

  // Scroll to the cart
  this.scrollToCart();
};

/**
 * Returnes instance family from series from.
 * @param {string} seriesValue instance series.
 * @return {string} instance family.
 */
ListingCtrl.prototype.getFamilyFromSeries = function(seriesValue) {
  for (const [family, seriesItems] of Object.entries(
           this.computeServerGenerationOptions)) {
    for (const seriesItem of seriesItems) {
      if (seriesItem.value === seriesValue.toLowerCase()) {
        return /** @type {string} */ (family);
      }
    }
  }

  return 'gp';
};

/**
 * Clear input region after an item is selected and dropdows is closed
 */
ListingCtrl.prototype.clearRegionText = function() {
  this.inputRegionText = {};
};


/**
 * Stops propagation of keyboard events from input region to md-select.
 * @return {!angular.Directive}
 * @constructor
 * @ngInject
 */
cloudpricingcalculator.RegionInputDirective = function() {
  return {
    restrict: 'A',
    link: function(scope, element, attr) {
      element.on('keydown', function(e) {
        e.stopPropagation();

        // When ArrowDown is pressed, move focus to the first option
        if (e.key === 'ArrowDown') {
          const input = element[0];
          const firstOption =
              input.closest('md-select-menu').querySelector('md-option');
          if (firstOption) {
            firstOption.focus();
            firstOption.scrollIntoView();
            e.preventDefault();
          }
        }
      });
    }
  };
};

/**
 * Helper directive to moves focus to region input from first option in the
 * md-select without this directive, region input cannot receive focus by
 * keyboard
 * @return {!angular.Directive}
 * @constructor
 * @ngInject
 */
cloudpricingcalculator.RegionOptionDirective = function() {
  return {
    restrict: 'A',
    link: function(scope, element) {
      element.on('keydown', function(e) {
        const optionsElement = element.parent();
        const option = element[0];
        const options = Array.from(optionsElement.children());
        const index = options.indexOf(option);

        // Move focus to the input element except for ArrowDown/Up/Enter/Tab
        const ignoreKeys = ['ArrowDown', 'PageDown', 'ArrowUp', 'Enter', 'Tab'];
        const arrowUpFirstOption = e.key === 'ArrowUp' && index === 0;
        if (!ignoreKeys.includes(e.key) || arrowUpFirstOption) {
          const regionInput = option.closest('md-select-menu')
                                  .querySelector('md-input-container > input');
          if (regionInput) {
            regionInput.focus();
            e.stopPropagation();
          }
        }
      });
    }
  };
};

/**
 * Makes field invalid if the value is not equal to 1 or is an even number.
 * Also considers cpu validation for N2D series.
 * @return {!angular.Directive}
 * @constructor
 * @ngInject
 */
cloudpricingcalculator.CpuValidatorDirective = function() {
  const n2dCores = [2, 4, 8, 16, 32, 48, 64, 80, 96];
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      ctrl.$validators['cpu'] = function(valueString) {
        if (!valueString) {
          return true;
        }
        const value = parseInt(valueString, 10);

        if (scope.$parent.ComputeEngineForm ||
            scope.$parent.ContainerEngineForm) {
          const series = scope.$parent.ComputeEngineForm ?
              scope.$parent.ComputeEngineForm.series.$viewValue :
              scope.$parent.ContainerEngineForm.series.$viewValue;

          return series !== 'n2d' ? value == 1 || value % 2 == 0 :
                                    n2dCores.includes(value);
        } else {
          return value == 1 || value % 2 == 0;
        }
      };
    }
  };
};



/**
 * Makes field invalid if the value is not a multiple of 0.25
 * and it is not equal to min or max. Min and max do not have to be
 * multiples of 0.25.
 * @return {!angular.Directive}
 * @constructor
 * @ngInject
 */
cloudpricingcalculator.StepValidatorDirective = function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      ctrl.$validators['step'] = function(valueString) {
        if (!valueString) {
          return true;
        }
        var value = parseFloat(valueString);
        var minValue = attrs['ngMin'];
        var maxValue = attrs['ngMax'];

        return value == minValue || value == maxValue ||
            value * 4 == Math.round(value * 4);
      };
    }
  };
};
});  // goog.scope
