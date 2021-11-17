
import PriceListJson from './pricelist.json'
import SimpleCalculator from './SimpleCalculator.js'
class MachineList {

   
    constructor() {            
        // return the pricelist.json in a format the rest of the app understands.
        // Machine list format is [{type: 'e2-custom', vcpu:0, memory: 0}]
        // pricelist.json... look at the file and see
        this.calculator = new SimpleCalculator()

        var machineList = [] // {type:'',vcpu:0,memory:0}
        // grab the vm product types        
        for(var priceListSku in PriceListJson.gcp_price_list) {
            if (priceListSku.includes('CP-COMPUTEENGINE-VMIMAGE-'))
            {
                var p = PriceListJson.gcp_price_list[priceListSku]
                var machineType = priceListSku.replace('CP-COMPUTEENGINE-VMIMAGE-','')
                var family = this.calculator.getFamilyFromSku(priceListSku)

                // collect family name for custom types?
                machineList.push({
                    type: machineType,
                    family: family,
                    vcpu: p['cores'],
                    memory: p['memory']
                })
            }  
        }
        this._raw = machineList        
    }


    machines() {    
        this._raw.sort(this.sortByProperty("vcpu"));
        return this._raw;
    }

    sortByProperty(property) {
        return function (a, b) {
            if (a[property] > b[property])
                return 1;
            else if (a[property] < b[property])
                return -1;

            return 0;
        }
    }

    _raw = [
        
        // type, vcpus, memory
        // custom types will be calculated in realtime based on im
     /*   {type: 'e2-custom', vcpu:0, memory: 0, pricing: [] },
        {type: 'n1-custom', vcpu:0, memory: 0, pricing: [] },
        {type: 'n2-custom', vcpu:0, memory: 0, pricing: [] },
        {type: 'n2d-custom', vcpu:0, memory: 0, pricing: [] }
        */

    ]
}

export default MachineList