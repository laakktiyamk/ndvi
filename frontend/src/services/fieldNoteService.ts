import {apiClient} from '../api/client'; 

export interface IFieldNote {
  text: string;
  updatedAt: string | null;
}

/** Hakee käyttäjän muistiinpanon pellolle. Tyhjä, jos muistiinpanoa ei ole. */
export async function fetchFieldNote(aoiId: string): Promise<IFieldNote> {
  const { data } = await apiClient.get<IFieldNote>(`/api/fields/${aoiId}/note`);
  return data;
}

/** Tallentaa muistiinpanon. Tyhjä teksti poistaa sen. */
export async function saveFieldNote(aoiId: string, text: string): Promise<IFieldNote> {
  const { data } = await apiClient.put<IFieldNote>(`/api/fields/${aoiId}/note`, { text });
  return data;
}