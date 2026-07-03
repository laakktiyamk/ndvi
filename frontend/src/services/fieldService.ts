import { apiClient } from '../api/client';
import type { IField } from '../types';

export const getFields = () =>
  apiClient.get<IField[]>('/api/fields');

export const createField = (data: Partial<IField>) =>
  apiClient.post<IField>('/api/fields', data);
