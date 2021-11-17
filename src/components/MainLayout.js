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
import * as React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import { styled } from '@material-ui/core/styles';
import Divider from '@material-ui/core/Divider';
import InstanceList from './InstanceList.js' 
import CostModeling from './CostModeling.js';
import Tooltip from '@material-ui/core/Tooltip';
import PriceList from './PriceList.js'

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  color: theme.palette.text.secondary,
}));



function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function setTab(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function MainLayout(props) {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (          
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            <Tab label="Migration Calculator" {...setTab(0)} />
            <Tab label="[DEBUG] API Pricelist" {...setTab(1)} />
            
            <Tab label="[DEBUG] Calculator Pricelist" {...setTab(2)} />
            
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <CostModeling {...props}
          />
        </TabPanel>
        <TabPanel value={value} index={1}>
        Pricing Api (https://cloud.google.com/billing/v1/how-tos/catalog-api )
            <InstanceList
              {...props}     
              setAlert={props.setAlert}
              setError={props.setError}
              instancePriceList={props.instancePriceList}
              
              
            />
        </TabPanel>
         <TabPanel value={value} index={2}>
        PriceList Calculator (https://cloudpricingcalculator.appspot.com/static/data/pricelist.json) 
            <PriceList
              {...props}     
              setAlert={props.setAlert}
              setError={props.setError}
            />
        </TabPanel>
      </Box>
  );
}