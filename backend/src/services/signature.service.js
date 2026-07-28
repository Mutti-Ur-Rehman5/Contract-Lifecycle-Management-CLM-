import signatureRepository from '../repositories/signature.repository.js';
import auditLogService from './auditLog.service.js';
import notificationService from './notification.service.js';
import eventBus from '../events/eventBus.js';
import Contract from '../models/Contract.model.js';
import User from '../models/User.model.js';
import workflowRepository from '../repositories/workflow.repository.js';
import workflowEngineService from './workflowEngine.service.js';

const signatureService = {
  async requestSignatures(contractId, organizationId, mode = 'sequential') {
    if (!['sequential', 'parallel'].includes(mode)) mode = 'sequential';

    const contract = await Contract.findById(contractId)
      .populate('ownerId', 'name email role');

    if (!contract || contract.organizationId.toString() !== organizationId) {
      const err = new Error('Contract not found');
      err.statusCode = 404;
      throw err;
    }

    const existing = await signatureRepository.findByContract(contractId);
    if (existing.length > 0) return existing;

    const admins = await User.find({ organizationId, role: 'admin', isActive: true })
      .select('_id name email')
      .lean();
    const adminUser = admins.length > 0 ? admins[0] : null;

    const signatoryUsers = await User.find({ organizationId, role: 'signatory', isActive: true })
      .select('_id name email')
      .lean();
    const signatoryUser = signatoryUsers.length > 0 ? signatoryUsers[0] : null;

    const signatories = [];

    if (signatoryUser) {
      signatories.push({
        organizationId,
        contractId,
        signerId: signatoryUser._id,
        signerName: signatoryUser.name || 'External Signatory',
        signerRole: 'signatory',
        signOrder: 1,
        mode,
        status: 'pending',
      });
    } else {
      signatories.push({
        organizationId,
        contractId,
        signerId: contract.ownerId._id || contract.ownerId,
        signerName: (contract.ownerId && contract.ownerId.name) || 'External Signatory',
        signerRole: 'signatory',
        signOrder: 1,
        mode,
        status: 'pending',
      });
    }

    if (adminUser) {
      signatories.push({
        organizationId,
        contractId,
        signerId: adminUser._id,
        signerName: adminUser.name || 'Admin',
        signerRole: 'admin',
        signOrder: 2,
        mode,
        status: 'pending',
      });
    }

    const records = await signatureRepository.createMany(signatories);

    await auditLogService.log({
      organizationId,
      userId: contract.ownerId._id || contract.ownerId,
      action: 'signature.requests_created',
      entityType: 'Signature',
      entityId: contractId,
      metadata: { contractId, count: records.length, mode, parties: 'two-party-sequential' },
    });

    eventBus.emit('signature.requests_created', {
      contractId,
      organizationId,
      count: records.length,
    });

    const contractTitle = contract.title || 'Untitled contract';
    for (const record of records) {
      if (record.signerId && record.signerId.toString() !== (contract.ownerId._id || contract.ownerId).toString()) {
        notificationService.enqueueNotification({
          organizationId,
          userId: record.signerId,
          type: 'signature_pending',
          title: 'Signature required',
          message: `Your signature is requested on "${contractTitle}". Please review and sign the contract.`,
          relatedContractId: contractId,
        });
      }
    }

    return records;
  },

  async sign(contractId, organizationId, userId, ipAddress, signatureImageUrl) {
    let record = await signatureRepository.findByContractAndSigner(contractId, userId);

    if (!record) {
      const user = await User.findById(userId).select('_id name role').lean();
      if (user) {
        const allSignatures = await signatureRepository.findByContract(contractId);
        record = allSignatures.find(
          (s) => s.signerRole === user.role && s.status === 'pending'
        );
        if (record) {
          record = await signatureRepository.updateById(record._id, {
            signerId: userId,
            signerName: user.name || record.signerName,
          });
        }
      }
    }

    if (!record) {
      const err = new Error('You are not a signatory on this contract');
      err.statusCode = 403;
      throw err;
    }

    if (record.status === 'signed') {
      const err = new Error('You have already signed this contract');
      err.statusCode = 400;
      throw err;
    }
    if (record.status === 'declined') {
      const err = new Error('You have already declined to sign this contract');
      err.statusCode = 400;
      throw err;
    }

    if (record.mode === 'sequential' && record.signOrder > 1) {
      const previousSignatures = await signatureRepository.findByContract(contractId);
      const sorted = previousSignatures.sort((a, b) => a.signOrder - b.signOrder);
      const prevSignatory = sorted.find((s) => s.signOrder === record.signOrder - 1);
      if (prevSignatory && prevSignatory.status !== 'signed') {
        const err = new Error(
          `Cannot sign yet: previous signatory "${prevSignatory.signerName}" must sign first`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    const signer = await User.findById(userId).select('name email').lean();
    const updated = await signatureRepository.updateByContractAndSigner(contractId, userId, {
      status: 'signed',
      signedAt: new Date(),
      signerName: signer?.name || record.signerName,
      ipAddress,
      signatureImageUrl: signatureImageUrl || null,
      $push: {
        auditTrail: { action: 'signed', timestamp: new Date(), ipAddress },
      },
    });

    await auditLogService.log({
      organizationId,
      userId,
      action: 'signature.signed',
      entityType: 'Signature',
      entityId: record._id,
      metadata: { contractId, signOrder: record.signOrder, signerRole: record.signerRole, mode: record.mode },
    });

    eventBus.emit('contract.signed', {
      contractId,
      signerId: userId,
      signerName: record.signerName,
      signerRole: record.signerRole,
      organizationId,
    });

    const allSigs = await signatureRepository.findByContract(contractId);
    const sortedSigs = allSigs.sort((a, b) => a.signOrder - b.signOrder);
    const nextSig = sortedSigs.find((s) => s.status === 'pending');
    if (nextSig && nextSig.signerId && nextSig.signerId.toString() !== userId.toString()) {
      const signedContract = await Contract.findById(contractId).select('title');
      notificationService.enqueueNotification({
        organizationId,
        userId: nextSig.signerId,
        type: 'signature_pending',
        title: 'Your signature is next',
        message: `The previous signatory has signed "${signedContract?.title || 'Untitled contract'}". It is now your turn to sign.`,
        relatedContractId: contractId,
      });
    }

    const total = await signatureRepository.countTotalByContract(contractId);
    const signed = await signatureRepository.countSignedByContract(contractId);

    if (signed >= total) {
      const contract = await Contract.findById(contractId);
      if (contract && contract.workflowInstanceId) {
        const currentStage = await workflowEngineService.getCurrentStage(contract.workflowInstanceId);
        if (currentStage && currentStage.workflowStatus === 'in_progress' && currentStage.stageKey === 'pending_signature') {
          const advResult = await workflowEngineService.advance(
            contract.workflowInstanceId,
            'approve',
            userId,
            'All signatures completed — auto-advancing to published'
          );
          const advInstance = advResult.instance;
          await Contract.findByIdAndUpdate(contractId, { status: advInstance.contractStatus });

          await auditLogService.log({
            organizationId,
            userId,
            action: 'signature.all_completed',
            entityType: 'Contract',
            entityId: contractId,
            metadata: { contractId, decision: advResult.decision },
          });

          eventBus.emit('contract.signatures_completed', {
            contractId,
            organizationId,
            completedBy: userId,
          });

          const publishedContract = await Contract.findById(contractId).select('ownerId title');
          if (publishedContract?.ownerId) {
            const pubOwnerId = publishedContract.ownerId._id || publishedContract.ownerId;
            notificationService.enqueueNotification({
              organizationId,
              userId: pubOwnerId,
              type: 'contract_published',
              title: 'Contract published',
              message: `"${publishedContract.title || 'Untitled contract'}" has been fully signed and published.`,
              relatedContractId: contractId,
            });
          }
        }
      }
    }

    return updated;
  },

  async decline(contractId, organizationId, userId, ipAddress, comment) {
    const record = await signatureRepository.findByContractAndSigner(contractId, userId);
    if (!record) {
      const err = new Error('You are not a signatory on this contract');
      err.statusCode = 403;
      throw err;
    }

    if (record.status !== 'pending') {
      const err = new Error('You have already acted on this signature request');
      err.statusCode = 400;
      throw err;
    }

    const updated = await signatureRepository.updateByContractAndSigner(contractId, userId, {
      status: 'declined',
      ipAddress,
      $push: {
        auditTrail: { action: `declined: ${comment || 'No reason given'}`, timestamp: new Date(), ipAddress },
      },
    });

    await auditLogService.log({
      organizationId,
      userId,
      action: 'signature.declined',
      entityType: 'Signature',
      entityId: record._id,
      metadata: { contractId, comment },
    });

    eventBus.emit('signature.declined', {
      contractId,
      signerId: userId,
      organizationId,
      comment,
    });

    return updated;
  },

  async getSignatureStatus(contractId, organizationId) {
    const contract = await Contract.findById(contractId);
    if (!contract || contract.organizationId.toString() !== organizationId) return [];
    return signatureRepository.findByContract(contractId);
  },
};

export default signatureService;
