import { getCardBySlug } from '@/lib/storage';
import CardClient from './CardClient';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = await getCardBySlug(slug);

  return <CardClient slug={slug} initialCard={card} />;
}
