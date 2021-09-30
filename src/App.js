import './App.css';
import PricingApi from './api/PricingApi.js'
import ModalPopup from './components/ModalPopup.js'
import AppHeader from './components/AppHeader.js'
import MainLayout from './components/MainLayout.js'

import Divider from '@material-ui/core/Divider';
import '@fontsource/roboto';
import React from 'react';

class App extends React.Component {

  state= {
    instancePricing: null,
    filter: {},
    error : {
      title:null,
      content:null,
      isOpen:false
    },
    alert : {
      title:null,
      content:null,
      isOpen:false
    },
  }

  constructor(props, context) {
    super(props,context);
    this.setError = this.setError.bind(this)
    this.setAlert = this.setAlert.bind(this)
    this.handleErrorClose = this.handleErrorClose.bind(this)
    this.handleRefreshFilter = this.handleRefreshFilter.bind(this)
  }  
  
  setError(text,title="Error")
  {
    var error = this.state.error;
    error.title = title;
    error.content = text;
    error.isOpen = true      ;
    this.setState({...this.state,error});
  }

  setAlert(text,title="Alert")
  {
    var alert = this.state.alert;
    alert.title = title;
    alert.content = text;
    alert.isOpen = true      ;
    this.setState({...this.state,alert});
  }

  // also closes alert box
  handleErrorClose() {
    let error = this.state.error
    error.isOpen = false

    let alert = this.state.alert
    alert.isOpen = false

    this.setState({...this.state,alert,error})
  }

  handleRefreshFilter() {

  }



  async componentDidMount() {
    await this.getPricing()
  }

  async getPricing() { 
    try 
    {
      let pricingApi = new PricingApi();
      let instancePricingJson = await pricingApi.GetInstancePricing()
      this.setState({instancePricing: instancePricingJson})
     } catch( ex) {
       this.setError(`Could not Load pricing from Google. ${ex.message }`)
      //  /throw new Error(ex)
     }   
  }

  //TODO: move this crap into its own layout with the tabs
  setTab(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  
  render() {
    return (
      <div className="App">
      <ModalPopup           
        title={this.state.error.title} 
        content={this.state.error.content} 
        open={this.state.error.isOpen} 
        onClose={this.handleErrorClose} />
      <ModalPopup           
          title={this.state.alert.title} 
          content={this.state.alert.content} 
          open={this.state.alert.isOpen} 
          severity="info"
          onClose={this.handleErrorClose} />     
      <AppHeader 
        setError = {this.setError}
        setAlert = {this.setAlert}
      />
  <Divider />
  <MainLayout      
    setAlert={this.setAlert}
    setError={this.setError}
    instancePricing = {this.state.instancePricing}     
    filter = {this.state.filter}  
    />
        
      </div>
    );
  }
}
export default App;
