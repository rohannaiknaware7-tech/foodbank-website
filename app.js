const $=s=>document.querySelector(s);
const today=new Date();today.setHours(0,0,0,0);
const dateOffset=n=>{let d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const seedItems=[
{id:1,name:"Seasonal tomatoes",category:"Produce",quantity:8,unit:"kg",expiry:dateOffset(1),donatable:true},
{id:2,name:"Whole wheat bread",category:"Bakery",quantity:14,unit:"items",expiry:dateOffset(3),donatable:true},
{id:3,name:"Fresh milk",category:"Dairy",quantity:6,unit:"litres",expiry:dateOffset(6),donatable:false},
{id:4,name:"Cooked rice portions",category:"Prepared meals",quantity:20,unit:"portions",expiry:dateOffset(0),donatable:true}
];
const seedDonations=[
{id:101,name:"Freshly baked bread",quantity:12,unit:"kg",location:"Green Street Community Kitchen",pickup:dateOffset(1),contact:"",claimed:false},
{id:102,name:"Seasonal vegetables",quantity:18,unit:"kg",location:"Harvest Hub, Central area",pickup:dateOffset(2),contact:"",claimed:false}
];
let items=load("hl-items",seedItems),donations=load("hl-donations",seedDonations),rescued=Number(localStorage.getItem("hl-rescued")||0),editId=null;
function load(k,f){try{return JSON.parse(localStorage.getItem(k))||structuredClone(f)}catch{return structuredClone(f)}}
function save(){localStorage.setItem("hl-items",JSON.stringify(items));localStorage.setItem("hl-donations",JSON.stringify(donations));localStorage.setItem("hl-rescued",rescued)}
function daysLeft(date){return Math.ceil((new Date(date+"T00:00:00")-today)/86400000)}
function status(item){let d=daysLeft(item.expiry);return d<0?["Expired","danger"]:d<=3?["Expiring soon","warning"]:["Fresh",""]}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function emoji(cat){return ({Produce:"🥬",Bakery:"🥖",Dairy:"🥛","Prepared meals":"🍱",Pantry:"🥫",Other:"📦"})[cat]||"🥗"}
function render(){
 const soon=items.filter(x=>daysLeft(x.expiry)>=0&&daysLeft(x.expiry)<=3).length;
 $("#totalItems").textContent=items.length;$("#expiringCount").textContent=soon;$("#rescuedCount").innerHTML=`${rescued} <small>kg</small>`;$("#impactKg").textContent=rescued+" kg";
 let query=$("#search").value.toLowerCase(),filter=$("#filter").value;
 let filtered=items.filter(x=>(x.name+" "+x.category).toLowerCase().includes(query));
 filtered=filtered.filter(x=>filter==="all"||(filter==="soon"&&daysLeft(x.expiry)>=0&&daysLeft(x.expiry)<=3)||(filter==="expired"&&daysLeft(x.expiry)<0)||(filter==="available"&&x.donatable));
 $("#inventoryRows").innerHTML=filtered.map(x=>{let [label,cls]=status(x),d=daysLeft(x.expiry),dateLabel=d<0?`${Math.abs(d)} day${d===-1?"":"s"} ago`:d===0?"Today":d===1?"Tomorrow":`In ${d} days`;return `<tr><td><div class="food-name"><span class="food-emoji">${emoji(x.category)}</span><span>${esc(x.name)}<small style="display:block;color:#8a958d;font-weight:400;margin-top:3px">${esc(x.category)}</small></span></div></td><td>${x.quantity} ${esc(x.unit)}</td><td>${new Date(x.expiry+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</td><td><span class="pill ${cls}">${label} · ${dateLabel}</span></td><td><div class="actions"><button class="mini" data-edit="${x.id}">Edit</button><button class="mini" data-donate="${x.id}">Donate</button><button class="mini" data-delete="${x.id}" aria-label="Delete ${esc(x.name)}">×</button></div></td></tr>`}).join("");
 $("#emptyInventory").hidden=filtered.length>0;
 $("#donationCards").innerHTML=donations.length?donations.map(x=>`<article class="donation-card"><div class="card-top"><span class="card-emoji">🥗</span><span class="pill ${x.claimed?"neutral":""}">${x.claimed?"Claimed":"Available"}</span></div><h3>${esc(x.name)}</h3><p>${x.quantity} ${esc(x.unit)} available for community pickup.</p><div class="card-meta"><span>📍 ${esc(x.location)}</span><span>◷ Pickup by ${new Date(x.pickup+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span></div>${x.claimed?'<button class="outline" disabled>Claimed by partner</button>':`<button class="primary" data-claim="${x.id}">Claim donation</button>`}</article>`).join(""):`<div class="empty">No surplus listings yet. Add a listing to connect food with a community partner.</div>`;
 save();
}
function openFood(id){editId=id||null;let f=$("#foodForm");f.reset();$("#foodModalTitle").textContent=id?"Edit food item":"Add food item";if(id){let x=items.find(a=>a.id===id);for(let k of ["name","category","quantity","unit"])f.elements[k].value=x[k];f.elements.expiry.value=x.expiry;f.elements.donatable.checked=x.donatable;f.elements.id.value=id}else{f.elements.expiry.value=dateOffset(3);f.elements.donatable.checked=true}$("#foodDialog").showModal()}
function closeDialog(d){d.close()}
["#addFoodTop","#heroAdd","#addFood"].forEach(s=>$(s).addEventListener("click",()=>openFood()));
$("#foodForm").addEventListener("submit",e=>{e.preventDefault();let f=e.currentTarget,x={id:editId||Date.now(),name:f.elements.name.value.trim(),category:f.elements.category.value,quantity:Number(f.elements.quantity.value),unit:f.elements.unit.value,expiry:f.elements.expiry.value,donatable:f.elements.donatable.checked};if(!x.name||x.quantity<=0||!x.expiry)return;if(editId)items=items.map(a=>a.id===editId?x:a);else items.unshift(x);closeDialog($("#foodDialog"));render();toast(editId?"Food item updated":"Food item added")});
$("#inventoryRows").addEventListener("click",e=>{let b=e.target.closest("button");if(!b)return;let id=Number(b.dataset.edit||b.dataset.donate||b.dataset.delete),x=items.find(a=>a.id===id);if(b.dataset.edit)openFood(id);if(b.dataset.delete&&confirm(`Delete ${x.name}?`)){items=items.filter(a=>a.id!==id);render();toast("Item deleted")}if(b.dataset.donate){if(!x.donatable){toast("Mark this item as available for donation first");return}if(confirm(`Record ${x.quantity} ${x.unit} of ${x.name} as donated?`)){if(x.unit==="kg")rescued+=x.quantity;items=items.filter(a=>a.id!==id);render();toast("Donation recorded — thank you! 🌱")}}});
$("#search").addEventListener("input",render);$("#filter").addEventListener("change",render);
$("#addDonation").addEventListener("click",()=>{$("#donationForm").reset();$("#donationForm").elements.pickup.value=dateOffset(1);$("#donationDialog").showModal()});
$("#donationForm").addEventListener("submit",e=>{e.preventDefault();let f=e.currentTarget;donations.unshift({id:Date.now(),name:f.elements.name.value.trim(),quantity:Number(f.elements.quantity.value),unit:f.elements.unit.value,location:f.elements.location.value.trim(),pickup:f.elements.pickup.value,contact:f.elements.contact.value.trim(),claimed:false});closeDialog($("#donationDialog"));render();toast("Surplus listing published")});
$("#donationCards").addEventListener("click",e=>{let b=e.target.closest("[data-claim]");if(!b)return;let x=donations.find(a=>a.id===Number(b.dataset.claim));if(confirm(`Claim ${x.name} for pickup at ${x.location}?`)){x.claimed=true;render();toast("Donation claimed. Please coordinate pickup with the donor.")}});
$("#closeFood").onclick=$("#cancelFood").onclick=()=>closeDialog($("#foodDialog"));$("#closeDonation").onclick=$("#cancelDonation").onclick=()=>closeDialog($("#donationDialog"));
$("#resetDemo").addEventListener("click",()=>{if(confirm("Reset all food items, listings and impact totals to demo data?")){items=structuredClone(seedItems);donations=structuredClone(seedDonations);rescued=0;render();toast("Demo data reset")}});
let toastTimer;function toast(msg){let t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2800)}
render();