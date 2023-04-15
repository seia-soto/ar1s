import {clientParcelTypes, parcelTypes} from '@ar1s/spec/out/parcel.js';
import {TypeCompiler} from '@sinclair/typebox/compiler';

// eslint-disable-next-line new-cap
const clientParcelTypeChecker = TypeCompiler.Compile(clientParcelTypes);

export const validateClientParcelType = clientParcelTypeChecker.Check;

// eslint-disable-next-line new-cap
const serverParcelTypeChecker = TypeCompiler.Compile(parcelTypes);

export const validateServerParcelType = serverParcelTypeChecker.Check;
