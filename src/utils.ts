export type PathObject = { path: string };

export function parsePath(path: string) {
  return path
    .split(".")
    .reduce<
      { part: string; type: "array" | "index" | "key" }[]
    >((accum, next) => {
      if (next.startsWith("[") && next.endsWith("]")) {
        if (next.length === 2) {
          accum.push({ part: next, type: "array" });
        } else {
          accum.push({ part: next, type: "index" });
        }
      } else {
        accum.push({ part: next, type: "key" });
      }

      return accum;
    }, []);
}

// foo.bar.[].baz.foo.[3].number
// foo.bar
//        map(baz.foo[3].number)
export function getValueByPath(path: string): PathObject[] {
  const chunks = parsePath(path);
  const result: PathObject[] = [];
  let pathObject = { path: "" };

  while (chunks.length) {
    const chunk = chunks.shift();

    if (chunk?.type === "key") {
      if (!pathObject.path) {
        pathObject.path = chunk.part;
      } else {
        pathObject.path += `.${chunk.part}`;
      }
    } else if (chunk?.type === "index") {
      pathObject.path += chunk.part;
    } else if (chunk?.type === "array") {
      result.push(pathObject);
      pathObject = { path: "" };
    }
  }

  result.push(pathObject);

  return result;
}
