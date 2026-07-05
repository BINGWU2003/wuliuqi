import { CarouselPage } from "../../../../components/carousel-page";

type Params = Promise<{ name: string }>;

export default async function Page({ params }: { params: Params }) {
  const { name } = await params;

  return <CarouselPage name={name} />;
}
