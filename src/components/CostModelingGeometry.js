import * as React from 'react';

import Typography from '@material-ui/core/Typography';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import TextField from '@material-ui/core/TextField'
import Divider from '@material-ui/core/Divider';
import ArrowRightAltRoundedIcon from '@material-ui/icons/ArrowRightAltRounded';
import Grid from '@material-ui/core/Grid';
import Tooltip from '@material-ui/core/Tooltip';
import GeometryModel from '../lib/GeometryModel';
import Slider from '@material-ui/core/Slider'
import { Box } from '@material-ui/core';
import ArrowRightAltIcon from '@material-ui/icons/ArrowRightAlt';


import Paper from '@material-ui/core/Paper';
import { styled } from '@material-ui/core/styles';

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  color: theme.palette.text.secondary,
}));

class CostModelingGeometry extends React.Component {
    constructor(props, context) {
        super(props,context);
        this.handleUpdateCurrent = this.handleUpdateCurrent.bind(this)
        this.handleUpdateUtilization = this.handleUpdateUtilization.bind(this)
        this.handleUpdateUtilizationDesired = this.handleUpdateUtilizationDesired.bind(this)
        this.toggleOpen = this.toggleOpen.bind(this)
        this.handleSliderChange = this.handleSliderChange.bind(this)
        
    }  


    state = { 
            isOpen:0,
            current: '',
            utilization: 0,
            utilization_desired: 0,
            recommended:0,
            spread:20
        }
    

    async componentDidMount(){

        // load model data from localStorage
        let model = new GeometryModel(this.props.title, this.props.type)
        await model.calculateRecommendation()
        
        this.props.onChange(model)
        
        //set default state from localStorage
        this.setState({
            isOpen: model.isOpen,
            current: model.current,
            utilization: model.utilization,
            utilization_desired: model.utilization_desired ,
            recommended: model.recommended
        })
    }

    cleanup (text) {
        if (!Number.isInteger(text)) {
            return text.replace( /[^0-9]/g, '' ); 
        } else {
            return text
        }
    }
    async saveState() {
        let model = new GeometryModel(this.props.title, this.props.type)
        model.isOpen= this.state.isOpen

        if (this.state.current) {
            model.current= this.cleanup(this.state.current)
        }
        if (this.state.utilization) {
            model.utilization= this.cleanup(this.state.utilization)
        }
        if (this.state.utilization_desired) {
            model.utilization_desired= this.cleanup(this.state.utilization_desired)
        }

        await model.calculateRecommendation()
        if (model.recommended) {
            // update recommended calculation
            this.setState({...this.state,recommended: model.recommended})
            
            this.props.onChange(model)
        }

        await model.persist()
        

    }

    async toggleOpen() {        
        await this.setState({...this.state, isOpen: !this.state.isOpen})
        this.saveState()
    }
    
    async handleUpdateCurrent(evt) {
        let current = evt.target.value.replace( /[^0-9]/g, '' ); 
        if (current) {
            await this.setState({...this.state,current: current})
            this.saveState()
        }
    }
    async handleUpdateUtilization(evt) {
        let utilization = evt.target.value.replace( /[^0-9]/g, '' ); 
        if (utilization > 100) {
            this.props.setError("Utilization cannot exceed 100%")
        } else if (utilization) {
            await this.setState({...this.state,utilization: utilization})
            this.saveState()
        }
    }
    async handleUpdateUtilizationDesired(evt) {
        let utilization_desired = evt.target.value.replace( /[^0-9]/g, '' ); 
        if (utilization_desired > 100) {
            this.props.setError("Desired Utilization cannot be exceed  100%")
        } else if (utilization_desired) {
            await this.setState({...this.state,utilization_desired: utilization_desired})
            this.saveState()     
        }
    }

    handleSliderChange(event, newValue){
        this.setState({spread: newValue});
    }
    
    render () {
        let title = this.props.title
        let type = this.props.type
        console.log("rendering")

        var min_recommended = (this.state.recommended - (this.state.recommended * this.state.spread/100)).toFixed(0)
        var max_recommended = (this.state.recommended + (this.state.recommended * this.state.spread/100)).toFixed(0)
console.log(this.state)
        return (
                <Accordion expanded={this.state.isOpen} onChange={this.toggleOpen}>
                    <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header">
                        <Typography variant="h6">{title}&nbsp;&nbsp;</Typography> 
                        
                        <Typography  hidden={this.state.isOpen} color="primary">{this.state.recommended}  {type} </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <table width="100%">
                            <tr>
                                <td>
           

                                    <Accordion>
                                        <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        aria-controls="panel1a-content"
                                        id="panel1a-header"
                                        >
                                       <b>
                                            <Tooltip title={`Current ${title}`}>
                                                <Typography>
                                                <TextField  
                                                    label={`${title}`} 
                                                    value={`${this.state.current}`}
                                                    onChange={this.handleUpdateCurrent}
                                                    size="small"/> 
                                                </Typography>                                                                
                                            </Tooltip>  {type} </b> @ {this.state.utilization_desired}% Utilization
                                        </AccordionSummary>

                                        <AccordionDetails> 
                                            <h6>Utilization</h6>                                               
                                            <Tooltip title={`Curr Util`} >
                                                <Typography>
                                                    <TextField  
                                                        label={`Current`} 
                                                        value={`${this.state.utilization} %`}
                                                        onChange={this.handleUpdateUtilization}
                                                        size="small"/>
                                                </Typography>      
                                            </Tooltip>                   
                                            <Tooltip title={`Desired`} >
                                                <Typography>
                                                    <TextField  
                                                        label={`Desired`} 
                                                        value={`${this.state.utilization_desired} %`}
                                                        onChange={this.handleUpdateUtilizationDesired}
                                                        size="small"/>
                                                </Typography>    
                                            </Tooltip>
                                        </AccordionDetails>
                                    </Accordion>           
                                </td>
                                <td>&nbsp;&nbsp;&nbsp;{/*i got hacks from the 90s table layout till i die*/}</td>
                                <td>
                                    <Accordion>
                                        <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        aria-controls="panel1a-content"
                                        id="panel1a-header"
                                        >
                                            <Typography  color="primary" variant="h5">
                                                <center>
                                                    <b>{min_recommended} to {max_recommended}  {type}</b> 
                                                </center>
                                            </Typography>  
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <table><tr><td>
                                            <Slider
                                                    aria-label={`${type} Spread`}
                                                    valueLabelDisplay="auto"
                                                    defaultValue={20}
                                                    getAriaValueText={(value) => {return `${value}%`}}
                                                    onChange={this.handleSliderChange}
                                                    size="small"
                                                    aria-label="Small"                                                    
                                                    min={0}
                                                    max={100}
                                                /> 
                                            </td></tr><tr><td>
                                            {`Increasing ${type} spread (min/max) will match more machine types in right panel`}
                                            <span style={{float:'right'}}><ArrowRightAltIcon/></span>
                                            </td></tr>
                                            </table>
                                        </AccordionDetails>
                                    </Accordion>        
                                    

                                </td>
                            </tr>
                        </table>
                        
                    </AccordionDetails>
                    
                </Accordion>        
                        
            );
        }
}
export default CostModelingGeometry