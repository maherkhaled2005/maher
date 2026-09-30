// src/utils/pdfExport.ts
import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface ReportUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  status?: string;
  balance?: number;
  createdAt: string;
  specialty?: string;
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  creatorName: string;
  creatorRole: string;
  users: ReportUser[];
}

const getRoleArabicName = (role: string): string => {
  const map: Record<string, string> = {
    owner: 'المالك والمشرف العام',
    manager: 'المدير العام والتشغيلي',
    programmer: 'فريق البرمجة والتطوير',
    customer_support: 'دعم العملاء والمساندة',
    technician: 'فني معتمد',
    merchant: 'تاجر قطع غيار',
    customer: 'عميل المنصة',
  };
  return map[role.toLowerCase()] || role;
};

const getStatusArabicName = (status?: string): string => {
  if (status === 'active') return 'نشط ومفعل';
  if (status === 'pending') return 'قيد المراجعة';
  if (status === 'suspended') return 'معلق';
  if (status === 'blocked') return 'محظور';
  return status || 'نشط';
};

export async function exportUsersToPDF({
  title,
  subtitle,
  creatorName,
  creatorRole,
  users,
}: PDFExportOptions): Promise<void> {
  const isOwner = creatorRole.toLowerCase() === 'owner';
  const isManager = creatorRole.toLowerCase() === 'manager';
  const generatedAt = new Date().toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const techCount = users.filter((u) => u.role === 'technician').length;
  const merchantCount = users.filter((u) => u.role === 'merchant').length;
  const customerCount = users.filter((u) => u.role === 'customer').length;

  const rowsHtml = users
    .map(
      (u, idx) => `
      <tr>
        <td style="text-align: center; width: 40px;">${idx + 1}</td>
        <td style="font-weight: bold;">${u.name || 'بدون اسم'}</td>
        <td dir="ltr" style="text-align: right; font-family: monospace;">${u.phone || '—'}</td>
        <td>${getRoleArabicName(u.role)}</td>
        <td style="text-align: center;">
          <span class="status-badge ${u.status === 'active' ? 'status-active' : 'status-other'}">
            ${getStatusArabicName(u.status)}
          </span>
        </td>
        <td style="text-align: center; font-weight: bold;">${Number(u.balance || 0).toLocaleString()} ج.م</td>
        <td style="text-align: center; font-size: 10px; color: #64748B;">
          ${u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-EG') : '—'}
        </td>
      </tr>`
    )
    .join('');

  // Phase 18: Dynamic Signatures Block
  let signaturesHtml = '';
  if (isOwner) {
    signaturesHtml = `
      <div class="signatures-wrapper">
        <div class="sig-card">
          <div class="sig-title">المالك والمشرف العام</div>
          <div class="sig-name">${creatorName}</div>
          <div class="sig-line">التوقيع: ___________________________</div>
          <div class="sig-date">التاريخ: ___________________________</div>
        </div>
        <div class="sig-card">
          <div class="sig-title">رئيس الفريق التقني (Main Programmer)</div>
          <div class="sig-name">المسؤول التقني المعتمد</div>
          <div class="sig-line">التوقيع: ___________________________</div>
          <div class="sig-date">التاريخ: ___________________________</div>
        </div>
      </div>`;
  } else if (isManager) {
    signaturesHtml = `
      <div class="signatures-wrapper">
        <div class="sig-card">
          <div class="sig-title">إعداد: المدير العام</div>
          <div class="sig-name">${creatorName}</div>
          <div class="sig-line">التوقيع: ___________________________</div>
          <div class="sig-date">التاريخ: ___________________________</div>
        </div>
        <div class="sig-card">
          <div class="sig-title">اعتماد: المالك العام</div>
          <div class="sig-name">إدارة المنصة العليا</div>
          <div class="sig-line">التوقيع: ___________________________</div>
          <div class="sig-date">التاريخ: ___________________________</div>
        </div>
        <div class="sig-card">
          <div class="sig-title">التدقيق التقني</div>
          <div class="sig-name">الإدارة الهندسية</div>
          <div class="sig-line">التوقيع: ___________________________</div>
          <div class="sig-date">التاريخ: ___________________________</div>
        </div>
      </div>`;
  } else {
    signaturesHtml = `
      <div class="signatures-wrapper">
        <div class="sig-card">
          <div class="sig-title">معد التقرير</div>
          <div class="sig-name">${creatorName} (${getRoleArabicName(creatorRole)})</div>
          <div class="sig-line">التوقيع: ___________________________</div>
          <div class="sig-date">التاريخ: ___________________________</div>
        </div>
      </div>`;
  }

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 12mm 16mm 12mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", Tahoma, sans-serif;
      background-color: #FFFFFF !important;
      color: #0F172A !important;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.5;
    }
    .header-box {
      border-bottom: 2.5px solid #D4AF37;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 900;
      color: #0F172A;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .brand-gold {
      color: #D4AF37;
    }
    .report-title {
      font-size: 16px;
      font-weight: 800;
      color: #1E293B;
      margin: 4px 0 0 0;
    }
    .report-meta {
      font-size: 10px;
      color: #64748B;
      text-align: left;
      line-height: 1.6;
    }
    .stats-grid {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
    }
    .stat-card {
      flex: 1;
      background: #F8FAFC !important;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 8px 10px;
      text-align: center;
    }
    .stat-val {
      font-size: 15px;
      font-weight: 900;
      color: #0F172A;
    }
    .stat-lbl {
      font-size: 10px;
      color: #64748B;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background-color: #FFFFFF !important;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
    }
    th {
      background-color: #F8FAFC !important;
      color: #0F172A !important;
      font-weight: 800;
      padding: 9px 8px;
      font-size: 11px;
      text-align: right;
      border: 1px solid #E2E8F0;
      border-bottom: 2px solid #D4AF37 !important;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #E2E8F0;
      font-size: 10.5px;
      color: #1E293B;
    }
    tr:nth-child(even) td {
      background-color: #F8FAFC !important;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 9.5px;
      font-weight: 700;
    }
    .status-active {
      background-color: #DCFCE7 !important;
      color: #166534 !important;
      border: 1px solid #BBF7D0;
    }
    .status-other {
      background-color: #FEF3C7 !important;
      color: #92400E !important;
      border: 1px solid #FDE68A;
    }
    .signatures-wrapper {
      margin-top: 26px;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      page-break-inside: avoid;
    }
    .sig-card {
      flex: 1;
      border: 1px solid #CBD5E1;
      background: #F8FAFC !important;
      border-radius: 6px;
      padding: 12px 14px;
      text-align: center;
    }
    .sig-title {
      font-weight: 800;
      color: #0F172A;
      font-size: 11px;
      margin-bottom: 2px;
    }
    .sig-name {
      color: #64748B;
      font-size: 10px;
      margin-bottom: 16px;
    }
    .sig-line {
      font-size: 10.5px;
      color: #334155;
      margin-bottom: 6px;
    }
    .sig-date {
      font-size: 10px;
      color: #64748B;
    }
    .footer {
      margin-top: 20px;
      border-top: 1px solid #E2E8F0;
      padding-top: 8px;
      font-size: 9px;
      color: #94A3B8;
      display: flex;
      justify-content: space-between;
      align-items: center;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div>
      <div class="brand-title">Tecno<span class="brand-gold">Rexa</span> Platform</div>
      <div class="report-title">${title}</div>
      ${subtitle ? `<div style="font-size: 11px; color: #64748B; margin-top: 2px;">${subtitle}</div>` : ''}
    </div>
    <div class="report-meta">
      <div><strong>تاريخ الإصدار:</strong> ${generatedAt}</div>
      <div><strong>مُعد التقرير:</strong> ${creatorName}</div>
      <div><strong>الصفة الإدارية:</strong> ${getRoleArabicName(creatorRole)}</div>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-val">${totalUsers}</div>
      <div class="stat-lbl">إجمالي الحسابات</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #16A34A;">${activeUsers}</div>
      <div class="stat-lbl">حسابات نشطة</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #D4AF37;">${techCount}</div>
      <div class="stat-lbl">فنيين معتمدين</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color: #2563EB;">${merchantCount}</div>
      <div class="stat-lbl">تجار قطع الغيار</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${customerCount}</div>
      <div class="stat-lbl">عملاء المنصة</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align: center; width: 40px;">#</th>
        <th>الاسم الثلاثي</th>
        <th style="text-align: right;">رقم الهاتف</th>
        <th>الدور والصفة</th>
        <th style="text-align: center;">الحالة</th>
        <th style="text-align: center;">الرصيد</th>
        <th style="text-align: center;">تاريخ التسجيل</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  ${signaturesHtml}

  <div class="footer">
    <div>منظومة TecnoRexa المتكاملة لصيانة الأجهزة المنزلية — تقرير رسمي صادر من السجل المركزي الموحد</div>
    <div>الصفحات مرقمة ومحفوظة آلياً | الإصدار 1.0.0</div>
  </div>
</body>
</html>`;

  try {
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      } else {
        Alert.alert('تنبيه', 'يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.');
      }
    } else {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: title,
        });
      } else {
        Alert.alert('تم التصدير', `تم حفظ تقرير PDF بنجاح في:\n${uri}`);
      }
    }
  } catch (error: any) {
    Alert.alert('خطأ في التصدير', error?.message || 'تعذر توليد ملف PDF.');
  }
}

export interface OrderInvoiceOptions {
  order: any;
}

export async function exportOrderInvoiceToPDF({ order }: OrderInvoiceOptions): Promise<void> {
  const isMaintenance = order?.type === 'maintenance';
  const orderId = order?.id || 'ORD-000';
  const customerName = order?.customerName || order?.user?.name || 'العميل المعتمد';
  const techName = order?.technicianName || order?.technician?.name || (isMaintenance ? 'الفني المعتمد' : 'المتجر المعتمد');
  const total = Number(order?.total || 0).toLocaleString();
  const dateStr = order?.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG');
  const items = Array.isArray(order?.items) ? order.items : [];

  const itemsHtml = items.map((it: any, idx: number) => `
    <tr>
      <td style="text-align: center; width: 40px;">${idx + 1}</td>
      <td style="font-weight: bold;">${it.name || it.productName || 'بند طلب'}</td>
      <td style="text-align: center;">${it.quantity || 1}</td>
      <td style="text-align: center;">${Number(it.price || 0).toLocaleString()} ج.م</td>
      <td style="text-align: center; font-weight: bold;">${(Number(it.price || 0) * (it.quantity || 1)).toLocaleString()} ج.م</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>فاتورة وتقرير معتمد #${orderId}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; color: #1e293b; padding: 30px; margin: 0; direction: rtl; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #D4AF37; padding-bottom: 20px; margin-bottom: 25px; }
    .logo-text { font-size: 26px; font-weight: 900; color: #0f172a; }
    .logo-text span { color: #D4AF37; }
    .badge { background: rgba(212,175,55,0.15); color: #B45309; padding: 6px 14px; border-radius: 8px; font-weight: bold; font-size: 13px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .info-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
    .info-label { color: #64748b; font-weight: 600; }
    .info-value { color: #0f172a; font-weight: 800; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    th { background: #f8fafc; color: #0f172a; border-bottom: 2.5px solid #D4AF37; padding: 12px; font-size: 12px; font-weight: 800; text-align: right; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; }
    .total-box { display: flex; justify-content: flex-end; margin-bottom: 25px; }
    .total-card { background: #f8fafc; color: #0f172a; border: 1.5px solid #D4AF37; padding: 15px 25px; border-radius: 10px; text-align: left; }
    .total-card span { color: #B45309; font-size: 20px; font-weight: 900; }
    .warranty-box { background: #f0fdf4; border: 1.5px solid #22c55e; border-radius: 10px; padding: 15px; margin-bottom: 25px; text-align: right; }
    .warranty-title { color: #15803d; font-weight: 900; font-size: 14px; margin-bottom: 5px; }
    .warranty-desc { color: #166534; font-size: 11px; line-height: 18px; }
    .footer { text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo-text">Tecno<span>Rexa</span></div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">المنظومة الذكية لصيانة وتوريد الأجهزة المنزلية</div>
    </div>
    <div style="text-align: left;">
      <div class="badge">${isMaintenance ? 'شهادة صيانة وضمان معتمد' : 'فاتورة شراء رسمية'}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 6px;">رقم الطلب: #${orderId}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-row"><span class="info-label">اسم العميل:</span><span class="info-value">${customerName}</span></div>
    <div class="info-row"><span class="info-label">تاريخ العملية:</span><span class="info-value">${dateStr}</span></div>
    <div class="info-row"><span class="info-label">${isMaintenance ? 'الفني المعتمد:' : 'المتجر / التاجر:'}</span><span class="info-value">${techName}</span></div>
    <div class="info-row"><span class="info-label">حالة الطلب:</span><span class="info-value">${order?.status === 'completed' ? 'مكتمل بنجاح ✅' : order?.status || 'نشط'}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align: center; width: 40px;">#</th>
        <th>البيان / الخدمة</th>
        <th style="text-align: center;">الكمية</th>
        <th style="text-align: center;">السعر الفردي</th>
        <th style="text-align: center;">الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml || `<tr><td style="text-align:center;">1</td><td>${order?.deviceType ? `صيانة وإصلاح ${order.deviceType} (${order.deviceBrand || ''})` : 'خدمة صيانة وإصلاح أجهزة منزلية'}</td><td style="text-align:center;">1</td><td style="text-align:center;">${total} ج.م</td><td style="text-align:center; font-weight:bold;">${total} ج.م</td></tr>`}
    </tbody>
  </table>

  <div class="total-box">
    <div class="total-card">
      <div style="font-size: 12px; color: #475569; font-weight: bold;">المبلغ الإجمالي النهائي:</div>
      <div style="margin-top: 4px;"><span>${total} ج.م</span></div>
    </div>
  </div>

  <div class="warranty-box">
    <div class="warranty-title">🛡️ شهادة الضمان والاعتماد الرسمي من TecnoRexa</div>
    <div class="warranty-desc">
      تضمن منصة TecnoRexa أعمال الصيانة وقطع الغيار الموضحة أعلاه وفق معايير الجودة الفنية المعتمدة. في حال حدوث أي عطل ضمن فترة الضمان المقررة، يرجى تقديم رقم هذا الطلب #${orderId} لخدمة العملاء.
    </div>
  </div>

  <div class="footer">
    تم استخراج هذه الوثيقة آلياً من منصة TecnoRexa | جميع الحقوق محفوظة &copy; ${new Date().getFullYear()}
  </div>
</body>
</html>`;

  try {
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      } else {
        Alert.alert('تنبيه', 'يرجى السماح بالنوافذ المنبثقة لطباعة الفاتورة.');
      }
    } else {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `فاتورة طلب #${orderId}`,
        });
      } else {
        Alert.alert('تم التصدير', `تم حفظ الفاتورة بنجاح في:\n${uri}`);
      }
    }
  } catch (error: any) {
    Alert.alert('خطأ في التصدير', error?.message || 'تعذر توليد ملف الفاتورة PDF.');
  }
}
