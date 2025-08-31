// ===== Helpers =====
    const $ = (id) => document.getElementById(id);
    const st = {
      running:false, stop:false, startAt:0, cmp:0, swp:0,
      structure:'array', variant:'1d', op:'bubble',
      // Arrays
      arr:[], base:[],
      // 2D
      rows:5, cols:6, matrix:[],
      // Linked list
      list:[],
      // Stack & Queue
      stack:[], queue:[],
      // Tree (BST)
      tree:null,
      // Graph
      graph:{nodes:[], edges:[], pos:{}},
    };

    function setStatus(t){ $("status").textContent = t; }
    function setMetrics(){
      $("cmp").textContent = st.cmp; $("swp").textContent = st.swp;
      $("time").textContent = st.startAt ? Math.round(performance.now()-st.startAt) : 0;
    }
    function sleep(ms){ return new Promise(r=> setTimeout(r, ms)); }
    function delay(){ const v=+$("speed").value; return Math.max(10, Math.round(810 - v*8)); }

    // ---------- Generic drawing utilities ----------
    function clearCanvas(){ const el=$("canvas"); el.innerHTML=''; el.removeAttribute('style'); return el; }

    function drawBars(arr, highlights = {}) {
  const wrap = clearCanvas();
  wrap.style.display = 'flex';
  wrap.style.alignItems = 'center';
  wrap.style.justifyContent = 'flex-start';
  wrap.style.gap = '5px'; // smaller gap

  arr.forEach((val, i) => {
    const node = document.createElement('div');
    node.className = 'node';
    node.textContent = val;

    // Highlights for sorting
    if (highlights.compare?.has(i)) node.style.backgroundColor = '#facc15'; // yellow
    if (highlights.swap?.has(i)) node.style.backgroundColor = '#ef4444'; // red
    if (highlights.sorted?.has(i)) node.style.backgroundColor = '#10b981'; // green

    wrap.appendChild(node);

    if (i < arr.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'arrow';
      arrow.textContent = '→';
      wrap.appendChild(arrow);
    }
  });
}
   function drawHNodes(values, activeIdx=-1, foundIdx=-1, type='singly'){
  const wrap = clearCanvas();
  wrap.className = wrap.className; // preserve background
  const box = document.createElement('div');
  box.className = 'hbox';
  wrap.appendChild(box);

  values.forEach((v,i)=>{
    const n = document.createElement('div');
    n.className='node';
    if(i===activeIdx) n.classList.add('active');
    if(i===foundIdx) n.classList.add('found');
    n.textContent = v;
    box.appendChild(n);

    if(i<values.length-1){
      const a = document.createElement('div');
      if(type==='singly'){ a.className='arrow'; a.textContent='→';}
      else if(type==='doubly'){ a.className='arrow'; a.textContent='↔';}
      else if(type==='circular'){ a.className='arrow'; a.textContent='→';}
      box.appendChild(a);
    }
  });

  // Circular: connect last node back to first
  if(type==='circular' && values.length>1){
    const a = document.createElement('div');
    a.className='arrow circular-loop';
    a.textContent='↺'; // loop symbol
    box.appendChild(a);
  }
}
    function drawVStack(values, activeTop = false) {
  const wrap = clearCanvas();
  const box = document.createElement('div');
  box.className = 'vbox';
  wrap.appendChild(box);

  // Reverse the array so the last element appears at the top
  for (let i = values.length - 1; i >= 0; i--) {
    const n = document.createElement('div');
    n.className = 'node';
    n.textContent = values[i];
    
    // Highlight the actual top (last pushed element)
    if (activeTop && i === values.length - 1) {
      n.classList.add('active');
    }

    box.appendChild(n);
  }
}

    function drawQueue(values, activeHead=-1){
  const wrap = clearCanvas();
  const box=document.createElement('div'); box.className='hbox'; wrap.appendChild(box);

  values.forEach((v,i)=>{
    const n=document.createElement('div'); n.className='node'; n.textContent=v;
    if(i===0) n.title='front';
    if(i===values.length-1) n.title='rear';
    if(i===activeHead) n.classList.add('active');
    box.appendChild(n);
    if(i<values.length-1){ const a=document.createElement('div'); a.className='arrow'; a.textContent='→'; box.appendChild(a); }
  });
}


    function svgRoot(){ const el=clearCanvas(); const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('viewBox','0 0 1000 520'); el.appendChild(svg); return svg; }


    async function stepDrawBars({compare=[], swap=[], sorted=[], msg=''}){
      $("stepLog").textContent = msg || '—';
      setMetrics();
      const hi={ compare:new Set(compare), swap:new Set(swap), sorted:new Set(sorted) };
      drawBars(st.arr, hi); await sleep(delay());
    }

    function updateComplexity(map){
      const c = map||{best:'—',avg:'—',worst:'—',space:'—'};
      $("complexity").textContent = `Best: ${c.best} | Avg: ${c.avg} | Worst: ${c.worst} | Space: ${c.space}`;
    }

    // ====== Registry (modules for each structure) ======
    const Modules = {
      array:{
        name:'Array',
        variants:{
          '1d':{
            name:'1D',
            ops:{
          // Quick Sort
          quick: {
            name: 'Quick Sort',
            cx: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
            pseudo: `quickSort(a, low, high)
  if low < high
    pi = partition(a, low, high)
    quickSort(a, low, pi - 1)
    quickSort(a, pi + 1, high)`,
      description: "Quick Sort is a divide-and-conquer algorithm. It selects a pivot element, partitions the array into elements less than and greater than the pivot, then recursively sorts the subarrays. Efficient for large datasets, average time complexity is O(n log n).",

            run: async function () {
              async function partition(low, high) {
                let pivot = st.arr[high];
                let i = low - 1;
                for (let j = low; j < high; j++) {
                  st.cmp++;
                  await stepDrawBars({ compare: [j, high], msg: `compare a[${j}] with pivot a[${high}]` });
                  if (st.arr[j] < pivot) {
                    i++;
                    [st.arr[i], st.arr[j]] = [st.arr[j], st.arr[i]];
                    st.swp++;
                    await stepDrawBars({ swap: [i, j], msg: `swap a[${i}] and a[${j}]` });
                  }
                }
                [st.arr[i + 1], st.arr[high]] = [st.arr[high], st.arr[i + 1]];
                st.swp++;
                await stepDrawBars({ swap: [i + 1, high], msg: `move pivot to position ${i + 1}` });
                return i + 1;
              }

              async function quickSort(low, high) {
                if (low < high) {
                  let pi = await partition(low, high);
                  await quickSort(low, pi - 1);
                  await quickSort(pi + 1, high);
                }
              }

              await quickSort(0, st.arr.length - 1);
              await stepDrawBars({ sorted: [...Array(st.arr.length).keys()], msg: 'sorted' });
            }
          },
              bubble:{name:'Bubble Sort', cx:{best:'O(n)',avg:'O(n²)',worst:'O(n²)',space:'O(1)'}, pseudo:`for i=0..n-2
swapped=false
  for j=0..n-i-2
    if a[j] > a[j+1] swap
  if !swapped break`,
    description: "Bubble Sort repeatedly compares adjacent elements and swaps them if needed. The largest elements 'bubble' to the end of the array each pass.",
 run: async function(){
                const n=st.arr.length;
                for(let i=0;i<n-1;i++){
                  let swapped=false;
                  for(let j=0;j<n-i-1;j++){
                    if(st.stop) return;
                    st.cmp++; await stepDrawBars({compare:[j,j+1], msg:`compare a[${j}] and a[${j+1}]`});
                    if(st.arr[j] > st.arr[j+1]){
                      [st.arr[j],st.arr[j+1]]=[st.arr[j+1],st.arr[j]]; st.swp++;
                      swapped=true; await stepDrawBars({swap:[j,j+1], msg:`swap a[${j}], a[${j+1}]`});
                    }
                  }
                  await stepDrawBars({sorted:[n-1-i], msg:`element ${n-1-i} fixed`});
                  if(!swapped) break;
                }
                await stepDrawBars({sorted:[...Array(n).keys()], msg:'sorted'});
              }},
              insertion:{name:'Insertion Sort', cx:{best:'O(n)',avg:'O(n²)',worst:'O(n²)',space:'O(1)'}, pseudo:`for i=1..n-1
  key=a[i]
  j=i-1
  while j>=0 and a[j]>key
    a[j+1]=a[j]; j--
  a[j+1]=key`,
    description: "Insertion Sort builds a sorted portion of the array one element at a time by inserting each new element into its correct position in the sorted portion.",
 run: async function(){
                const n=st.arr.length; for(let i=1;i<n;i++){
                  let key=st.arr[i]; let j=i-1; $("stepLog").textContent=`key=a[${i}]`;
                  while(j>=0 && st.arr[j]>key){ st.cmp++; await stepDrawBars({compare:[j,j+1]}); st.arr[j+1]=st.arr[j]; st.swp++; await stepDrawBars({swap:[j,j+1], msg:`shift a[${j}] -> a[${j+1}]`}); j--; }
                  st.arr[j+1]=key; st.swp++; await stepDrawBars({swap:[j+1], msg:`insert key at ${j+1}`});
                }
                await stepDrawBars({sorted:[...Array(n).keys()], msg:'sorted'});
              }},
              selection:{name:'Selection Sort', cx:{best:'O(n²)',avg:'O(n²)',worst:'O(n²)',space:'O(1)'}, pseudo:`for i=0..n-2
  min=i
  for j=i+1..n-1
    if a[j]<a[min] min=j
  swap a[i], a[min]`,
    description: "Selection Sort repeatedly selects the smallest element from the unsorted portion and swaps it with the first unsorted element, gradually building a sorted array.",
 run: async function(){
                const n=st.arr.length; for(let i=0;i<n-1;i++){
                  let min=i; for(let j=i+1;j<n;j++){ st.cmp++; await stepDrawBars({compare:[min,j], msg:`compare min=${min} with j=${j}`}); if(st.arr[j]<st.arr[min]) min=j; }
                  if(min!==i){ [st.arr[i],st.arr[min]]=[st.arr[min],st.arr[i]]; st.swp++; await stepDrawBars({swap:[i,min], msg:`swap ${i}<->${min}`}); }
                  await stepDrawBars({sorted:[i], msg:`fix index ${i}`});
                }
                await stepDrawBars({sorted:[...Array(n).keys()], msg:'sorted'});
              }},
            }
          },
        }
    },
      linkedlist: {
  name: 'Linked List',
  variants: {
    singly: {
      name: 'Singly',
      ops: {
        insertHead: {
          name: 'Insert Head',
          cx: { best:'O(1)', avg:'O(1)', worst:'O(1)', space:'O(1)' },
          pseudo: `new.next = head\nhead = new`,
            description: "Inserts a new node at the beginning of the list. The new node becomes the head. Time complexity O(1).",
          run: async function() {
            const x = +$("valueInput").value || Math.floor(Math.random()*99);
            st.list.unshift(x);
            for(let i=0;i<st.list.length;i++){
              drawHNodes(st.list, i, -1, 'singly');
              $("stepLog").textContent = `shift node ${i}`;
              await sleep(delay()/2);
            }
            drawHNodes(st.list, -1, -1, 'singly');
          }
        },
        insertTail: {
          name: 'Insert Tail',
          cx: { best:'O(n)', avg:'O(n)', worst:'O(n)', space:'O(1)' },
          pseudo: `traverse to tail\ntail.next = new`,
            description: "Adds a new node at the end of the list. Requires traversal from head to tail. Time complexity O(n).",

          run: async function() {
            const x = +$("valueInput").value || Math.floor(Math.random()*99);
            st.list.push(x);
            for(let i=0;i<st.list.length;i++){
              drawHNodes(st.list, i, -1, 'singly');
              $("stepLog").textContent = `traverse ${i}`;
              await sleep(delay()/2);
            }
            drawHNodes(st.list, -1, -1, 'singly');
          }
        },
        deleteValue: {
          name: 'Delete Value',
          cx: { best:'O(1)', avg:'O(n)', worst:'O(n)', space:'O(1)' },
          pseudo: `find prev of target\nprev.next = target.next`,
            description: "Deletes the first node with the given value. Traverses the list to find the node. Time complexity O(n) in general.",

          run: async function() {
            const x = +$("valueInput").value || st.list[0];
            for(let i=0;i<st.list.length;i++){
              drawHNodes(st.list, i, -1, 'singly');
              $("stepLog").textContent = `scan idx ${i}`;
              await sleep(delay()/2);
            }
            const idx = st.list.indexOf(x);
            if(idx>=0){ st.list.splice(idx,1); $("stepLog").textContent = `deleted ${x}`; }
            else $("stepLog").textContent = `not found ${x}`;
            drawHNodes(st.list, -1, -1, 'singly');
          }
        },
        search: {
          name: 'Search',
          cx: { best:'O(1)', avg:'O(n)', worst:'O(n)', space:'O(1)' },
          pseudo: `i=0..n-1 if a[i]==x`,
            description: "Searches for a node with the specified value. Traverses nodes sequentially. Average time O(n).",

          run: async function() {
            const x = +$("valueInput").value || st.list[0];
            for(let i=0;i<st.list.length;i++){
              drawHNodes(st.list, i, i, 'singly');
              $("stepLog").textContent = `compare node ${i}`;
              await sleep(delay());
              if(st.list[i]===x){
                drawHNodes(st.list, i, i, 'singly');
                $("stepLog").textContent = `found at ${i}`;
                return;
              }
            }
            $("stepLog").textContent = `not found`;
          }
        }
      }
    },

    doubly: {
      name: 'Doubly',
      ops: {
        insertHead: {
          name: 'Insert Head',
            description: "Adds a new node at the head. Updates next and previous pointers. Time O(1).",

          run: async function() {
            const x = +$("valueInput").value || Math.floor(Math.random()*99);
            st.list.unshift(x);
            drawHNodes(st.list, -1, -1, 'doubly');
            $("stepLog").textContent = `Inserted ${x} at head`;
          }
        },
        insertTail: {
          name: 'Insert Tail',
            description: "Adds a new node at the tail. Updates next and previous pointers. Time O(1) if tail reference exists, otherwise O(n).",

          run: async function() {
            const x = +$("valueInput").value || Math.floor(Math.random()*99);
            st.list.push(x);
            drawHNodes(st.list, -1, -1, 'doubly');
            $("stepLog").textContent = `Inserted ${x} at tail`;
          }
        },
        deleteValue: {
          name: 'Delete Value',
            description: "Removes a node with a given value. Adjusts previous and next pointers. O(n) traversal needed.",

          run: async function() {
            const x = +$("valueInput").value || st.list[0];
            const idx = st.list.indexOf(x);
            if(idx>=0) { st.list.splice(idx,1); $("stepLog").textContent = `Deleted ${x}`; }
            else $("stepLog").textContent = `Not found`;
            drawHNodes(st.list, -1, -1, 'doubly');
          }
        },
        search: {
          name: 'Search',
            description: "Finds a node with the specified value by traversing from head or tail. Average time O(n).",

          run: async function() {
            const x = +$("valueInput").value || st.list[0];
            for(let i=0;i<st.list.length;i++){
              drawHNodes(st.list, i, i, 'doubly');
              $("stepLog").textContent = `Compare node ${i}`;
              await sleep(delay());
              if(st.list[i]===x){ $("stepLog").textContent=`Found at ${i}`; return; }
            }
            $("stepLog").textContent = `Not found`;
          }
        }
      }
    },

    circular: {
      name: 'Circular',
      ops: {
        insertTail: {
          name: 'Insert Tail',
            description: "Inserts a new node at the end. The last node points back to head, maintaining the circular structure. Time O(n).",

          run: async function() {
            const x = +$("valueInput").value || Math.floor(Math.random()*99);
            st.list.push(x);
            drawHNodes(st.list, -1, -1, 'circular');
            $("stepLog").textContent = `Inserted ${x} at tail (circular)`;
          }
        },
        traverse: {
          name: 'Traverse',
            description: "Visits each node starting from head and moving through the circular list once. Useful for printing or inspecting all nodes. Time O(n).",

          run: async function() {
            for(let i=0;i<st.list.length;i++){
              drawHNodes(st.list, i, -1, 'circular');
              $("stepLog").textContent = `Node ${i}`;
              await sleep(delay()/2);
            }
            drawHNodes(st.list, -1, -1, 'circular');
          }
        }
      }
    }
  }
},
      stack:{ name:'Stack', variants:{ basic:{name:'Basic', ops:{
        push:{name:'Push', cx:{best:'O(1)',avg:'O(1)',worst:'O(1)',space:'O(1)'}, pseudo:`stack.push(x)`,
          description: "Adds an element to the top of the stack. Time complexity O(1). Useful for LIFO operations.",
        run: async function(){ const x=+$("valueInput").value||Math.floor(Math.random()*99); st.stack.push(x); drawVStack(st.stack,true); $("stepLog").textContent=`pushed ${x}`; await sleep(delay()); drawVStack(st.stack); }},
        pop:{name:'Pop', cx:{best:'O(1)',avg:'O(1)',worst:'O(1)',space:'O(1)'}, pseudo:`x = stack.pop()`,
          description: "Removes and returns the top element from the stack. Time complexity O(1). Will throw underflow if stack is empty.",
 run: async function(){ if(!st.stack.length){ $("stepLog").textContent='underflow'; return;} drawVStack(st.stack,true); await sleep(delay()); const x=st.stack.pop(); $("stepLog").textContent=`popped ${x}`; drawVStack(st.stack); }}
      }}} },
      queue:{ name:'Queue', variants:{ basic:{name:'Simple', ops:{
        enqueue:{name:'Enqueue', cx:{best:'O(1)',avg:'O(1)',worst:'O(1)',space:'O(1)'}, pseudo:`q[tail]=x; tail++`,
          description: "Adds an element to the end (rear) of the queue. Time complexity O(1). Follows FIFO order.",
 run: async function(){ const x=+$("valueInput").value||Math.floor(Math.random()*99); st.queue.push(x); drawQueue(st.queue, 0); $("stepLog").textContent=`enqueued ${x}`; }},
        dequeue:{name:'Dequeue', cx:{best:'O(1)',avg:'O(1)',worst:'O(1)',space:'O(1)'}, pseudo:`x=q[head]; head++`, 
          description: "Removes and returns the front element from the queue. Time complexity O(1). Will throw underflow if queue is empty.",
run: async function(){ if(!st.queue.length){ $("stepLog").textContent='underflow'; return;} drawQueue(st.queue, 0); await sleep(delay()); const x=st.queue.shift(); $("stepLog").textContent=`dequeued ${x}`; drawQueue(st.queue, 0); }}
      }},
    },
}
};
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-royal");
});
function updateOperationInfo(time, space, desc) {
    document.getElementById("timeComplexity").textContent = `Time Complexity: ${time}`;
    document.getElementById("spaceComplexity").textContent = `Space Complexity: ${space}`;
    document.getElementById("description").textContent = desc;
}

    // ===== Structure-specific helpers =====
    function toggleDatasetControls(){
      const s=$("structure").value, v=$("variant").value;
      const is1D = (s==='array' && v==='1d'); const is2D=(s==='array' && v==='2d');
      $("arrayControls").style.display = is1D ? 'block' : 'none';
      $("matrixControls").style.display = is2D ? 'block' : 'none';
      // value input for structures that use single-value ops
      const needVal = (s==='linkedlist' || s==='stack' || s==='queue');
      $("valueControls").style.display = needVal ? 'block' : 'none';
    }

    function populateVariants(){
      const s = $("structure").value; const vSel=$("variant"); vSel.innerHTML='';
      const variants = Modules[s].variants; for(const key in variants){ const o=document.createElement('option'); o.value=key; o.textContent=variants[key].name; vSel.appendChild(o); }
      populateOps(); toggleDatasetControls();
    }
    function populateOps(){
      const s=$("structure").value; const v=$("variant").value; const opSel=$("operation"); opSel.innerHTML='';
      const ops = Modules[s].variants[v].ops; for(const key in ops){ const o=document.createElement('option'); o.value=key; o.textContent=ops[key].name; opSel.appendChild(o); }
      showPseudoAndCx(); renderWorkspace();
    }
    function showPseudoAndCx(){
  const s=$("structure").value, v=$("variant").value, o=$("operation").value; 
  const spec = Modules[s].variants[v].ops[o];

  const pseudoBox = $("pseudoBox");
  pseudoBox.textContent = spec.pseudo || '(pseudocode)';

  updateComplexity(spec.cx);

  // Add description toggle
  let descBox = $("descriptionBox");
  if(!descBox){
    descBox = document.createElement('div');
    descBox.id = 'descriptionBox';
    descBox.style.marginTop = '10px';
    descBox.style.padding = '8px';
    descBox.style.background = '#111737';
    descBox.style.borderRadius = '8px';
    descBox.style.color = '#fff';
    descBox.style.cursor = 'pointer';
    $("pseudoCard").appendChild(descBox);
  }
  descBox.textContent = 'Click to show explanation';
  descBox.onclick = () => {
    if(descBox.textContent === 'Click to show explanation'){
      descBox.textContent = spec.description || 'No explanation available';
    } else {
      descBox.textContent = 'Click to show explanation';
    }
  }
}


    function resetMetrics(){ st.cmp=0; st.swp=0; st.startAt=0; setMetrics(); }

    // ------- Arrays: dataset & renderers -------
    function generateArray(){
      const size = Math.max(5, Math.min(200, +$("size").value||40));
      st.arr = Array.from({length:size}, ()=> Math.floor(Math.random()*200)+5);
      st.base = st.arr.slice(); resetMetrics(); drawBars(st.arr); setStatus('Ready');
    }
    function shuffleArray(){ for(let i=st.arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [st.arr[i],st.arr[j]]=[st.arr[j],st.arr[i]]; } st.base=st.arr.slice(); resetMetrics(); drawBars(st.arr); }
    function applyManual(){ const t=$("manual").value.trim(); if(!t) return; const a=t.split(/[ ,]+/).map(Number).filter(Number.isFinite); if(!a.length) return alert('Enter numbers separated by space/comma'); st.arr=a.slice(); st.base=a.slice(); resetMetrics(); drawBars(st.arr); }

    function makeMatrix(){ const r=+$("rows").value||5, c=+$("cols").value||6; st.rows=r; st.cols=c; st.matrix = Array.from({length:r},()=> Array.from({length:c},()=> Math.floor(Math.random()*99))); renderMatrix(); }
    function renderMatrix(){ const el=clearCanvas(); el.style.display='grid'; el.style.alignItems='stretch'; el.style.gridTemplateColumns=`repeat(${st.cols}, 1fr)`; el.style.gridAutoRows='minmax(0,1fr)'; el.style.gap='6px';
      st.matrix.forEach((row,ri)=> row.forEach((val,ci)=>{ const cell=document.createElement('div'); cell.textContent=val; cell.style.background='#0e1533'; cell.style.border='1px solid #1f2c62'; cell.style.borderRadius='10px'; cell.style.padding='10px'; cell.style.textAlign='center'; cell.className='mono'; cell.title=`(${ri},${ci}) click to edit`; cell.onclick=()=>{ const nv=prompt(`Value at [${ri},${ci}]`, String(val)); if(nv===null) return; const num=Number(nv); if(Number.isFinite(num)){ st.matrix[ri][ci]=num; renderMatrix(); }}; el.appendChild(cell); })); }
       // ------- Workspace switcher -------
    function renderWorkspace(){
      const s=$("structure").value, v=$("variant").value; if(s==='array' && v==='1d'){ if(!st.arr.length) generateArray(); drawBars(st.arr); }
      else if(s==='array' && v==='2d'){ if(!st.matrix.length) makeMatrix(); else renderMatrix(); }
      else if(s==='linkedlist'){ if(!st.list.length) st.list = [5,9,3]; drawHNodes(st.list); }
      else if(s==='stack'){ drawVStack(st.stack); }
      else if(s==='queue'){ drawQueue(st.queue); }
      else if(s==='tree'){ drawBST(st.tree); }
      else if(s==='graph'){ if(!st.graph.nodes.length) buildRandomGraph(8,0.25); else drawGraph(st.graph); }
      else { const el=clearCanvas(); el.innerHTML = '<div style="margin:auto;opacity:.8">Visualization placeholder</div>'; }
    }

    // ------- Run/Stop/Reset -------
   async function run() {
  if (st.running) return;
  st.running = true; st.stop = false;
  st.startAt = performance.now();
  setMetrics(); setStatus('Running');
  const s = $("structure").value, v = $("variant").value, o = $("operation").value;
  const spec = Modules[s].variants[v].ops[o];
  try {
    await spec.run();  // <-- stop works only if spec.run checks st.stop
    setStatus('Done');
  } catch(err) {
    console.error(err); setStatus('Error');
  } finally {
    st.running = false;
  }
}

function stop() { st.stop = true; setStatus('Stopped'); }
    function reset(){
  st.arr = st.base.slice();
  st.matrix = [];
  st.list = [];
  st.stack = [];
  st.queue = [];
  renderWorkspace();
  resetMetrics();
  setStatus('Ready');
}
    // Export/Import state
    function exportState(){ const data={ structure:$("structure").value, variant:$("variant").value, operation:$("operation").value, arr:st.arr, base:st.base, matrix:st.matrix, rows:st.rows, cols:st.cols, list:st.list, stack:st.stack, queue:st.queue, tree:st.tree, graph:st.graph }; const blob=new Blob([JSON.stringify(data,null,2)], {type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='dsa-studio-state.json'; a.click(); URL.revokeObjectURL(url); }
    function importState(file){ const reader=new FileReader(); reader.onload=e=>{ try{ const data=JSON.parse(e.target.result); $("structure").value=data.structure||'array'; populateVariants(); $("variant").value=data.variant||'1d'; populateOps(); $("operation").value=data.operation||'bubble'; st.arr=data.arr||[]; st.base=data.base||st.arr.slice(); st.matrix=data.matrix||[]; st.rows=data.rows||5; st.cols=data.cols||6; st.list=data.list||[]; st.stack=data.stack||[]; st.queue=data.queue||[]; st.tree=data.tree||null; st.graph=data.graph||{nodes:[],edges:[],pos:{}}; renderWorkspace(); resetMetrics(); setStatus('Loaded'); }catch(err){ alert('Invalid file'); } }; reader.readAsText(file); }

    // Events
    $("structure").addEventListener('change', ()=>{ populateVariants(); });
    $("variant").addEventListener('change', ()=>{ populateOps(); });
    $("operation").addEventListener('change', ()=>{ showPseudoAndCx(); renderWorkspace(); });

    $("gen").addEventListener('click', generateArray);
    $("shuffle").addEventListener('click', shuffleArray);
    $("applyManual").addEventListener('click', applyManual);
    $("mkMatrix").addEventListener('click', makeMatrix);

    $("runBtn").addEventListener('click', run);
    $("stopBtn").addEventListener('click', stop);
    $("resetBtn").addEventListener('click', reset);
    $("saveBtn").addEventListener('click', exportState);
    $("loadBtn").addEventListener('click', ()=> $("loadFile").click());
    $("loadFile").addEventListener('change', (e)=>{ const f=e.target.files[0]; if(f) importState(f); });

    window.addEventListener('resize', ()=>{ const s=$("structure").value, v=$("variant").value; if(s==='array' && v==='1d') drawBars(st.arr); else renderWorkspace(); });

    // Boot
    function initDefaults(){ st.stack=[]; st.queue=[]; st.list=[5,9,3]; st.tree=null; st.graph={nodes:[],edges:[],pos:{}}; }
    populateVariants(); generateArray(); initDefaults(); showPseudoAndCx(); renderWorkspace();