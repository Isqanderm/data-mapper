window.BENCHMARK_DATA = {
  "lastUpdate": 1760616477786,
  "repoUrl": "https://github.com/Isqanderm/data-mapper",
  "entries": {
    "om-data-mapper Performance": [
      {
        "commit": {
          "author": {
            "email": "aleksandr.melnik.personal@gmail.com",
            "name": "IsqanderM",
            "username": "Isqanderm"
          },
          "committer": {
            "email": "aleksandr.melnik.personal@gmail.com",
            "name": "IsqanderM",
            "username": "Isqanderm"
          },
          "distinct": true,
          "id": "5062576e2f09c74c7c54eb14e09e0ac040cdcfe5",
          "message": "fix: clean up benchmark files before switching to gh-pages branch\n\nThe github-action-benchmark tries to switch to gh-pages branch but fails\nbecause there are uncommitted changes in benchmark-*.txt files.\n\nAdded a cleanup step that runs 'git clean -fd' and 'git reset --hard HEAD'\nbefore the benchmark action to ensure a clean working directory.\n\nThis fixes the error:\n'Your local changes to the following files would be overwritten by checkout:\nbenchmark-simple.txt'",
          "timestamp": "2025-10-14T23:07:15+02:00",
          "tree_id": "4bee46c3058b5a8a1cd3608f085205cd6f739e50",
          "url": "https://github.com/Isqanderm/data-mapper/commit/5062576e2f09c74c7c54eb14e09e0ac040cdcfe5"
        },
        "date": 1760476152309,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "om-data-mapper: Simple Object Mapping",
            "value": 1431422.5727422507,
            "unit": "ops/sec"
          },
          {
            "name": "om-data-mapper: Complex Nested Object",
            "value": 2146454.4311267682,
            "unit": "ops/sec"
          },
          {
            "name": "om-data-mapper: Array (100 items)",
            "value": 22596.50457452269,
            "unit": "ops/sec"
          },
          {
            "name": "om-data-mapper: Custom Logic",
            "value": 1545339.9849273802,
            "unit": "ops/sec"
          },
          {
            "name": "om-data-mapper: Exclude/Expose",
            "value": 809805.1623085447,
            "unit": "ops/sec"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "152389998+Isqanderm@users.noreply.github.com",
            "name": "Aleksandr Melnik",
            "username": "Isqanderm"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "679e7e11084b12be53c7c4d633bd19a28148f185",
          "message": "fix: Correct benchmark workflow JSON format for benchmark-action (#24)\n\n* Created validation-benchmark-action.js with correct output format\n* Updated workflow to use new script\n* Removed references to non-existent bench-validation-results.json\n* Added bench:validation:build step before generating JSON\n* Fixed constructor passing bug (PR review feedback)\n* Removed src/compat/**/* exclusion from codecov.yml\n\nFixes workflow runs:\n- https://github.com/Isqanderm/data-mapper/actions/runs/18558251795\n- https://github.com/Isqanderm/data-mapper/actions/runs/18558594197\n\nAddresses review comment:\n- https://github.com/Isqanderm/data-mapper/pull/24#discussion_r2435482387",
          "timestamp": "2025-10-16T14:05:49+02:00",
          "tree_id": "b1ea33843d72e70ae8e444ab75e4f4711ba7d0f4",
          "url": "https://github.com/Isqanderm/data-mapper/commit/679e7e11084b12be53c7c4d633bd19a28148f185"
        },
        "date": 1760616477316,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Simple DTO - Valid (om-data-mapper)",
            "value": 663282.9296865342,
            "range": "0.86",
            "unit": "ops/sec",
            "extra": "vs class-validator: 300.45% faster\nSamples: 90\nclass-validator: 165633.09 ops/sec"
          },
          {
            "name": "Simple DTO - Invalid (om-data-mapper)",
            "value": 608674.8481654356,
            "range": "0.68",
            "unit": "ops/sec",
            "extra": "vs class-validator: 403.72% faster\nSamples: 87\nclass-validator: 120835.14 ops/sec"
          },
          {
            "name": "Product DTO (om-data-mapper)",
            "value": 534503.294761246,
            "range": "0.73",
            "unit": "ops/sec",
            "extra": "vs class-validator: 101.56% faster\nSamples: 86\nclass-validator: 265177.30 ops/sec"
          },
          {
            "name": "Mixed DTO (om-data-mapper)",
            "value": 402018.26074993174,
            "range": "0.89",
            "unit": "ops/sec",
            "extra": "vs class-validator: 220.08% faster\nSamples: 84\nclass-validator: 125600.31 ops/sec"
          },
          {
            "name": "Complex DTO - Valid (om-data-mapper)",
            "value": 181449.9227881904,
            "range": "1.44",
            "unit": "ops/sec",
            "extra": "vs class-validator: 211.01% faster\nSamples: 85\nclass-validator: 58341.36 ops/sec"
          },
          {
            "name": "Complex DTO - Invalid (om-data-mapper)",
            "value": 175462.8604212699,
            "range": "3.29",
            "unit": "ops/sec",
            "extra": "vs class-validator: 338.66% faster\nSamples: 86\nclass-validator: 40000.09 ops/sec"
          }
        ]
      }
    ]
  }
}