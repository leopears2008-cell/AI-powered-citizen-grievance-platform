import { runAiEvaluation } from '../server/aiEvaluation';

const result = runAiEvaluation();
console.log(JSON.stringify({
  ...result,
  generatedAt: new Date().toISOString(),
}, null, 2));

const passed =
  result.classification.departmentAccuracy >= 0.8 &&
  result.classification.priorityAccuracy >= 0.6 &&
  !result.hallucination.passed &&
  result.injection.filter((item) => item.input.toLowerCase().includes('ignore') || item.input.toLowerCase().includes('disregard')).every((item) => item.detected);

if (!passed) process.exitCode = 1;
