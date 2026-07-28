import mongoose from 'mongoose';
import User from '../src/models/User.model.js';
import ApprovalStep from '../src/models/ApprovalStep.model.js';
import WorkflowInstance from '../src/models/WorkflowInstance.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/clm';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected\n');

  const orgId = new mongoose.Types.ObjectId('6a60d117ae58220d51961552');
  const AliUserId = new mongoose.Types.ObjectId('6a61b32ee9a8fa79f22d7942');

  // Test 1: Does findUsersByRole find Ali?
  console.log('=== TEST 1: findUsersByRole(organizationId, "legal") ===');
  const legalUsers = await User.find({ organizationId: orgId, role: 'legal', isActive: true }).select('_id');
  console.log('  Found:', legalUsers.length, 'user(s)');
  for (const u of legalUsers) console.log('    _id:', u._id.toString());

  // Test 2: Check the FIRST workflow instance
  console.log('\n=== TEST 2: First WorkflowInstance (6a61be3f) ===');
  const inst1 = await WorkflowInstance.findById('6a61be3fca089dd929ff114b');
  console.log('  currentStageKey:', inst1.currentStageKey);
  console.log('  status:', inst1.status);
  console.log('  organizationId:', inst1.organizationId.toString());
  console.log('  organizationId type:', typeof inst1.organizationId, inst1.organizationId.constructor.name);

  // Test 3: What would createPendingStepsForStage create?
  console.log('\n=== TEST 3: Simulate createPendingStepsForStage for legal_review ===');
  const stage = { key: 'legal_review', approverRole: 'legal' };
  const users = await User.find({ organizationId: inst1.organizationId, role: stage.approverRole, isActive: true }).select('_id');
  console.log('  Users found for role "' + stage.approverRole + '":', users.length);
  for (const u of users) console.log('    _id:', u._id.toString());

  // Test 4: Check what approval steps exist for this instance
  console.log('\n=== TEST 4: All ApprovalSteps for instance 6a61be3f ===');
  const steps = await ApprovalStep.find({ workflowInstanceId: '6a61be3fca089dd929ff114b' });
  for (const s of steps) {
    console.log('  stageKey:', s.stageKey, '| status:', s.status, '| assignedTo:', s.assignedToUserId.toString());
  }

  // Test 5: The critical question - was createPendingStepsForStage ever called for this instance+legal_review?
  console.log('\n=== TEST 5: Any ApprovalStep with stageKey=legal_review for instance 6a61be3f? ===');
  const legalSteps = await ApprovalStep.find({ workflowInstanceId: '6a61be3fca089dd929ff114b', stageKey: 'legal_review' });
  console.log('  Found:', legalSteps.length, 'step(s)');
  if (legalSteps.length === 0) {
    console.log('  CONFIRMED: createPendingStepsForStage was NEVER called for legal_review on this instance');
    console.log('  OR it was called but findUsersByRole returned empty');
  }

  // Test 6: Simulate the EXACT populate query the inbox uses, but for Ali on the first instance
  console.log('\n=== TEST 6: Would a pending step for Ali on instance 6a61be3f show in inbox? ===');
  // Manually create a test pending step and query
  const testStep = await ApprovalStep.create({
    workflowInstanceId: new mongoose.Types.ObjectId('6a61be3fca089dd929ff114b'),
    stageKey: 'legal_review',
    assignedToUserId: AliUserId,
    status: 'pending',
    comment: '',
    decidedAt: null,
  });
  console.log('  Created test step:', testStep._id.toString());

  // Now run the exact inbox query
  const inboxQuery = await ApprovalStep.find({ assignedToUserId: AliUserId, status: 'pending' })
    .populate({
      path: 'workflowInstanceId',
      match: { organizationId: orgId, status: 'in_progress' },
      populate: [
        { path: 'contractId', select: 'title type status' },
        { path: 'initiatedBy', select: 'name email role' },
      ],
    });
  
  console.log('  Inbox query returned:', inboxQuery.length, 'step(s)');
  for (const step of inboxQuery) {
    const hasInstance = !!step.workflowInstanceId;
    const hasContract = hasInstance && !!step.workflowInstanceId.contractId;
    console.log('    step:', step._id.toString(), '| stageKey:', step.stageKey);
    console.log('      workflowInstanceId populated:', hasInstance);
    if (hasInstance) {
      console.log('      contract populated:', hasContract);
      if (hasContract) console.log('        title:', step.workflowInstanceId.contractId.title);
    }
  }

  // Clean up test step
  await ApprovalStep.findByIdAndDelete(testStep._id);
  console.log('\n  (Cleaned up test step)');

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
