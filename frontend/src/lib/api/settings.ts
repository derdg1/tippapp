import { pb } from '$lib/pocketbase';
import type { SettingsRecord } from '$lib/types';

// Einzelbenutzer-App: es gibt genau einen Settings-Datensatz mit fester ID
// (siehe pb_migrations/3_settings.js), daher direkter getOne statt Suche.
const SETTINGS_ID = 'settings0000001';

export async function getSettings(): Promise<SettingsRecord> {
	return pb.collection('settings').getOne<SettingsRecord>(SETTINGS_ID);
}

export async function updateSettings(data: Partial<SettingsRecord> | FormData): Promise<SettingsRecord> {
	return pb.collection('settings').update<SettingsRecord>(SETTINGS_ID, data);
}

export function getLogoUrl(settings: SettingsRecord): string {
	if (!settings.logo) return '';
	return pb.files.getUrl(settings, settings.logo);
}
