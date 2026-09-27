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
      background-color: #0F172A !important;
      color: #FFFFFF !important;
      font-weight: 800;
      padding: 8px 6px;
      font-size: 11px;
      text-align: right;
      border: 1px solid #0F172A;
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
