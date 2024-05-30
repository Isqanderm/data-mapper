export type PathObject = {
    path: string;
};
export declare function parsePath(path: string): {
    part: string;
    type: "array" | "index" | "key";
}[];
export declare function getValueByPath(path: string): PathObject[];
//# sourceMappingURL=utils.d.ts.map