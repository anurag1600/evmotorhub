import HeroSlideForm from '@/components/admin/HeroSlideForm';

interface EditHeroSlidePageProps {
  params: { id: string };
}

export default function EditHeroSlidePage({ params }: EditHeroSlidePageProps) {
  return <HeroSlideForm id={params.id} />;
}
