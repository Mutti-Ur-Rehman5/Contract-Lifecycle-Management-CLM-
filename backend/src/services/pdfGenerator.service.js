import puppeteer from 'puppeteer-core';
import { GetObjectCommand, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

import s3 from '../config/s3.js';
import config from '../config/env.js';
import contractRepository from '../repositories/contract.repository.js';
import versionRepository from '../repositories/version.repository.js';
import signatureRepository from '../repositories/signature.repository.js';
import auditLogService from './auditLog.service.js';
import logger from '../utils/logger.js';

const PDF_BUCKET = config.s3.bucket;

async function ensureBucket(bucket) {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    try {
      await s3.send(new CreateBucketCommand({ Bucket: bucket }));
      logger.info(`Created S3 bucket: ${bucket}`);
    } catch (createErr) {
      if (createErr.name === 'BucketAlreadyOwnedByYou' || createErr.name === 'BucketAlreadyExists') return;
      throw createErr;
    }
  }
}

async function fetchSignatureImageAsBase64(imageUrl) {
  if (!imageUrl) return null;
  try {
    const bucketIdx = imageUrl.indexOf(`/${PDF_BUCKET}/`);
    if (bucketIdx === -1) return null;
    const key = imageUrl.substring(bucketIdx + PDF_BUCKET.length + 2);

    const response = await s3.send(new GetObjectCommand({
      Bucket: PDF_BUCKET,
      Key: key,
    }));

    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch {
    logger.warn(`Failed to fetch signature image: ${imageUrl}`);
    return null;
  }
}

async function buildSignatureBlockHtml(signatures) {
  if (!signatures || signatures.length === 0) return '';

  const sorted = [...signatures].sort((a, b) => a.signOrder - b.signOrder);

  const rows = [];
  for (const sig of sorted) {
    const label = sig.signerRole === 'admin' ? 'Receiving Party (Admin)' : 'Disclosing Party';
    const signedName = sig.signerName || '';
    const signedDate = sig.status === 'signed' && sig.signedAt
      ? new Date(sig.signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';

    let signatureContent = '________________________________________';
    if (sig.status === 'signed') {
      const base64Image = await fetchSignatureImageAsBase64(sig.signatureImageUrl);
      if (base64Image) {
        signatureContent = `<img src="${base64Image}" style="height:40pt;max-width:150pt;object-fit:contain;" />`;
      } else if (sig.digitalSignature || signedName) {
        signatureContent = `<span style="font-family:'Brush Script MT','Segoe Script','Dancing Script',cursive;font-size:18pt;color:#1F5C4C;">${sig.digitalSignature || signedName}</span>`;
      }
    }

    const dateContent = sig.status === 'signed' && signedDate
      ? signedDate
      : '__________';

    rows.push(`
      <div style="margin-top:32pt;">
        <div style="display:flex;gap:40pt;">
          <div style="flex:1;">
            <div style="border-bottom:1px solid #1B2430;width:100%;height:40pt;"></div>
            <div style="font-size:9pt;color:#5B6472;margin-top:4pt;">${label}</div>
          </div>
          <div style="flex:1;">
            <div style="border-bottom:1px solid #1B2430;width:100%;height:40pt;padding-bottom:2pt;padding-left:4pt;">${signatureContent}</div>
            <div style="display:flex;justify-content:space-between;margin-top:4pt;">
              <div style="font-size:9pt;color:#5B6472;">
                ${sig.status === 'signed' ? `Digitally signed by: ${signedName}` : 'Signature (pending)'}
              </div>
              <div style="font-size:9pt;color:#5B6472;">
                Date: ${dateContent}
              </div>
            </div>
          </div>
        </div>
      </div>`);
  }

  return `
    <hr style="margin-top:36pt;" />
    <h2 style="font-size:14pt;margin-bottom:12pt;">Signatures</h2>
    <p style="font-size:10pt;color:#5B6472;margin-bottom:16pt;">The parties have executed this agreement as of the dates indicated below.</p>
    ${rows.join('')}`;
}

function buildHtmlDocument(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1B2430;
      padding: 60px 72px;
    }
    h1 { font-size: 22pt; font-weight: 600; margin-bottom: 24pt; }
    h2 { font-size: 16pt; font-weight: 600; margin-top: 18pt; margin-bottom: 12pt; }
    h3 { font-size: 13pt; font-weight: 600; margin-top: 14pt; margin-bottom: 8pt; }
    p { margin-bottom: 10pt; }
    ul, ol { margin-bottom: 10pt; padding-left: 24pt; }
    li { margin-bottom: 4pt; }
    blockquote {
      border-left: 3px solid #1F5C4C;
      padding-left: 16pt;
      margin: 0 0 10pt 0;
      color: #5B6472;
      font-style: italic;
    }
    hr {
      border: none;
      border-top: 1px solid #D9D6CC;
      margin: 20pt 0;
    }
    a { color: #1F5C4C; text-decoration: underline; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16pt 0;
      table-layout: fixed;
    }
    td, th {
      border: 1px solid #D9D6CC;
      padding: 8pt 12pt;
      text-align: left;
      vertical-align: top;
    }
    th { background: #F6F5F1; font-weight: 600; }
    [style*="text-align: center"] { text-align: center !important; }
    [style*="text-align: right"] { text-align: right !important; }
    [style*="text-align: justify"] { text-align: justify !important; }
    .clause { margin-bottom: 16pt; }
    .clause-title { font-weight: 600; font-size: 13pt; margin-bottom: 6pt; color: #1F5C4C; }
    .meta { font-size: 10pt; color: #5B6472; margin-bottom: 4pt; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

const pdfGeneratorService = {
  async generatePdf(contractId) {
    logger.info(`Starting PDF generation for contract ${contractId}`);

    const contract = await contractRepository.findById(contractId);
    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    const latestVersion = await versionRepository.findLatestByContract(contractId);
    if (!latestVersion) {
      throw new Error(`No version found for contract ${contractId}`);
    }

    const signatures = await signatureRepository.findByContract(contractId);
    const signatureBlockHtml = await buildSignatureBlockHtml(signatures);

    const html = buildHtmlDocument((latestVersion.content || '') + signatureBlockHtml);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '40px', bottom: '40px', left: '40px', right: '40px' },
        printBackground: true,
      });

      await page.close();

      const key = `org/${contract.organizationId}/contracts/${contractId}/v${latestVersion.versionNumber}.pdf`;

      await ensureBucket(PDF_BUCKET);

      await s3.send(new PutObjectCommand({
        Bucket: PDF_BUCKET,
        Key: key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      }));

      const pdfUrl = `${config.s3.endpoint}/${PDF_BUCKET}/${key}`;

      await versionRepository.updateById(latestVersion._id, { pdfFileUrl: pdfUrl });

      await auditLogService.log({
        organizationId: contract.organizationId,
        userId: contract.ownerId,
        action: 'pdf.generated',
        entityType: 'Contract',
        entityId: contractId,
        metadata: { versionNumber: latestVersion.versionNumber, pdfUrl },
      });

      logger.info(`PDF generated for contract ${contractId} at ${pdfUrl}`);
      return { pdfUrl, versionNumber: latestVersion.versionNumber };
    } catch (error) {
      logger.error(`PDF generation failed for contract ${contractId}: ${error.message}`);
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  },
};

export default pdfGeneratorService;
