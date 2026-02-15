/**
 * Local Test Script for Smart Coach Algorithm
 * Run with: deno run --allow-net test.ts
 */

const FUNCTION_URL = "http://localhost:54321/functions/v1/evaluate-session";

interface TestCase {
  name: string;
  current_snr: number;
  results: boolean[];
  expected_action: "increase" | "decrease" | "maintain";
}

const testCases: TestCase[] = [
  {
    name: "High Performance (80%+) - Should Decrease SNR",
    current_snr: 10,
    results: [true, true, true, true, true, true, true, true, false, false], // 80%
    expected_action: "decrease"
  },
  {
    name: "Excellent Performance (100%) - Should Decrease SNR",
    current_snr: 5,
    results: [true, true, true, true, true, true, true, true, true, true], // 100%
    expected_action: "decrease"
  },
  {
    name: "Poor Performance (50%) - Should Increase SNR",
    current_snr: 0,
    results: [true, true, true, true, true, false, false, false, false, false], // 50%
    expected_action: "increase"
  },
  {
    name: "Very Poor Performance (30%) - Should Increase SNR",
    current_snr: -5,
    results: [true, true, true, false, false, false, false, false, false, false], // 30%
    expected_action: "increase"
  },
  {
    name: "Moderate Performance (70%) - Should Maintain",
    current_snr: 5,
    results: [true, true, true, true, true, true, true, false, false, false], // 70%
    expected_action: "maintain"
  },
  {
    name: "Boundary Test - Clamp to Max (20dB)",
    current_snr: 18,
    results: [true, true, false, false, false, false, false, false, false, false], // 20% - should increase to 20 max
    expected_action: "increase"
  },
  {
    name: "Boundary Test - Clamp to Min (-10dB)",
    current_snr: -8,
    results: [true, true, true, true, true, true, true, true, true, true], // 100% - should decrease to -10 min
    expected_action: "decrease"
  }
];

async function runTest(testCase: TestCase) {
  console.log(`\n🧪 ${testCase.name}`);
  console.log(`   Current SNR: ${testCase.current_snr} dB`);
  console.log(`   Results: ${testCase.results.filter(r => r).length}/${testCase.results.length} correct`);

  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_snr: testCase.current_snr,
        results: testCase.results
      })
    });

    const data = await response.json();

    console.log(`   📊 Accuracy: ${(data.accuracy * 100).toFixed(0)}%`);
    console.log(`   🎯 Action: ${data.action}`);
    console.log(`   📈 Next SNR: ${data.next_snr} dB`);
    console.log(`   💬 "${data.recommendation}"`);

    if (data.action === testCase.expected_action) {
      console.log(`   ✅ PASS`);
      return true;
    } else {
      console.log(`   ❌ FAIL - Expected "${testCase.expected_action}", got "${data.action}"`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log("=".repeat(60));
  console.log("Smart Coach Algorithm Test Suite");
  console.log("=".repeat(60));

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = await runTest(testCase);
    if (result) passed++;
    else failed++;
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(60));
}

// Run tests
runAllTests();
