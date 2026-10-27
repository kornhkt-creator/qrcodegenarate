"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type QrType = "url" | "text" | "email" | "phone" | "wifi";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [type, setType] = useState<QrType>("url");
  const [content, setContent] = useState("https://example.com");
  const [size, setSize] = useState(512);
  const [dark, setDark] = useState("#172554");
  const [light, setLight] = useState("#ffffff");
  const [ecc, setEcc] = useState<"L" | "M" | "Q" | "H">("H");
  const [margin, setMargin] = useState(3);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoScale, setLogoScale] = useState(20);
  const [rounded, setRounded] = useState(false);
  const [message, setMessage] = useState("");

  const qrValue = type === "email" && content && !content.startsWith("mailto:")
    ? `mailto:${content}`
    : type === "phone" && content && !content.startsWith("tel:")
      ? `tel:${content}`
      : content;

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      await QRCode.toCanvas(canvas, qrValue || " ", {
        width: size,
        margin,
        errorCorrectionLevel: ecc,
        color: { dark, light },
      });
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (logo) {
        const img = new Image();
        img.onload = () => {
          const w = size * (logoScale / 100);
          const pad = Math.max(5, size * 0.012);
          const x = (size - w) / 2;
          const y = (size - w) / 2;
          ctx.save();
          ctx.fillStyle = light;
          ctx.beginPath();
          const r = rounded ? w * 0.2 : w * 0.08;
          ctx.roundRect(x - pad, y - pad, w + pad * 2, w + pad * 2, r);
          ctx.fill();
          ctx.drawImage(img, x, y, w, w);
          ctx.restore();
        };
        img.src = logo;
      }
      setMessage("");
    } catch {
      setMessage("สร้าง QR Code ไม่สำเร็จ กรุณาตรวจสอบข้อมูล");
    }
  }, [qrValue, size, margin, ecc, dark, light, logo, logoScale, rounded]);

  useEffect(() => { void draw(); }, [draw]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadSvg = async () => {
    try {
      const svg = await QRCode.toString(qrValue || " ", {
        type: "svg", width: size, margin, errorCorrectionLevel: ecc,
        color: { dark, light },
      });
      const svgWithLogo = logo ? await addLogoToSvg(svg, logo, logoScale, light, rounded) : svg;
      const blob = new Blob([svgWithLogo], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = "qr-code.svg"; link.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage("ดาวน์โหลด SVG ไม่สำเร็จ");
    }
  };

  const uploadLogo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("กรุณาเลือกไฟล์รูปภาพ");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("ไฟล์โลโก้ต้องมีขนาดไม่เกิน 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
    setMessage("");
  };

  const reset = () => {
    setType("url"); setContent("https://example.com"); setSize(512);
    setDark("#172554"); setLight("#ffffff"); setEcc("H"); setMargin(3);
    setLogo(null); setLogoScale(20); setRounded(false);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-icon">▦</span><span>QR<span className="brand-accent">Studio</span></span></a>
        <span className="top-note"><span className="live-dot" /> ฟรี · ใช้งานได้ทันที</span>
      </header>

      <section className="hero">
        <div className="eyebrow"><span>✦</span> YOUR QR, YOUR STYLE</div>
        <h1>สร้าง QR Code<br /><span>ในสไตล์ของคุณ</span></h1>
        <p>ปรับสี เลือกขนาด เพิ่มโลโก้ และดาวน์โหลดได้ในไม่กี่คลิก</p>
      </section>

      <section className="workspace">
        <div className="panel settings-panel">
          <div className="panel-heading"><div><span className="step">01</span><h2>ตั้งค่า QR Code</h2></div><button className="text-button" onClick={reset}>↺ รีเซ็ต</button></div>

          <label className="field-label">ประเภทข้อมูล</label>
          <div className="type-grid">
            {([
              ["url", "↗", "เว็บไซต์"], ["text", "T", "ข้อความ"], ["phone", "⌕", "โทรศัพท์"],
              ["email", "✉", "อีเมล"], ["wifi", "⌁", "Wi-Fi"],
            ] as [QrType, string, string][]).map(([value, icon, label]) => (
              <button key={value} className={`type-option ${type === value ? "selected" : ""}`} onClick={() => {
                setType(value);
                if (value === "url") setContent("https://example.com");
                if (value === "text") setContent("สวัสดี! ขอบคุณที่สแกน QR Code");
                if (value === "phone") setContent("+66812345678");
                if (value === "email") setContent("hello@example.com");
                if (value === "wifi") setContent("WIFI:T:WPA;S:MyWiFi;P:password123;;");
              }}><span className="type-icon">{icon}</span><span>{label}</span></button>
            ))}
          </div>

          <label className="field-label" htmlFor="content">{type === "url" ? "ลิงก์เว็บไซต์" : type === "text" ? "ข้อความที่ต้องการ" : type === "phone" ? "หมายเลขโทรศัพท์" : type === "email" ? "อีเมล" : "ข้อมูล Wi-Fi (รูปแบบ QR Wi-Fi)"}</label>
          {type === "text" || type === "wifi" ? <textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="กรอกข้อมูลที่ต้องการ..." /> : <input id="content" value={content} onChange={e => setContent(e.target.value)} placeholder="กรอกข้อมูลที่ต้องการ..." />}
          <p className="helper">{type === "wifi" ? "รูปแบบตัวอย่าง: WIFI:T:WPA;S:ชื่อWiFi;P:รหัสผ่าน;;" : "ข้อมูลจะถูกสร้างเป็น QR Code บนอุปกรณ์ของคุณ"}</p>

          <div className="section-divider" />
          <div className="panel-subheading"><span className="mini-icon">◈</span><h3>สีและรูปลักษณ์</h3></div>
          <div className="color-row">
            <div className="color-control"><label className="field-label" htmlFor="dark">สี QR Code</label><div className="color-input"><input id="dark" type="color" value={dark} onChange={e => setDark(e.target.value)} /><code>{dark.toUpperCase()}</code></div></div>
            <div className="color-control"><label className="field-label" htmlFor="light">สีพื้นหลัง</label><div className="color-input"><input id="light" type="color" value={light} onChange={e => setLight(e.target.value)} /><code>{light.toUpperCase()}</code></div></div>
          </div>
          <div className="preset-row" aria-label="ชุดสีสำเร็จรูป">
            {[["#172554","#FFFFFF"],["#000000","#FFFFFF"],["#166534","#F0FDF4"],["#7C2D12","#FFF7ED"],["#6D28D9","#FAF5FF"],["#FFFFFF","#111827"]].map(([d,l]) =>
              <button key={d+l} className="swatch" title={`สี ${d} บนพื้น ${l}`} style={{background:l, borderColor:d}} onClick={() => {setDark(d);setLight(l);}}><span style={{background:d}} /></button>
            )}
          </div>

          <div className="section-divider" />
          <div className="panel-subheading"><span className="mini-icon">⤢</span><h3>ขนาดและคุณภาพ</h3></div>
          <div className="field-row"><label className="field-label" htmlFor="size">ขนาดไฟล์</label><strong>{size} × {size} px</strong></div>
          <input className="range" id="size" type="range" min="256" max="2048" step="128" value={size} onChange={e => setSize(Number(e.target.value))} />
          <div className="range-labels"><span>256 px</span><span>2048 px</span></div>
          <div className="field-row compact-row"><label className="field-label" htmlFor="ecc">ระดับแก้ไขข้อผิดพลาด</label><select id="ecc" value={ecc} onChange={e => setEcc(e.target.value as "L"|"M"|"Q"|"H")}><option value="L">L · ต่ำ</option><option value="M">M · ปกติ</option><option value="Q">Q · สูง</option><option value="H">H · สูงสุด</option></select></div>
          <div className="field-row compact-row"><label className="field-label" htmlFor="margin">ขอบรอบ QR Code</label><select id="margin" value={margin} onChange={e => setMargin(Number(e.target.value))}><option value={0}>ไม่มีขอบ</option><option value={2}>เล็ก</option><option value={3}>ปกติ</option><option value={5}>กว้าง</option></select></div>

          <div className="section-divider" />
          <div className="panel-subheading"><span className="mini-icon">▣</span><h3>โลโก้ตรงกลาง</h3><span className="optional">ไม่บังคับ</span></div>
          <label className="upload-box">
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => uploadLogo(e.target.files?.[0])} />
            {logo ? <><img className="uploaded-logo" src={logo} alt="ตัวอย่างโลโก้" /><span><strong>อัปโหลดโลโก้แล้ว</strong><small>คลิกเพื่อเปลี่ยนรูป</small></span><button type="button" className="remove-logo" onClick={e => {e.preventDefault();setLogo(null);}}>ลบ</button></> : <><span className="upload-icon">↑</span><span><strong>คลิกเพื่ออัปโหลดโลโก้</strong><small>PNG, JPG, WebP หรือ SVG · สูงสุด 5 MB</small></span></>}
          </label>
          {logo && <><div className="field-row"><label className="field-label" htmlFor="logoScale">ขนาดโลโก้</label><strong>{logoScale}%</strong></div><input id="logoScale" className="range" type="range" min="10" max="28" step="2" value={logoScale} onChange={e => setLogoScale(Number(e.target.value))} /><label className="toggle-row"><input type="checkbox" checked={rounded} onChange={e => setRounded(e.target.checked)} /><span>พื้นหลังโลโก้มุมโค้ง</span></label><p className="helper">แนะนำระดับแก้ไขข้อผิดพลาด H เมื่อใส่โลโก้ เพื่อช่วยให้สแกนได้ง่ายขึ้น</p></>}
        </div>

        <aside className="preview-column">
          <div className="preview-card">
            <div className="preview-top"><div><span className="step">02</span><h2>ตัวอย่าง</h2></div><span className="preview-live"><span className="live-dot" /> LIVE PREVIEW</span></div>
            <div className="qr-stage"><div className="qr-frame"><canvas ref={canvasRef} aria-label="ตัวอย่าง QR Code" /></div><div className="scan-caption"><span>✦</span> สแกนเพื่อทดสอบ QR Code</div></div>
            {message && <p className="error-message">{message}</p>}
            <div className="preview-meta"><div><span>ขนาด</span><strong>{size} × {size} px</strong></div><div><span>รูปแบบ</span><strong>PNG / SVG</strong></div><div><span>Error correction</span><strong>{ecc}</strong></div></div>
            <div className="download-actions"><button className="download-primary" onClick={downloadPng}><span>↓</span> ดาวน์โหลด PNG</button><button className="download-secondary" onClick={() => void downloadSvg()}><span>↓</span> SVG</button></div>
            <p className="privacy-note"><span>✓</span> สร้างบนเบราว์เซอร์ของคุณ ไม่ต้องสมัครสมาชิก</p>
          </div>
          <div className="tip-card"><span className="tip-icon">✧</span><div><strong>เคล็ดลับให้สแกนง่าย</strong><p>ใช้สี QR Code ที่ตัดกับพื้นหลังชัดเจน และทดสอบสแกนก่อนนำไปพิมพ์จริง</p></div></div>
        </aside>
      </section>
      <footer><span>QR<span className="brand-accent">Studio</span></span><span>Simple. Fast. Yours.</span></footer>
    </main>
  );
}

async function addLogoToSvg(svg: string, logo: string, scale: number, background: string, rounded: boolean) {
  const sizeMatch = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const size = sizeMatch ? Number(sizeMatch[1]) : 512;
  const w = size * scale / 100;
  const x = (size - w) / 2;
  const y = (size - w) / 2;
  const radius = rounded ? w * 0.2 : w * 0.08;
  const image = `<rect x="${x-w*0.04}" y="${y-w*0.04}" width="${w*1.08}" height="${w*1.08}" rx="${radius}" fill="${background}"/><image href="${logo}" x="${x}" y="${y}" width="${w}" height="${w}" preserveAspectRatio="xMidYMid meet"/>`;
  return svg.replace("</svg>", `${image}</svg>`);
}
