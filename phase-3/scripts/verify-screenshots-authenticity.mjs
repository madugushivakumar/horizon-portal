import fs from "fs";

function inspectPng(filePath) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, error: "File not found" };
  }
  const stats = fs.statSync(filePath);
  const buf = fs.readFileSync(filePath);
  
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
  if (!isPng) {
    return { exists: true, error: "Not a valid PNG file" };
  }

  // IHDR chunk is immediately after signature: length (4 bytes), type "IHDR" (4 bytes), width (4 bytes), height (4 bytes)
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];

  // Sample bytes from raw file to check diversity
  const sampledBytes = new Set();
  for (let i = 33; i < buf.length - 12; i += 50) {
    sampledBytes.add(buf[i]);
  }

  return {
    exists: true,
    sizeBytes: stats.size,
    sizeKb: (stats.size / 1024).toFixed(2),
    width,
    height,
    bitDepth,
    colorType,
    distinctSampledBytes: sampledBytes.size,
    isBlackOrBlank: stats.size < 35000 && sampledBytes.size < 10,
    mtime: stats.mtime.toISOString()
  };
}

const day12Path = "reports/day-12-evidence/01_finance_snapshot_desktop.png";
const day15Path = "reports/day-15-evidence/01_hr_insights_desktop_overview.png";

console.log("=== SCREENSHOT AUTHENTICITY AUDIT ===");
console.log("Day 12:", day12Path, JSON.stringify(inspectPng(day12Path), null, 2));
console.log("Day 15:", day15Path, JSON.stringify(inspectPng(day15Path), null, 2));

