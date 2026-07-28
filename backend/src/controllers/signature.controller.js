import signatureService from '../services/signature.service.js';
import auditLogService from '../services/auditLog.service.js';
import versionControlService from '../services/versionControl.service.js';
import { PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import s3 from '../config/s3.js';
import config from '../config/env.js';
import { successResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

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

export const requestSignatures = asyncHandler(async (req, res) => {
  const result = await signatureService.requestSignatures(
    req.params.contractId,
    req.organizationId,
    req.body.mode
  );
  return successResponse(res, result, 'Signature requests created');
});

export const uploadSignatureImage = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    const err = new Error('imageBase64 is required');
    err.statusCode = 400;
    throw err;
  }

  try {
    await ensureBucket(config.s3.bucket);
  } catch (bucketErr) {
    logger.error(`Failed to ensure bucket: ${bucketErr.message}`);
    const err = new Error('Storage service unavailable');
    err.statusCode = 503;
    throw err;
  }

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const key = `org/${req.organizationId}/contracts/${contractId}/signatures/${req.user.id}.png`;

  try {
    await s3.send(new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
    }));
  } catch (uploadErr) {
    logger.error(`S3 upload failed: ${uploadErr.message}`);
    const err = new Error('Failed to upload signature image');
    err.statusCode = 500;
    throw err;
  }

  const imageUrl = `${config.s3.endpoint}/${config.s3.bucket}/${key}`;

  await auditLogService.log({
    organizationId: req.organizationId,
    userId: req.user.id,
    action: 'signature.image_uploaded',
    entityType: 'Signature',
    entityId: contractId,
    metadata: { contractId, imageUrl },
  });

  return successResponse(res, { imageUrl }, 'Signature image uploaded');
});

export const sign = asyncHandler(async (req, res) => {
  const result = await signatureService.sign(
    req.params.contractId,
    req.organizationId,
    req.user.id,
    req.ip || req.connection?.remoteAddress || '0.0.0.0',
    req.body.signatureImageUrl || null
  );
  return successResponse(res, result, 'Contract signed');
});

export const decline = asyncHandler(async (req, res) => {
  const result = await signatureService.decline(
    req.params.contractId,
    req.organizationId,
    req.user.id,
    req.ip || req.connection?.remoteAddress || '0.0.0.0',
    req.body.comment || ''
  );
  return successResponse(res, result, 'Signature declined');
});

export const getSignatureStatus = asyncHandler(async (req, res) => {
  const result = await signatureService.getSignatureStatus(req.params.contractId, req.organizationId);
  return successResponse(res, result);
});

// --- Version Control ---
export const compareVersions = asyncHandler(async (req, res) => {
  const { versionAId, versionBId } = req.query;
  if (!versionAId || !versionBId) {
    const err = new Error('Both versionAId and versionBId are required');
    err.statusCode = 400;
    throw err;
  }
  const result = await versionControlService.compareVersions(
    req.params.contractId,
    versionAId,
    versionBId,
    req.organizationId
  );
  return successResponse(res, result);
});

export const rollbackVersion = asyncHandler(async (req, res) => {
  const result = await versionControlService.rollback(
    req.params.contractId,
    req.body.targetVersionId,
    req.organizationId,
    req.user.id
  );
  return successResponse(res, result, 'Version rolled back');
});
