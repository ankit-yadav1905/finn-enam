"use client";
import {useEffect,useRef} from 'react';
import {Check,X,SlidersHorizontal} from 'lucide-react';
type Threshold={price:number;volume:number};
export default function PreferencesDialog({threshold,setThreshold,onClose}:{threshold:Threshold;setThreshold:(value:Threshold)=>void;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const last=document.activeElement as HTMLElement|null;dialog.current?.showModal();return ()=>{dialog.current?.close();last?.focus()}},[]);
 function save(){localStorage.setItem('finn-threshold',JSON.stringify(threshold));onClose()}
 return <dialog ref={dialog} className="modal" aria-labelledby="preferences-title" onCancel={onClose} onClick={e=>{if(e.target===dialog.current){const r=dialog.current.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose()}}}>
 <button className="icon-button close" aria-label="Close preferences" onClick={onClose}><X size={20}/></button><div className="dialog-icon"><SlidersHorizontal size={22} aria-hidden="true"/></div><div className="eyebrow">ALERT PREFERENCES</div><h2 id="preferences-title">Your definition of unusual.</h2><p>Choose when daily prices and volume deserve a closer look. Settings are saved on this device.</p>
 <label htmlFor="price-threshold">Daily price movement <strong>±{threshold.price}%</strong></label><input id="price-threshold" type="range" min="1" max="15" step="0.5" value={threshold.price} onChange={e=>setThreshold({...threshold,price:+e.target.value})}/><div className="range-ends"><span>1%</span><span>15%</span></div>
 <label htmlFor="volume-threshold">Volume versus recent average <strong>{threshold.volume}×</strong></label><input id="volume-threshold" type="range" min="1.5" max="5" step="0.5" value={threshold.volume} onChange={e=>setThreshold({...threshold,volume:+e.target.value})}/><div className="range-ends"><span>1.5×</span><span>5×</span></div><p className="table-note">Uses completed end-of-day sessions. Scheduled monitoring has its own saved thresholds.</p><button className="primary" onClick={save}><Check size={17} aria-hidden="true"/>Save preferences</button>
 </dialog>
}
