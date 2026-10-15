import Greeting from '@/domain/settings/components/Greeting';
import useSettingsShortcut from '@/shared/hooks/useSettingsShortcut';

export default function App() {
  // hooks
  useSettingsShortcut();

  return (
    <main className="bg-base-100 flex h-full items-center justify-center p-6">
      <div className="border-base-300 bg-card w-full max-w-sm rounded-xl border">
        <div className="flex flex-col items-center gap-4 px-4 py-8 text-center">
          <Greeting />
        </div>
      </div>
    </main>
  );
}
