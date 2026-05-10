'use client';
import { useState } from 'react';

// ── This is a standalone billing section to be embedded inside the admin page ──
// Import and use <AdminBilling /> inside your admin page.js billing section

const CLIENTS = [
  'Riverside Youth Sports',
  'East Side Brewing Co.',
  'Lakewood FC',
  'Northside Academy',
  'Summit CrossFit',
];

const TAX_RATE = 0.07;

const MOCK_INVOICES = [
  { id:'INV-093', client:'Northside Academy',      amount:342.00, issued:'2026-05-10', due:'2026-06-09', status:'pending', items:[{desc:'24x T-Shirts, Front Print',qty:24,price:10.50},{desc:'Setup fee',qty:1,price:90.00}] },
  { id:'INV-091', client:'Lakewood FC',            amount:180.00, issued:'2026-04-10', due:'2026-05-10', status:'overdue', items:[{desc:'36x Jerseys, Name+Number',qty:36,price:5.00}] },
  { id:'INV-089', client:'East Side Brewing Co.',  amount:480.00, issued:'2026-04-02', due:'2026-05-02', status:'paid',    items:[{desc:'60x T-Shirts, 2-color',qty:60,price:8.00}] },
  { id:'INV-090', client:'Summit CrossFit',        amount:876.00, issued:'2026-04-08', due:'2026-05-08', status:'paid',    items:[{desc:'48x Hoodies, Full Back',qty:48,price:18.25}] },
  { id:'INV-088', client:'Riverside Youth Sports', amount:245.00, issued:'2026-03-28', due:'2026-04-27', status:'overdue', items:[{desc:'100x T-Shirts, 3-color',qty:100,price:2.45}] },
  { id:'INV-085', client:'Summit CrossFit',        amount:320.00, issued:'2026-02-15', due:'2026-03-15', status:'paid',    items:[{desc:'24x Polos, Left Chest',qty:24,price:13.33}] },
  { id:'INV-081', client:'East Side Brewing Co.',  amount:210.00, issued:'2026-01-20', due:'2026-02-19', status:'paid',    items:[{desc:'30x Tank Tops',qty:30,price:7.00}] },
  { id:'INV-079', client:'Riverside Youth Sports', amount:540.00, issued:'2025-12-05', due:'2026-01-04', status:'paid',    items:[{desc:'60x Hoodies, 2-color',qty:60,price:9.00}] },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getMonthYear(dateStr) {
  const d = new Date(dateStr);
  return { month: d.getMonth(), year: d.getFullYear(), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` };
}

export default function AdminBilling() {
  const [invoices, setInvoices]       = useState(MOCK_INVOICES);
  const [tab, setTab]                 = useState('invoices'); // invoices | create | reports
  const [previewInv, setPreviewInv]   = useState(null);

  // Create invoice state
  const [newClient, setNewClient]     = useState('');
  const [newDue, setNewDue]           = useState('');
  const [newNote, setNewNote]         = useState('');
  const [lineItems, setLineItems]     = useState([{ desc:'', qty:'', price:'' }]);
  const [createMsg, setCreateMsg]     = useState('');

  // Reports state
  const [reportType, setReportType]   = useState('monthly'); // monthly | quarterly | yearly
  const [reportYear, setReportYear]   = useState('2026');

  /* ── Invoice actions ── */
  function waive(id)    { setInvoices(inv => inv.map(i => i.id===id ? {...i,status:'waived'} : i)); }
  function markPaid(id) { setInvoices(inv => inv.map(i => i.id===id ? {...i,status:'paid'} : i)); }

  /* ── Line items ── */
  function setLine(idx, field, val) {
    setLineItems(lines => lines.map((l,i) => i===idx ? {...l,[field]:val} : l));
  }
  function addLine()    { setLineItems(l => [...l, {desc:'',qty:'',price:''}]); }
  function removeLine(idx) { setLineItems(l => l.filter((_,i)=>i!==idx)); }

  /* ── Create invoice ── */
  function createInvoice() {
    if (!newClient || !newDue || lineItems.some(l=>!l.desc||!l.qty||!l.price)) {
      setCreateMsg('⚠ Please fill in all fields.'); return;
    }
    const items = lineItems.map(l => ({ desc:l.desc, qty:Number(l.qty), price:Number(l.price) }));
    const subtotal = items.reduce((s,i) => s + i.qty*i.price, 0);
    const total = subtotal * (1 + TAX_RATE);
    const newId = `INV-${String(100 + invoices.length + 1)}`;
    const today = new Date().toISOString().split('T')[0];
    setInvoices(inv => [{
      id:newId, client:newClient, amount:parseFloat(total.toFixed(2)),
      issued:today, due:newDue, status:'pending', items, note:newNote,
    }, ...inv]);
    setCreateMsg(`✓ ${newId} created for ${newClient}!`);
    setNewClient(''); setNewDue(''); setNewNote('');
    setLineItems([{desc:'',qty:'',price:''}]);
    setTimeout(() => setCreateMsg(''), 4000);
  }

  /* ── Tax report data ── */
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const year = parseInt(reportYear);

  function getMonthlyData() {
    return MONTHS.map((m, idx) => {
      const matched = paidInvoices.filter(i => {
        const d = new Date(i.issued);
        return d.getFullYear() === year && d.getMonth() === idx;
      });
      const revenue = matched.reduce((s,i) => s + i.amount, 0);
      const tax = revenue * TAX_RATE;
      return { label: m, revenue, tax, count: matched.length };
    });
  }

  function getQuarterlyData() {
    return ['Q1 (Jan-Mar)','Q2 (Apr-Jun)','Q3 (Jul-Sep)','Q4 (Oct-Dec)'].map((label, q) => {
      const months = [0,1,2].map(m => m + q*3);
      const matched = paidInvoices.filter(i => {
        const d = new Date(i.issued);
        return d.getFullYear() === year && months.includes(d.getMonth());
      });
      const revenue = matched.reduce((s,i) => s + i.amount, 0);
      return { label, revenue, tax: revenue * TAX_RATE, count: matched.length };
    });
  }

  function getYearlyData() {
    const years = [...new Set(paidInvoices.map(i => new Date(i.issued).getFullYear()))].sort((a,b)=>b-a);
    return years.map(yr => {
      const matched = paidInvoices.filter(i => new Date(i.issued).getFullYear() === yr);
      const revenue = matched.reduce((s,i) => s + i.amount, 0);
      return { label: String(yr), revenue, tax: revenue * TAX_RATE, count: matched.length };
    });
  }

  const reportData = reportType==='monthly' ? getMonthlyData() : reportType==='quarterly' ? getQuarterlyData() : getYearlyData();
  const totalRevenue = reportData.reduce((s,r) => s + r.revenue, 0);
  const totalTax     = reportData.reduce((s,r) => s + r.tax, 0);

  const STATUS_COLORS = {
    pending: { bg:'#fef3c7', color:'#92400e' },
    overdue: { bg:'#fee2e2', color:'#991b1b' },
    paid:    { bg:'#d1fae5', color:'#065f46' },
    waived:  { bg:'#f3f4f6', color:'#6b7280' },
  };

  return (
    <div>
      <style>{`@media print { .no-print{display:none!important} body{background:#fff} }`}</style>

      {/* Tabs */}
      <div style={s.tabs} className="no-print">
        {[['invoices','📄 Invoices'],['create','➕ Create Invoice'],['reports','📊 Tax Reports']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{...s.tab,...(tab===id?s.tabActive:{})}}>
            {label}
          </button>
        ))}
      </div>

      {/* ── INVOICES TAB ── */}
      {tab==='invoices' && (
        <div>
          <div style={s.statsRow}>
            {[
              { label:'Outstanding', value:'$'+invoices.filter(i=>i.status==='pending'||i.status==='overdue').reduce((s,i)=>s+i.amount,0).toFixed(2), color:'#dc2626' },
              { label:'Overdue',     value:'$'+invoices.filter(i=>i.status==='overdue').reduce((s,i)=>s+i.amount,0).toFixed(2), color:'#f59e0b' },
              { label:'Paid',        value:'$'+invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.amount,0).toFixed(2), color:'#059669' },
              { label:'Total Billed',value:'$'+invoices.reduce((s,i)=>s+i.amount,0).toFixed(2), color:'#111827' },
            ].map(stat=>(
              <div key={stat.label} style={s.statCard}>
                <div style={{fontSize:11,color:'#6b7280',marginBottom:4,textTransform:'uppercase',letterSpacing:0.5}}>{stat.label}</div>
                <div style={{fontSize:22,fontWeight:700,color:stat.color}}>{stat.value}</div>
              </div>
            ))}
          </div>

          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{borderBottom:'2px solid #e5e7eb'}}>
                {['Invoice','Client','Amount','Issued','Due','Status','Actions'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',textAlign:'left',color:'#6b7280',fontWeight:600,fontSize:11,textTransform:'uppercase',letterSpacing:0.5}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const sc = STATUS_COLORS[inv.status] || STATUS_COLORS.pending;
                return (
                  <tr key={inv.id} style={{borderBottom:'1px solid #f3f4f6'}}>
                    <td style={{padding:'12px 12px',fontWeight:700,color:'#111827'}}>{inv.id}</td>
                    <td style={{padding:'12px 12px',color:'#374151'}}>{inv.client}</td>
                    <td style={{padding:'12px 12px',fontWeight:600,color:'#111827'}}>${inv.amount.toFixed(2)}</td>
                    <td style={{padding:'12px 12px',color:'#6b7280'}}>{inv.issued}</td>
                    <td style={{padding:'12px 12px',color:'#6b7280'}}>{inv.due}</td>
                    <td style={{padding:'12px 12px'}}>
                      <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:sc.bg,color:sc.color}}>{inv.status}</span>
                    </td>
                    <td style={{padding:'12px 12px'}}>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        <button onClick={()=>setPreviewInv(inv)} style={s.actionBtn}>Preview</button>
                        {inv.status!=='paid'&&inv.status!=='waived' && <>
                          <button onClick={()=>markPaid(inv.id)} style={{...s.actionBtn,color:'#059669'}}>Mark Paid</button>
                          <button onClick={()=>waive(inv.id)} style={{...s.actionBtn,color:'#dc2626'}}>Waive</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CREATE INVOICE TAB ── */}
      {tab==='create' && (
        <div style={{maxWidth:700}}>
          <div style={s.formSection}>
            <h3 style={s.formSectionTitle}>Invoice Details</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div>
                <label style={s.label}>Client</label>
                <select style={s.inp} value={newClient} onChange={e=>setNewClient(e.target.value)}>
                  <option value="">Select client…</option>
                  {CLIENTS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Due Date</label>
                <input type="date" style={s.inp} value={newDue} onChange={e=>setNewDue(e.target.value)}/>
              </div>
              <div style={{gridColumn:'span 2'}}>
                <label style={s.label}>Note (optional)</label>
                <input style={s.inp} value={newNote} onChange={e=>setNewNote(e.target.value)} placeholder="e.g. Net 30, rush order…"/>
              </div>
            </div>
          </div>

          <div style={s.formSection}>
            <h3 style={s.formSectionTitle}>Line Items</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 80px 100px 32px',gap:8,marginBottom:8}}>
              {['Description','Qty','Unit Price',''].map(h=>(
                <div key={h} style={{fontSize:11,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:0.4}}>{h}</div>
              ))}
            </div>
            {lineItems.map((line, idx) => (
              <div key={idx} style={{display:'grid',gridTemplateColumns:'1fr 80px 100px 32px',gap:8,marginBottom:8}}>
                <input style={s.inp} value={line.desc} onChange={e=>setLine(idx,'desc',e.target.value)} placeholder="e.g. 24x T-Shirts, Front Print"/>
                <input style={s.inp} type="number" value={line.qty} onChange={e=>setLine(idx,'qty',e.target.value)} placeholder="24"/>
                <input style={s.inp} type="number" step="0.01" value={line.price} onChange={e=>setLine(idx,'price',e.target.value)} placeholder="10.50"/>
                <button onClick={()=>removeLine(idx)} style={{background:'#fee2e2',border:'none',borderRadius:6,color:'#dc2626',cursor:'pointer',fontSize:16,fontWeight:700}}>×</button>
              </div>
            ))}
            <button onClick={addLine} style={s.addLineBtn}>+ Add Line Item</button>

            {/* Totals preview */}
            {lineItems.some(l=>l.qty&&l.price) && (
              <div style={{marginTop:16,padding:14,background:'#f9fafb',borderRadius:8}}>
                {(() => {
                  const sub = lineItems.reduce((s,l) => s + (Number(l.qty)||0)*(Number(l.price)||0), 0);
                  const tax = sub * TAX_RATE;
                  return (
                    <div style={{display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end',fontSize:13}}>
                      <div style={{color:'#6b7280'}}>Subtotal: <strong>${sub.toFixed(2)}</strong></div>
                      <div style={{color:'#6b7280'}}>Tax (7%): <strong>${tax.toFixed(2)}</strong></div>
                      <div style={{fontSize:16,fontWeight:700,color:'#111827',borderTop:'1px solid #e5e7eb',paddingTop:6,marginTop:2}}>Total: ${(sub+tax).toFixed(2)}</div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <button onClick={createInvoice} style={s.createBtn}>Create Invoice</button>
            {createMsg && (
              <span style={{fontSize:13,fontWeight:500,color:createMsg.startsWith('✓')?'#059669':'#dc2626'}}>{createMsg}</span>
            )}
          </div>
        </div>
      )}

      {/* ── TAX REPORTS TAB ── */}
      {tab==='reports' && (
        <div>
          <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:20,flexWrap:'wrap'}}>
            <div style={{display:'flex',gap:4}}>
              {[['monthly','Monthly'],['quarterly','Quarterly'],['yearly','Yearly']].map(([id,label])=>(
                <button key={id} onClick={()=>setReportType(id)}
                  style={{...s.reportToggle,...(reportType===id?s.reportToggleActive:{})}}>
                  {label}
                </button>
              ))}
            </div>
            {reportType!=='yearly' && (
              <select style={s.inp} value={reportYear} onChange={e=>setReportYear(e.target.value)}>
                {['2026','2025','2024'].map(y=><option key={y}>{y}</option>)}
              </select>
            )}
            <button onClick={()=>window.print()} style={s.printReportBtn}>🖨 Print Report</button>
          </div>

          {/* Summary */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
            {[
              { label:'Total Revenue', value:'$'+totalRevenue.toFixed(2), color:'#059669' },
              { label:'Tax Collected (7%)', value:'$'+totalTax.toFixed(2), color:'#e8a020' },
              { label:'Net Revenue', value:'$'+(totalRevenue-totalTax).toFixed(2), color:'#1a1a2e' },
            ].map(stat=>(
              <div key={stat.label} style={{...s.statCard,textAlign:'center'}}>
                <div style={{fontSize:11,color:'#6b7280',marginBottom:6,textTransform:'uppercase',letterSpacing:0.5}}>{stat.label}</div>
                <div style={{fontSize:24,fontWeight:700,color:stat.color}}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Report table */}
          <div style={{background:'#fff',borderRadius:8,border:'1px solid #e5e7eb',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#1a1a2e'}}>
                  {['Period','Invoices','Revenue','Tax (7%)','Net'].map(h=>(
                    <th key={h} style={{padding:'10px 16px',textAlign:h==='Period'?'left':'right',color:'#e8a020',fontWeight:700,fontSize:12}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.map((row,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #f3f4f6',background:i%2===0?'#fff':'#fafafa'}}>
                    <td style={{padding:'10px 16px',fontWeight:600,color:'#111827'}}>{row.label}</td>
                    <td style={{padding:'10px 16px',textAlign:'right',color:'#6b7280'}}>{row.count}</td>
                    <td style={{padding:'10px 16px',textAlign:'right',fontWeight:600,color:'#059669'}}>${row.revenue.toFixed(2)}</td>
                    <td style={{padding:'10px 16px',textAlign:'right',color:'#e8a020'}}>${row.tax.toFixed(2)}</td>
                    <td style={{padding:'10px 16px',textAlign:'right',fontWeight:600,color:'#111827'}}>${(row.revenue-row.tax).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:'#1a1a2e'}}>
                  <td style={{padding:'12px 16px',fontWeight:700,color:'#e8a020'}}>TOTAL</td>
                  <td style={{padding:'12px 16px',textAlign:'right',color:'#e8a020'}}>{reportData.reduce((s,r)=>s+r.count,0)}</td>
                  <td style={{padding:'12px 16px',textAlign:'right',fontWeight:700,color:'#e8a020'}}>${totalRevenue.toFixed(2)}</td>
                  <td style={{padding:'12px 16px',textAlign:'right',color:'#e8a020'}}>${totalTax.toFixed(2)}</td>
                  <td style={{padding:'12px 16px',textAlign:'right',fontWeight:700,color:'#e8a020'}}>${(totalRevenue-totalTax).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p style={{fontSize:12,color:'#9ca3af',marginTop:12}}>
            * Reports based on paid invoices only. Tax rate: 7%. For official tax filing, consult your accountant.
          </p>
        </div>
      )}

      {/* ── Invoice Preview Modal ── */}
      {previewInv && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}} className="no-print">
              <h3 style={{margin:0,fontSize:16,fontWeight:700}}>Invoice Preview — {previewInv.id}</h3>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>window.print()} style={s.printReportBtn}>🖨 Print / Screenshot</button>
                <button onClick={()=>setPreviewInv(null)} style={s.closeBtn}>✕ Close</button>
              </div>
            </div>

            {/* Printable invoice */}
            <div style={{fontFamily:"'Inter',sans-serif"}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:28}}>
                <div>
                  <div style={{fontSize:20,fontWeight:800,color:'#1a1a2e'}}>S&A Screen Printing</div>
                  <div style={{fontSize:13,color:'#6b7280',lineHeight:1.7,marginTop:4}}>
                    123 Print Ave, Newark NJ<br/>
                    (973) 555-0100 · info@sascreenprinting.com
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:26,fontWeight:800,color:'#1a1a2e'}}>INVOICE</div>
                  <div style={{fontSize:18,fontWeight:700,color:'#e8a020'}}>{previewInv.id}</div>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24,padding:14,background:'#f9fafb',borderRadius:8}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Bill To</div>
                  <div style={{fontSize:14,fontWeight:600,color:'#111827'}}>{previewInv.client}</div>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Details</div>
                  <div style={{fontSize:13,color:'#374151',lineHeight:1.7}}>
                    <div>Issued: {previewInv.issued}</div>
                    <div>Due: {previewInv.due}</div>
                    {previewInv.note && <div>Note: {previewInv.note}</div>}
                  </div>
                </div>
              </div>

              <table style={{width:'100%',borderCollapse:'collapse',marginBottom:20}}>
                <thead>
                  <tr style={{background:'#1a1a2e'}}>
                    {['Description','Qty','Unit Price','Total'].map(h=>(
                      <th key={h} style={{padding:'9px 12px',textAlign:h==='Description'?'left':'right',color:'#e8a020',fontSize:12,fontWeight:700}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewInv.items.map((item,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid #f3f4f6'}}>
                      <td style={{padding:'10px 12px',fontSize:13,color:'#111827'}}>{item.desc}</td>
                      <td style={{padding:'10px 12px',fontSize:13,textAlign:'right'}}>{item.qty}</td>
                      <td style={{padding:'10px 12px',fontSize:13,textAlign:'right'}}>${item.price.toFixed(2)}</td>
                      <td style={{padding:'10px 12px',fontSize:13,fontWeight:600,textAlign:'right'}}>${(item.qty*item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(() => {
                const sub = previewInv.items.reduce((s,i)=>s+i.qty*i.price,0);
                const tax = sub * TAX_RATE;
                return (
                  <div style={{display:'flex',justifyContent:'flex-end'}}>
                    <div style={{width:200}}>
                      {[['Subtotal',sub],['Tax (7%)',tax]].map(([label,val])=>(
                        <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',fontSize:13,color:'#6b7280',borderBottom:'1px solid #f3f4f6'}}>
                          <span>{label}</span><span>${val.toFixed(2)}</span>
                        </div>
                      ))}
                      <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontSize:16,fontWeight:700,color:'#111827'}}>
                        <span>Total</span><span>${(sub+tax).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{marginTop:24,padding:14,background:'#f9fafb',borderRadius:8,fontSize:13,color:'#6b7280',lineHeight:1.7}}>
                <strong style={{color:'#111827'}}>Payment accepted:</strong> Venmo · Zelle · Check · Bank Transfer<br/>
                <strong style={{color:'#111827'}}>Questions?</strong> info@sascreenprinting.com · (973) 555-0100
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  tabs:              { display:'flex',gap:4,marginBottom:20,background:'#f3f4f6',padding:4,borderRadius:8,width:'fit-content' },
  tab:               { padding:'7px 16px',background:'transparent',border:'none',borderRadius:6,fontSize:13,fontWeight:500,color:'#6b7280',cursor:'pointer' },
  tabActive:         { background:'#fff',color:'#111827',fontWeight:600,boxShadow:'0 1px 3px rgba(0,0,0,0.08)' },
  statsRow:          { display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20 },
  statCard:          { background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:8,padding:14 },
  actionBtn:         { padding:'4px 10px',background:'#f3f4f6',border:'1px solid #e5e7eb',borderRadius:5,fontSize:11,fontWeight:500,cursor:'pointer',color:'#374151' },
  formSection:       { background:'#f9fafb',borderRadius:8,padding:16,marginBottom:16 },
  formSectionTitle:  { fontSize:13,fontWeight:700,color:'#374151',marginBottom:12,marginTop:0 },
  label:             { display:'block',fontSize:11,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:0.4,marginBottom:5 },
  inp:               { width:'100%',padding:'7px 9px',border:'1px solid #d1d5db',borderRadius:6,fontSize:13,color:'#111827',background:'#fff',fontFamily:'inherit',boxSizing:'border-box' },
  addLineBtn:        { marginTop:4,padding:'6px 14px',background:'transparent',border:'1px dashed #d1d5db',borderRadius:6,fontSize:13,color:'#6b7280',cursor:'pointer' },
  createBtn:         { padding:'11px 24px',background:'#1a1a2e',color:'#e8a020',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer' },
  reportToggle:      { padding:'6px 14px',background:'transparent',border:'1px solid #e5e7eb',borderRadius:6,fontSize:13,color:'#6b7280',cursor:'pointer' },
  reportToggleActive:{ background:'#1a1a2e',color:'#e8a020',border:'1px solid #1a1a2e',fontWeight:600 },
  printReportBtn:    { padding:'6px 14px',background:'#f3f4f6',border:'1px solid #e5e7eb',borderRadius:6,fontSize:12,fontWeight:500,cursor:'pointer',color:'#374151' },
  overlay:           { position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20 },
  modal:             { background:'#fff',borderRadius:12,padding:28,maxWidth:720,width:'100%',maxHeight:'92vh',overflowY:'auto' },
  closeBtn:          { padding:'6px 14px',background:'#f3f4f6',border:'1px solid #e5e7eb',borderRadius:6,fontSize:12,cursor:'pointer',color:'#374151' },
};
