import versionRepository from '../repositories/version.repository.js';
import contractRepository from '../repositories/contract.repository.js';
import auditLogService from './auditLog.service.js';
import Contract from '../models/Contract.model.js';

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function computeDiff(textA, textB) {
  const linesA = textA.split('\n');
  const linesB = textB.split('\n');
  const lcs = [];
  const m = linesA.length;
  const n = linesB.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (linesA[i - 1] === linesB[j - 1]) {
      lcs.unshift({ type: 'unchanged', text: linesA[i - 1] });
      i--; j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      lcs.unshift({ type: 'removed', text: linesA[i - 1] });
      i--;
    } else {
      lcs.unshift({ type: 'added', text: linesB[j - 1] });
      j--;
    }
  }
  while (i > 0) { lcs.unshift({ type: 'removed', text: linesA[i - 1] }); i--; }
  while (j > 0) { lcs.unshift({ type: 'added', text: linesB[j - 1] }); j--; }

  return lcs;
}

const versionControlService = {
  async compareVersions(contractId, versionAId, versionBId, organizationId) {
    const contract = await contractRepository.findByIdRaw(contractId);
    if (!contract || contract.organizationId.toString() !== organizationId) {
      const err = new Error('Contract not found');
      err.statusCode = 404;
      throw err;
    }

    const [versionA, versionB] = await Promise.all([
      versionRepository.findById(versionAId),
      versionRepository.findById(versionBId),
    ]);

    if (!versionA || versionA.contractId.toString() !== contractId) {
      const err = new Error('Version A not found');
      err.statusCode = 404;
      throw err;
    }
    if (!versionB || versionB.contractId.toString() !== contractId) {
      const err = new Error('Version B not found');
      err.statusCode = 404;
      throw err;
    }

    const textA = stripHtml(versionA.content);
    const textB = stripHtml(versionB.content);
    const diff = computeDiff(textA, textB);

    return {
      versionA: { id: versionA._id, number: versionA.versionNumber, createdAt: versionA.createdAt, changeSummary: versionA.changeSummary },
      versionB: { id: versionB._id, number: versionB.versionNumber, createdAt: versionB.createdAt, changeSummary: versionB.changeSummary },
      diff,
      stats: {
        additions: diff.filter((d) => d.type === 'added').length,
        removals: diff.filter((d) => d.type === 'removed').length,
        unchanged: diff.filter((d) => d.type === 'unchanged').length,
      },
    };
  },

  async rollback(contractId, targetVersionId, organizationId, userId) {
    const contract = await contractRepository.findByIdRaw(contractId);
    if (!contract || contract.organizationId.toString() !== organizationId) {
      const err = new Error('Contract not found');
      err.statusCode = 404;
      throw err;
    }

    const targetVersion = await versionRepository.findById(targetVersionId);
    if (!targetVersion || targetVersion.contractId.toString() !== contractId) {
      const err = new Error('Target version not found');
      err.statusCode = 404;
      throw err;
    }

    const nextNumber = await versionRepository.getNextVersionNumber(contractId);
    const newVersion = await versionRepository.create({
      contractId,
      versionNumber: nextNumber,
      content: targetVersion.content,
      changeSummary: `Rolled back to v${targetVersion.versionNumber}`,
      createdBy: userId,
    });

    await Contract.findByIdAndUpdate(contractId, { currentVersionId: newVersion._id });

    await auditLogService.log({
      organizationId,
      userId,
      action: 'version.rollback',
      entityType: 'ContractVersion',
      entityId: newVersion._id,
      metadata: {
        contractId,
        fromVersion: targetVersion.versionNumber,
        toVersion: nextNumber,
      },
    });

    return newVersion;
  },
};

export default versionControlService;
