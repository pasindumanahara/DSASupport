

// Data structures

class Node {
  constructor(val) {
    this.val = val
    this.next = null
  }
}

function createNode(element){
    let tmp = new Node(element);
    return tmp;    
}

// reusable parts end

function enqueue(val){
    let tmp = createNode(val)
    if (head == null){
        head = tmp
        tail = tmp
    } else {
        tmp.next = head
        head = tmp
    }
}

function denqueue(){
    if (tail == null){
        // return empty message
    } else {
        tail = tail.next
        // return dequeue message
    }
}

// add all element from a arrar or 
function queue(dataset){
    for (const element of dataset) {
        createNode(element);
    }
}

