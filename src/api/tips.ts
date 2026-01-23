import apiClient from './client';

export interface Tip {
  id: string;
  title: string;
  body: string;
}

export const fetchTips = async (): Promise<Tip[]> => {
  const { data } = await apiClient.get<{ tips?: any[] }>('/dating-tips');
  const list = data?.tips || data;
  return Array.isArray(list)
    ? list.map((t) => ({
        id: t?.id || t?._id || t?.slug || 'tip',
        title: t?.title || 'Untitled',
        body: t?.excerpt || t?.body || t?.content || '',
      }))
    : [];
};
