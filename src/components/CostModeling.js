/*
# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
*/
import React, { useState } from 'react';
import DOMPurify from "dompurify";
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import { styled } from '@material-ui/core/styles';
import CardActions from '@material-ui/core/CardActions'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'

import Button from '@material-ui/core/Button';
import InstanceList from './InstanceList.js' 
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CostModelingGeometry from './CostModelingGeometry.js'
import GenericGeometry from './GenericGeometry.js'
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import { Checkbox } from '@material-ui/core';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import GeometryModel from '../lib/GeometryModel.js';


const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  color: theme.palette.text.secondary,
}));

class CostModeling extends React.Component {

    constructor(props, context) {
        super(props,context);
    }  

    render () {
        let props = this.props
        
        return (
            <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
                <Item>
                    <Tooltip title="Instance Geometry parameters determined by current count, utilization and desired utilization of the resource.">
                        <h2>Optimize Resource Geometry </h2>
                    </Tooltip>
                    
                    
                    <CostModelingGeometry title="vCpu" type ="Cores" />       
                    <CostModelingGeometry title="Memory" type ="Gigabytes" />       
                    <CostModelingGeometry title="PD-Boot" type ="Disk GB" />       
                    <CostModelingGeometry title="SSD-PD" type ="Disk GB" />       
                
                </Item>
                <Item>
                <h2>Include Contractual Discount</h2>
                    <GenericGeometry 
                        title="Discount" 
                        value="5"
                        type="%"

                    />
                </Item>
                
                <Item>
                <h2><FormControlLabel control={<Checkbox defaultChecked color="primary"/>} label="" />Use Commited Use Discounts ?</h2>
                    <GenericGeometry 
                        title="On-Demand Period" 
                        value="6"
                        type="Months"
                    />
                    <GenericGeometry 
                        title="CUD Period" 
                        value="3 Years"
                        type="Years"
                    />
                    <GenericGeometry 
                        title="Term" 
                        value="48"
                        type="Months"
                    />                                
                </Item>
            </Grid>
            <Grid item xs={12} md={8}>
                <Item>
                <h2>Matching Machine Types</h2>
                </Item>
            </Grid>      
            </Grid>

            );
    }
} 
export default CostModeling