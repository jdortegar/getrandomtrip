export const htmlActivityStyles = `.activity .header{margin-bottom:0}
.activity .header h1{font-size:29px}
.activity .summary-row{gap:20px;
  margin-bottom:24px}
.activity .summary{min-height:148px}
.activity .summary h2{font-size:15px}
.activity .summary strong{font-size:22px}
.activity .summary p{font-size:16px}
.activity .details-row{margin-left:75px;
  margin-right:46px;
  margin-bottom:24px}
.activity .details{min-height:370px;
  padding:24px 26px}
.activity .details .section-title{color:var(--ink);
  font-size:14px;
  margin-bottom:16px}
.activity .detail-row{min-height:48px;
  padding:11px 0 12px}
.activity .detail-label{font-size:15px;
  flex-basis:36%}
.activity .detail-value{font-weight:400;
  font-size:17px}
.activity .details .payment{font-weight:700;
  font-size:14px;
  background:#dcf8eb;
  color:#1a9763;
  border-radius:24px;
  padding:5px 14px;
  line-height:20px}
.activity .details .payment:before{content:"●";
  color:#32cc78;
  margin-right:7px}
.activity .detail-row:has(.payment){padding-top:7px;
  padding-bottom:7px}
.activity .items{margin-left:75px;
  margin-right:46px;
  padding:24px 26px 20px;
  min-height:357px;
  margin-bottom:22px}
.activity .items .section-title{font-size:14px;
  color:var(--ink);
  margin-bottom:18px}
.activity .service-item{min-height:103px;
  align-items:flex-start;
  padding:16px 20px;
  gap:18px}
.activity .item-grid{gap:14px}
.activity .service-item:nth-child(-n+2){min-height:133px}
.activity .service-item h3{font-size:17px;
  line-height:24px}
.activity .service-item .description{font-size:15px;
  line-height:22px;
  margin-top:3px}
.activity .service-item .check{margin-left:0}
.activity-presentation{border:3px solid var(--cyan);
  min-height:141px;
  padding:22px 27px;
  margin-left:53px;
  margin-right:52px;
  margin-bottom:26px;
  display:flex;
  gap:17px}
.activity-presentation>.icon{width:49px;
  height:49px;
  margin-top:5px}
.activity-presentation h2{font-size:15px;
  color:var(--cyan);
  line-height:22px;
  margin-bottom:12px}
.activity-presentation p{font-size:18px;
  font-weight:700;
  line-height:30px}
.activity-bottom{margin-left:53px;
  margin-right:52px;
  gap:12px}
.activity-bottom>.policy{flex:2.75;
  min-height:269px;
  padding:22px 26px}
.activity-bottom>.qr-panel{flex:1;
  min-height:269px;
  border:3px solid var(--cyan);
  padding:16px 32px}
.activity-bottom .qr-image{width:160px;
  height:160px;
  margin-top:10px}
.activity-bottom .qr-panel .accent strong{font-size:20px}
.activity-bottom .qr-panel .accent p{font-size:13px}
.activity-bottom .policy .section-title{font-size:15px;
  margin-bottom:12px}
.activity-bottom .policy .section-title .icon{width:48px;
  height:48px;
  margin-right:8px}
.activity-bottom .policy-list{font-size:16px;
  line-height:19px}
.activity-bottom .policy-list p{padding:7px 0 14px 25px}
.footer{position:absolute;
  bottom:17px;
  left:var(--inset);
  right:var(--inset);
  font-size:11px;
  line-height:16px;
  color:var(--muted);
  display:flex;
  justify-content:space-between;
  gap:24px}
.footer .footer-label{flex:1;
  min-width:0}
.footer .pagination{white-space:nowrap}
.hotel .footer{color:#c8d8de;
  background:var(--dark);
  bottom:5px}
.dinner .footer,.activity .footer{display:block;
  text-align:center;
  bottom:8px}
.farewell{color:var(--ink);
  font-weight:700}
.footer .pagination{font-size:9px}
.dinner .footer{display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  column-gap:20px;
  row-gap:0;
  text-align:left}
.dinner .footer .farewell{grid-column:1 / -1;
  grid-row:2;
  text-align:center}
.dinner .footer .pagination{grid-column:2;
  grid-row:1}
`;
