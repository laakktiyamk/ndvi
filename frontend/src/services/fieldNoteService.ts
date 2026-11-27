import {apiClient} from '../api/client'; 

export interface INote {
  text: string;
  updatedAt: string | null;
}

export interface IFieldNotes {
  general: INote;
  season: (INote & { year: number }) | null;
}

/** Hakee pellon yleisen ja valitun vuoden muistiinpanon. */
export async function fetchFieldNotes(aoiId: string, year: number): Promise<IFieldNotes> {
  const { data } = await apiClient.get<IFieldNotes>(`/api/fields/${aoiId}/note`, {
    params: { year },
  });
  return data;
}

/**
 * Tallentaa yhden muistiinpanon. Tyhjä teksti poistaa sen.
 *
 * @param year - null = yleinen, numero = kauden muistiinpano.
 */
export async function saveFieldNote(
  aoiId: string,
  year: number | null,
  text: string
): Promise<INote> {
  const { data } = await apiClient.put<INote>(
    `/api/fields/${aoiId}/note`,
    { text },
    { params: year === null ? undefined : { year } }
  );
  return data;
}