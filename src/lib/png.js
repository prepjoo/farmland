// SVG 글자 → PNG 파일(Blob). 브라우저 안에서만 바꾸고 서버로 보내지 않는다.
export function svgToPng(svg, [w, h]) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG를 만들지 못했어요'))), 'image/png');
    };
    img.onerror = () => reject(new Error('그림을 불러오지 못했어요'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}
