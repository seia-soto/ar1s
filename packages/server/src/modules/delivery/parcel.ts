import {ParcelTypes, clientParcelTypes, parcelTypes, type StaticParcelTypes, type messageCreateParcelType, type messageUpdateParcelType, type messageDeleteParcelType} from '@ar1s/spec/out/parcel.js';
import {type Static} from '@sinclair/typebox';
import {TypeCompiler} from '@sinclair/typebox/compiler';

// eslint-disable-next-line new-cap
const clientParcelTypeChecker = TypeCompiler.Compile(clientParcelTypes);

export const validateClientParcelType = clientParcelTypeChecker.Check.bind(clientParcelTypeChecker);

// eslint-disable-next-line new-cap
const serverParcelTypeChecker = TypeCompiler.Compile(parcelTypes);

export const validateServerParcelType = serverParcelTypeChecker.Check.bind(serverParcelTypeChecker);

type ParcelKindOfMessage = Static<typeof messageCreateParcelType>
| Static<typeof messageUpdateParcelType>
| Static<typeof messageDeleteParcelType>;

export const isMessageParcel = (parcel: StaticParcelTypes): parcel is ParcelKindOfMessage =>
	parcel.type === ParcelTypes.MessageCreate
  || parcel.type === ParcelTypes.MessageUpdate
  || parcel.type === ParcelTypes.MessageDelete;

export const getConversationIdFromMessageParcel = (parcel: ParcelKindOfMessage) => {
	if (parcel.type === ParcelTypes.MessageDelete) {
		return parcel.payload;
	}

	return parcel.payload.conversation;
};
