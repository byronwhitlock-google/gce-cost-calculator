import '@fontsource/roboto';
import React from 'react';

class InstanceList extends React.Component {

    render () {
        return (        
            <table key="mytables">
            <thead><tr><th>Name </th><th>Description</th></tr></thead>
            <tbody>
            {this.props.instancePricing && this.props.instancePricing.map((sku, key) =>
                <tr key={sku.skuId}>
                    <td>{sku.skuId}</td><td>{sku.name}</td><td>{sku.description}</td>
                </tr>          
            ) }
            </tbody>
        </table>
        )
    }
}

export default InstanceList;
