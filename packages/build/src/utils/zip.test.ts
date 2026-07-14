import { describe,it,expect } from "vite-plus/test";
import { zip } from "./zip";

describe("test zip",() => {
    it("when input 2 array,zip it",() => {
        const array1 = [1,2,3]
        const array2 = [4,5,6]
        expect(Array.from(zip(array1,array2))).toStrictEqual([[1,4],[2,5],[3,6]])
    })
        it("when input 0 array,return empty",() => {
        expect(Array.from(zip())).toStrictEqual([])
    })
})