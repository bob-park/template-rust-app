import { useGreeting } from '@/domain/settings/queries/settings';

export default function Greeting() {
  // queries
  const { greeting } = useGreeting();

  return <h1 className="text-primary text-4xl font-bold">{greeting ?? ' '}</h1>;
}
