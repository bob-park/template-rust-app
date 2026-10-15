import ThemeSwitcher from '@/shared/components/theme/ThemeSwitcher';

export default function SettingsApp() {
  return (
    <main className="bg-base-200 min-h-screen p-6">
      <h1 className="mb-4 text-xl font-bold">Settings</h1>
      <section className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="text-base-content/60 text-sm font-semibold">Appearance</h2>
          <ThemeSwitcher />
        </div>
      </section>
    </main>
  );
}
