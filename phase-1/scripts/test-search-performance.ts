/**
 * Directory Search Performance Benchmark Test
 * scripts/test-search-performance.ts
 *
 * Measures API search latency against the local Horizon database.
 * Requirement: Search must return results in under 1.00 second (< 1000ms).
 */

const BASE_URL = "http://localhost:3000";

interface LoginResult {
  cookie: string;
}

async function loginAsAdmin(): Promise<LoginResult> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@growmar.com", password: "Admin@Horizon2026!" }),
  });

  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/horizon_session=([^;]+)/);
  const cookie = match ? `horizon_session=${match[1]}` : "";

  return { cookie };
}

interface BenchmarkCase {
  name: string;
  url: string;
  expectedMatches?: number;
}

async function runBenchmark() {
  console.log("===============================================================");
  console.log("   HORIZON PORTAL — SEARCH PERFORMANCE BENCHMARK (< 1000ms)    ");
  console.log("===============================================================\n");

  const { cookie } = await loginAsAdmin();
  if (!cookie) {
    console.error("Failed to authenticate demo user for benchmark.");
    process.exit(1);
  }

  // Warmup request
  await fetch(`${BASE_URL}/api/v1/employees?pageSize=5`, {
    headers: { Cookie: cookie },
  });

  const testCases: BenchmarkCase[] = [
    {
      name: "Full Name Search ('Alexander Wright')",
      url: `${BASE_URL}/api/v1/employees?search=${encodeURIComponent("Alexander Wright")}`,
    },
    {
      name: "Partial First Name ('Elean')",
      url: `${BASE_URL}/api/v1/employees?search=${encodeURIComponent("Elean")}`,
    },
    {
      name: "Partial Last Name ('Vance')",
      url: `${BASE_URL}/api/v1/employees?search=${encodeURIComponent("Vance")}`,
    },
    {
      name: "Exact Employee ID ('EMP-004')",
      url: `${BASE_URL}/api/v1/employees?search=${encodeURIComponent("EMP-004")}`,
    },
    {
      name: "Mixed Case Query ('sOpHiE')",
      url: `${BASE_URL}/api/v1/employees?search=${encodeURIComponent("sOpHiE")}`,
    },
    {
      name: "Whitespace Trim Test ('   marcus   ')",
      url: `${BASE_URL}/api/v1/employees?search=${encodeURIComponent("   marcus   ")}`,
    },
    {
      name: "Combined Search + Department ('Engineering' + 'Chen')",
      url: `${BASE_URL}/api/v1/employees?department=Engineering&search=Chen`,
    },
    {
      name: "Department Filter Alone ('Human Resources')",
      url: `${BASE_URL}/api/v1/employees?department=${encodeURIComponent("Human Resources")}`,
    },
    {
      name: "Non-Matching Query ('NonExistentPersonXYZ')",
      url: `${BASE_URL}/api/v1/employees?search=NonExistentPersonXYZ`,
    },
    {
      name: "Full Directory Browse (First Page)",
      url: `${BASE_URL}/api/v1/employees?page=1&pageSize=12`,
    },
  ];

  const results: {
    name: string;
    durationMs: number;
    status: number;
    count: number;
    passed: boolean;
  }[] = [];

  const ITERATIONS_PER_CASE = 3;
  let allUnderOneSecond = true;

  console.log(`Running ${testCases.length} benchmark test cases (${ITERATIONS_PER_CASE} iterations each)...\n`);

  for (const testCase of testCases) {
    const latencies: number[] = [];
    let lastStatus = 0;
    let matchCount = 0;

    for (let i = 0; i < ITERATIONS_PER_CASE; i++) {
      const start = performance.now();
      const res = await fetch(testCase.url, {
        headers: { Cookie: cookie },
      });
      const end = performance.now();
      const duration = end - start;

      latencies.push(duration);
      lastStatus = res.status;

      if (res.ok) {
        const data = await res.json();
        matchCount = data.pagination?.total ?? (Array.isArray(data.data) ? data.data.length : 0);
      }
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const isPassing = avgLatency < 1000 && lastStatus === 200;

    if (!isPassing) {
      allUnderOneSecond = false;
    }

    results.push({
      name: testCase.name,
      durationMs: parseFloat(avgLatency.toFixed(2)),
      status: lastStatus,
      count: matchCount,
      passed: isPassing,
    });
  }

  // Formatted Output Table
  console.log("-----------------------------------------------------------------------------------------");
  console.log(
    "Query Description".padEnd(52) +
    "Avg Latency".padEnd(15) +
    "Matches".padEnd(10) +
    "Target (<1s)"
  );
  console.log("-----------------------------------------------------------------------------------------");

  for (const r of results) {
    const statusText = r.passed ? "✓ PASS" : "✗ FAIL";
    console.log(
      r.name.padEnd(52) +
      `${r.durationMs} ms`.padEnd(15) +
      `${r.count}`.padEnd(10) +
      statusText
    );
  }
  console.log("-----------------------------------------------------------------------------------------");

  const totalAvg =
    results.reduce((acc, r) => acc + r.durationMs, 0) / results.length;
  const minLatency = Math.min(...results.map((r) => r.durationMs));
  const maxLatency = Math.max(...results.map((r) => r.durationMs));

  console.log(`\nBENCHMARK SUMMARY:`);
  console.log(`- Total Benchmark Cases: ${results.length}`);
  console.log(`- Minimum Latency:       ${minLatency.toFixed(2)} ms`);
  console.log(`- Maximum Latency:       ${maxLatency.toFixed(2)} ms`);
  console.log(`- Average Search Latency:${totalAvg.toFixed(2)} ms`);
  console.log(`- Requirement Target:    < 1,000.00 ms (1.00 second)`);
  console.log(`- Status:                ${allUnderOneSecond ? "ALL TESTS PASSED (< 1s)" : "FAILED"}\n`);

  if (!allUnderOneSecond) {
    process.exit(1);
  }
}

runBenchmark().catch((err) => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
