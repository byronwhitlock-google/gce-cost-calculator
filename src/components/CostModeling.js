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
TODO:
1. make discount default to 0 and accept inputs
2. toggle-able SUDs
3. CUD + blended rates toggle-able, and prices shown
4. add PD HDD, PD SSD, and local SSD options
5. debug why c2 instance types show "not available"
6. when clicking inputs on right, overwrite 0 instead of appending

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
import InstancePriceList from './InstancePriceList.js' 
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CostModelingGeometry from './CostModelingGeometry.js'
import GenericGeometry from './GenericGeometry.js'
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import { Checkbox } from '@material-ui/core';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import GeometryModel from '../lib/GeometryModel.js';
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import RegionList from '../lib/RegionList.js'

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  color: theme.palette.text.secondary,
}));

class CostModeling extends React.Component {

    constructor(props, context) {
        super(props,context);
        this.handleChangeRegion= this.handleChangeRegion.bind(this)
        this.regionList= new RegionList()
    }  

    state = {filter: {region:'us-west2'}}

    regions =[]

    async handleChangeRegion(evt) {
        await this.setState({filter: {region: evt.target.value}})
        this.props.applyRegionFilter(this.state.filter.region)
    }    
    
    async componentDidMount() { 
        
        this.regions = this.regionList.regions() 
        this.props.applyRegionFilter(this.state.filter.region)
    }

    


    render () {
        let props = this.props
        
        return (
            <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
                <Item>
                    <h2>Region:&nbsp;                
                            <Select
                                value={this.state.filter.region}
                                onChange={this.handleChangeRegion}
                                inputProps={{
                                name: 'Region',
                                id: 'region',
                                }}
                            >
                                {this.regions.map((region, key) =>
                                <MenuItem value={region.id}>{region.name} ({region.id})</MenuItem>       
                                ) }
                            </Select>                    
                     </h2>

                    <Tooltip title="Instance Geometry parameters determined by current count, utilization and desired utilization of the resource.">
                        <h2>Machine Geometry Recommender</h2>
                    </Tooltip>
                    
                    
                    <CostModelingGeometry title="vCpu" type ="Cores"  onChange={this.props.onInputChanged} {...this.props}/>       
                    <CostModelingGeometry title="Memory" type ="Gigabytes" onChange={this.props.onInputChanged} {...this.props} />       
                    <CostModelingGeometry title="PD-Boot" type ="Disk GB" onChange={this.props.onInputChanged} {...this.props} hideSpread={true}/>       
                    <CostModelingGeometry title="SSD-PD" type ="Disk GB" onChange={this.props.onInputChanged} {...this.props} hideSpread={true}/>       
                
                </Item>
                <Item>
                    <h2><FormControlLabel  disabled={true} control={<Checkbox defaultChecked color="primary"/>} label="" />Include Contractual Discount ?</h2>
                
                    <GenericGeometry 
                        title="Discount" 
                        value="0"
                        type="%"
                        {...this.props}

                    />
                </Item>
                
                <Item>
                <h2><FormControlLabel  disabled={true} control={<Checkbox defaultChecked color="primary"/>} label="" />Show Commited Use Discounts ?</h2>
                                    <GenericGeometry 
                        title="Sustained Use Discount" 
                        value="6"
                        type="Months"
                        {...this.props}
                    />
                    <GenericGeometry 
                        title="On-Demand Period" 
                        value="6"
                        type="Months"
                        {...this.props}
                    />
                    <GenericGeometry 
                        title="CUD Period" 
                        value="3 Years"
                        type="Years"
                        {...this.props}
                    />
                    <GenericGeometry 
                        title="Term" 
                        value="48"
                        type="Months"
                        {...this.props}
                    />                                
                </Item>
            </Grid>
            <Grid item xs={12} md={8}>
                <Item>

                <h2>Matching Machine Types</h2>
                <InstancePriceList {...props}
                    filter={this.state.filter}
                    instancePriceList={this.state.instancePriceListFiltered}                    
                />
                </Item>
            </Grid>      
            </Grid>

            );
    }
} 
export default CostModeling