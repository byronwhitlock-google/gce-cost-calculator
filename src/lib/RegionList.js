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

class RegionList {

    regions() {
        let regions = this.regionsFull()
        let regionMap = []
        
        for(var i =0;i<regions.length;i++){
            
            let region_id = regions[i].id.slice(0,-2)
            let region_name = regions[i].name

            regionMap[region_id]={id: region_id, name:region_name}
        }
        let allRegions = []
        for (var id in regionMap){
            allRegions.push(regionMap[id])
        }
        return allRegions /// i hate js ^^^
    }
    regionsFull(){
        var regions = []
        for(var i=0;i<this._raw.length;i++) {
            
            var region = this._raw[i][0];
            var name = this._raw[i][1];
            var machineTypes = this._raw[i][2];
                      

            regions.push({
                id: region,
                name: name,
                machineTypes: machineTypes ? machineTypes.length ? machineTypes.split(',') : [] : [] // don't get confused sweetie ;-* 
            })
        }
        return regions;
    }
    //copy paste from https://cloud.google.com/compute/docs/regions-zones#available
    // TODO:  these need to be pulled dynamically!!!!
    _raw = 
    [
        ['asia-east1-a', 'Changhua County, Taiwan, APAC', 'E2, N2, N2D, N1, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
        ['asia-east1-b', 'Changhua County, Taiwan, APAC', 'E2, N2, N2D, N1, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['asia-east1-c', 'Changhua County, Taiwan, APAC', 'E2, N2, N2D, N1, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['asia-east2-a', 'Hong Kong, APAC', 'E2, N2, N2D, N1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome'],
['asia-east2-b', 'Hong Kong, APAC', 'E2, N2, N2D, N1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome'],
['asia-east2-c', 'Hong Kong, APAC', 'E2, N2, N2D, N1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome'],
['asia-northeast1-a', 'Tokyo, Japan, APAC', 'E2, N2, N2D, N1, M1, M2, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['asia-northeast1-b', 'Tokyo, Japan, APAC', 'E2, N2, N2D, N1, M1, M2, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome'],
['asia-northeast1-c', 'Tokyo, Japan, APAC', 'E2, N2, N2D, N1, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['asia-northeast2-a', 'Osaka, Japan, APAC', 'E2, N1, N2, N2D, M1, C2', 'Ivy Bridge, Sandy Bridge, Broadwell, Skylake, , Cascade Lake, AMD EPYC Rome'],
['asia-northeast2-b', 'Osaka, Japan, APAC', 'E2, N1, N2, N2D, M1, M2', 'Ivy Bridge, Sandy Bridge, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome'],
['asia-northeast2-c', 'Osaka, Japan, APAC', 'E2, N2, N2D, N1, M2', 'Ivy Bridge, Sandy Bridge, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome'],
['asia-northeast3-a', 'Seoul, South Korea, APAC', 'E2, N2, N1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake'],
['asia-northeast3-b', 'Seoul, South Korea, APAC', 'E2, N2, N1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake', 'GPUs'],
['asia-northeast3-c', 'Seoul, South Korea, APAC', 'E2, N2, N1, C2', 'Ivy Bridge, Sandy Bridge, Broadwell, Skylake, Cascade Lake', 'GPUs'],
['asia-south1-a', 'Mumbai, India APAC', 'E2, N2, N1, M2, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake', 'GPUs'],
['asia-south1-b', 'Mumbai, India APAC', 'E2, N2, N1, M2, M1', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake', 'GPUs'],
['asia-south1-c', 'Mumbai, India APAC', 'E2, N1, M1', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake'],
['asia-south2-a'],
['asia-south2-b'],
['asia-south2-c', 'Delhi, India APAC', 'E2, N1, N2, C2', 'Haswell, Broadwell, Skylake, Cascade Lake'],
['asia-southeast1-a'],
['asia-southeast1-b', 'Jurong West, Singapore, APAC', 'E2, N2, N2D, N1, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['asia-southeast1-c', 'Jurong West, Singapore, APAC', 'E2, N2, N2D, N1, M1, C2, A2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['asia-southeast2-a', 'Jakarta, Indonesia, APAC', 'E2, N2, N1, M1', 'Ivy Bridge, Haswell, Broadwell, Skylake, Cascade Lake', 'GPUs'],
['asia-southeast2-b', 'Jakarta, Indonesia, APAC', 'E2, N2, N1', 'Ivy Bridge, Haswell, Broadwell, Skylake, Cascade Lake', 'GPUs'],
['asia-southeast2-c', 'Jakarta, Indonesia, APAC', 'E2, N2, N1, M1', 'Ivy Bridge, Haswell, Broadwell, Skylake, Cascade Lake', 'GPUs'],
['australia-southeast1-a', 'Sydney, Australia, APAC', 'E2, N2, N1, C2, M1, M2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake'],
['australia-southeast1-b', 'Sydney, Australia, APAC', 'E2, N2, N1, C2, M1, M2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake', 'GPUs'],
['australia-southeast1-c', 'Sydney, Australia, APAC', 'E2, N2, N1, C2, M1, M2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake', 'GPUs'],
['australia-southeast2-a', 'Melbourne, Australia, APAC', 'E2, N1, N2', 'Haswell, Broadwell, Skylake, Cascade Lake'],
['australia-southeast2-b'],
['australia-southeast2-c', 'Melbourne, Australia, APAC', 'E2, N1, N2, M1', 'Haswell, Broadwell, Skylake, Cascade Lake'],
['europe-central2-a'],
['europe-central2-b'],
['europe-central2-c', 'Warsaw, Poland, Europe', 'E2, N2, N1', 'Haswell, Broadwell, Skylake, Cascade Lake'],
['europe-north1-a', 'Hamina, Finland, Europe', 'E2, N2, N2D, N1, C2', 'Ivy Bridge, Sandy Bridge, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome'],
['europe-north1-b', 'Hamina, Finland, Europe', 'E2, N2, N2D, N1, C2', 'Ivy Bridge, Sandy Bridge, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome'],
['europe-north1-c', 'Hamina, Finland, Europe', 'E2, N2, N2D, N1, C2', 'Ivy Bridge, Sandy Bridge, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome'],
['europe-west1-b', 'St. Ghislain, Belgium, Europe', 'E2, N2, N2D, N1, M1, M2, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['europe-west1-c', 'St. Ghislain, Belgium, Europe', 'E2, N2, N2D, N1, M2, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['europe-west1-d', 'St. Ghislain, Belgium, Europe', 'E2, N2, N2D, N1, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome,', 'GPUs'],
['europe-west2-a', 'London, England, Europe', 'E2, N2, N2D, N1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['europe-west2-b', 'London, England, Europe', 'E2, N2, N2D, N1, M1, M2, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['europe-west2-c', 'London, England, Europe', 'E2, N2, N2D, N1, M1, M2, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome'],
['europe-west3-a', 'Frankfurt, Germany Europe', 'E2, N2, N2D, N1, M1, M2, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome'],
['europe-west3-b', 'Frankfurt, Germany Europe', 'E2, N2, N2D, N1, M1, M2, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['europe-west3-c', 'Frankfurt, Germany Europe', 'E2, N2, N2D, N1, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome'],
['europe-west4-a', 'Eemshaven, Netherlands, Europe', 'E2, N2, N2D, N1, C2, A2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['europe-west4-b', 'Eemshaven, Netherlands, Europe', 'E2, N2, N2D, N1, M2, M1, C2, A2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['europe-west4-c', 'Eemshaven, Netherlands, Europe', 'E2, N2, N2D, N1, M2, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['europe-west6-a'],
['europe-west6-b'],
['europe-west6-c', 'Zurich, Switzerland, Europe', 'E2, N2, N1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake'],
['northamerica-northeast1-a', 'Montréal, Québec, North America', 'E2, N2, N2D, N1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['northamerica-northeast1-b', 'Montréal, Québec, North America', 'E2, N2, N2D, N1, M1, M2, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['northamerica-northeast1-c', 'Montréal, Québec, North America', 'E2, N2, N2D, N1, M1, M2, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['northamerica-northeast2-a', 'Toronto, Ontario, North America', 'E2, N2, N1', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake'],
['northamerica-northeast2-b', 'Toronto, Ontario, North America', 'E2, N2, N1', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake'],
['northamerica-northeast2-c', 'Toronto, Ontario, North America', 'E2, N2, N1', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake'],
['southamerica-east1-a', 'Osasco, São Paulo, Brazil, South America', 'E2, N2, N1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake'],
['southamerica-east1-b', 'Osasco, São Paulo, Brazil, South America', 'E2, N2, N1, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake'],
['southamerica-east1-c', 'Osasco, São Paulo, Brazil, South America', 'E2, N2, N1, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake', 'GPUs'],
['us-central1-a', 'Council Bluffs, Iowa, North America', 'E2, N2, N2D, N1, M1, C2, A2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['us-central1-b', 'Council Bluffs, Iowa, North America', 'E2, N2, N2D, N1, M2, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['us-central1-c', 'Council Bluffs, Iowa, North America', 'E2, N2, N2D, N1, M2, M1, C2, A2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['us-central1-f', 'Council Bluffs, Iowa, North America', 'E2, N2, N2D, N1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['us-east1-b', 'Moncks Corner, South Carolina, North America', 'E2, N2, N2D, N1, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['us-east1-c', 'Moncks Corner, South Carolina, North America', 'E2, N2, N2D, N1, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['us-east1-d', 'Moncks Corner, South Carolina, North America', 'E2, N2, N2D, N1, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['us-east4-a', 'Ashburn, Virginia, North America', 'E2, N2, N2D, N1, M2, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['us-east4-b', 'Ashburn, Virginia, North America', 'E2, N2, N2D, N1, M2, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['us-east4-c', 'Ashburn, Virginia, North America', 'E2, N2, N2D, N1, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['us-west1-a', 'The Dalles, Oregon, North America', 'E2, N2, N2D, N1, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['us-west1-b', 'The Dalles, Oregon, North America', 'E2, N2, N2D, N1, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['us-west1-c', 'The Dalles, Oregon, North America', 'E2, N2, N2D, N1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome'],
['us-west2-a', 'Los Angeles, California, North America', 'E2, N1, M2, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake'],
['us-west2-b', 'Los Angeles, California, North America', 'E2, N1, C2, M1', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake', 'GPUs'],
['us-west2-c', 'Los Angeles, California, North America', 'E2, N1, M2, M1, C2', 'Ivy Bridge, Sandy Bridge, Haswell, Broadwell, Skylake, Cascade Lake', 'GPUs'],
['us-west3-a'],
['us-west3-b'],
['us-west3-c', 'Salt Lake City, Utah, North America', 'E2, N1, C2', 'Ivy Bridge, Sandy Bridge, Broadwell, Skylake, Cascade Lake'],
['us-west4-a', 'Las Vegas, Nevada, North America', 'E2, N2, N2D, N1, M2, M1', 'Ivy Bridge, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['us-west4-b', 'Las Vegas, Nevada, North America', 'E2, N2, N2D, N1, M1', 'Ivy Bridge, Broadwell, Skylake, Cascade Lake, AMD EPYC Rome', 'GPUs'],
['us-west4-c', 'Las Vegas, Nevada, North America', 'E2, N2, N1', 'Ivy Bridge, Broadwell, Skylake, Cascade Lake']
    ]

}
export default RegionList