
import * as React from 'react';

import Typography from '@material-ui/core/Typography';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import TextField from '@material-ui/core/TextField'
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import JSONPretty from 'react-json-pretty';
import NumberFormat from 'react-number-format';

class MachinePriceSummary extends React.Component {
    state = {isOpen:false}

    constructor(props, context) {
        super(props,context);
        this.toggleOpen = this.toggleOpen.bind(this)
    }  
    
    async toggleOpen() {        
        this.setState({isOpen: !this.state.isOpen})        
    }

    getPrice(sku) {
        if (!sku['pricingInfo']) return 0
        return 1000000/sku['pricingInfo'][0]['pricingExpression']['tieredRates'][0]['unitPrice']['nanos']        
    }
    getUnit(sku) {
        if (!sku['pricingInfo']) return 0
        return sku['pricingInfo'][0]['pricingExpression']['usageUnitDescription']
    }


    render() {
        var totalPrice = 0.0
        var machineDetails = [( 
            <thead>
                <th>SKU</th>
                <th>Description</th>
                <th>Unit Price</th>
                <th></th>
                <th>Subtotal</th>
                
            </thead>
        )]

        for (var i in this.props.skus) {
            var sku = this.props.skus[i]
            
            var id = sku['skuId'] 
            var type = sku['category']['resourceGroup']
            var calculatedType = sku['calculatedType']
            var desc = sku['description']
            var unitPrice =  parseFloat(this.getPrice(sku))
            var unit = this.getUnit(sku)
            
            // change units to months
            if (unit.includes('hour')) {
                unit = unit.replace('hour',"month")
                unitPrice = unitPrice * 730
            }

            var machinePrice = unitPrice
            var units = 0
            
            var comment
            

            if (type == 'CPU' || calculatedType == 'CPU') {
                
                unit ='core ' + unit
                units = this.props.vcpu

            } else if(type == 'RAM' || calculatedType == 'RAM') {
                units = this.props.memory
   
            } else if(type == 'SSD' || calculatedType == 'SSD') {
                units = this.props.pdssd
                machinePrice = (unitPrice * units)
            } else if(type == 'PD' || calculatedType == 'PD') {
                units = this.props.pdboot
                machinePrice = (unitPrice * units)
                
            } else {
               // desc += " !!! Not found. Not included in price!!!! "
            }


             
            totalPrice += machinePrice

            machineDetails.push (
                <tbody>
                    <tr>
                        <td>{id}</td>
                        <td>&nbsp;&nbsp;{desc}&nbsp;&nbsp;&nbsp;</td>                   
                        <td>
                        <NumberFormat value={unitPrice} displayType={'text'} decimalScale='3' prefix={'$'} /> per {unit}
                        </td>
                        
<td></td>

                        <td>

                            <NumberFormat value={machinePrice} displayType={'text'} decimalScale='2' prefix={'$'} /> 
                            
                        </td>
                    </tr> 
                </tbody>
            )
        }

        machineDetails.push (
            <tbody>
                <tr><td colspan='100'><hr/></td></tr>
                <tr>
                    <th colspan='4'>Total:</th>
                    <td><NumberFormat value={totalPrice} displayType={'text'} decimalScale='2' housandSeparator={true} prefix={'$'} /> per month</td>
                </tr> 
            </tbody>
        )
        /*
        if (totalPrice == 0) 
            return ( <Typography  color=""> This instance type is not available in this region.</Typography>)
        else*/
            return (
                <Accordion expanded={this.state.isOpen} onChange={this.toggleOpen}>
                    <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header">
                    <NumberFormat value={totalPrice} displayType={'text'} decimalScale='2' housandSeparator={true} prefix={'$'} />&nbsp;per month
                    </AccordionSummary>
                    <AccordionDetails>
                        <table>{machineDetails}</table>
                    </AccordionDetails>
                </Accordion>
            )
    }
    
}
export default MachinePriceSummary;
