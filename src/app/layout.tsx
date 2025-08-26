import type { Metadata } from 'next';
import Image from 'next/image';
import { Upload, Loader2, Download, RefreshCw, CheckCircle2, XCircle, Archive, Settings } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';

// ... (rest of the component code is unchanged)

export const metadata: Metadata = {
  title: "WebP 일괄 변환기 | 빠르고 간편한 이미지 최적화",
  description: "여러 장의 JPG, PNG 이미지를 한 번에 WebP로 변환하여 웹사이트 로딩 속도를 개선하세요. 품질, 해상도 조절 및 ZIP 다운로드를 지원합니다.",
  manifest: "/manifest.json",
  themeColor: "#111827",
  applicationName: "WebP 변환기",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WebP 변환기",
  },
  openGraph: {
    title: "WebP 일괄 변환기",
    description: "클라이언트 사이드에서 작동하는 빠르고 강력한 WebP 변환기",
    url: "https://webp-conversion.vercel.app/",
    siteName: "WebP Converter",
    images: [
      {
        url: '/og-image.png', // Must be an absolute URL
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "WebP 일괄 변환기",
    description: "클라이언트 사이드에서 작동하는 빠르고 강력한 WebP 변환기",
    images: ['/og-image.png'], // Must be an absolute URL
  },
};


export default function Home() {
  // ... (rest of the component is unchanged)
}
