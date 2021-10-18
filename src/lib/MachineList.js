class MachineList {

    machines() {
        let machines = []
        for (var i = 0; i < this._raw.length; i++) {

            var type = this._raw[i][0];
            var vcpus = this._raw[i][1];
            var memory = this._raw[i][2];

            machines.push({
                type: type,
                vcpus: vcpus,
                memory: memory
            })
        }
        machines.sort(this.sortByProperty("vcpus"));
        localStorage.setItem("machines", JSON.stringify(machines))
        return machines;
    }

    sortByProperty(property){  
        return function(a,b){  
           if(a[property] > b[property])  
              return 1;  
           else if(a[property] < b[property])  
              return -1;  
       
           return 0;  
        }  
     }

    _raw = [
        // type, vcpus, memory
        ['c2-standard-16', 16, 64],
        ['c2-standard-30', 30, 120],
        ['c2-standard-4', 4, 6],
        ['c2-standard-60', 60, 240],
        ['c2-standard-8', 8, 32],
        ['e2-highcpu-16', 16, 16],
        ['e2-highcpu-2', 2, 2],
        ['e2-highcpu-32', 32, 32],
        ['e2-highcpu-4', 4, 4],
        ['e2-highcpu-8', 8, 8],
        ['e2-highmem-16', 16, 128],
        ['e2-highmem-2', 2, 16],
        ['e2-highmem-4', 4, 32],
        ['e2-highmem-8', 8, 64],
        ['e2-medium', 2, 4],
        ['e2-micro	', 2, 1],
        ['e2-small	', 2, 2],
        ['e2-standard-16', 16, 64],
        ['e2-standard-2', 2, 8],
        ['e2-standard-32', 32, 128],
        ['e2-standard-4', 4, 16],
        ['e2-standard-8', 8, 32],
        ['f1-micro', 1, 0.6],
        ['g1-small', 1, 1.7],
        ['m1-megamem-96', 96, 1433.6],
        ['m1-ultramem-160', 160, 3844],
        ['m1-ultramem-40', 40, 961],
        ['m1-ultramem-80', 80, 1922],
        ['n1-highcpu-16', 16, 14.4],
        ['n1-highcpu-2', 2, 1.8],
        ['n1-highcpu-32', 32, 28.8],
        ['n1-highcpu-4', 4, 3.6],
        ['n1-highcpu-64', 64, 57.6],
        ['n1-highcpu-8', 8, 7.2],
        ['n1-highcpu-96', 96, 86.4],
        ['n1-highmem-16', 16, 104],
        ['n1-highmem-2', 2, 13],
        ['n1-highmem-32', 32, 208],
        ['n1-highmem-4', 4, 26],
        ['n1-highmem-64', 64, 416],
        ['n1-highmem-8', 8, 52],
        ['n1-highmem-96', 96, 624],
        ['n1-standard-1', 1, 3.75],
        ['n1-standard-16', 16, 60],
        ['n1-standard-2', 2, 7.5],
        ['n1-standard-32', 32, 120],
        ['n1-standard-4', 4, 15],
        ['n1-standard-64', 64, 240],
        ['n1-standard-8', 8, 30],
        ['n1-standard-96', 96, 360],
        ['n2-highcpu-16', 16, 16],
        ['n2-highcpu-2', 2, 2],
        ['n2-highcpu-32', 32, 32],
        ['n2-highcpu-4', 4, 4],
        ['n2-highcpu-48', 48, 48],
        ['n2-highcpu-64', 64, 64],
        ['n2-highcpu-8', 8, 8],
        ['n2-highcpu-80', 80, 80],
        ['n2-highmem-16', 16, 128],
        ['n2-highmem-2', 2, 16],
        ['n2-highmem-32', 32, 256],
        ['n2-highmem-4', 4, 32],
        ['n2-highmem-48', 48, 384],
        ['n2-highmem-64	', 64, 512],
        ['n2-highmem-8', 8, 64],
        ['n2-highmem-80', 80, 640],
        ['n2-standard-16', 16, 64],
        ['n2-standard-2', 2, 8],
        ['n2-standard-32', 32, 128],
        ['n2-standard-4', 4, 16],
        ['n2-standard-48', 48, 192],
        ['n2-standard-64', 64, 256],
        ['n2-standard-8	', 8, 32],
        ['n2-standard-80', 80, 320],
        ['n2d-highcpu-128', 128, 128],
        ['n2d-highcpu-16', 16, 16],
        ['n2d-highcpu-2', 2, 2],
        ['n2d-highcpu-224', 224, 224],
        ['n2d-highcpu-32', 32, 32],
        ['n2d-highcpu-4', 4, 4],
        ['n2d-highcpu-48', 48, 48],
        ['n2d-highcpu-64', 64, 64],
        ['n2d-highcpu-8', 8, 8],
        ['n2d-highcpu-80', 80, 80],
        ['n2d-highcpu-96', 96, 96],
        ['n2d-highmem-16', 16, 128],
        ['n2d-highmem-2', 2, 16],
        ['n2d-highmem-32', 32, 256],
        ['n2d-highmem-4', 4, 32],
        ['n2d-highmem-48', 48, 384],
        ['n2d-highmem-64', 64, 512],
        ['n2d-highmem-8', 8, 64],
        ['n2d-highmem-80', 80, 640],
        ['n2d-highmem-96', 96, 768],
        ['n2d-standard-128', 128, 512],
        ['n2d-standard-16', 16, 64],
        ['n2d-standard-2', 2, 8],
        ['n2d-standard-224', 224, 896],
        ['n2d-standard-32', 32, 128],
        ['n2d-standard-4', 4, 16],
        ['n2d-standard-48', 48, 192],
        ['n2d-standard-64', 64, 256],
        ['n2d-standard-8', 8, 32],
        ['n2d-standard-80', 80, 320],
        ['n2d-standard-96', 96, 384],
    ]
}

export default MachineList