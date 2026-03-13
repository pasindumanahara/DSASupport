const { sortBinarySort, sortMergeSort } = require('./algorithms.js');
binarydata = []
mergedata=[]
for (let i = 0; i < 100; i++) {
    const arr = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 1000));
    data = sortBinarySort(arr);
    binarydata.push(data.time_duration)
    //console.log(data.sorted_array)
    //console.log(data.time_duration)
    const arr1 = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 1000));
    data = sortMergeSort(arr1);
    mergedata.push(data.time_duration)
    //console.log(data.sorted_array)
    //console.log(data.time_duration)   
    
}
