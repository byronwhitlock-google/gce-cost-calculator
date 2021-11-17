// simple class that helps with caluclatons
class SimpleCalculator {

    
   /**
   * @const {Object}
   */
    GCE_VMS_CORE_RAM_RATIO = {
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
     * @export {number}
     */
    TOTAL_BILLING_HOURS = 730;

    /**
     * @const {number}
     */
    MAX_RAM_RATIO = {'n1': 6.5, 'n2': 8, 'n2d': 8};

    /**
     * Returnes .
     * @param {string} sku The product SKU
     * @return {string} family this sku belongs.
     */
    getFamilyFromSku = function(sku) {
    return sku ? sku.replace('CP-COMPUTEENGINE-VMIMAGE-', '').split('-')[0] : '';
    }
    
    /**
     * Returnes max custom ram to core ratio per given machine family.
     * @param {string} family instance family
     * @return {number} ratio.
     */
    getMaxCoreRatio = function(family) {
        family = family.toLowerCase();
        return family ? this.MAX_RAM_RATIO[family] : 0;
    }
} export default SimpleCalculator