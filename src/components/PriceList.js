import '@fontsource/roboto';
import React from 'react';
//import Calculator from 'lib/Calculator.js' 

import JSONPretty from 'react-json-pretty';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import { styled } from '@material-ui/core/styles';
import MachineConfig from '../lib/MachineConfig';

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  color: theme.palette.text.secondary,
}));

class PriceList extends React.Component {

    constructor(props, context) {
        super(props,context);
        // deprecated!
        //var m = new MachineList()
        //this.machineList = m.machines()

        var mc = new MachineConfig()
        this.machineList = mc.machines()
    }  
    render () {
        return (   
        <React.Fragment>
            <Item>
                <pre style={{'text':'align-left'}}>
                    <JSONPretty id="json-pretty" data={this.machineList}></JSONPretty>
                </pre>
            </Item>
        </React.Fragment>
        )
    }
}

export default PriceList;
