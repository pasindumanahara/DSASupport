// more precession time
const { performance } = require('perf_hooks');

// binary sort
function sortBinarySort(arr) {
    const start_time = performance.now()
    for (let i = 0; i < arr.length; i++) {
        for (let y = 0; y < arr.length - i - 1; y++) {
            if (arr[y] > arr[y + 1]) {
                let tmp = arr[y]
                arr[y] = arr[y + 1]
                arr[y + 1] = tmp
            }
        }
    }
    const end_time = performance.now();
    const data = {
        "sorted_array": arr,
        "time_duration": end_time - start_time
    };
    return data;
}

// merge sort
// TODO :: write code foe merge sort
function merge(arr, l, m, u) {
    const leftArray = arr.slice(l, m + 1);
    const rightArray = arr.slice(m + 1, u + 1);

    let i = 0;
    let j = 0;
    let k = l;

    while (i < leftArray.length && j < rightArray.length) {
        if (leftArray[i] <= rightArray[j]) {
            arr[k] = leftArray[i];
            i++;
        } else {
            arr[k] = rightArray[j];
            j++;
        }
        k++;
    }

    while (i < leftArray.length) {
        arr[k] = leftArray[i];
        i++;
        k++;
    }

    while (j < rightArray.length) {
        arr[k] = rightArray[j];
        j++;
        k++;
    }
}

function mergeSort(arr, l, u) {
    if (l<u){
        let m = Math.floor((l + u) / 2);
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, u);
        merge(arr, l, m, u);
    } 
}

function sortMergeSort(arr){
    const start_time = performance.now();
    mergeSort(arr, 0, arr.length-1)
    const end_time = performance.now()

    const data = {
        "sorted_array": arr,
        "time_duration": end_time-start_time
    }
    return data
}

// insertion sort
function sortInsertion(data) {

}

module.exports = { sortBinarySort, sortMergeSort }