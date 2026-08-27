import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

export const pb = new PocketBase(env.PUBLIC_PB_URL);
