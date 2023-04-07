import {type Transaction} from '@databases/pg';
import {addFlag} from '../modules/bitwise.js';
import {isExist} from '../modules/database/index.js';
import {PlatformFlags} from './platform.js';

export const isBootstrapRequired = async (t: Transaction) => isExist(t, 'platform', 'flag', addFlag(0, PlatformFlags.Default));
