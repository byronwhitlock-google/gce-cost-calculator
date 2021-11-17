class MachineConfig {

    /**
     * Combines instance name.
     * @param {string} family instance family.
     * @param {number} series instance series.
     * @param {string} instanceType type of this instance.
     * @param {number} coreNumber number of cores.
     * @return {string} instance name.
     * @export
     */
    generateGceInstanceName(family, series, instanceType, coreNumber) {
    let cores = series == 'a2' ? `${coreNumber}g` : coreNumber;
    return [series, instanceType, cores].join('-').toLowerCase();
    }

    machineDetails (family, series, instanceType, coreNumber) {
        const instanceName =  this.generateGceInstanceName(family, series, instanceType, coreNumber);
        const instanceInfo =  this.gceMachineFamilyConfig[family][series]['supportedTypes'][instanceType];
        const ramRatio = instanceInfo['alternateRamRatio'] &&
        instanceInfo['alternateRamRatioCores'] &&
        instanceInfo['alternateRamRatioCores'].includes(coreNumber) ?
        instanceInfo['alternateRamRatio'] :
        instanceInfo['ramRatio'];
        const coreRatio = instanceInfo['coreRatio'];
        
        let vcpu = coreNumber * coreRatio
        let memory = coreNumber * ramRatio
        let gpu = 0

        if (series == 'a2') {        
            gpu = coreNumber
        }
        return {
            type: instanceName,
            series:series,
            family:family,
            vcpu:vcpu,
            memory:memory};
    }
  

    // gets us the machinelist format.
    machines() {
        let machineList = []
        Object.entries(this.gceMachineFamilyConfig).forEach(([
                                                                family, familyInfo
                                                            ]) => {
            
            Object.entries(familyInfo).forEach(([series, genInfo]) => {
            Object.entries(genInfo['supportedTypes']).forEach(([
                                                                typeName, typeData
                                                                ]) => {
                typeData['supportedCores'].forEach((coresCount) => {

                    machineList.push(
                        this.machineDetails(family, series, typeName, coresCount)
                    )
                });
            });
            });
        });
        return machineList
    }

  /**
   * @export {!Object.<string,!Array.<!Object.<string, number>>>}
   */

  computeServerGenerationOptions = {
    'gp': [
      {name: 'N1', value: 'n1'}, {name: 'N2', value: 'n2'},
      {name: 'E2', value: 'e2'}, {name: 'N2D', value: 'n2d'},
      {name: 'T2D', value: 't2d'}
    ],
    'compute': [{name: 'C2', value: 'c2'}],
    'memory': [{name: 'M1', value: 'm1'}, {name: 'M2', value: 'm2'}],
    'accelerator': [{name: 'A2', value: 'a2'}]
  };

  /**
   * @export {!Array.<!Object.<string, string>>}
   */
  computeServerCpuOptions = [
    {name: 'shared', value: 'shared'}, {name: '1', value: '1'},
    {name: '2', value: '2'}, {name: '4', value: '4'}, {name: '8', value: '8'},
    {name: '16', value: '16'}, {name: '32', value: '32'}
  ];

  /**
   * @export {!Object.<string,!Array.<!Object.<string, number>>>}
   */
  gceMachineFamilyConfig = {
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
} 

export default MachineConfig