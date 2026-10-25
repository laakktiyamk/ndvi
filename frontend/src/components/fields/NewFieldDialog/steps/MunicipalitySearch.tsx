import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { useMunicipalityStore } from '../../../../store/municipalityStore';
import type { IMunicipalityListItem } from '../../../../types';

interface MunicipalitySearchProps {
    onSelect: (municipality: IMunicipalityListItem) => void;
}

export default function MunicipalitySearch({ onSelect }: MunicipalitySearchProps) {
    const { t } = useTranslation();
    const { municipalities, municipalitiesLoading, loadMunicipalities } = useMunicipalityStore();
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        loadMunicipalities();
    }, [loadMunicipalities]);

    return (
        <Autocomplete
            size="small"
            fullWidth
            options={municipalities}
            loading={municipalitiesLoading}
            getOptionLabel={(o) => o.nimi}
            isOptionEqualToValue={(a, b) => a.kunta === b.kunta}
            value={null}
            inputValue={inputValue}
            onInputChange={(_, v) => setInputValue(v)}
            onChange={(_, m) => {
                if (m) {
                    onSelect(m);
                    setInputValue(m.nimi);
                }
            }}
            autoHighlight
            clearOnBlur={false}
            noOptionsText={t('noMunicipalities')}
            renderInput={(params) => (
                <TextField
                    {...params}
                    placeholder={t('searchMunicipality')}
                    slotProps={{
                        ...params.slotProps,
                        input: {
                            ...params.slotProps.input,
                            endAdornment: (
                                <>
                                    {municipalitiesLoading && <CircularProgress size={16} />}
                                    {params.slotProps.input.endAdornment}
                                </>
                            ),
                        },
                    }}
                />
            )}
        />
    );
}