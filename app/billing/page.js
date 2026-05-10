'use client';
import { useState } from 'react';

const MOCK_INVOICES = [
  { id:'INV-093', amount:342.00, issued:'May 10, 2026', due:'Jun 9, 2026', status:'pending', items:[
    { desc:'24x T-Shirts, Front Print', qty:24, price:10.50 },
    { desc:'Setup fee', qty:1, price:90.00 },
  ]},
  { id:'INV-091', amount:180.00, issued:'Apr 10, 2026', due:'May 10, 2026', status:'overdue', items:[
    { desc:'36x Jerseys, Name+Number', qty:36, price:5.00 },
  ]},
  { id:'INV-087', amount:480.00, issued:'Mar 2, 2026', due:'Apr 1, 2026', status:'paid', items:[
    { desc:'60x T-Shirts, 2-color print', qty:60, price:8.00 },
  ]},
  { id:'INV-082', amount:240.00, issued:'Jan 15, 2026', due:'Feb 14, 2026', status:'paid', items:[
    { desc:'24x Hoodies, Full Back', qty:24, price:10.00 },
  ]},
];

const STATUS = {
  pending: { bg:'#fef3c7', color:'#92400e', label:'Pending' },
  overdue: { bg:'#fee2e2', color:'#991b1b', label:'Overdue' },
  paid:    { bg:'#d1fae5', color:'#065f46', label:'Paid' },
  waived:  { bg:'#f3f4f6', color:'#6b7280', label:'Waived' },
};

export default function BillingPage() {
  const [invoices] = useState(MOCK_INVOICES);
  const [viewing, setViewing] = useState(null);
  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote] = useState({ description:'', qty:'', notes:'' });
  const [quoteSent, setQuoteSent] = useState(false);

  const outstanding = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((s,i) => s+i.amount, 0);
  const paid = invoices.filter(i => i.status === 'paid').reduce((s,i) => s+i.amount, 0);

  function sendQuote() {
    setQuoteSent(true);
    setTimeout(() => { setShowQuote(false); setQuoteSent(false); setQuote({ description:'', qty:'', notes:'' }); }, 2500);
  }

  return (
    <div style={s.page}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      {/* Header */}
      <header style={s.header} className="no-print">
        <div style={s.hLeft}>
          <a href="/dashboard" style={s.backLink}>← Dashboard</a>
          <h1 style={s.headerTitle}>Billing</h1>
        </div>
        <button onClick={() => setShowQuote(true)} style={s.quoteBtn}>+ Request a Quote</button>
      </header>

      <div style={s.body}>

        {/* Summary cards */}
        <div style={s.summaryGrid} className="no-print">
          <div style={s.summaryCard}>
            <div style={{fontSize:13,color:'#6b7280',marginBottom:4}}>Outstanding Balance</div>
            <div style={{fontSize:28,fontWeight:700,color:outstanding>0?'#dc2626':'#111827'}}>${outstanding.toFixed(2)}</div>
            <div style={{fontSize:12,color:'#9ca3af',marginTop:2}}>{invoices.filter(i=>i.status==='pending'||i.status==='overdue').length} unpaid invoice{invoices.filter(i=>i.status==='pending'||i.status==='overdue').length!==1?'s':''}</div>
          </div>
          <div style={s.summaryCard}>
            <div style={{fontSize:13,color:'#6b7280',marginBottom:4}}>Paid to Date</div>
            <div style={{fontSize:28,fontWeight:700,color:'#059669'}}>${paid.toFixed(2)}</div>
            <div style={{fontSize:12,color:'#9ca3af',marginTop:2}}>{invoices.filter(i=>i.status==='paid').length} paid invoices</div>
          </div>
          <div style={s.summaryCard}>
            <div style={{fontSize:13,color:'#6b7280',marginBottom:4}}>Total Invoices</div>
            <div style={{fontSize:28,fontWeight:700,color:'#111827'}}>{invoices.length}</div>
            <div style={{fontSize:12,color:'#9ca3af',marginTop:2}}>All time</div>
          </div>
        </div>

        {/* Invoice list */}
        <div style={s.card} className="no-print">
          <h2 style={s.cardTitle}>Your Invoices</h2>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {invoices.map(inv => {
              const st = STATUS[inv.status];
              return (
                <div key={inv.id} style={{...s.invoiceRow,...(inv.status==='overdue'?{borderLeft:'3px solid #dc2626'}:{})}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:14,fontWeight:700,color:'#111827'}}>{inv.id}</span>
                      <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:st.bg,color:st.color}}>{st.label}</span>
                      {inv.status==='overdue' && <span style={{fontSize:11,color:'#dc2626',fontWeight:600}}>⚠ Payment overdue</span>}
                    </div>
                    <div style={{fontSize:13,color:'#6b7280'}}>Issued {inv.issued} · Due {inv.due}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:16}}>
                    <div style={{fontSize:20,fontWeight:700,color:'#111827'}}>${inv.amount.toFixed(2)}</div>
                    <button onClick={()=>setViewing(inv)} style={s.viewBtn}>View Invoice</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment info */}
        <div style={s.card} className="no-print">
          <h2 style={s.cardTitle}>Payment Information</h2>
          <p style={{fontSize:14,color:'#6b7280',lineHeight:1.7}}>
            To pay an outstanding invoice, please contact us directly. We accept Venmo, Zelle, check, and bank transfer.
            Reach us at <strong>info@sascreenprinting.com</strong> or call <strong>(973) 555-0100</strong>.
          </p>
        </div>
      </div>

      {/* ── Invoice Viewer Modal ── */}
      {viewing && (
        <div style={s.modalOverlay} className="no-print">
          <div style={s.modal}>
            <button onClick={()=>setViewing(null)} style={s.closeBtn}>✕</button>
            <button onClick={()=>window.print()} style={s.printBtn}>🖨 Print / Save</button>
            <InvoicePrintView invoice={viewing}/>
          </div>
        </div>
      )}

      {/* ── Quote Request Modal ── */}
      {showQuote && (
        <div style={s.modalOverlay}>
          <div style={{...s.modal, maxWidth:480}}>
            <button onClick={()=>setShowQuote(false)} style={s.closeBtn}>✕</button>
            <h2 style={{fontSize:18,fontWeight:700,color:'#111827',marginBottom:4}}>Request a Quote</h2>
            <p style={{fontSize:13,color:'#6b7280',marginBottom:20}}>Tell us what you need and we'll get back to you with pricing.</p>
            {quoteSent ? (
              <div style={{textAlign:'center',padding:'30px 0',color:'#059669',fontSize:16,fontWeight:600}}>
                ✓ Quote request sent! We'll be in touch soon.
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div>
                  <label style={s.label}>What do you need printed?</label>
                  <textarea value={quote.description} onChange={e=>setQuote(q=>({...q,description:e.target.value}))}
                    style={{...s.inp,height:80,resize:'vertical',width:'100%'}}
                    placeholder="e.g. T-shirts with our logo on the front left chest…"/>
                </div>
                <div>
                  <label style={s.label}>Approximate quantity</label>
                  <input value={quote.qty} onChange={e=>setQuote(q=>({...q,qty:e.target.value}))}
                    style={{...s.inp,width:'100%'}} placeholder="e.g. 48"/>
                </div>
                <div>
                  <label style={s.label}>Additional notes</label>
                  <textarea value={quote.notes} onChange={e=>setQuote(q=>({...q,notes:e.target.value}))}
                    style={{...s.inp,height:60,resize:'vertical',width:'100%'}}
                    placeholder="Colors, sizes, deadline, special requests…"/>
                </div>
                <button onClick={sendQuote} style={s.submitBtn}>Send Quote Request</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InvoicePrintView({ invoice }) {
  const subtotal = invoice.items.reduce((s,i) => s + (i.qty * i.price), 0);
  const tax = subtotal * 0.07;
  const total = subtotal + tax;

  return (
    <div style={{fontFamily:"'Inter',sans-serif",maxWidth:600,margin:'0 auto'}}>
      {/* Invoice header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:32}}>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:'#1a1a2e',marginBottom:4}}>S&A Screen Printing</div>
          <div style={{fontSize:13,color:'#6b7280',lineHeight:1.6}}>
            123 Print Ave, Newark NJ<br/>
            (973) 555-0100 · info@sascreenprinting.com
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:28,fontWeight:800,color:'#1a1a2e'}}>INVOICE</div>
          <div style={{fontSize:16,fontWeight:600,color:'#e8a020'}}>{invoice.id}</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:28,padding:16,background:'#f9fafb',borderRadius:8}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Bill To</div>
          <div style={{fontSize:14,fontWeight:600,color:'#111827'}}>Your Company Name</div>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Invoice Details</div>
          <div style={{fontSize:13,color:'#374151',lineHeight:1.7}}>
            <div>Issued: {invoice.issued}</div>
            <div>Due: {invoice.due}</div>
          </div>
        </div>
      </div>

      <table style={{width:'100%',borderCollapse:'collapse',marginBottom:24}}>
        <thead>
          <tr style={{background:'#1a1a2e'}}>
            {['Description','Qty','Unit Price','Total'].map(h=>(
              <th key={h} style={{padding:'10px 14px',textAlign:h==='Description'?'left':'right',color:'#e8a020',fontSize:12,fontWeight:700,letterSpacing:0.5}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item,i)=>(
            <tr key={i} style={{borderBottom:'1px solid #f3f4f6'}}>
              <td style={{padding:'12px 14px',fontSize:13,color:'#111827'}}>{item.desc}</td>
              <td style={{padding:'12px 14px',fontSize:13,color:'#374151',textAlign:'right'}}>{item.qty}</td>
              <td style={{padding:'12px 14px',fontSize:13,color:'#374151',textAlign:'right'}}>${item.price.toFixed(2)}</td>
              <td style={{padding:'12px 14px',fontSize:13,fontWeight:600,color:'#111827',textAlign:'right'}}>${(item.qty*item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <div style={{width:220}}>
          {[['Subtotal', subtotal],['Tax (7%)', tax]].map(([label,val])=>(
            <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:13,color:'#6b7280',borderBottom:'1px solid #f3f4f6'}}>
              <span>{label}</span><span>${val.toFixed(2)}</span>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',fontSize:16,fontWeight:700,color:'#111827'}}>
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{marginTop:32,padding:16,background:'#f9fafb',borderRadius:8,fontSize:13,color:'#6b7280',lineHeight:1.7}}>
        <strong style={{color:'#111827'}}>Payment:</strong> Venmo · Zelle · Check · Bank Transfer<br/>
        <strong style={{color:'#111827'}}>Questions?</strong> info@sascreenprinting.com · (973) 555-0100
      </div>
    </div>
  );
}

const s = {
  page:        { minHeight:'100vh',background:'#f3f4f6',fontFamily:"'Inter',sans-serif" },
  header:      { background:'#1a1a2e',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',position:'sticky',top:0,zIndex:50 },
  hLeft:       { display:'flex',alignItems:'center',gap:16 },
  backLink:    { color:'#9ca3af',fontSize:13,textDecoration:'none' },
  headerTitle: { fontSize:16,fontWeight:600,color:'#fff',margin:0 },
  quoteBtn:    { background:'#e8a020',color:'#1a1a2e',border:'none',borderRadius:8,padding:'7px 16px',fontSize:13,fontWeight:700,cursor:'pointer' },
  body:        { padding:24,maxWidth:900,margin:'0 auto' },
  summaryGrid: { display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:20 },
  summaryCard: { background:'#fff',borderRadius:10,border:'1px solid #e5e7eb',padding:20 },
  card:        { background:'#fff',borderRadius:10,border:'1px solid #e5e7eb',padding:22,marginBottom:16 },
  cardTitle:   { fontSize:15,fontWeight:600,color:'#111827',marginBottom:16,marginTop:0 },
  invoiceRow:  { display:'flex',alignItems:'center',gap:16,padding:16,background:'#f9fafb',borderRadius:8,border:'1px solid #e5e7eb' },
  viewBtn:     { padding:'7px 16px',background:'#1a1a2e',color:'#e8a020',border:'none',borderRadius:6,fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap' },
  modalOverlay:{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:20 },
  modal:       { background:'#fff',borderRadius:12,padding:32,maxWidth:680,width:'100%',maxHeight:'90vh',overflowY:'auto',position:'relative' },
  closeBtn:    { position:'absolute',top:16,right:16,background:'#f3f4f6',border:'none',borderRadius:6,width:28,height:28,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center' },
  printBtn:    { position:'absolute',top:16,right:52,background:'#1a1a2e',color:'#e8a020',border:'none',borderRadius:6,padding:'5px 12px',fontSize:12,fontWeight:600,cursor:'pointer' },
  label:       { display:'block',fontSize:11,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:0.4,marginBottom:5 },
  inp:         { padding:'8px 10px',border:'1px solid #d1d5db',borderRadius:6,fontSize:13,color:'#111827',background:'#fff',fontFamily:'inherit',boxSizing:'border-box' },
  submitBtn:   { padding:'11px 0',background:'#1a1a2e',color:'#e8a020',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer' },
};
