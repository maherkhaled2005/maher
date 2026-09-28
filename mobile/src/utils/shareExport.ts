import { Platform, Share } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

/**
 * Real file export for phone/tablet.
 *
 * Previously the dashboards just showed "تم التصدير" without producing any
 * file on mobile. This writes a real file to the cache directory and opens the
 * system share sheet so the user actually receives the report.
 */
export async function shareTextAsFile(
  content: string,
  fileName: string,
  mimeType = "text/plain",
): Promise<string> {
  if (Platform.OS === "web") {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return fileName;
  }

  const dir: any = (FileSystem as any).cacheDirectory;
  if (!dir)
    throw new Error("تعذر الوصول لمساحة التخزين المؤقتة على هذا الجهاز");

  const uri = `${dir}${fileName}`;
  await (FileSystem as any).writeAsStringAsync(uri, content, {
    encoding: (FileSystem as any).EncodingType?.UTF8 ?? "utf8",
  });

  const canShare = await Sharing.isAvailableAsync().catch(() => false);
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType,
      dialogTitle: "مشاركة التقرير",
      UTI: "public.plain-text",
    });
  } else {
    // Fall back to the generic share sheet with the content itself.
    await Share.share({ title: fileName, message: content });
  }

  return uri;
}

export default shareTextAsFile;
