import QRCode from 'qrcode';

interface PixPayloadOptions {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid?: string;
}

function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ polynomial) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatTLV(tag: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${tag}${length}${value}`;
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export async function generatePixBRCode({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txid = '***'
}: PixPayloadOptions): Promise<{ brCode: string; qrCodeBase64: string }> {
  const normalizedName = stripAccents(merchantName).toUpperCase().replace(/[^A-Z0-9 ]/g, '').substring(0, 25) || 'ELYP ATELIE';
  const normalizedCity = stripAccents(merchantCity).toUpperCase().replace(/[^A-Z0-9 ]/g, '').substring(0, 15) || 'SAO PAULO';
  const cleanTxid = txid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || '***';

  const gui = formatTLV('00', 'br.gov.bcb.pix');
  const key = formatTLV('01', pixKey);
  const merchantAccountInfo = formatTLV('26', `${gui}${key}`);

  const txidTLV = formatTLV('05', cleanTxid);
  const additionalDataField = formatTLV('62', txidTLV);

  const payloadBase = [
    formatTLV('00', '01'),
    merchantAccountInfo,
    formatTLV('52', '0000'),
    formatTLV('53', '986'),
    formatTLV('54', amount.toFixed(2)),
    formatTLV('58', 'BR'),
    formatTLV('59', normalizedName),
    formatTLV('60', normalizedCity),
    additionalDataField,
    '6304'
  ].join('');

  const crc16 = calculateCRC16(payloadBase);
  const brCode = `${payloadBase}${crc16}`;

  const qrCodeBase64 = await QRCode.toDataURL(brCode, {
    margin: 2,
    width: 300,
    color: { dark: '#0C2D6B', light: '#ffffff' }
  });

  return { brCode, qrCodeBase64 };
}
