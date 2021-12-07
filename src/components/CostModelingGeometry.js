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
        this.handleFocus = this.handleFocus.bind(this)
        
        
    }  


    state = { 
            isOpen:0,
            current: '',
            utilization: 0,
            utilization_desired: 0,
            recommended:0,
            spread:20
        }
    

    componentDidMount(){
        // load model data from localStorage
        let model = new GeometryModel(this.props.title, this.props.type)
        this.props.onChange(model)
        //super.setState({...model})
       //window.alert("hola")
    }

    cleanup (text) {
        if (!Number.isInteger(text)) {
            return text.replace( /[^0-9]/g, '' ); 
        } else {
            return text
        }
    }

    // loads model from state
    getModelFromState() {
        let model = new GeometryModel(this.props.title, this.props.type)
        model.isOpen= this.state.isOpen

        if (this.state.spread>0) {
            model.spread = this.cleanup(this.state.spread)
        }
        if (this.state.current) {
            model.current= this.cleanup(this.state.current)
        }
        if (this.state.utilization) {
            model.utilization= this.cleanup(this.state.utilization)
        }
        if (this.state.utilization_desired) {
            model.utilization_desired= this.cleanup(this.state.utilization_desired)
        }
        model.calculateRecommendation()
        return model
    }
    // set state and persists model in local storage
    async setState(state) {
        await super.setState(state)

        let model = this.getModelFromState()            
        this.props.onChange(model)
        model.persist()
    }

    async toggleOpen() {        
        this.setState({isOpen: !this.state.isOpen})
    }
    
    async handleUpdateCurrent(evt) {
        let current = evt.target.value.replace( /[^0-9]/g, '' ); 
        if (current) {
            this.setState({current: current})            
        }
    }
    async handleUpdateUtilization(evt) {
        let utilization = evt.target.value.replace( /[^0-9]/g, '' ); 
        if (utilization > 100) {
            this.props.setError("Utilization cannot exceed 100%")
        } else if (utilization) {
            this.setState({utilization: utilization})
        }
    }
    async handleUpdateUtilizationDesired(evt) {
        let utilization_desired = evt.target.value.replace( /[^0-9]/g, '' ); 
        if (utilization_desired > 100) {
            this.props.setError("Desired Utilization cannot be exceed  100%")
        } else if (utilization_desired) {
            this.setState({utilization_desired: utilization_desired})            
        }
    }

    async handleSliderChange(event, spread){
        this.setState({spread: spread});        
    }
    handleFocus = (event) => { event.preventDefault(); event.target.select();}
    
    render () {
        let title = this.props.title
        let type = this.props.type

        var model = this.getModelFromState()

        var min_recommended = model.min_recommended
        var max_recommended = model.max_recommended
        
        var min_utilization_actual = model.min_utilization_actual
        var max_utilization_actual = model.max_utilization_actual
        

        var recommendation = <React.Fragment>{min_recommended} to {max_recommended} {this.props.type}</React.Fragment>
        let utilization_actual =  <React.Fragment>{max_utilization_actual}%</React.Fragment>
        if ((min_recommended == max_recommended ) || ! this.props.hideSpread) {
            // recommendation = <React.Fragment>{max_recommended} {this.props.type}</React.Fragment>            
        }
        
        return (
                <Accordion expanded={model.isOpen} onChange={this.toggleOpen}>
                    <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header">
                        <Typography variant="h6">{title}:&nbsp;&nbsp;</Typography>                         
                        <Typography  variant="h6" hidden={model.isOpen} color="primary"> {recommendation}</Typography>
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
                                                    onFocus={this.handleFocus} 
                                                    
                                                    label={`${title}`} 
                                                    value={`${model.current}`}
                                                    onChange={this.handleUpdateCurrent}
        
                                                    size="small"/> 
                                                </Typography>                                                                
                                            </Tooltip>  
                                            {type} </b>
                                        </AccordionSummary>
                                        
                                        <AccordionDetails > 
                                            <h6>Utilization</h6>                                               
                                            <Tooltip title={`Curr Util`} >
                                                <Typography>
                                                    <TextField  
                                                    onFocus={this.handleFocus} 
                                                        label={`Current`} 
                                                        value={`${model.utilization} %`}
                                                        onChange={this.handleUpdateUtilization}
                                                        size="small"/>
                                                </Typography>      
                                            </Tooltip>                   
                                            <Tooltip title={`Desired`} >
                                                <Typography>
                                                    <TextField  
                                                    onFocus={this.handleFocus} 
                                                        label={`Desired`} 
                                                        value={`${model.utilization_desired} %`}
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
                                        expandIcon={this.props.hideSpread ? null:<ExpandMoreIcon />}
                                        aria-controls="panel1a-content"
                                        id="panel1a-header"
                                        >
                                            <Typography  color="primary" variant="h5">
                                                <center>
                                                    <b>
                                                        { this.props.hideSpread ? <span >= </span>:<span> &#x02248; </span>} 
                                                        {recommendation}</b> 
                                                </center>
                                            </Typography>  
                                        </AccordionSummary>
                                        {this.props.hideSpread ||
                                        <AccordionDetails>
                                            <table><tr><td>
                                                {type} Spread: {model.recommended} {type} &plusmn; {this.state.spread}% 
                                            <Slider
                                                    aria-label={`${type} Spread`}
                                                    valueLabelDisplay="auto"
                                                    defaultValue={this.state.spread}
                                                    getAriaValueText={(value) => {return `${value}%`}}
                                                    onChangeCommitted={this.handleSliderChange}
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
                                        </AccordionDetails> }
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