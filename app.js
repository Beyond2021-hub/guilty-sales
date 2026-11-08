const $=id=>document.getElementById(id);
const key='snack-manager-v1';
let data;
try{data=JSON.parse(localStorage.getItem(key))||{};}catch{data={};}
if(!Array.isArray(data.casts))data.casts=[];
if(!Array.isArray(data.records))data.records=[];
const localToday=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
$('date').value=localToday();$('filterDate').value=localToday();$('month').value=localToday().slice(0,7);
const yen=n=>'¥'+n.toLocaleString('ja-JP');
function save(){localStorage.setItem(key,JSON.stringify(data));render();}
function cell(tr,value){const td=document.createElement('td');td.textContent=String(value);tr.append(td);return td;}
function empty(tbody,count){const tr=document.createElement('tr');const td=cell(tr,'データがありません');td.colSpan=count;td.style.textAlign='center';tbody.append(tr);}
function render(){
 const old=$('cast').value;$('cast').replaceChildren();$('castList').replaceChildren();
 for(const name of data.casts){const o=document.createElement('option');o.value=name;o.textContent=name;$('cast').append(o);const chip=document.createElement('span');chip.className='chip';chip.append(document.createTextNode(name));const del=document.createElement('button');del.type='button';del.textContent='×';del.title='キャストを削除';del.onclick=()=>{if(data.records.some(r=>r.cast===name)){alert('売上記録があるキャストは削除できません。');return;}if(confirm(`${name}を削除しますか？`)){data.casts=data.casts.filter(c=>c!==name);save();}};chip.append(del);$('castList').append(chip);}
 if(data.casts.includes(old))$('cast').value=old;
 const monthly=data.records.filter(r=>r.date.startsWith($('month').value));
 const sum=(rs,k)=>rs.reduce((a,r)=>a+r[k],0);
 $('totalSales').textContent=yen(sum(monthly,'sales'));$('totalGroups').textContent=sum(monthly,'groups');$('totalNominations').textContent=sum(monthly,'nominations');$('totalExtensions').textContent=sum(monthly,'extensions');
 const ranking=$('ranking');ranking.replaceChildren();const grouped=new Map();for(const r of monthly){if(!grouped.has(r.cast))grouped.set(r.cast,[]);grouped.get(r.cast).push(r);}const ordered=[...grouped].sort((a,b)=>sum(b[1],'sales')-sum(a[1],'sales'));ordered.forEach(([name,rs],i)=>{const tr=document.createElement('tr');[i+1,name,sum(rs,'groups'),sum(rs,'nominations'),sum(rs,'extensions'),yen(sum(rs,'sales'))].forEach(v=>cell(tr,v));ranking.append(tr);});if(!ordered.length)empty(ranking,6);
 const daily=$('daily');daily.replaceChildren();const records=data.records.filter(r=>r.date===$('filterDate').value).sort((a,b)=>a.cast.localeCompare(b.cast,'ja'));for(const r of records){const tr=document.createElement('tr');[r.cast,r.groups,r.nominations,r.extensions,yen(r.sales)].forEach(v=>cell(tr,v));const actions=cell(tr,'');const wrap=document.createElement('div');wrap.className='actions';const edit=document.createElement('button');edit.textContent='編集';edit.onclick=()=>{$('date').value=r.date;$('cast').value=r.cast;for(const k of ['groups','nominations','extensions','sales'])$(k).value=r[k];$('salesForm').scrollIntoView({behavior:'smooth'});};const del=document.createElement('button');del.textContent='削除';del.className='danger';del.onclick=()=>{if(confirm(`${r.date} ${r.cast} の記録を削除しますか？`)){data.records=data.records.filter(x=>x!==r);save();}};wrap.append(edit,del);actions.append(wrap);daily.append(tr);}if(!records.length)empty(daily,6);
}
$('castForm').addEventListener('submit',e=>{e.preventDefault();const name=$('castName').value.trim();if(!name)return;if(data.casts.includes(name)){alert('登録済みです');return;}data.casts.push(name);$('castName').value='';save();$('cast').value=name;});
$('salesForm').addEventListener('submit',e=>{e.preventDefault();const date=$('date').value,cast=$('cast').value;if(!date||!data.casts.includes(cast)){alert('日付とキャストを選んでください');return;}const r={date,cast};for(const k of ['groups','nominations','extensions','sales']){const raw=$(k).value;const n=Number(raw);if(raw.trim()===''||!Number.isSafeInteger(n)||n<0){alert('数値は0以上の整数で入力してください');return;}r[k]=n;}const i=data.records.findIndex(x=>x.date===date&&x.cast===cast);if(i>=0){if(!confirm('同じ日付・キャストの記録を上書きしますか？'))return;data.records[i]=r;}else data.records.push(r);$('filterDate').value=date;$('month').value=date.slice(0,7);save();alert('保存しました');});
$('month').addEventListener('change',render);$('filterDate').addEventListener('change',render);
$('export').addEventListener('click',()=>{const rows=[['日付','キャスト','来店組数','指名本数','延長本数','売上金額'],...data.records.sort((a,b)=>a.date.localeCompare(b.date)).map(r=>[r.date,r.cast,r.groups,r.nominations,r.extensions,r.sales])];const csv='\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='snack-sales-'+localToday()+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
render();
