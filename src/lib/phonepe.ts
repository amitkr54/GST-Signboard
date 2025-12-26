import crypto from 'crypto';

export const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID ?? 'PGTESTPAYUAT86';
export const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY ?? '96434309-7796-489d-8924-ab56988a6076';
export const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX ?? '1';
export const PHONEPE_HOST_URL = process.env.PHONEPE_HOST_URL ?? 'https://api-preprod.phonepe.com/apis/pg-sandbox';

export const generateChecksum = (payload: string, endpoint: string, saltKey: string, saltIndex: string) => {
    const stringToHash = payload + endpoint + saltKey;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    return `${sha256}###${saltIndex}`;
};

export const base64Encode = (data: any) => {
    return Buffer.from(JSON.stringify(data)).toString('base64');
};
