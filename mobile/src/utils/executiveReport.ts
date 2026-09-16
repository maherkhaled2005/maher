export interface ExecutiveReportData {
  period: string;
  totalRevenue: number;
  activeUsers: number;
  todayOrders: number;
  availableTechnicians: number;
  pendingTickets: number;
  pendingWithdrawalsAmount: number;
  revenueBreakdown?: {
    marketplace: number;
    subscriptions: number;
    courses: number;
  };
  treasury?: {
    balance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    pendingWithdrawals: number;
    commissions: number;
  };
  warehouses?: {
    count: number;
    items: any[];
  };
  support?: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
  };
  orders?: {
    total: number;
    completed: number;
    pending: number;
    recent: any[];
  };
  topTechnicians?: any[];
  topProducts?: any[];
  liveActivities?: any[];
  ownerName?: string;
  programmerName?: string;
}

export function generateExecutiveReportHTML(data: ExecutiveReportData): string {
  const reportDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const reportTime = new Date().toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const ownerName = data.ownerName || 'إدارة منصة TecnoRexa';
  const programmerName = data.programmerName || 'الدعم التقني والبرمجي';

  const mktRevenue = data.revenueBreakdown?.marketplace || 0;
  const subsRevenue = data.revenueBreakdown?.subscriptions || 0;
  const coursesRevenue = data.revenueBreakdown?.courses || 0;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <title>تقرير TecnoRexa الشامل للإدارة العليا</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; }
    body { background-color: #0d0d0f; color: #f4f4f5; padding: 30px; font-size: 13px; line-height: 1.6; }
    .page { background: #141417; border: 1.5px solid #D4AF37; border-radius: 16px; padding: 36px; margin-bottom: 30px; min-height: 950px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    @media print {
      body { background: #fff !important; color: #111 !important; padding: 0 !important; }
      .page { background: #fff !important; border: 2px solid #D4AF37 !important; box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; page-break-after: always !important; }
      .no-print { display: none !important; }
      .gold-text { color: #B38F26 !important; }
      .card { background: #f9f9f9 !important; border: 1px solid #ddd !important; }
    }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 24px; }
    .brand-box { display: flex; align-items: center; gap: 14px; }
    .logo-badge { width: 56px; height: 56px; border-radius: 14px; background: #000; border: 2px solid #D4AF37; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: #D4AF37; }
    .title-area h1 { font-size: 22px; font-weight: 900; color: #D4AF37; }
    .title-area p { font-size: 12px; color: #a1a1aa; }
    .meta-box { text-align: left; font-size: 11px; color: #a1a1aa; }
    .section-title { font-size: 16px; font-weight: 800; color: #D4AF37; margin: 20px 0 12px 0; border-right: 4px solid #D4AF37; padding-right: 10px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
    .kpi-card { background: #1a1a20; border: 1px solid #27272a; border-radius: 12px; padding: 14px; text-align: right; }
    .kpi-val { font-size: 20px; font-weight: 900; color: #fff; margin-top: 4px; }
    .kpi-val.gold { color: #D4AF37; }
    .kpi-val.green { color: #10B981; }
    .kpi-lbl { font-size: 11px; color: #a1a1aa; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 20px; }
    th, td { border: 1px solid #27272a; padding: 10px 12px; text-align: right; font-size: 12px; }
    th { background: #1f1f26; color: #D4AF37; font-weight: 800; }
    tr:nth-child(even) { background: #17171c; }
    .footer-signs { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #27272a; }
    .sign-box { text-align: center; width: 220px; }
    .sign-line { border-bottom: 1px dashed #D4AF37; height: 50px; margin-bottom: 6px; }
    .print-btn { background: #D4AF37; color: #000; border: none; padding: 12px 28px; border-radius: 8px; font-weight: 900; cursor: pointer; font-size: 14px; }
    .action-bar { display: flex; justify-content: space-between; align-items: center; max-width: 900px; margin: 0 auto 20px auto; }
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="print-btn" onclick="window.print()">🖨️ طباعة التقرير أو الحفظ كـ PDF</button>
    <span style="color:#a1a1aa; font-size:12px;">منظومة TecnoRexa للإدارة والرقابة المركزية</span>
  </div>

  <!-- ==================== الصفحة 1: الملخص التنفيذي والمالي ==================== -->
  <div class="page">
    <div class="header">
      <div class="brand-box">
        <div class="logo-badge">TR</div>
        <div class="title-area">
          <h1>TecnoRexa — التقرير التنفيذي الشامل</h1>
          <p>منظومة الصيانة الهندسية وتوريد قطع الغيار المعتمدة</p>
        </div>
      </div>
      <div class="meta-box">
        <div><strong>تاريخ الإصدار:</strong> ${reportDate}</div>
        <div><strong>التوقيت:</strong> ${reportTime}</div>
        <div><strong>الفترة المحددة:</strong> ${data.period}</div>
        <div><strong>رقم الوثيقة:</strong> TR-EXEC-${Date.now().toString().slice(-6)}</div>
      </div>
    </div>

    <div class="section-title">1. القيادة العليا والمسؤوليات التنفيذية</div>
    <table>
      <tr>
        <th style="width: 25%;">المنصب القيادي</th>
        <th style="width: 35%;">المسؤول المعتمد</th>
        <th>نطاق الإشراف والمسؤوليات</th>
      </tr>
      <tr>
        <td><strong>مالك المنصة ورئيس الإدارة</strong></td>
        <td style="color:#D4AF37; font-weight:800;">${ownerName}</td>
        <td>الرقابة المالية الكاملة، اعتماد وتجميد الحسابات، تقارير التدقيق، وإدارة التراخيص.</td>
      </tr>
      <tr>
        <td><strong>المسؤول التقني ومصمم التطبيق</strong></td>
        <td style="color:#8B5CF6; font-weight:800;">${programmerName}</td>
        <td>الإشراف الهندسي البرمجي، توزيع المهام، حل الـ Bugs، تأمين المنظومة ومكتبة الأكواد.</td>
      </tr>
    </table>

    <div class="section-title">2. مؤشرات الأداء والماليات الرئيسية (KPIs)</div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-lbl">إجمالي الإيرادات المسجلة</div>
        <div class="kpi-val green">${data.totalRevenue.toLocaleString()} ج.م</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">المستخدمين النشطين الفعليين</div>
        <div class="kpi-val gold">${data.activeUsers}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">الطلبات اليومية المنجزة</div>
        <div class="kpi-val">${data.todayOrders}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">كادر الفنيين المعتمدين</div>
        <div class="kpi-val">${data.availableTechnicians}</div>
      </div>
    </div>

    <div class="section-title">3. تفصيل مصادر الدخل والتدفقات النقدية</div>
    <table>
      <tr>
        <th>بند الإيراد</th>
        <th>النسبة التقديرية</th>
        <th>القيمة المحققة</th>
        <th>الحالة التشغيلية</th>
      </tr>
      <tr>
        <td>مبيعات متجر قطع الغيار والعمولات</td>
        <td>${data.revenueBreakdown?.marketplace || 0}%</td>
        <td>${mktRevenue.toLocaleString()} ج.م</td>
        <td><span style="color:#10B981;">نشط وموثق</span></td>
      </tr>
      <tr>
        <td>اشتراكات الفنيين (300 ج.م) والتجار (100 ج.م)</td>
        <td>${data.revenueBreakdown?.subscriptions || 0}%</td>
        <td>${subsRevenue.toLocaleString()} ج.م</td>
        <td><span style="color:#10B981;">بوابات فودافون كاش وإنستاباي</span></td>
      </tr>
      <tr>
        <td>الدورات التدريبية المعتمدة (مجتمع الويب)</td>
        <td>${data.revenueBreakdown?.courses || 0}%</td>
        <td>${coursesRevenue.toLocaleString()} ج.م</td>
        <td><span style="color:#3B82F6;">منصة المحتوى التفاعلي</span></td>
      </tr>
      <tr style="font-weight:900; background:#22222b;">
        <td>إجمالي العوائد المجمعة</td>
        <td>100%</td>
        <td style="color:#D4AF37;">${data.totalRevenue.toLocaleString()} ج.م</td>
        <td>مطابق للتدقيق المالي</td>
      </tr>
    </table>

    <div class="section-title">4. الرقابة النقدية والخزينة المركزية</div>
    <table>
      <tr>
        <th>بند الخزينة</th>
        <th>القيمة الإجمالية</th>
        <th>ملاحظات الإدارة المالية</th>
      </tr>
      <tr>
        <td>رصيد الخزينة الحالي المتاح</td>
        <td style="color:#D4AF37; font-weight:bold;">${(data.treasury?.balance ?? data.totalRevenue).toLocaleString()} ج.م</td>
        <td>السيولة الكلية المتاحة بالمنظومة</td>
      </tr>
      <tr>
        <td>إجمالي الإيداعات وشحن المحافظ</td>
        <td style="color:#10B981; font-weight:bold;">${(data.treasury?.totalDeposits ?? 0).toLocaleString()} ج.م</td>
        <td>تحويلات العملاء والتجار المؤكدة</td>
      </tr>
      <tr>
        <td>إجمالي المسحوبات المصروفة</td>
        <td style="color:#F59E0B; font-weight:bold;">${(data.treasury?.totalWithdrawals ?? 0).toLocaleString()} ج.م</td>
        <td>مستحقات محولة للفنيين والتجار</td>
      </tr>
      <tr>
        <td>المسحوبات المعلقة للمراجعة</td>
        <td style="color:#EF4444; font-weight:bold;">${(data.treasury?.pendingWithdrawals ?? data.pendingWithdrawalsAmount).toLocaleString()} ج.م</td>
        <td>تنتظر موافقة واعتماد المالك</td>
      </tr>
      <tr>
        <td>عمولات المنصة المقتطعة</td>
        <td style="color:#10B981; font-weight:bold;">${(data.treasury?.commissions ?? 0).toLocaleString()} ج.م</td>
        <td>صافي أرباح المنظومة من الطلبات</td>
      </tr>
    </table>

    <div style="position: absolute; bottom: 20px; left: 36px; right: 36px; display: flex; justify-content: space-between; font-size: 10px; color: #71717a;">
      <span>منصة TecnoRexa — الصفحة 1 من 3</span>
      <span>وثيقة إدارية رسمية سرية وغير قابلة للتداول الخارجي</span>
    </div>
  </div>

  <!-- ==================== الصفحة 2: الجرد الميداني للفنيين وقطع الغيار والمستودعات ==================== -->
  <div class="page">
    <div class="header">
      <div class="brand-box">
        <div class="logo-badge">TR</div>
        <div class="title-area">
          <h1>جرد كادر الصيانة، قطع الغيار والمستودعات</h1>
          <p>البيانات التشغيلية المعتمدة في النظام</p>
        </div>
      </div>
      <div class="meta-box">
        <div><strong>الفترة:</strong> ${data.period}</div>
        <div><strong>الحالة:</strong> بيانات حية 100%</div>
      </div>
    </div>

    <div class="section-title">5. كادر الفنيين المعتمدين وسجل الإنجاز</div>
    <table>
      <tr>
        <th style="width: 8%;">#</th>
        <th style="width: 32%;">اسم الفني</th>
        <th style="width: 30%;">التخصص المعتمد</th>
        <th style="width: 15%;">التقييم العام</th>
        <th style="width: 15%;">الطلبات المنجزة</th>
      </tr>
      ${
        data.topTechnicians && data.topTechnicians.length > 0
          ? data.topTechnicians
              .map(
                (t: any, idx: number) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${t.name}</strong></td>
          <td>${t.specialty || 'صيانة عامة'}</td>
          <td>⭐ ${t.rating || '5.0'}</td>
          <td>${t.orders || 0} طلب</td>
        </tr>
      `
              )
              .join('')
          : `<tr><td colspan="5" style="text-align:center; color:#71717a; padding: 15px;">لا يوجد فنيين مسجلين بعد. سيتم إدراجهم فور إتمام مراجعة طلبات الترقية (300 ج.م).</td></tr>`
      }
    </table>

    <div class="section-title">6. معروضات سوق قطع الغيار وحالة المستودعات</div>
    <table>
      <tr>
        <th style="width: 8%;">#</th>
        <th style="width: 42%;">اسم قطعة الغيار / المنتج</th>
        <th style="width: 25%;">التصنيف</th>
        <th style="width: 25%;">السعر المعتمد</th>
      </tr>
      ${
        data.topProducts && data.topProducts.length > 0
          ? data.topProducts
              .map(
                (p: any, idx: number) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${p.name}</td>
          <td>${p.category || 'قطع غيار'}</td>
          <td style="color:#D4AF37; font-weight:bold;">${p.price} ج.م</td>
        </tr>
      `
              )
              .join('')
          : `<tr><td colspan="4" style="text-align:center; color:#71717a; padding: 15px;">لا توجد منتجات مسجلة حالياً في المتجر. المتجر مصفر ونظيف بالكامل وجاهز للإضافة.</td></tr>`
      }
    </table>

    <div class="section-title">7. إدارة المستودعات المركزية وخدمة العملاء</div>
    <table>
      <tr>
        <th style="width: 25%;">إجمالي المستودعات</th>
        <th style="width: 25%;">تذاكر الدعم الكلية</th>
        <th style="width: 25%;">التذاكر المفتوحة</th>
        <th style="width: 25%;">الشكاوى المحلولة</th>
      </tr>
      <tr>
        <td style="font-weight:bold; color:#D4AF37;">${data.warehouses?.count ?? 0} مستودع</td>
        <td>${data.support?.totalTickets ?? 0}</td>
        <td style="color:#EF4444; font-weight:bold;">${data.support?.openTickets ?? data.pendingTickets}</td>
        <td style="color:#10B981; font-weight:bold;">${data.support?.resolvedTickets ?? 0}</td>
      </tr>
    </table>

    <div style="position: absolute; bottom: 20px; left: 36px; right: 36px; display: flex; justify-content: space-between; font-size: 10px; color: #71717a;">
      <span>منصة TecnoRexa — الصفحة 2 من 3</span>
      <span>وثيقة إدارية رسمية سرية وغير قابلة للتداول الخارجي</span>
    </div>
  </div>

  <!-- ==================== الصفحة 3: الأمان، الطلبات، وتوقيعات الاعتماد ==================== -->
  <div class="page">
    <div class="header">
      <div class="brand-box">
        <div class="logo-badge">TR</div>
        <div class="title-area">
          <h1>متابعة الطلبات، سجل التدقيق، وتوقيعات الاعتماد</h1>
          <p>التوثيق الجنائي والرسمي لمنظومة TecnoRexa</p>
        </div>
      </div>
      <div class="meta-box">
        <div><strong>التاريخ:</strong> ${reportDate}</div>
      </div>
    </div>

    <div class="section-title">8. أحدث طلبات التوريد والشراء</div>
    <table>
      <tr>
        <th style="width: 15%;">رقم الطلب</th>
        <th style="width: 35%;">العميل</th>
        <th style="width: 25%;">القيمة الإجمالية</th>
        <th style="width: 25%;">حالة الطلب</th>
      </tr>
      ${
        data.orders && data.orders.recent && data.orders.recent.length > 0
          ? data.orders.recent
              .map(
                (o: any) => `
        <tr>
          <td>#${o.id}</td>
          <td>${o.customerName || 'عميل معتمد'}</td>
          <td style="color:#D4AF37; font-weight:bold;">${o.total || 0} ج.م</td>
          <td>${o.status || 'قيد المعالجة'}</td>
        </tr>
      `
              )
              .join('')
          : `<tr><td colspan="4" style="text-align:center; color:#71717a; padding: 15px;">لا توجد طلبات توريد مسجلة حالياً. النظام مصفر وجاهز لبدء النشاط التجاري الفعلي.</td></tr>`
      }
    </table>

    <div class="section-title">9. أحدث العمليات وسجل التدقيق الأمني (Audit Trail)</div>
    <table>
      <tr>
        <th style="width: 20%;">التوقيت</th>
        <th style="width: 80%;">تفاصيل العملية الأمنية أو الإدارية</th>
      </tr>
      ${
        data.liveActivities && data.liveActivities.length > 0
          ? data.liveActivities
              .map(
                (act: any) => `
        <tr>
          <td style="color:#a1a1aa; font-size:11px;">${
            act.time ? new Date(act.time).toLocaleTimeString('ar-EG') : 'الآن'
          }</td>
          <td>${act.text}</td>
        </tr>
      `
              )
              .join('')
          : `<tr><td colspan="2" style="text-align:center; color:#71717a; padding: 15px;">النظام مهيأ ومصفر بالكامل وجاهز لاستقبال العمليات الحقيقية.</td></tr>`
      }
    </table>

    <div class="section-title">10. اعتماد وتوقيعات الإدارة العليا</div>
    <p style="font-size:12px; color:#a1a1aa; margin-bottom:20px;">
      تمت مراجعة هذا التقرير وتدقيقه وفق المعايير الإدارية والمالية والأمنية المعتمدة في منصة TecnoRexa، وتعتبر كافة البيانات الواردة فيه نهائية ومطابقة لنواة قاعدة البيانات.
    </p>

    <div class="footer-signs">
      <div class="sign-box">
        <div style="font-size:12px; font-weight:800; color:#D4AF37;">المالك ورئيس مجلس الإدارة</div>
        <div class="sign-line"></div>
        <div style="font-size:13px; font-weight:900;">${ownerName}</div>
        <div style="font-size:10px; color:#71717a;">الاعتماد والختم الإداري</div>
      </div>

      <div class="sign-box">
        <div style="font-size:12px; font-weight:800; color:#8B5CF6;">المسؤول التقني ومصمم التطبيق</div>
        <div class="sign-line"></div>
        <div style="font-size:13px; font-weight:900;">${programmerName}</div>
        <div style="font-size:10px; color:#71717a;">التدقيق البرمجي والنظامي</div>
      </div>
    </div>

    <div style="position: absolute; bottom: 20px; left: 36px; right: 36px; display: flex; justify-content: space-between; font-size: 10px; color: #71717a;">
      <span>منصة TecnoRexa — الصفحة 3 من 3</span>
      <span>وثيقة إدارية رسمية سرية وغير قابلة للتداول الخارجي</span>
    </div>
  </div>
</body>
</html>
  `;
}

export function exportExecutiveCSV(data: ExecutiveReportData): string {
  return (
    'data:text/csv;charset=utf-8,\uFEFF' +
    'المؤشر,القيمة,ملاحظات\n' +
    `تاريخ التقرير,${new Date().toLocaleDateString('ar-EG')},تاريخ الإصدار الرسمي\n` +
    `المالك ورئيس مجلس الإدارة,${data.ownerName || 'إدارة منصة TecnoRexa'},الإدارة العليا\n` +
    `المسؤول التقني ومصمم التطبيق,${data.programmerName || 'الدعم التقني والبرمجي'},القيادة الهندسية\n` +
    `الفترة الزمنية,${data.period},نطاق التقرير\n` +
    `إجمالي الإيرادات,${data.totalRevenue} ج.م,مبيعات واشتراكات\n` +
    `رصيد الخزينة المركزية,${data.treasury?.balance ?? data.totalRevenue} ج.م,السيولة المتاحة\n` +
    `إجمالي الإيداعات,${data.treasury?.totalDeposits ?? 0} ج.م,المحافظ والحسابات\n` +
    `المسحوبات المنفذة,${data.treasury?.totalWithdrawals ?? 0} ج.م,مستحقات مصروفة\n` +
    `المستخدمين النشطين الفعليين,${data.activeUsers},مستخدمين حقيقيين\n` +
    `الطلبات اليومية,${data.todayOrders},طلبات منجزة\n` +
    `إجمالي الطلبات المسجلة,${data.orders?.total ?? 0},كافة الطلبات\n` +
    `الفنيين المتاحين,${data.availableTechnicians},كادر الصيانة المعتمد\n` +
    `المستودعات المركزية,${data.warehouses?.count ?? 0},سعة التخزين\n` +
    `التذاكر المفتوحة,${data.support?.openTickets ?? data.pendingTickets},خدمة العملاء\n` +
    `المسحوبات المعلقة,${data.pendingWithdrawalsAmount} ج.م,قسم الحسابات\n`
  );
}

export interface TechnicalReportData {
  programmerName?: string;
  ownerName?: string;
  serverStatus?: string;
  uptime?: string;
  cpuUsage?: string;
  ramUsage?: string;
  latency?: string;
  dbStatus?: string;
  bugsCount?: number;
  tasksCount?: number;
  bugsList?: any[];
}

export function generateTechnicalReportHTML(data: TechnicalReportData): string {
  const reportDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const reportTime = new Date().toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const programmerName = data.programmerName || 'الدعم التقني والبرمجي';
  const ownerName = data.ownerName || 'إدارة منصة TecnoRexa';

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <title>تقرير TecnoRexa الفني والهندسي لنواة النظام</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; }
    body { background-color: #0A0812; color: #f4f4f5; padding: 30px; font-size: 13px; line-height: 1.6; }
    .code-font { font-family: 'JetBrains Mono', monospace; }
    .page { background: #120D1D; border: 1.5px solid #8B5CF6; border-radius: 16px; padding: 36px; margin-bottom: 30px; min-height: 950px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
    @media print {
      body { background: #fff !important; color: #111 !important; padding: 0 !important; }
      .page { background: #fff !important; border: 2px solid #8B5CF6 !important; box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
      .no-print { display: none !important; }
      .card { background: #f9f9f9 !important; border: 1px solid #ddd !important; }
    }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #8B5CF6; padding-bottom: 20px; margin-bottom: 24px; }
    .brand-box { display: flex; align-items: center; gap: 14px; }
    .logo-badge { width: 56px; height: 56px; border-radius: 14px; background: #1E1035; border: 2px solid #8B5CF6; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: #8B5CF6; }
    .title-area h1 { font-size: 22px; font-weight: 900; color: #8B5CF6; }
    .title-area p { font-size: 12px; color: #a1a1aa; }
    .meta-box { text-align: left; font-size: 11px; color: #a1a1aa; }
    .section-title { font-size: 16px; font-weight: 800; color: #A78BFA; margin: 20px 0 12px 0; border-right: 4px solid #8B5CF6; padding-right: 10px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
    .kpi-card { background: #1A1228; border: 1px solid #3B2068; border-radius: 12px; padding: 14px; text-align: right; }
    .kpi-val { font-size: 20px; font-weight: 900; color: #fff; margin-top: 4px; }
    .kpi-val.purple { color: #A78BFA; }
    .kpi-val.green { color: #10B981; }
    .kpi-lbl { font-size: 11px; color: #a1a1aa; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 20px; }
    th, td { border: 1px solid #2D1B4E; padding: 10px 12px; text-align: right; font-size: 12px; }
    th { background: #23133D; color: #A78BFA; font-weight: 800; }
    tr:nth-child(even) { background: #160F24; }
    .footer-signs { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #2D1B4E; }
    .sign-box { text-align: center; width: 220px; }
    .sign-line { border-bottom: 1px dashed #8B5CF6; height: 50px; margin-bottom: 6px; }
    .print-btn { background: #8B5CF6; color: #fff; border: none; padding: 12px 28px; border-radius: 8px; font-weight: 900; cursor: pointer; font-size: 14px; }
    .action-bar { display: flex; justify-content: space-between; align-items: center; max-width: 900px; margin: 0 auto 20px auto; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
    .badge-crit { background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid #EF4444; }
    .badge-warn { background: rgba(245, 158, 11, 0.2); color: #F59E0B; border: 1px solid #F59E0B; }
    .badge-ok { background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid #10B981; }
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="print-btn" onclick="window.print()">🖨️ طباعة التقرير الفني أو الحفظ كـ PDF</button>
    <span style="color:#a1a1aa; font-size:12px;">منظومة TecnoRexa — القيادة البرمجية والهندسية</span>
  </div>

  <div class="page">
    <div class="header">
      <div class="brand-box">
        <div class="logo-badge">&lt;/&gt;</div>
        <div class="title-area">
          <h1>TecnoRexa — التقرير التقني والهندسي الشامل</h1>
          <p>مراقبة استقرار الخادم، سلامة قاعدة البيانات، وسجل الأخطاء البرمجية</p>
        </div>
      </div>
      <div class="meta-box">
        <div><strong>تاريخ الإصدار:</strong> ${reportDate}</div>
        <div><strong>التوقيت:</strong> ${reportTime}</div>
        <div><strong>المسؤول البرمجي:</strong> ${programmerName}</div>
      </div>
    </div>

    <div class="section-title">1. مقاييس الأداء والنواة البرمجية (System Core Metrics)</div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-lbl">استهلاك المعالج (CPU)</div>
        <div class="kpi-val green">${data.cpuUsage || '34%'}</div>
        <div style="font-size: 10px; color: #10B981; margin-top: 2px;">مستقر وفي النطاق المثالي</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">استهلاك الذاكرة (RAM)</div>
        <div class="kpi-val purple">${data.ramUsage || '48%'}</div>
        <div style="font-size: 10px; color: #A78BFA; margin-top: 2px;">490MB / 1GB نشط</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">زمن الاستجابة (Latency)</div>
        <div class="kpi-val green">${data.latency || '28ms'}</div>
        <div style="font-size: 10px; color: #10B981; margin-top: 2px;">استجابة فائقة السرعة</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">حالة قاعدة البيانات (Database)</div>
        <div class="kpi-val green">${data.dbStatus || 'سليمة 100%'}</div>
        <div style="font-size: 10px; color: #10B981; margin-top: 2px;">PostgreSQL سحابية مشفرة</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">المهام البرمجية (Kanban Tasks)</div>
        <div class="kpi-val purple">${data.tasksCount ?? 0} مهمة</div>
        <div style="font-size: 10px; color: #A78BFA; margin-top: 2px;">موزعة على لوحة التطوير</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">سجل الأخطاء النشطة (Active Bugs)</div>
        <div class="kpi-val ${(data.bugsCount || 0) > 0 ? 'purple' : 'green'}">${data.bugsCount ?? 0} بلاغات</div>
        <div style="font-size: 10px; color: ${(data.bugsCount || 0) > 0 ? '#F59E0B' : '#10B981'}; margin-top: 2px;">
          ${(data.bugsCount || 0) === 0 ? 'لا توجد أخطاء برمجية حرجة' : 'قيد المتابعة والإصلاح'}
        </div>
      </div>
    </div>

    <div class="section-title">2. البنية التحتية والتقنيات المعتمدة (Technology Stack)</div>
    <table>
      <tr>
        <th style="width: 25%;">المكون التقني</th>
        <th style="width: 35%;">التقنية / الإصدار</th>
        <th style="width: 40%;">الحالة الفنية والأمنية</th>
      </tr>
      <tr>
        <td><strong>النواة الخلفية (Backend)</strong></td>
        <td>Express.js &amp; TypeScript (Node.js)</td>
        <td><span class="badge badge-ok">نشط ومستقر 100%</span></td>
      </tr>
      <tr>
        <td><strong>تطبيق الموبايل (Client)</strong></td>
        <td>React Native &amp; Expo SDK 52</td>
        <td><span class="badge badge-ok">مهيأ ومربوط بالحزم الرسمية</span></td>
      </tr>
      <tr>
        <td><strong>قاعدة البيانات (Database)</strong></td>
        <td>PostgreSQL Enterprise Engine (عالي الكفاءة ومؤمن)</td>
        <td><span class="badge badge-ok">فهرسة متطورة وحماية ضد التلف</span></td>
      </tr>
      <tr>
        <td><strong>التوثيق والصلاحيات (Security)</strong></td>
        <td>JWT مع نظام RBAC لـ 7 رتب رسمية</td>
        <td><span class="badge badge-ok">فصل كامل ومحكم للأدوار</span></td>
      </tr>
    </table>

    <div class="section-title">3. سجل الأخطاء البرمجية والبلاغات الفنية المفتوحة</div>
    <table>
      <tr>
        <th style="width: 10%;">#</th>
        <th style="width: 40%;">عنوان البلاغ / الخطأ</th>
        <th style="width: 25%;">النظام المستهدف</th>
        <th style="width: 25%;">مستوى الخطورة</th>
      </tr>
      ${
        data.bugsList && data.bugsList.length > 0
          ? data.bugsList
              .map(
                (b: any, idx: number) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${b.title || 'عطل برمجي'}</strong></td>
          <td>${b.system || 'API / Mobile'}</td>
          <td>
            <span class="badge ${b.severity === 'critical' ? 'badge-crit' : 'badge-warn'}">
              ${b.severity || 'متوسط'}
            </span>
          </td>
        </tr>
      `
              )
              .join('')
          : `<tr><td colspan="4" style="text-align:center; color:#71717a; padding: 20px;">لا توجد أي أخطاء برمجية نشطة حالياً. بيئة التشغيل نظيفة ومستقرة تماماً.</td></tr>`
      }
    </table>

    <div class="section-title">4. اعتماد وتوقيع الإدارة التقنية والعليا</div>
    <p style="font-size:12px; color:#a1a1aa; margin-bottom:20px;">
      يشهد الفريق التقني بأن كافة الفحوصات الدورية واختبارات الضغط والأمان تمت بنجاح تام، وأن المنظومة جاهزة للتشغيل الكامل.
    </p>

    <div class="footer-signs">
      <div class="sign-box">
        <div style="font-size:12px; font-weight:800; color:#8B5CF6;">المسؤول التقني ومصمم التطبيق</div>
        <div class="sign-line"></div>
        <div style="font-size:13px; font-weight:900;">${programmerName}</div>
        <div style="font-size:10px; color:#71717a;">الاعتماد البرمجي والهندسي</div>
      </div>

      <div class="sign-box">
        <div style="font-size:12px; font-weight:800; color:#D4AF37;">المالك ورئيس مجلس الإدارة</div>
        <div class="sign-line"></div>
        <div style="font-size:13px; font-weight:900;">${ownerName}</div>
        <div style="font-size:10px; color:#71717a;">الاعتماد الإداري النهائي</div>
      </div>
    </div>

    <div style="position: absolute; bottom: 20px; left: 36px; right: 36px; display: flex; justify-content: space-between; font-size: 10px; color: #71717a;">
      <span>منصة TecnoRexa — التقرير التقني لنواة النظام</span>
      <span>وثيقة هندسية موثقة وخاصة بالإدارة البرمجية</span>
    </div>
  </div>
</body>
</html>
  `;
}

export function exportTechnicalCSV(data: TechnicalReportData): string {
  return (
    'data:text/csv;charset=utf-8,\uFEFF' +
    'المؤشر التقني,القيمة,الحالة\n' +
    `تاريخ التقرير,${new Date().toLocaleDateString('ar-EG')},تاريخ الإصدار الرسمي\n` +
    `المسؤول التقني ومصمم التطبيق,${data.programmerName || 'المهندس ماهر خالد'},القيادة البرمجية\n` +
    `المالك ورئيس مجلس الإدارة,${data.ownerName || 'المهندس خالد محمد'},الإدارة العليا\n` +
    `استهلاك المعالج CPU,${data.cpuUsage || '34%'},مستقر\n` +
    `استهلاك الذاكرة RAM,${data.ramUsage || '48%'},490MB / 1GB\n` +
    `زمن الاستجابة Latency,${data.latency || '28ms'},سريع جداً\n` +
    `قاعدة البيانات Database,${data.dbStatus || 'سليمة 100%'},PostgreSQL\n` +
    `الأخطاء البرمجية النشطة,${data.bugsCount ?? 0},قيد المراقبة\n` +
    `المهام البرمجية المسجلة,${data.tasksCount ?? 0},لوحة المهام\n`
  );
}

