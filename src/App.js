import './App.css';
import PricingApi from './api/PricingApi.js'
import ModalPopup from './components/ModalPopup.js'
import AppHeader from './components/AppHeader.js'
import MainLayout from './components/MainLayout.js'
import Divider from '@material-ui/core/Divider';
import '@fontsource/roboto';
import React from 'react';
import MachineConfig from './lib/MachineConfig';

class App extends React.Component {

  state= {
    instancePriceList: null,
    machineList: [],
    machineListFiltered: [],
    vcpu_filter: {},
    memory_filter: {},
    pdboot_filter: {},
    ssdpd_filter: {},
    regionFilter: '',
    
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
    this.handleInputChanged = this.handleInputChanged.bind(this)
    this.applyRegionFilter = this.applyRegionFilter.bind(this)
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


  async handleInputChanged(geometry) {
    if (geometry){
      // grab the filter 
      var currentFilter = this.state.filter

      // see what gemotery we are looking at in this callback, is it cpu memoy or what
      var type = geometry.title.toLowerCase().replace('-','')
      
      await this.setState({[type+'_filter']: geometry, })  //  es6 is the hottness.
      
      // set the current filter value for this type(cpu memroy pd etc)
      switch (type) {
        case 'vcpu':
          await this.setState({vcpu_filter: geometry})
          break;        
        case 'memory':
          await this.setState({memory_filter: geometry})
          break;
        case 'pdboot':
          await this.setState({pdboot_filter: geometry})
          break;
        case 'ssdpd':
          await this.setState({ssdpd_filter: geometry})
          break;
      }
      
      // apply filter according to state.
      return this.applyMachineListFilter()
    }
  }
  async applyMachineListFilter() {
    var machineList = []
    var vcpu_f = this.state.vcpu_filter
    var memory_f = this.state.memory_filter
    var m = new MachineConfig()
    

    machineList =  m.customMachines(vcpu_f.recommended,memory_f.recommended)

    for (var i in this.state.machineList) {
      let curMachine = this.state.machineList[i]
      
      /// calculate custom types
      //TODO: need min/max cpu/mem values here
      if (curMachine.type.includes('custom')) {
      //  continue; // never repush custom types, we initialized with it.
      }

      var push=false
      // floor
      if (
          vcpu_f.min_recommended <= curMachine.vcpu && 
          memory_f.min_recommended <= curMachine.memory ) {
        push = true
      }
      // celing
      // dont add cpus more than 2x what we want
      if (
          vcpu_f.max_recommended <= curMachine.vcpu || 
          memory_f.max_recommended <= curMachine.memory) {
        push=false
      }

      // don't do that, use spread

      if (push ) {
         curMachine.skus = this.getSkus(curMachine.type)
         machineList.push(curMachine)
      }
      

      // don't recomend the next higest size type if we already recommended the smaller one.
    }    
    return this.setState({machineListFiltered: machineList})
  }

  async applyRegionFilter(filter_region) {

    if (!filter_region) {
      filter_region = this.state.regionFilter
    }
      let instancePriceList = []
      // apply filter
      if (this.state.instancePriceList) {
          for(let i =0;i<this.state.instancePriceList.length;i++) {
              var product = this.state.instancePriceList[i]
              if (filter_region) {
                  if (! product["serviceRegions"].includes(filter_region)) {
                      continue
                  }
              }
              instancePriceList.push(product)
          }
      }

      await this.setState({...this.state, regionFilter:filter_region, instancePriceListFiltered: instancePriceList})
      this.applyMachineListFilter()
  }

  // TODO: move machine pricing  into another libarary  
  /// machineTypeName: n2-highcpu-2
  getSkus(machineTypeName) {

    var series = machineTypeName.split('-').at(0).toLowerCase()
    var custom=false
    if (machineTypeName.toLowerCase().includes("custom")) {
      custom=true
    }

    var matchStandardRam = new RegExp(`^${series} Instance Ram`,'i')
    var matchStandardCpu = new RegExp(`^${series} Instance Core`,'i')

    var matchCustomRam = new RegExp(`^${series} Custom Instance Ram`,'i')
    var matchCustomCpu = new RegExp(`^${series} Custom Instance Core`,'i')

    var matchSSD  = new RegExp(`^SSD backed PD Capacity`,'i')//SSD
    var matchPD  = new RegExp(`^Storage PD Capacity`,'i') //PDStandard

    if (series == 'e2') {
      matchCustomRam = matchStandardRam
      matchCustomCpu = matchStandardCpu
    }

    if (series == 'n1') {
      matchCustomRam = matchStandardRam = new RegExp(`^${series}.+ ram`,'ig')
      matchCustomCpu = matchStandardCpu = new RegExp(`^${series}.+ core`,'ig')
    }

     if (series.includes('2d')) {
      matchStandardRam = new RegExp(`^${series} AMD Instance Ram running`,'i')
      matchStandardCpu = new RegExp(`^${series} AMD Instance Core running`,'i')
      matchCustomRam = new RegExp(`^${series} AMD Custom Instance Ram running`,'i')
      matchCustomCpu = new RegExp(`^${series} AMD Custom Instance Core running`,'i')
     }

    let skus = []
    for(var i in this.state.instancePriceListFiltered) {
        var sku = this.state.instancePriceListFiltered[i]
        var desc = sku['description'].toLowerCase()
        var resourceGroup = sku.category.resourceGroup

        if (resourceGroup == 'PDStandard') {
           if (desc.match(matchPD)) {
            sku['calculatedType'] = 'PD'
            push=true
           }
        } else if (resourceGroup == 'SSD') {
          if (desc.match(matchSSD)) {          
            sku['calculatedType'] = 'SSD'
            push=true
          }
        } else {
          if (series)
            var push =false
            if (custom) {
              if (desc.match(matchCustomCpu)) {
                push=true
                sku['calculatedType'] = 'CPU'
              }
              if (desc.match(matchCustomRam)) {
                push=true
                sku['calculatedType'] = 'RAM'
              }

            } else {
            if (desc.match(matchStandardCpu)) {
                push=true
                sku['calculatedType'] = 'CPU'
              }
              if (desc.match(matchStandardRam)) {
                push=true
                sku['calculatedType'] = 'RAM'
              }        
            }
          }
        
        if(push){
          skus.push(sku)
        }
    }
    return skus
  }

  // TODO: move pricing stuff into another libarary
  
  async loadMachines() {
    var m = new MachineConfig()
    var machines = m.machines()
    await this.setState({...this.state, machineList: machines})
    await this.applyMachineListFilter()
    await this.applyRegionFilter()
  }

  async componentDidMount() {
    // load machine types    
    await this.getPricing()
    await this.loadMachines()
    
  }

  async getPricing() { 
    try 
    {
      let pricingApi = new PricingApi();
      let instancePriceListJson = await pricingApi.GetInstancePriceList()
      this.setState({...this.state, instancePriceList: instancePriceListJson})
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
    instancePriceList = {this.state.instancePriceList}   
    instancePriceListFiltered = {this.state.instancePriceListFiltered}
    machineList = {this.state.machineListFiltered}  
    onInputChanged = {this.handleInputChanged}
    applyRegionFilter = {this.applyRegionFilter}

    pdssd={this.state.ssdpd_filter.recommended}
    pdboot={this.state.pdboot_filter.recommended}
    />
        
      </div>
    );
  }
}
export default App;
