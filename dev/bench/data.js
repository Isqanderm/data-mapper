window.BENCHMARK_DATA = {
  "lastUpdate": 1760476152781,
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
      }
    ]
  }
}