import '@fontsource/roboto';
import React from 'react';
import JSONPretty from 'react-json-pretty';
import MachinePriceSummary from './MachinePriceSummary.js'

class InstancePriceList extends React.Component {

    constructor(props, context) {
        super(props,context);
    }  
    render () {
        return (        
            <table width='100%' key="mytables">
            <thead>
                    <tr>
                        <th>Instance</th>
                        <th>Series</th>
                        <th>CPU</th>
                        <th>Memory</th>
                        <th>Price</th>
                    </tr>
            </thead>
            <tbody>
            {this.props.machineList && this.props.machineList.map((machine,key) =>
                <tr key={key}>
                    <td>{machine.type}</td>
                    <td>{machine.series}</td>
                    <td>{machine.vcpu}</td> 
                    <td>{machine.memory}</td>
                    <td>
                        <MachinePriceSummary {...machine} 
                      
                       pdssd={this.props.pdssd}
                       pdboot={this.props.pdboot}
                        />
                     </td>      
                </tr>          
            ) }
            </tbody>
        </table>
        )
    }
}

export default InstancePriceList;
