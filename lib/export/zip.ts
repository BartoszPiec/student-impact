import "server-only";

type ZipEntry = {
  path: string;
  data: Buffer;
  modifiedAt?: Date;
};

type CentralDirectoryEntry = {
  header: Buffer;
};

const CRC32_TABLE = new Uint32Array(256);

for (let i = 0; i < 256; i += 1) {
  let c = i;
  for (let j = 0; j < 8; j += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c >>> 0;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function toDosDateTime(date: Date): { date: number; time: number } {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  return {
    date: ((year - 1980) << 9) | (month << 5) | day,
    time: (hours << 11) | (minutes << 5) | seconds,
  };
}

function writeCommonHeaderFields(header: Buffer, offset: number, entry: ZipEntry, crc: number, dos: { date: number; time: number }) {
  header.writeUInt16LE(20, offset);
  header.writeUInt16LE(0x0800, offset + 2);
  header.writeUInt16LE(0, offset + 4);
  header.writeUInt16LE(dos.time, offset + 6);
  header.writeUInt16LE(dos.date, offset + 8);
  header.writeUInt32LE(crc, offset + 10);
  header.writeUInt32LE(entry.data.length, offset + 14);
  header.writeUInt32LE(entry.data.length, offset + 18);
}

function assertZipSize(value: number, label: string) {
  if (value > 0xffffffff) {
    throw new Error(`${label} exceeds ZIP32 limit.`);
  }
}

export function sanitizeZipPath(path: string): string {
  return path
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => segment.trim().replace(/[<>:"|?*\u0000-\u001f]/g, "_"))
    .filter(Boolean)
    .join("/")
    .slice(0, 240);
}

export function createZip(entries: ZipEntry[]): Buffer {
  const fileParts: Buffer[] = [];
  const centralDirectory: CentralDirectoryEntry[] = [];
  let offset = 0;

  for (const entry of entries) {
    const normalizedPath = sanitizeZipPath(entry.path);
    if (!normalizedPath) {
      throw new Error("ZIP entry path cannot be empty.");
    }

    assertZipSize(entry.data.length, `ZIP entry ${normalizedPath}`);

    const fileName = Buffer.from(normalizedPath, "utf8");
    const dos = toDosDateTime(entry.modifiedAt ?? new Date());
    const crc = crc32(entry.data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    writeCommonHeaderFields(localHeader, 4, entry, crc, dos);
    localHeader.writeUInt16LE(fileName.length, 26);
    localHeader.writeUInt16LE(0, 28);

    fileParts.push(localHeader, fileName, entry.data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    writeCommonHeaderFields(centralHeader, 6, entry, crc, dos);
    centralHeader.writeUInt16LE(fileName.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralDirectory.push({
      header: Buffer.concat([centralHeader, fileName]),
    });

    offset += localHeader.length + fileName.length + entry.data.length;
    assertZipSize(offset, "ZIP file");
  }

  const centralStart = offset;
  for (const entry of centralDirectory) {
    fileParts.push(entry.header);
    offset += entry.header.length;
  }

  const centralSize = offset - centralStart;
  assertZipSize(centralSize, "ZIP central directory");
  assertZipSize(centralStart, "ZIP central directory offset");

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(centralDirectory.length, 8);
  end.writeUInt16LE(centralDirectory.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);
  fileParts.push(end);

  return Buffer.concat(fileParts);
}
