import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createClient} from '@supabase/supabase-js';
import './style.css';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = URL && KEY ? createClient(URL, KEY) : null;
const BRANCHES = ['HN2.VQ1','HN4.ML','HN10.VINS','HN3.VQ2','HN12.MĐ','HN13.LB','HN1.LG','HN9.LĐ','HN6.CG','HN8.NGĐ','HN7.TIMES','HN5.HAPU'];
const CARS = ['🏎️','🚙','🏎️','🚕','🚗','🏎️','🚙','🚕','🏎️','🚗','🚙','🏎️'];
const money = n => new Intl.NumberFormat('vi-VN').format(Number(n||0));
const monthKey = () => new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'}).slice(0,7);
function App(){
 const [session,setSession]=useState(localStorage.getItem('cec_session')||'');
 const [role,setRole]=useState(localStorage.getItem('cec_role')||'');
 const [branch,setBranch]=useState(localStorage.getItem('cec_branch')||'');
 const [pin,setPin]=useState('');
 const [selected,setSelected]=useState(BRANCHES[0]);
 const [target,setTarget]=useState('');
 const [revenue,setRevenue]=useState('');
 const [board,setBoard]=useState([]);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [admin,setAdmin]=useState(false);
 const period=monthKey();
 async function api(action,body={}){
   if(!supabase) throw new Error('Chưa cấu hình Supabase. Xem file README.');
   const {data,error}=await supabase.functions.invoke(action,{body:{...body,session}});
   if(error) throw new Error(error.message||'Lỗi kết nối máy chủ');
   if(data?.error) throw new Error(data.error);
   return data;
 }
 async function login(e){
   e.preventDefault();setBusy(true);setMessage('');
   try{
    const data=await api('login',{pin,branch:selected,admin});
    localStorage.setItem('cec_session',data.session);localStorage.setItem('cec_role',data.role);
    localStorage.setItem('cec_branch',data.branch||'');
    setSession(data.session);setRole(data.role);setBranch(data.branch||'');setPin('');
    setMessage('Đăng nhập thành công!');
   }catch(err){setMessage(err.message)}finally{setBusy(false)}
 }
 function logout(){localStorage.clear();setSession('');setRole('');setBranch('');setBoard([])}
 async function refresh(){
   if(!session)return;
   try{const d=await api('board');setBoard(d.rows||[])}catch(e){setMessage(e.message)}
 }
 useEffect(()=>{if(session){refresh();const t=setInterval(refresh,2500);return()=>clearInterval(t)}},[session]);
 async function submit(e){
   e.preventDefault();setBusy(true);setMessage('');
   try{await api('submit-revenue',{revenue:Number(revenue)});setMessage('Đã cập nhật doanh thu!');setRevenue('');await refresh()}
   catch(e){setMessage(e.message)}finally{setBusy(false)}
 }
 async function saveTarget(e){
   e.preventDefault();setBusy(true);
   try{await api('set-target',{branch:selected,target:Number(target)});setMessage('Đã lưu KPI mục tiêu.');await refresh()}
   catch(e){setMessage(e.message)}finally{setBusy(false)}
 }
 const sorted=useMemo(()=>[...board].sort((a,b)=>Number(b.percent)-Number(a.percent)),[board]);
 if(!session)return <main className="login"><div className="login-card"><div className="eyebrow">CEC EDUCATION PRESENTS</div><h1>🏁 CEC RACE</h1><p>12 BRANCHES · ONE FINISH LINE</p><form onSubmit={login}>
  <label>Đăng nhập với tư cách</label><div className="switch"><button type="button" className={!admin?'active':''} onClick={()=>setAdmin(false)}>Cơ sở</button><button type="button" className={admin?'active':''} onClick={()=>setAdmin(true)}>Quản trị</button></div>
  {!admin&&<><label>Chọn cơ sở</label><select value={selected} onChange={e=>setSelected(e.target.value)}>{BRANCHES.map(b=><option key={b}>{b}</option>)}</select></>}
  <label>Mã PIN</label><input type="password" inputMode="numeric" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Nhập mã PIN" required/>
  <button className="primary" disabled={busy}>{busy?'Đang xác thực...':'VÀO ĐƯỜNG ĐUA →'}</button>
 </form>{message&&<div className="notice">{message}</div>}<small>CEC RACE · THI ĐUA DOANH THU THEO THÁNG</small></div></main>;
 return <main className="app">
  <header><div><div className="eyebrow">CEC EDUCATION · MONTHLY CHALLENGE</div><h1>🏎️ CEC RACE</h1><p>ĐƯỜNG ĐUA 12 CƠ SỞ · {period}</p></div><button className="ghost" onClick={logout}>Đăng xuất</button></header>
  <section className="stats"><div><small>TỔNG KPI</small><b>{money(board.reduce((s,x)=>s+Number(x.target),0))}</b><small>triệu VNĐ</small></div><div><small>DOANH THU</small><b>{money(board.reduce((s,x)=>s+Number(x.revenue),0))}</b><small>triệu VNĐ</small></div><div><small>HOÀN THÀNH</small><b>{(board.reduce((s,x)=>s+Number(x.target),0)?(board.reduce((s,x)=>s+Number(x.revenue),0)/board.reduce((s,x)=>s+Number(x.target),0)*100):0).toFixed(1)}%</b><small>toàn hệ thống</small></div></section>
  {role==='branch'&&<section className="card"><h2>📍 {branch}</h2><p>Cập nhật doanh thu tháng {period} (triệu VNĐ)</p><form className="inline" onSubmit={submit}><input type="number" min="0" step="any" value={revenue} onChange={e=>setRevenue(e.target.value)} placeholder="Nhập doanh thu"/><button className="primary" disabled={busy}>CẬP NHẬT</button></form></section>}
  {role==='admin'&&<section className="card"><h2>⚙️ Thiết lập KPI tháng</h2><form className="inline" onSubmit={saveTarget}><select value={selected} onChange={e=>setSelected(e.target.value)}>{BRANCHES.map(b=><option key={b}>{b}</option>)}</select><input type="number" min="0" step="any" value={target} onChange={e=>setTarget(e.target.value)} placeholder="KPI (triệu VNĐ)"/><button className="primary" disabled={busy}>LƯU KPI</button></form><p className="hint">Mỗi PIN cơ sở chỉ cập nhật được doanh thu của chính cơ sở đó.</p></section>}
  <section className="card"><div className="section-title"><h2>🏁 BẢNG ĐUA LIVE</h2><span className="live">● LIVE · tự làm mới 2,5 giây</span></div>
   {sorted.map((r,i)=><div className="race-row" key={r.branch}><span className="rank">{i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span><div className="race-main"><div className="race-meta"><b>{r.branch}</b><strong>{Number(r.percent).toFixed(1)}%</strong></div><div className="track"><div className="progress" style={{width:`${Math.min(100,Math.max(0,Number(r.percent)))}%`}}></div><span className="car" style={{left:`min(calc(${Math.max(0,Math.min(100,Number(r.percent)))}% - 15px),calc(100% - 27px))`}}>{CARS[BRANCHES.indexOf(r.branch)]||'🏎️'}</span></div><div className="race-meta sub"><span>Doanh thu: {money(r.revenue)} triệu</span><span>KPI: {money(r.target)}</span></div></div></div>)}
   {!sorted.length&&<p className="hint">Chưa có dữ liệu KPI. Quản trị viên hãy thiết lập KPI cho các cơ sở.</p>}
  </section>
  <div className="footer">🏆 CEC RACE · RUN TO THE FINISH LINE <span>{role==='admin'?'ADMINISTRATOR':branch}</span></div>
  {message&&<div className="toast" role="status">{message}</div>}
 </main>
}
createRoot(document.getElementById('root')).render(<App/>);
