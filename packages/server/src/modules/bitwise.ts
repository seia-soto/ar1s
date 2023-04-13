/* eslint-disable no-bitwise */
export const compileBit = (flag: number) => 2 ** flag;

export const addFlag = (base: number, flag: number) => base | flag;

export const removeFlag = (base: number, flag: number) => base & ~flag;

export const hasFlag = (base: number, flag: number) => (base & flag) === flag;
