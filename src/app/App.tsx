import Greeting from '@/domain/settings/components/Greeting';

export default function App() {
  return (
    <main className="bg-base-200 flex min-h-screen items-center justify-center p-6">
      <div className="card bg-base-100 w-full max-w-sm shadow-sm">
        <div className="card-body items-center gap-4 text-center">
          <Greeting />
        </div>
      </div>
    </main>
  );
}
