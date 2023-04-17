import {type TSchema} from '@sinclair/typebox';
import {TypeCompiler} from '@sinclair/typebox/compiler';

export const createCompiledType = <T extends TSchema>(schema: T) => {
	// eslint-disable-next-line new-cap
	const compiled = TypeCompiler.Compile(schema);

	return {
		check: compiled.Check.bind(compiled),
		errors: compiled.Errors.bind(compiled),
	};
};
