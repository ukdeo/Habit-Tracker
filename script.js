// ── Particles ──
(function(){
  const c=document.getElementById('particleCanvas'),ctx=c.getContext('2d');let nodes=[];
  function resize(){c.width=window.innerWidth;c.height=window.innerHeight;}
  function init(){resize();nodes=[];const n=Math.floor((c.width*c.height)/18000);for(let i=0;i<n;i++)nodes.push({x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.5,r:Math.random()*1.8+.8});}
  function draw(){ctx.clearRect(0,0,c.width,c.height);nodes.forEach(n=>{n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>c.width)n.vx*=-1;if(n.y<0||n.y>c.height)n.vy*=-1;ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fillStyle='rgba(0,240,255,.7)';ctx.fill();});for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const dx=nodes[i].x-nodes[j].x,dy=nodes[i].y-nodes[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<140){ctx.beginPath();ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);ctx.strokeStyle=`rgba(0,240,255,${.18*(1-d/140)})`;ctx.lineWidth=.6;ctx.stroke();}}requestAnimationFrame(draw);}
  window.addEventListener('resize',init);init();draw();
})();

// ── Helpers ──
const today=()=>new Date().toISOString().split('T')[0];
const daysAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().split('T')[0];};
const esc=s=>{const d=document.createElement('div');d.textContent=s;return d.innerHTML;};
const CAT={health:{label:'Health',icon:'💪',cls:'cat-health'},mind:{label:'Mindfulness',icon:'🧘',cls:'cat-mind'},productivity:{label:'Productivity',icon:'⚡',cls:'cat-productivity'},learning:{label:'Learning',icon:'📚',cls:'cat-learning'},social:{label:'Social',icon:'🤝',cls:'cat-social'},finance:{label:'Finance',icon:'💰',cls:'cat-finance'}};
const DIFF={easy:'😊 Easy',medium:'💪 Med',hard:'🔥 Hard'};

// ── DB ──
const DB={
  load(){try{this.habits=JSON.parse(localStorage.getItem('nh_h')||'[]');this.logs=JSON.parse(localStorage.getItem('nh_l')||'[]');}catch(e){this.habits=[];this.logs=[];}},
  save(){localStorage.setItem('nh_h',JSON.stringify(this.habits));localStorage.setItem('nh_l',JSON.stringify(this.logs));},
  addHabit(e){e.preventDefault();const name=document.getElementById('fName').value.trim();if(!name)return;this.habits.push({id:Date.now(),name,desc:document.getElementById('fDesc').value.trim(),cat:document.getElementById('fCat').value,diff:document.getElementById('fDiff').value,time:document.getElementById('fTime').value,goal:document.getElementById('fGoal').value,created:today()});this.save();UI.closeModal();UI.toast('Habit initialized ✦','success');UI.refresh();},
  del(id){this.habits=this.habits.filter(h=>h.id!==id);this.logs=this.logs.filter(l=>l.hid!==id);this.save();UI.toast('Habit removed','error');UI.refresh();},
  toggle(id){const t=today(),idx=this.logs.findIndex(l=>l.hid===id&&l.date===t);if(idx>=0)this.logs[idx].done=!this.logs[idx].done;else this.logs.push({id:Date.now(),hid:id,date:t,done:true});this.save();UI.refresh();},
  isDone(id,date){const l=this.logs.find(l=>l.hid===id&&l.date===date);return!!(l&&l.done);},
  streak(id){let s=0,d=new Date();while(true){const ds=d.toISOString().split('T')[0];if(this.isDone(id,ds)){s++;d.setDate(d.getDate()-1);}else break;}return s;},
  bestStreak(id){const dates=this.logs.filter(l=>l.hid===id&&l.done).map(l=>l.date).sort();if(!dates.length)return 0;let best=1,cur=1;for(let i=1;i<dates.length;i++){const diff=(new Date(dates[i])-new Date(dates[i-1]))/(864e5);if(diff===1){cur++;best=Math.max(best,cur);}else cur=1;}return best;},
  doneOn(date){return this.habits.filter(h=>this.isDone(h.id,date)).length;},
  totalStreak(){let s=0,d=new Date();while(true){const ds=d.toISOString().split('T')[0],dn=this.doneOn(ds);if(dn>0&&dn>=this.habits.length){s++;d.setDate(d.getDate()-1);}else break;}return s;},
  perfDays(){if(!this.habits.length)return 0;const all=[...new Set(this.logs.map(l=>l.date))];return all.filter(d=>this.doneOn(d)>=this.habits.length).length;},
  weeklyRate(){if(!this.habits.length)return 0;let tot=0;for(let i=0;i<7;i++)tot+=this.doneOn(daysAgo(i));return Math.round(tot/(this.habits.length*7)*100);},
  rateFor(date){if(!this.habits.length)return 0;return Math.round(this.doneOn(date)/this.habits.length*100);}
};

// ── UI ──
const UI={
  view:'dashboard',filter:'all',
  init(){DB.load();document.getElementById('dateStr').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});this.refresh();},
  goTo(v){document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));document.getElementById('view-'+v)?.classList.add('active');document.querySelector(`[data-view="${v}"]`)?.classList.add('active');this.view=v;this.refresh();},
  refresh(){this.updateSidebar();switch(this.view){case'dashboard':this.renderDash();break;case'habits':this.renderHabits();break;case'analytics':this.renderAnalytics();break;case'insights':this.renderInsights();break;case'timeline':this.renderTimeline();break;}},
  updateSidebar(){document.getElementById('navCount').textContent=DB.habits.length;const p=DB.habits.length?Math.round(DB.doneOn(today())/DB.habits.length*100):0;document.getElementById('navProg').textContent=p+'%';document.getElementById('sideStreak').textContent=DB.totalStreak();},

  renderDash(){
    const t=today();
    document.getElementById('doneToday').textContent=DB.doneOn(t);
    document.getElementById('totalH').textContent=DB.habits.length;
    document.getElementById('weekRate').textContent=DB.weeklyRate()+'%';
    document.getElementById('perfDays').textContent=DB.perfDays();
    const prev=DB.doneOn(daysAgo(1)),curr=DB.doneOn(t);
    document.getElementById('deltaTxt').textContent=curr>prev?`↑ ${curr-prev} more than yesterday`:curr<prev?`↓ ${prev-curr} fewer than yesterday`:'Same as yesterday';
    const p=DB.habits.length?Math.round(curr/DB.habits.length*100):0;
    document.getElementById('ringFill').style.strokeDashoffset=163-(p/100)*163;
    document.getElementById('ringPct').textContent=p+'%';
    const el=document.getElementById('todayList');
    if(!DB.habits.length){el.innerHTML=`<div class="empty"><span class="empty-glyph">🚀</span><h3>No habits yet</h3><p>Create your first habit</p><button class="btn btn-cyan" onclick="UI.openModal()">➕ Create First Habit</button></div>`;}
    else el.innerHTML=DB.habits.map(h=>this.rowHTML(h)).join('');
    document.getElementById('dashInsights').innerHTML=this.buildInsights().slice(0,3).map(i=>`<div class="ai-tile"><div class="ai-ico">${i.icon}</div><div><div class="ai-title">${i.title}</div><div class="ai-desc">${i.desc}</div></div></div>`).join('');
  },

  rowHTML(h){
    const done=DB.isDone(h.id,today()),streak=DB.streak(h.id),cat=CAT[h.cat]||CAT.health;
    return`<div class="habit-row${done?' done':''}"><div class="hcheck${done?' checked':''}" onclick="DB.toggle(${h.id})"></div><div class="habit-body"><div class="habit-name">${esc(h.name)}</div><div class="habit-tags"><span class="htag ${cat.cls}">${cat.icon} ${cat.label}</span>${h.time?`<span class="htag">⏰ ${h.time}</span>`:''}<span class="htag">${DIFF[h.diff]||''}</span></div></div>${streak>0?`<div class="habit-streak">🔥 ${streak}d</div>`:''}<button class="del-btn" onclick="DB.del(${h.id})" title="Delete">✕</button></div>`;
  },

  renderHabits(){
    const search=(document.getElementById('searchInput')?.value||'').toLowerCase();
    let list=DB.habits;
    if(search)list=list.filter(h=>h.name.toLowerCase().includes(search));
    if(this.filter==='done')list=list.filter(h=>DB.isDone(h.id,today()));
    if(this.filter==='pending')list=list.filter(h=>!DB.isDone(h.id,today()));
    const el=document.getElementById('habitLibrary');
    if(!list.length){el.innerHTML=`<div class="empty"><span class="empty-glyph">📂</span><h3>${DB.habits.length?'No matches':'Habit library is empty'}</h3><p>${DB.habits.length?'Try a different filter':'Start tracking by creating a habit'}</p>${!DB.habits.length?`<button class="btn btn-cyan" onclick="UI.openModal()">➕ Create Habit</button>`:''}</div>`;}
    else el.innerHTML=list.map(h=>this.rowHTML(h)).join('');
  },
  setFilter(f,btn){this.filter=f;document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');this.renderHabits();},

  renderAnalytics(){this.renderTrend();this.renderCat();this.renderHeatmap();},
  renderTrend(){
    const canvas=document.getElementById('trendCanvas');if(!canvas)return;
    const ctx=canvas.getContext('2d');canvas.width=canvas.offsetWidth||500;canvas.height=200;
    const W=canvas.width,H=canvas.height,pad=40,data=Array.from({length:30},(_,i)=>DB.rateFor(daysAgo(29-i)));
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<=4;i++){const y=pad+(H-pad*2)/4*i;ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(W-pad,y);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.3)';ctx.font='10px Space Grotesk';ctx.textAlign='right';ctx.fillText((100-i*25)+'%',pad-6,y+4);}
    const step=(W-pad*2)/(data.length-1);
    const grad=ctx.createLinearGradient(0,pad,0,H-pad);grad.addColorStop(0,'rgba(0,240,255,.25)');grad.addColorStop(1,'rgba(0,240,255,0)');
    ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(pad,H-pad);
    data.forEach((v,i)=>{const x=pad+i*step,y=pad+(H-pad*2)*(1-v/100);ctx.lineTo(x,y);});
    ctx.lineTo(W-pad,H-pad);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#00f0ff';ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.shadowColor='#00f0ff';ctx.shadowBlur=8;ctx.beginPath();
    data.forEach((v,i)=>{const x=pad+i*step,y=pad+(H-pad*2)*(1-v/100);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
    ctx.stroke();ctx.shadowBlur=0;
    data.forEach((v,i)=>{const x=pad+i*step,y=pad+(H-pad*2)*(1-v/100);ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle='#00f0ff';ctx.fill();});
  },
  renderCat(){
    const canvas=document.getElementById('catCanvas');if(!canvas)return;
    const ctx=canvas.getContext('2d');canvas.width=canvas.offsetWidth||300;canvas.height=200;
    const W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);
    const counts={};DB.habits.forEach(h=>{counts[h.cat]=(counts[h.cat]||0)+1;});
    const entries=Object.entries(counts);
    if(!entries.length){ctx.fillStyle='rgba(255,255,255,.3)';ctx.font='14px Space Grotesk';ctx.textAlign='center';ctx.fillText('No habits yet',W/2,H/2);return;}
    const colors=['#00f0ff','#7c3aed','#f000b8','#00ffa3','#ffb800','#4ade80'];
    const cx=W/2-40,cy=H/2,r=Math.min(cx,cy)-20,total=entries.reduce((s,[,v])=>s+v,0);
    let angle=-Math.PI/2;
    entries.forEach(([cat,cnt],i)=>{const slice=(cnt/total)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,angle,angle+slice);ctx.closePath();ctx.fillStyle=colors[i%colors.length];ctx.shadowColor=colors[i%colors.length];ctx.shadowBlur=8;ctx.fill();ctx.shadowBlur=0;angle+=slice;});
    let ly=H/2-entries.length*12;
    entries.forEach(([cat,cnt],i)=>{const c=CAT[cat]||CAT.health;ctx.fillStyle=colors[i%colors.length];ctx.fillRect(W-80,ly,12,12);ctx.fillStyle='rgba(255,255,255,.6)';ctx.font='11px Space Grotesk';ctx.textAlign='left';ctx.fillText(`${c.icon} ${cnt}`,W-62,ly+10);ly+=22;});
  },
  renderHeatmap(){
    const el=document.getElementById('heatmap');if(!el)return;el.innerHTML='';
    for(let i=89;i>=0;i--){const date=daysAgo(i),rate=DB.rateFor(date),div=document.createElement('div');div.className='hcell'+(rate===0?'':rate<30?' l1':rate<60?' l2':rate<90?' l3':' l4');div.title=`${date}: ${rate}%`;el.appendChild(div);}
  },

  renderInsights(){
    document.getElementById('insightCards').innerHTML=this.buildInsights().map(t=>`
      <div class="card">
        <div class="card-head">
          <div style="display:flex;align-items:center;gap:12px;"><span style="font-size:1.8rem;">${t.icon}</span><div><div class="card-title">${t.title}</div><div style="color:var(--txt2);font-size:.85rem;margin-top:3px;">${t.sub}</div></div></div>
          <div class="card-badge">AI</div>
        </div>
        <div style="color:var(--txt2);line-height:1.7;">${t.body}</div>
      </div>`).join('');
  },

  buildInsights(){
    const total=DB.habits.length,r7=DB.weeklyRate(),pDays=DB.perfDays(),bStreak=total?Math.max(...DB.habits.map(h=>DB.bestStreak(h.id)),0):0;
    return[
      {icon:'📊',title:'PERFORMANCE ANALYSIS',sub:'Based on your last 7 days',desc:`7-day rate: ${r7}%. ${r7>=80?'Outstanding.':r7>=60?'Good momentum.':r7>=40?'Moderate consistency.':'Early stage.'}`,
       body:total===0?'No habits tracked yet. Create your first habit to start generating insights.':`Your 7-day completion rate is <strong style="color:var(--cyan)">${r7}%</strong>. ${r7>=80?'Outstanding — you are in the top tier of habit builders.':r7>=60?'Good momentum. Small consistency improvements will push you further.':r7>=40?'Moderate consistency. Focus on your highest-priority habit first.':'Early stage. Start with one non-negotiable habit and build outward.'}`},
      {icon:'🔥',title:'STREAK INTELLIGENCE',sub:'Continuity analysis',desc:`Best streak: ${bStreak} days`,
       body:bStreak===0?'No streaks recorded yet. Complete a habit today to start your first streak.':`Your best recorded streak is <strong style="color:var(--amber)">${bStreak} consecutive days</strong>. ${bStreak>=21?'At 21+ days, habits become neurologically automatic. You have reached automaticity.':bStreak>=14?'Two weeks of consistency — the neural pathway is strengthening significantly.':bStreak>=7?'One week streak is the foundation. Keep pushing toward the 21-day threshold.':'Short streaks still matter. Every chain you build counts. Do not break it today.'}`},
      {icon:'🏆',title:'PERFECT DAY INDEX',sub:'100% completion events',desc:`${pDays} perfect days`,
       body:pDays===0?'You have not achieved a perfect day yet. Today is your opportunity — complete all habits before midnight.':`You have achieved <strong style="color:var(--green)">${pDays} perfect day${pDays>1?'s':''}</strong>. ${pDays>=10?'Exceptional. Double-digit perfect days demonstrate elite commitment.':pDays>=5?'Strong foundation. You clearly understand what it takes to win the day.':'Each perfect day compounds. Aim to make today number '+(pDays+1)+'.'}`},
      {icon:'💡',title:'CATEGORY OPTIMIZATION',sub:'Habit distribution analysis',desc:'Portfolio balance check',
       body:(()=>{if(!total)return'Add habits across multiple categories for a balanced approach to self-improvement.';const cats={};DB.habits.forEach(h=>{cats[h.cat]=(cats[h.cat]||0)+1;});const dom=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];const c=CAT[dom[0]]||CAT.health;return`Your dominant category is <strong style="color:var(--cyan)">${c.icon} ${c.label}</strong> with ${dom[1]} habit${dom[1]>1?'s':''}. ${Object.keys(cats).length===1?'Diversifying across categories creates compound effects on performance.':'Good distribution. Cross-domain habits reinforce each other neurologically.'}`;})()},
      {icon:'🚀',title:'NEXT LEVEL PROTOCOL',sub:'Recommendation engine',desc:'What to do next',
       body:(()=>{if(!total)return'Start with one identity-based habit. <em>"I am someone who meditates daily"</em> is more powerful than <em>"I want to meditate."</em>';const missing=Object.keys(CAT).filter(k=>!DB.habits.find(h=>h.cat===k));if(missing.length){const m=CAT[missing[0]];return`Gap detected in <strong style="color:var(--violet)">${m.icon} ${m.label}</strong>. Adding a habit here would balance your routine and trigger cross-category momentum. Start with a simple 5-minute entry point.`;}return`You have covered all categories. The next level is increasing difficulty on your easiest habits. Upgrade one <em>😊 Easy</em> habit to <em>💪 Medium</em> to keep growing.`;})()}
    ];
  },

  renderTimeline(){
    const el=document.getElementById('timelineEl');
    const items=Array.from({length:14},(_,i)=>{const d=daysAgo(i);return{date:d,done:DB.habits.filter(h=>DB.isDone(h.id,d)),miss:DB.habits.filter(h=>!DB.isDone(h.id,d))};});
    if(!DB.habits.length){el.innerHTML=`<div class="empty"><span class="empty-glyph">🕰️</span><h3>Timeline is empty</h3><p>Complete some habits to see your journey</p></div>`;return;}
    el.innerHTML=items.map(item=>{
      const dateObj=new Date(item.date+'T00:00:00'),label=dateObj.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}),isToday=item.date===today(),hasDone=item.done.length>0;
      return`<div class="tl-entry">
        <div class="tl-date" style="color:${isToday?'var(--cyan)':'var(--txt3)'}">${isToday?'TODAY':label}</div>
        <div class="tl-left"><div class="tl-dot${!hasDone?' miss':''}"></div><div class="tl-line"></div></div>
        <div class="tl-content">
          <div class="tl-row-title">${item.done.length}/${DB.habits.length} — ${item.done.length===DB.habits.length&&DB.habits.length>0?'<span style="color:var(--green)">⭐ Perfect Day</span>':hasDone?`<span style="color:var(--cyan)">${Math.round(item.done.length/DB.habits.length*100)}% complete</span>`:'<span style="color:var(--txt3)">No completions</span>'}</div>
          <div class="tl-pills">${item.done.map(h=>`<div class="tl-pill">${h.name}</div>`).join('')}${item.miss.map(h=>`<div class="tl-pill miss">${h.name}</div>`).join('')}</div>
        </div>
      </div>`;
    }).join('');
  },

  openModal(){document.getElementById('modalOverlay').classList.add('open');document.getElementById('fName').value='';document.getElementById('fDesc').value='';setTimeout(()=>document.getElementById('fName').focus(),100);},
  closeModal(){document.getElementById('modalOverlay').classList.remove('open');},
  bgClose(e){if(e.target===document.getElementById('modalOverlay'))this.closeModal();},

  toast(msg,type='success'){
    const el=document.createElement('div');el.className=`toast ${type}`;
    el.innerHTML=`<span class="toast-ico">${type==='success'?'✦':'✕'}</span><span class="toast-msg">${msg}</span>`;
    document.getElementById('toasts').appendChild(el);
    setTimeout(()=>{el.style.cssText='opacity:0;transform:translateX(100%);transition:all .3s ease;';setTimeout(()=>el.remove(),300);},2800);
  }
};

document.addEventListener('DOMContentLoaded',()=>UI.init());
window.UI=UI;window.DB=DB;
