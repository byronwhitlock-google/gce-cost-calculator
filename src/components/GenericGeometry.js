import * as React from 'react';

import Typography from '@material-ui/core/Typography';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import Divider from '@material-ui/core/Divider';
import ArrowRightAltRoundedIcon from '@material-ui/icons/ArrowRightAltRounded';
import TextField from '@material-ui/core/TextField'

export default function GenericGeometry(props) {
  return (
        <Accordion disabled={true}>
            <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
            >
            <Typography variant="h6">{props.title}&nbsp;&nbsp;</Typography> 
        <Typography  color="primary">   {props.value} {props.type}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <table><tr><td nowrap="true">
            <Typography>
                    {props.title}: {props.current} <br/>                    
            </Typography>
            </td><td>                  
                <Typography>
                <TextField  
                    label={`Current ${props.title}`} 
                    value={props.value}
                    size="small"/> {props.type}
                </Typography>       
            </td></tr></table>
            </AccordionDetails>
        </Accordion>                
  );
}