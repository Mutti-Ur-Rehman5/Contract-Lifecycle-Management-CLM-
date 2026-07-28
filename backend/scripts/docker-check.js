import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Connect to Docker MongoDB
const MONGO_URI = 'mongodb://localhost:27017/clm';

async function run() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  console.log('=== CONTRACTS ===');
  const contracts = await db.collection('contracts').find({}).toArray();
  contracts.forEach(c => console.log(`  ${c._id} | ${c.title} | status=${c.status} | type=${c.type}`));

  console.log('\n=== WORKFLOW INSTANCES ===');
  const instances = await db.collection('workflowinstances').find({}).toArray();
  instances.forEach(i => console.log(`  ${i._id} | contract=${i.contractId} | stage=${i.currentStageKey} | status=${i.status}`));

  console.log('\n=== PENDING APPROVAL STEPS ===');
  const pending = await db.collection('approvalsteps').find({ status: 'pending' }).toArray();
  pending.forEach(s => console.log(`  stage=${s.stageKey} | assignedTo=${s.assignedToUserId} | instance=${s.workflowInstanceId}`));

  console.log('\n=== USERS ===');
  const users = await db.collection('users').find({}).toArray();
  users.forEach(u => console.log(`  ${u._id} | ${u.email} | role=${u.role} | org=${u.organizationId}`));

  console.log('\n=== WORKFLOW DEFINITIONS ===');
  const defs = await db.collection('workflowdefinitions').find({}).toArray();
  defs.forEach(d => console.log(`  ${d._id} | type=${d.contractType} | name=${d.name} | org=${d.organizationId}`));

  await mongoose.disconnect();
}

run().catch(console.error);
