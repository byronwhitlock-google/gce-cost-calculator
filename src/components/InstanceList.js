import '@fontsource/roboto';
import React from 'react';
//import Calculator from 'lib/Calculator.js' 


class InstanceList extends React.Component {

    constructor(props, context) {
        super(props, context);
    }
    formatPrice(sku) {
        var price = 1000000 / sku['pricingInfo'][0]['pricingExpression']['tieredRates'][0]['unitPrice']['nanos']
        var unit = sku['pricingInfo'][0]['pricingExpression']['usageUnitDescription']
        return <div>${price} per {unit}</div>
    }
    
    render() {
        return (
            <table key="mytables">
                <thead><tr><th>Name </th><th>Description</th></tr></thead>
                <tbody>
                    {this.props.instancePricing && this.props.instancePricing.map((sku, key) =>
                        <tr key={sku.skuId}>
                            <td>{sku.category.resourceGroup}</td><td>{sku.description}</td>
                            <td>
                                {this.formatPrice(sku)}
                            </td>

                            <td>
                                {JSON.stringify(sku, null, 2)}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        )
    }
}

export default InstanceList;
