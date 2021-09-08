import './App.css';
import PricingApi from './api/PricingApi.js'
import ModalPopup from './ModalPopup.js'
import '@fontsource/roboto';
import React from 'react';

class App extends React.Component {

  state= {
    instancePricing: null,
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

      this.setError(ex.message)
    }
    
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

        Pricing Api 
        <table>
          <thead><tr><th>Name </th><th>Description</th></tr></thead>
          <tbody>
            {this.state.instancePricing && this.state.instancePricing.map((sku, key) =>
              <tr><td>{sku.name}</td><td>{sku.description}</td></tr>          
            ) }
          </tbody>
        </table>
        
      </div>
    );
  }
}
export default App;
