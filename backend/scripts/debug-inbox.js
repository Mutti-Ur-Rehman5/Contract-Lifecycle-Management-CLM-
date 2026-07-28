/**
 * Debug script — run against the live MongoDB to trace why the approval inbox is empty.
 * Usage: node scripts/debug-inbox.js
 */
import mongoose from 'mongoose';
import ApprovalStep from '../src/models/ApprovalStep.model.js';
import WorkflowInstance from '../src/models/WorkflowInstance.model.js';
import WorkflowDefinition from '../src/models/WorkflowDefinition.model.js';
import Contract from '../src/models/Contract.model.js';
import User from '../src/models/User.model.js';
import Organization from '../src/models/Organization.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/clm';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB\n');

  // ───────────────────────────────────────────────────
  // STEP 1: ALL documents in key collections
  // ───────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('STEP 1a: All ApprovalStep documents');
  console.log('═══════════════════════════════════════════════════════════════');
  const approvalSteps = await ApprovalStep.find({}).lean();
  if (approvalSteps.length === 0) {
    console.log('  ⚠ NO ApprovalStep documents exist at all!\n');
  } else {
    for (const step of approvalSteps) {
      console.log(`  _id:                 ${step._id}`);
      console.log(`    workflowInstanceId: ${step.workflowInstanceId}  (type: ${typeof step.workflowInstanceId})`);
      console.log(`    stageKey:           ${step.stageKey}`);
      console.log(`    assignedToUserId:   ${step.assignedToUserId}  (type: ${typeof step.assignedToUserId})`);
      console.log(`    status:             ${step.status}`);
      console.log(`    comment:            "${step.comment}"`);
      console.log(`    decidedAt:          ${step.decidedAt}`);
      console.log(`    createdAt:          ${step.createdAt}`);
      console.log('');
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('STEP 1b: All WorkflowInstance documents');
  console.log('═══════════════════════════════════════════════════════════════');
  const instances = await WorkflowInstance.find({}).lean();
  if (instances.length === 0) {
    console.log('  ⚠ NO WorkflowInstance documents exist!\n');
  } else {
    for (const inst of instances) {
      console.log(`  _id:                 ${inst._id}`);
      console.log(`    organizationId:     ${inst.organizationId}  (type: ${typeof inst.organizationId})`);
      console.log(`    contractId:         ${inst.contractId}`);
      console.log(`    currentStageKey:    ${inst.currentStageKey}`);
      console.log(`    status:             ${inst.status}`);
      console.log(`    contractStatus:     ${inst.contractStatus}`);
      console.log(`    initiatedBy:        ${inst.initiatedBy}`);
      console.log('');
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('STEP 1c: All Contracts (status + workflowInstanceId)');
  console.log('═══════════════════════════════════════════════════════════════');
  const contracts = await Contract.find({}, 'title type status workflowInstanceId organizationId').lean();
  if (contracts.length === 0) {
    console.log('  ⚠ NO Contract documents exist!\n');
  } else {
    for (const c of contracts) {
      console.log(`  _id: ${c._id}  title: "${c.title}"  type: ${c.type}  status: ${c.status}`);
      console.log(`    workflowInstanceId: ${c.workflowInstanceId}`);
      console.log(`    organizationId:     ${c.organizationId}`);
      console.log('');
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('STEP 1d: All WorkflowDefinitions (stages)');
  console.log('═══════════════════════════════════════════════════════════════');
  const definitions = await WorkflowDefinition.find({}).lean();
  if (definitions.length === 0) {
    console.log('  ⚠ NO WorkflowDefinition documents exist!\n');
  } else {
    for (const def of definitions) {
      console.log(`  _id: ${def._id}  name: "${def.name}"  contractType: ${def.contractType}  orgId: ${def.organizationId}`);
      if (def.stages && def.stages.length > 0) {
        for (const s of def.stages) {
          console.log(`    stage: key=${s.key} label="${s.label}" approverRole=${s.approverRole} order=${s.order} isRequired=${s.isRequired}`);
        }
      }
      console.log('');
    }
  }

  // ───────────────────────────────────────────────────
  // STEP 2: ALL Users
  // ───────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('STEP 2: All User documents');
  console.log('═══════════════════════════════════════════════════════════════');
  const users = await User.find({}, 'name email role organizationId isActive').lean();
  if (users.length === 0) {
    console.log('  ⚠ NO User documents exist!\n');
  } else {
    for (const u of users) {
      console.log(`  _id: ${u._id}  name: "${u.name}"  email: ${u.email}  role: "${u.role}"  isActive: ${u.isActive}`);
      console.log(`    organizationId: ${u.organizationId}  (type: ${typeof u.organizationId})`);
      console.log('');
    }
  }

  // ───────────────────────────────────────────────────
  // STEP 3: Reproduce the exact inbox query for EVERY user
  // ───────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('STEP 3: Exact inbox query per user (replicating app behavior)');
  console.log('═══════════════════════════════════════════════════════════════');

  for (const u of users) {
    console.log(`\n--- User: "${u.name}" (${u.email}) role="${u.role}" _id=${u._id} orgId=${u.organizationId} ---`);

    // 3a: Raw query (no populate)
    const rawSteps = await ApprovalStep.find({ assignedToUserId: u._id, status: 'pending' }).lean();
    console.log(`  [3a] Raw pending steps (no populate): ${rawSteps.length}`);
    for (const s of rawSteps) {
      console.log(`       step._id=${s._id} stageKey=${s.stageKey} workflowInstanceId=${s.workflowInstanceId}`);
    }

    // 3b: Full query with populate (EXACT replica of findPendingApprovalsForUser)
    const populatedSteps = await ApprovalStep.find({ assignedToUserId: u._id, status: 'pending' })
      .populate({
        path: 'workflowInstanceId',
        match: { organizationId: u.organizationId, status: 'in_progress' },
        populate: [
          { path: 'contractId', select: 'title type status' },
          { path: 'initiatedBy', select: 'name email role' },
        ],
      });

    console.log(`  [3b] With populate + match: ${populatedSteps.length} raw results`);
    for (const step of populatedSteps) {
      const rawObj = step.toObject ? step.toObject() : step;
      const hasInstance = !!rawObj.workflowInstanceId;
      console.log(`       step._id=${rawObj._id} stageKey=${rawObj.stageKey} status=${rawObj.status}`);
      console.log(`         assignedToUserId=${rawObj.assignedToUserId}`);
      if (hasInstance) {
        const inst = rawObj.workflowInstanceId;
        console.log(`         workflowInstanceId._id=${inst._id} orgId=${inst.organizationId} status=${inst.status}`);
        const hasContract = !!inst.contractId;
        console.log(`         contractId populated: ${hasContract}${hasContract ? ' title="' + inst.contractId.title + '" status=' + inst.contractId.status : ''}`);
      } else {
        console.log(`         ⚠ workflowInstanceId is NULL after populate — MATCH FAILED`);
      }
    }

    // 3c: Apply same filter as getApprovalInbox
    const filtered = populatedSteps.filter((step) => {
      const obj = step.toObject ? step.toObject() : step;
      return obj.workflowInstanceId && obj.workflowInstanceId.contractId;
    });
    console.log(`  [3c] After .filter(wi && wi.contractId): ${filtered.length} items → THIS IS WHAT FRONTEND GETS`);
  }

  // ───────────────────────────────────────────────────
  // DIAGNOSTIC: Role summary per org
  // ───────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('DIAGNOSTIC: Users per role per org');
  console.log('═══════════════════════════════════════════════════════════════');
  const orgIds = [...new Set(users.map(u => u.organizationId.toString()))];
  for (const orgId of orgIds) {
    const orgUsers = users.filter(u => u.organizationId.toString() === orgId);
    console.log(`\nOrg ${orgId}:`);
    const roleCounts = {};
    for (const u of orgUsers) {
      roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
    }
    for (const [role, count] of Object.entries(roleCounts)) {
      console.log(`  ${role}: ${count} user(s) — IDs: ${orgUsers.filter(u => u.role === role).map(u => u._id).join(', ')}`);
    }
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
