import apiClient from './client';

export interface Tip {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readingTime: number;
  featuredImage?: string;
}

export const fetchTips = async (): Promise<Tip[]> => {
  const { data } = await apiClient.get<{ tips?: any[] }>('/dating-tips');
  const list = data?.tips || data;
  return Array.isArray(list)
    ? list.map((t) => ({
        id: t?.id || t?._id || t?.slug || 'tip',
        title: t?.title || 'Untitled',
        excerpt: t?.excerpt || t?.body || '',
        content: t?.content || t?.excerpt || t?.body || '',
        category: t?.category || 'Guide',
        readingTime: t?.readingTime || 5,
        featuredImage: t?.featuredImage,
      }))
    : [];
};

export const fetchTipById = async (id: string): Promise<Tip | null> => {
  try {
    const { data } = await apiClient.get<any>(`/dating-tips/${id}`);
    const t = data?.tip || data;
    if (!t) return null;
    return {
      id: t?.id || t?._id || t?.slug || 'tip',
      title: t?.title || 'Untitled',
      excerpt: t?.excerpt || '',
      content: t?.content || t?.excerpt || '',
      category: t?.category || 'Guide',
      readingTime: t?.readingTime || 5,
      featuredImage: t?.featuredImage,
    };
  } catch {
    return null;
  }
};
